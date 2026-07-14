'use strict';

const path = require('node:path');
const packagedModule = path.join(__dirname, '..', 'release', 'win-unpacked', 'resources', 'app.asar', 'node_modules', 'node-pty');
const pty = require(packagedModule);
let output = '';
const session = pty.spawn('cmd.exe', ['/d', '/s', '/c', 'echo', 'PACKAGED_PTY_OK'], {
  name: 'xterm-256color', cols: 80, rows: 24, cwd: __dirname, env: process.env, useConpty: true
});
session.onData((data) => { output += data; });
session.onExit(() => setTimeout(() => process.exit(output.includes('PACKAGED_PTY_OK') ? 0 : 3), 100));
setTimeout(() => process.exit(2), 5000);
