'use strict';

const net = require('node:net');
const os = require('node:os');
const pty = require('node-pty');

const [, , pipe, token] = process.argv;
if (!pipe || !token) process.exit(64);
const socket = net.connect(pipe);
let session = null, buffer = '';
const send = (payload) => socket.write(`${JSON.stringify(payload)}\n`);
socket.on('connect', () => send({ type: 'hello', token }));
socket.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let newline;
  while ((newline = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
    if (!line) continue;
    let message; try { message = JSON.parse(line); } catch { continue; }
    if (message.type === 'start' && !session) {
      const profile = message.profile || {}, size = message.size || {};
      try {
        session = pty.spawn(String(profile.command || 'powershell.exe'), Array.isArray(profile.args) ? profile.args.map(String) : [], {
          name: 'xterm-256color', cols: Number(size.cols) || 80, rows: Number(size.rows) || 24,
          cwd: profile.startingDirectory || os.homedir(), env: { ...process.env, TERM_PROGRAM: 'HackersTerminal', COLORTERM: 'truecolor' }, useConpty: true
        });
        session.onData((data) => send({ type: 'data', data: Buffer.from(data).toString('base64') }));
        session.onExit(({ exitCode, signal }) => { send({ type: 'exit', exitCode, signal }); setTimeout(() => process.exit(0), 50); });
      } catch (error) { send({ type: 'error', message: error.message }); process.exit(1); }
    }
    if (message.type === 'write' && session) session.write(Buffer.from(message.data, 'base64').toString('utf8'));
    if (message.type === 'resize' && session) { try { session.resize(Number(message.cols) || 80, Number(message.rows) || 24); } catch {} }
    if (message.type === 'kill') { try { session?.kill(); } catch {} process.exit(0); }
  }
});
socket.on('close', () => { try { session?.kill(); } catch {} process.exit(0); });
