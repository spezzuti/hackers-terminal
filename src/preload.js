'use strict';

const { contextBridge, ipcRenderer } = require('electron');

function startupArgument(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  try { return value ? decodeURIComponent(value) : fallback; } catch { return fallback; }
}

contextBridge.exposeInMainWorld('hackers', {
  initialAppearance: Object.freeze({ experience: startupArgument('ht-experience', 'hackers'), theme: startupArgument('ht-theme', 'acidBurn') }),
  bootPrimed: () => ipcRenderer.send('boot:primed'),
  bootstrap: () => ipcRenderer.invoke('app:bootstrap'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  loadWorkspace: () => ipcRenderer.invoke('workspace:load'),
  saveWorkspace: (workspace) => ipcRenderer.invoke('workspace:save', workspace),
  clearWorkspace: () => ipcRenderer.invoke('workspace:clear'),
  discoverSshProfiles: () => ipcRenderer.invoke('profiles:discover-ssh'),
  importWindowsTerminal: () => ipcRenderer.invoke('profiles:import-windows-terminal'),
  createPty: (profile, size) => ipcRenderer.invoke('pty:create', profile, size),
  writePty: (id, data) => ipcRenderer.send('pty:write', id, data),
  resizePty: (id, cols, rows) => ipcRenderer.send('pty:resize', id, cols, rows),
  killPty: (id) => ipcRenderer.send('pty:kill', id),
  onPtyData: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('pty:data', handler);
    return () => ipcRenderer.removeListener('pty:data', handler);
  },
  onPtyExit: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('pty:exit', handler);
    return () => ipcRenderer.removeListener('pty:exit', handler);
  },
  onPtyError: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('pty:error', handler);
    return () => ipcRenderer.removeListener('pty:error', handler);
  },
  onQuakeChange: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('window:quake', handler);
    return () => ipcRenderer.removeListener('window:quake', handler);
  },
  onShortcutStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('shortcut:status', handler);
    return () => ipcRenderer.removeListener('shortcut:status', handler);
  },
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  openExternal: (url) => ipcRenderer.invoke('links:open-external', url),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.send('update:install'),
  onUpdateStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
  windowAction: (action) => ipcRenderer.send('window:action', action)
});
