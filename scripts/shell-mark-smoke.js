'use strict';

const pty = require('node-pty');
const { preparedProfile } = require('../src/main/pty-manager');
const profile = preparedProfile({ command: 'powershell.exe', args: ['-NoLogo'], shellIntegration: true });
const session = pty.spawn(profile.command, profile.args, { name: 'xterm-256color', cols: 80, rows: 24, cwd: __dirname, env: process.env, useConpty: true });
let output = '';
session.onData((data) => {
  output += data;
  if (/\x1b\]133;A(?:\x07|\x1b\\)/.test(output)) { try { session.kill(); } catch {} process.exit(0); }
});
setTimeout(() => { process.stderr.write(JSON.stringify(output.slice(-2000))); try { session.kill(); } catch {} process.exit(2); }, 7000);
