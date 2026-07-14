'use strict';

const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

function pipeName(id) { return `\\\\.\\pipe\\hackers-terminal-${process.pid}-${id}`; }
function send(socket, payload) { socket.write(`${JSON.stringify(payload)}\n`); }
function lineReader(onMessage) {
  let buffer = '';
  return (chunk) => {
    buffer += chunk.toString('utf8');
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
      if (line) { try { onMessage(JSON.parse(line)); } catch { /* ignore malformed helper traffic */ } }
    }
  };
}

class ElevatedPtyBroker {
  constructor(trace = () => {}) { this.trace = trace; this.sessions = new Map(); }

  async create(id, profile, size, callbacks) {
    const token = crypto.randomBytes(32).toString('hex');
    const pipe = pipeName(`${id}-${crypto.randomBytes(6).toString('hex')}`);
    const server = net.createServer();
    const connected = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Elevation was cancelled or timed out.')), 45000);
      server.on('connection', (socket) => {
        socket.once('data', (chunk) => {
          let hello;
          try { hello = JSON.parse(chunk.toString('utf8').trim()); } catch { socket.destroy(); return; }
          if (hello.type !== 'hello' || hello.token !== token) { socket.destroy(); return; }
          clearTimeout(timer); resolve(socket);
        });
      });
      server.on('error', reject);
    });
    await new Promise((resolve, reject) => server.listen(pipe, resolve).once('error', reject));
    this.launchHelper(pipe, token);
    let socket;
    try { socket = await connected; } catch (error) { server.close(); throw error; }
    const session = { socket, server, closed: false };
    this.sessions.set(String(id), session);
    socket.on('data', lineReader((message) => {
      if (message.type === 'data') callbacks.onData(Buffer.from(message.data, 'base64').toString('utf8'));
      if (message.type === 'exit') { session.closed = true; callbacks.onExit(message.exitCode ?? 0, message.signal ?? 0); this.dispose(id); }
      if (message.type === 'error') callbacks.onError?.(message.message);
    }));
    socket.on('close', () => { if (!session.closed) callbacks.onExit(1, 0); this.dispose(id); });
    send(socket, { type: 'start', profile, size });
    this.trace(`elevated:connected:${id}`);
    return session;
  }

  launchHelper(pipe, token) {
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      HT_ELEVATE_EXE: process.execPath,
      HT_ELEVATE_SCRIPT: path.join(__dirname, 'elevated-host.js'),
      HT_ELEVATE_PIPE: pipe,
      HT_ELEVATE_TOKEN: token
    };
    const command = "$argLine='\"{0}\" \"{1}\" \"{2}\"' -f $env:HT_ELEVATE_SCRIPT,$env:HT_ELEVATE_PIPE,$env:HT_ELEVATE_TOKEN; Start-Process -FilePath $env:HT_ELEVATE_EXE -ArgumentList $argLine -Verb RunAs -WindowStyle Hidden";
    const launcher = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { env, windowsHide: true, stdio: 'ignore' });
    launcher.unref();
  }

  write(id, data) { const session = this.sessions.get(String(id)); if (session) send(session.socket, { type: 'write', data: Buffer.from(data).toString('base64') }); }
  resize(id, cols, rows) { const session = this.sessions.get(String(id)); if (session) send(session.socket, { type: 'resize', cols, rows }); }
  kill(id) { const session = this.sessions.get(String(id)); if (session) send(session.socket, { type: 'kill' }); this.dispose(id); }
  dispose(id) { const session = this.sessions.get(String(id)); if (!session) return; this.sessions.delete(String(id)); try { session.socket.destroy(); } catch {} try { session.server.close(); } catch {} }
}

module.exports = { ElevatedPtyBroker, pipeName, lineReader };
