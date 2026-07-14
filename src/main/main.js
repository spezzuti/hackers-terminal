'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { app, BrowserWindow, ipcMain, shell, clipboard, globalShortcut, screen } = require('electron');
const traceFile = path.join(os.tmpdir(), 'hackers-terminal-startup.log');
function trace(message) {
  try { fs.appendFileSync(traceFile, `${new Date().toISOString()} [main:${process.pid}] ${message}\n`, 'utf8'); } catch { /* diagnostics must never block startup */ }
}
trace('module:start');
const { autoUpdater } = require('electron-updater');
const { PtyManager } = require('./pty-manager');
trace('module:pty-loaded');
const { SettingsStore } = require('./settings-store');
trace('module:settings-loaded');
const { WorkspaceStore } = require('./workspace-store');
const { discoverSshProfiles, importWindowsTerminalSettings } = require('./integration-service');
const { THEMES } = require('../shared/defaults');
const { normalizeExternalUrl } = require('../shared/external-links');
trace('module:defaults-loaded');

// Never derive Chromium storage from the display title. The themed title uses
// "//", which Electron otherwise interprets as path separators on Windows and
// can crash Chromium before the ready event is emitted.
const safeDataRoot = path.join(app.getPath('appData'), 'HackersTerminal');
const safeSessionRoot = path.join(process.env.LOCALAPPDATA || app.getPath('appData'), 'HackersTerminal', 'Chromium');
app.setPath('userData', safeDataRoot);
app.setPath('sessionData', safeSessionRoot);
trace(`app:paths-set:${safeDataRoot}`);

app.setAppUserModelId('club.cyberia.hackersterminal');
trace('app:aumid-set');

let mainWindow;
let store;
let workspaceStore;
let quakeActive = false;
let normalBounds = null;
let quakeShortcutStatus = { accelerator: 'Control+Shift+Space', registered: false };
const ptys = new PtyManager({ trace });
trace('app:pty-manager-created');

// xterm has to be told which pty backend is behind the socket. Left unset it assumes the
// legacy winpty contract: it guesses line-wrap state from trailing whitespace (which marks
// every full-width box-drawing row as a continuation of the row above) and disables reflow.
// ConPTY reports wrap state accurately, so saying so turns both workarounds off.
function windowsPtyInfo() {
  if (process.platform !== 'win32') return undefined;
  const buildNumber = Number(os.release().split('.')[2]) || 0;
  return { backend: buildNumber >= 18309 ? 'conpty' : 'winpty', buildNumber };
}

function createWindow() {
  trace('window:create:start');
  const initialSettings = store?.get() || { experience: 'hackers', theme: 'acidBurn' };
  mainWindow = new BrowserWindow({
    width: 1260,
    height: 790,
    minWidth: 760,
    minHeight: 480,
    show: false,
    frame: false,
    backgroundColor: '#05020b',
    backgroundMaterial: 'acrylic',
    title: 'HACKERS // Terminal',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      additionalArguments: [`--ht-experience=${encodeURIComponent(initialSettings.experience || 'hackers')}`, `--ht-theme=${encodeURIComponent(initialSettings.theme || 'acidBurn')}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  trace('window:create:complete');

  mainWindow.webContents.on('did-start-loading', () => trace('window:did-start-loading'));
  mainWindow.webContents.on('dom-ready', () => trace('window:dom-ready'));
  mainWindow.webContents.on('did-finish-load', () => trace('window:did-finish-load'));
  mainWindow.webContents.on('render-process-gone', (_event, details) => trace(`window:renderer-gone:${details.reason}:${details.exitCode}`));
  mainWindow.webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => trace(`renderer:console:${level}:${message}${lineNumber ? ` (${sourceId}:${lineNumber})` : ''}`));
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html')).catch((error) => trace(`window:load-error:${error.stack || error}`));
  trace('window:load-requested');
  mainWindow.once('ready-to-show', () => {
    trace('window:ready-to-show');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) { trace('window:primer-fallback-show'); mainWindow.show(); }
    }, 1500);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  trace('app:ready');
  store = new SettingsStore(app.getPath('userData'));
  workspaceStore = new WorkspaceStore(app.getPath('userData'));
  trace('app:settings-loaded');
  registerIpc();
  trace('app:ipc-registered');
  createWindow();
  registerQuakeShortcut();
  setupAutoUpdater();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
trace('app:ready-handler-registered');

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('web-contents-created', (_event, contents) => {
  contents.on('destroyed', () => ptys.killSender(contents.id));
  contents.on('will-navigate', (event) => event.preventDefault());
});
trace('app:event-handlers-registered');

function registerIpc() {
  ipcMain.on('boot:primed', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed() && !win.isVisible()) { trace('window:shown-after-primer'); win.show(); }
  });
  ipcMain.handle('app:bootstrap', () => {
    trace('ipc:bootstrap');
    const settings = store.get();
    // updateState rides along: the first check can resolve before the renderer subscribes, and a
    // missed 'update-downloaded' would leave a staged update with nothing in the UI to reveal it.
    return { settings, themes: { ...THEMES, ...(settings.customThemes || {}) }, version: app.getVersion(), workspace: workspaceStore.load(), shortcutStatus: quakeShortcutStatus, windowsPty: windowsPtyInfo(), update: updateState };
  });
  ipcMain.handle('settings:save', (_event, value) => {
    const saved = store.save(value);
    registerQuakeShortcut();
    return saved;
  });
  ipcMain.handle('workspace:load', () => workspaceStore.load());
  ipcMain.handle('workspace:save', (_event, value) => workspaceStore.save(value));
  ipcMain.handle('workspace:clear', () => { workspaceStore.clear(); return true; });
  ipcMain.handle('profiles:discover-ssh', () => discoverSshProfiles());
  ipcMain.handle('profiles:import-windows-terminal', () => importWindowsTerminalSettings());
  ipcMain.handle('pty:create', async (event, profile, size) => {
    trace(`ipc:pty-create:${profile?.id || 'unknown'}:${size?.cols}x${size?.rows}`);
    const result = await ptys.create(event.sender, profile || {}, size);
    trace(`ipc:pty-created:${result.id}`);
    return result;
  });
  ipcMain.on('pty:write', (event, id, data) => ptys.write(event.sender, id, data));
  ipcMain.on('pty:resize', (event, id, cols, rows) => ptys.resize(event.sender, id, cols, rows));
  ipcMain.on('pty:kill', (event, id) => ptys.kill(event.sender, id));
  ipcMain.handle('clipboard:read', () => clipboard.readText());
  ipcMain.handle('clipboard:write', (_event, text) => { clipboard.writeText(String(text || '')); return true; });
  ipcMain.handle('links:open-external', async (_event, value) => {
    const url = normalizeExternalUrl(value);
    if (!url) return { opened: false, error: 'Only HTTP and HTTPS links can be opened.' };
    try {
      await shell.openExternal(url);
      return { opened: true };
    } catch (error) {
      trace(`external-link:error:${error.message}`);
      return { opened: false, error: error.message };
    }
  });
  ipcMain.handle('update:check', async () => { await checkForUpdates(); return updateState; });
  ipcMain.on('update:install', () => {
    if (updateState.state !== 'ready') return;
    trace('update:quit-and-install');
    // Silent reinstall, then relaunch. Panes die with their renderer, so the ptys go with them.
    autoUpdater.quitAndInstall(true, true);
  });
  ipcMain.on('window:action', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (action === 'minimize') win.minimize();
    if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
    if (action === 'close') win.close();
    if (action === 'fullscreen') win.setFullScreen(!win.isFullScreen());
    if (action === 'quake') toggleQuakeMode();
  });
}

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
let updateState = { state: 'idle' };

function sendUpdateState(next) {
  updateState = next;
  trace(`update:state:${next.state}${next.version ? `:${next.version}` : ''}`);
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update:status', next);
}

function checkForUpdates() {
  if (!app.isPackaged) return Promise.resolve(updateState);
  return autoUpdater.checkForUpdates().catch((error) => {
    sendUpdateState({ state: 'error', message: error?.message || String(error) });
    return updateState;
  });
}

function setupAutoUpdater() {
  // The updater reads resources/app-update.yml, which electron-builder only writes into a packaged
  // build. Running unpackaged there is nothing to check against and every call just errors.
  if (!app.isPackaged) { trace('update:skipped-unpackaged'); return; }
  autoUpdater.logger = { info: (m) => trace(`update:${m}`), warn: (m) => trace(`update:warn:${m}`), error: (m) => trace(`update:error:${m}`), debug: () => {} };
  autoUpdater.autoDownload = true;
  // If the user never clicks restart, the update lands on the next normal quit anyway.
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => sendUpdateState({ state: 'checking' }));
  autoUpdater.on('update-not-available', () => sendUpdateState({ state: 'current' }));
  autoUpdater.on('update-available', (info) => sendUpdateState({ state: 'downloading', version: info?.version, percent: 0 }));
  autoUpdater.on('download-progress', (progress) => sendUpdateState({ state: 'downloading', version: updateState.version, percent: Math.round(progress?.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => sendUpdateState({ state: 'ready', version: info?.version }));
  autoUpdater.on('error', (error) => sendUpdateState({ state: 'error', message: error?.message || String(error) }));
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
}

function registerQuakeShortcut() {
  if (!app.isReady() || !store) return false;
  globalShortcut.unregisterAll();
  const accelerator = store.get().quakeShortcut || 'Control+Shift+Space';
  let registered = false;
  try { registered = globalShortcut.register(accelerator, toggleQuake); } catch (error) { trace(`quake:registration-error:${error.message}`); }
  trace(`quake:registered:${accelerator}:${registered}`);
  quakeShortcutStatus = { accelerator, registered };
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('shortcut:status', { accelerator, registered });
  return registered;
}

function enterQuakeMode() {
  if (!quakeActive) normalBounds = mainWindow.getBounds();
  const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const margin = Math.max(8, Math.round(workArea.width * 0.04));
  mainWindow.setBounds({ x: workArea.x + margin, y: workArea.y, width: workArea.width - margin * 2, height: Math.round(workArea.height * 0.46) });
  mainWindow.setAlwaysOnTop(true, 'pop-up-menu');
  quakeActive = true;
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('window:quake', { active: true });
}

function leaveQuakeMode() {
  if (!quakeActive) return;
  quakeActive = false;
  mainWindow.setAlwaysOnTop(false);
  if (normalBounds) mainWindow.setBounds(normalBounds);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('window:quake', { active: false });
}

// The global hotkey is a drop-down: it summons the window, and dismisses it only when it is
// already down AND focused, so hitting the key from another app raises the terminal instead of
// hiding the one you were reaching for.
function toggleQuake() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!quakeActive) { enterQuakeMode(); return; }
  if (mainWindow.isVisible() && mainWindow.isFocused()) { mainWindow.hide(); return; }
  mainWindow.show();
  mainWindow.focus();
}

// The in-app command enters and leaves outright. Without this there is no way back to a normal
// window: the hotkey only ever hides and re-shows the dropped-down one.
function toggleQuakeMode() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (quakeActive) leaveQuakeMode(); else enterQuakeMode();
}
