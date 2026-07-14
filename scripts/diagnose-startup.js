'use strict';

const path = require('node:path');
const mode = process.argv[2] || 'minimal';
const pty = ['pty', 'spawn'].includes(mode) ? require('node-pty') : null;
const { app, BrowserWindow } = require('electron');
if (['late-pty', 'late-pty-aumid'].includes(mode)) require('node-pty');
if (['aumid', 'late-pty-aumid'].includes(mode)) app.setAppUserModelId('club.cyberia.hackersterminal');

app.whenReady().then(() => {
  const options = {
    width: 500,
    height: 300,
    show: false,
    frame: false,
    backgroundColor: '#05020b',
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  };
  if (mode === 'acrylic') options.backgroundMaterial = 'acrylic';
  const window = new BrowserWindow(options);
  window.loadURL('data:text/html,<title>diagnostic</title><body>ok</body>');
  if (mode === 'spawn') {
    const session = pty.spawn('cmd.exe', ['/d', '/s', '/c', 'echo', 'ok'], {
      name: 'xterm-256color', cols: 80, rows: 24, cwd: __dirname, env: process.env, useConpty: true
    });
    session.onData(() => {});
  }
  setTimeout(() => app.quit(), 2500);
});
