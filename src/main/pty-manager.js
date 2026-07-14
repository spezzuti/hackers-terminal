'use strict';

const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const pty = require('node-pty');
const { ElevatedPtyBroker } = require('./elevated-pty-broker');

const POWERSHELL_INTEGRATION = "$global:__HTOriginalPrompt=$function:prompt; function global:prompt { $ok=$?; $code=if($ok){0}else{1}; $esc=[char]27; $bel=[char]7; [Console]::Write(\"$esc]133;D;$code$bel$esc]133;A$bel\"); & $global:__HTOriginalPrompt }";

function preparedProfile(profile = {}) {
  const prepared = { ...profile, args: Array.isArray(profile.args) ? profile.args.map(String) : [] };
  const executable = path.basename(String(prepared.command || '')).toLowerCase();
  const hasEntryCommand = prepared.args.some((arg) => /^-(command|file|encodedcommand)$/i.test(arg));
  if (prepared.shellIntegration !== false && ['powershell.exe', 'pwsh.exe', 'powershell', 'pwsh'].includes(executable) && !hasEntryCommand) {
    prepared.args.push('-NoExit', '-Command', POWERSHELL_INTEGRATION);
  }
  return prepared;
}

class PtyManager {
  constructor({ trace } = {}) {
    this.sessions = new Map();
    this.nextId = 1;
    this.elevated = new ElevatedPtyBroker(trace);
  }

  async create(sender, profile, size = {}) {
    const id = String(this.nextId++);
    const cols = Math.min(500, Math.max(2, Number(size.cols) || 80));
    const rows = Math.min(300, Math.max(1, Number(size.rows) || 24));
    profile = preparedProfile(profile);
    const command = String(profile.command || 'powershell.exe');
    const args = profile.args;
    const requestedCwd = String(profile.startingDirectory || '');
    const cwd = requestedCwd && fs.existsSync(requestedCwd) ? requestedCwd : os.homedir();
    if (profile.elevated) {
      const session = { id, senderId: sender.id, elevated: true };
      this.sessions.set(id, session);
      try {
        await this.elevated.create(id, profile, { cols, rows }, {
          onData: (data) => { if (!sender.isDestroyed()) sender.send('pty:data', { id, data }); },
          onExit: (exitCode, signal) => { this.sessions.delete(id); if (!sender.isDestroyed()) sender.send('pty:exit', { id, exitCode, signal }); },
          onError: (message) => { if (!sender.isDestroyed()) sender.send('pty:error', { id, message }); }
        });
        return { id, pid: 0, elevated: true };
      } catch (error) { this.sessions.delete(id); throw error; }
    }
    const shell = pty.spawn(command, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: { ...process.env, TERM_PROGRAM: 'HackersTerminal', COLORTERM: 'truecolor' },
      useConpty: true
    });
    const session = { id, shell, senderId: sender.id };
    this.sessions.set(id, session);
    shell.onData((data) => {
      if (!sender.isDestroyed()) sender.send('pty:data', { id, data });
    });
    shell.onExit(({ exitCode, signal }) => {
      this.sessions.delete(id);
      if (!sender.isDestroyed()) sender.send('pty:exit', { id, exitCode, signal });
    });
    return { id, pid: shell.pid };
  }

  owned(sender, id) {
    const session = this.sessions.get(String(id));
    return session && session.senderId === sender.id ? session : null;
  }

  write(sender, id, data) {
    const session = this.owned(sender, id);
    if (!session || typeof data !== 'string' || data.length > 1024 * 1024) return;
    if (session.elevated) this.elevated.write(id, data); else session.shell.write(data);
  }

  resize(sender, id, cols, rows) {
    const session = this.owned(sender, id);
    if (!session) return;
    const safeCols = Math.min(500, Math.max(2, Number(cols) || 80));
    const safeRows = Math.min(300, Math.max(1, Number(rows) || 24));
    if (session.elevated) this.elevated.resize(id, safeCols, safeRows);
    else try { session.shell.resize(safeCols, safeRows); } catch { /* process may be exiting */ }
  }

  kill(sender, id) {
    const session = this.owned(sender, id);
    if (!session) return;
    this.sessions.delete(String(id));
    if (session.elevated) this.elevated.kill(id);
    else try { session.shell.kill(); } catch { /* already gone */ }
  }

  killSender(senderId) {
    for (const [id, session] of this.sessions) {
      if (session.senderId !== senderId) continue;
      this.sessions.delete(id);
      if (session.elevated) this.elevated.kill(id);
      else try { session.shell.kill(); } catch { /* already gone */ }
    }
  }
}

module.exports = { PtyManager, preparedProfile, POWERSHELL_INTEGRATION };
