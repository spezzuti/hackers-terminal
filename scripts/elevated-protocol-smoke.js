'use strict';

const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const token = crypto.randomBytes(12).toString('hex');
const pipe = `\\\\.\\pipe\\hackers-elevated-smoke-${process.pid}`;
const server = net.createServer((socket) => {
  let buffer = '', output = '';
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      if (message.type === 'hello' && message.token === token) socket.write(`${JSON.stringify({ type: 'start', profile: { command: 'cmd.exe', args: ['/d', '/s', '/c', 'echo', 'ELEVATED_PROTOCOL_OK'] }, size: { cols: 80, rows: 24 } })}\n`);
      if (message.type === 'data') output += Buffer.from(message.data, 'base64').toString('utf8');
      if (message.type === 'exit') { server.close(); process.exit(output.includes('ELEVATED_PROTOCOL_OK') ? 0 : 3); }
    }
  });
});
const helperPath = process.env.HT_HELPER_PATH || path.join(__dirname, '..', 'src', 'main', 'elevated-host.js');
server.listen(pipe, () => spawn(process.execPath, [helperPath, pipe, token], { stdio: 'ignore' }));
setTimeout(() => process.exit(2), 8000);
