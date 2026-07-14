'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = {
  settings: null, themes: {}, tabs: [], panes: new Map(), activeTabId: null,
  nextTab: 1, nextPane: 1, paletteIndex: 0, paletteCommands: [], audio: null,
  broadcast: false, quake: false, workspaceReady: false, workspaceSaveTimer: null,
  windowsPty: undefined, update: { state: 'idle' }, updateAnnounced: false
};

const EXPERIENCES = {
  hackers: {
    brand: 'HACKERS', subtitle: 'TERMINAL SYSTEM', status: 'CYBERIA NODE', title: 'HACKERS // Terminal',
    bootTitle: 'HACKERS', bootSubtitle: 'TERMINAL SYSTEM // 1995',
    bootMessages: ['INITIALIZING NEURAL LINK...', 'NEGOTIATING SECURE HANDSHAKE...', 'MOUNTING CYBERSPACE...', 'SYSTEM ONLINE.'],
    brandMark: '<path d="M4 20 13 5h14l9 15-9 15H13Z"/><path d="m11 20 5-8h8l5 8-5 8h-8Z"/><circle cx="20" cy="20" r="3"/>',
    bootMark: '<path d="M12 50 31 17h38l19 33-19 33H31Z"/><path d="m29 50 11-19h20l11 19-11 19H40Z"/><circle cx="50" cy="50" r="6"/>'
  },
  fallout: {
    brand: 'ROBCO', subtitle: 'UNIFIED TERMINAL', status: 'VAULT NETWORK', title: 'ROBCO // Unified Terminal',
    bootTitle: 'ROBCO INDUSTRIES', bootSubtitle: 'UNIFIED OPERATING SYSTEM // REV 7.7',
    bootMessages: ['WARMING DISPLAY TUBES...', 'VERIFYING HOLOTAPE INDEX...', 'LINKING VAULT NETWORK...', 'SYSTEM READY.'],
    brandMark: '<ellipse cx="20" cy="20" rx="16" ry="6"/><ellipse cx="20" cy="20" rx="16" ry="6" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="16" ry="6" transform="rotate(120 20 20)"/><circle cx="20" cy="20" r="3"/>',
    bootMark: '<path d="M50 9a41 41 0 1 0 0 82 41 41 0 1 0 0-82Z"/><path d="M50 18v64M18 50h64M27 27l46 46M73 27 27 73"/><circle cx="50" cy="50" r="10"/>'
  }
};

const FALLOUT_SYSTEMS = {
  pipBoy: {
    brand: 'PIP-BOY', subtitle: '3000 PERSONAL PROCESSOR', status: 'WANDERER LINK', title: 'PIP-BOY 3000 // Terminal',
    bootTitle: 'PIP-BOY 3000', bootSubtitle: 'PERSONAL INFORMATION PROCESSOR',
    flavor: 'PERSONAL DATA // RADIATION // MAP',
    brandMark: '<rect class="device" x="3" y="7" width="34" height="25" rx="5"/><rect class="screen" x="8" y="11" width="20" height="15" rx="2"/><path class="signal" d="m10 20 4-4 4 7 4-9 4 6"/><circle class="knob" cx="32" cy="14" r="2"/><circle class="knob" cx="32" cy="24" r="2"/>',
    bootMark: '<rect class="device" x="9" y="13" width="82" height="68" rx="13"/><rect class="screen" x="20" y="23" width="50" height="38" rx="4"/><path class="signal" d="m25 48 10-13 9 19 10-26 11 20"/><circle class="knob" cx="79" cy="31" r="5"/><circle class="knob" cx="79" cy="50" r="5"/><path class="strap" d="M27 81v11h46V81"/>',
    bootMessages: ['CHARGING DISPLAY MATRIX...', 'CALIBRATING GEIGER COUNTER...', 'INDEXING PERSONAL DATA...', 'PIP-BOY READY.']
  },
  robco: {
    brand: 'ROBCO', subtitle: 'UNIFIED TERMINAL', status: 'ROBCO NETWORK', title: 'ROBCO // Unified Terminal',
    bootTitle: 'ROBCO INDUSTRIES', bootSubtitle: 'UNIFIED OPERATING SYSTEM // REV 7.7',
    flavor: 'INDUSTRIAL AUTOMATION CONTROL',
    brandViewBox: '0 0 120 44', bootViewBox: '0 0 220 100',
    brandMark: '<text class="robco-word" x="60" y="29" text-anchor="middle">RobCo</text><text class="robco-industries" x="60" y="42" text-anchor="middle">INDUSTRIES</text>',
    bootMark: '<text class="robco-word" x="110" y="67" text-anchor="middle">RobCo</text><text class="robco-industries" x="110" y="94" text-anchor="middle">INDUSTRIES</text>',
    bootMessages: ['WARMING DISPLAY TUBES...', 'VERIFYING HOLOTAPE INDEX...', 'LINKING INDUSTRIAL NETWORK...', 'SYSTEM READY.']
  },
  vaultTec: {
    brand: 'VAULT-TEC', subtitle: 'OVERSEER TERMINAL', status: 'VAULT NETWORK', title: 'VAULT-TEC // Overseer Terminal',
    bootTitle: 'VAULT-TEC', bootSubtitle: 'OVERSEER MAINFRAME // SECURE ACCESS',
    flavor: 'WELCOME, OVERSEER',
    brandViewBox: '0 0 100 66', bootViewBox: '0 0 100 66',
    brandMark: '<path class="vault-logo" d="M20 18h61c2 0 4 2 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Zm-13 11h86c3 0 5 2 7 4-2 2-4 4-7 4H7c-3 0-5-2-7-4 2-2 4-4 7-4Zm13 13h61c2 0 4 1 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Z"/><circle class="vault-logo" cx="50" cy="33" r="20"/><circle class="vault-cutout" cx="50" cy="33" r="12.5"/><circle class="vault-logo" cx="50" cy="33" r="7.5"/>',
    bootMark: '<path class="vault-logo" d="M20 18h61c2 0 4 2 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Zm-13 11h86c3 0 5 2 7 4-2 2-4 4-7 4H7c-3 0-5-2-7-4 2-2 4-4 7-4Zm13 13h61c2 0 4 1 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Z"/><circle class="vault-logo" cx="50" cy="33" r="20"/><circle class="vault-cutout" cx="50" cy="33" r="12.5"/><circle class="vault-logo" cx="50" cy="33" r="7.5"/>',
    bootMessages: ['VERIFYING VAULT INTEGRITY...', 'INDEXING RESIDENT RECORDS...', 'LINKING OVERSEER NETWORK...', 'WELCOME, OVERSEER.']
  },
  nukaCola: {
    brand: 'Nuka-Cola', subtitle: 'SERVICE CONSOLE', status: 'BOTTLING NETWORK', title: 'NUKA-COLA // Service Console',
    bootTitle: 'Nuka-Cola', bootSubtitle: 'SERVICE & DISTRIBUTION CONSOLE',
    flavor: 'ENJOY A REFRESHING SYSTEM CHECK',
    brandViewBox: '0 0 40 40', bootViewBox: '0 0 160 120',
    brandMark: '<path class="cap-edge" d="M20 2c2.1 0 2.7 2.1 4.6 2.5s3.3-1.2 5 .1 1 3.4 2.5 4.7 3.6.4 4.6 2.2-.5 3.6.1 5.4 2.7 2.3 2.7 4.4-2.1 2.7-2.5 4.6 1.2 3.3-.1 5-3.4 1-4.7 2.5-.4 3.6-2.2 4.6-3.6-.5-5.4.1-2.3 2.7-4.4 2.7-2.7-2.1-4.6-2.5-3.3 1.2-5-.1-1-3.4-2.5-4.7-3.6-.4-4.6-2.2.5-3.6-.1-5.4-2.7-2.3-2.7-4.4 2.1-2.7 2.5-4.6-1.2-3.3.1-5 3.4-1 4.7-2.5.4-3.6 2.2-4.6 3.6.5 5.4-.1C17.9 4.1 17.9 2 20 2Z"/><circle class="cap-face" cx="20" cy="20" r="13"/><ellipse class="eye-white" cx="15" cy="17" rx="3" ry="3.5"/><ellipse class="eye-white" cx="25" cy="17" rx="3" ry="3.5"/><circle class="pupil" cx="16" cy="17.5" r="1.2"/><circle class="pupil" cx="24" cy="17.5" r="1.2"/><path class="smile" d="M13 23q7 8 14 0q-7 3-14 0Z"/><path class="cap-shine" d="M10 12q5-6 11-5"/>',
    bootMark: '<path class="cappy-limb" d="M48 86c-2 13-4 18-2 24M62 86c1 12 6 18 9 22M105 87c-2 9-2 14-5 20M122 87c4 8 3 14 0 20M37 35C23 30 22 20 22 13M128 49c8-6 11-13 12-20"/><path class="nuka-bottle" d="M42 8h18l1 8-3 3v12c1 9 9 20 13 30 4 10 5 26 3 38-11 4-33 4-44 0-2-13-1-28 3-39 4-10 12-20 12-29V19l-3-3Z"/><path class="bottle-rim" d="M40 8h22v9H40Zm3 10h16v8H43Z"/><path class="bottle-highlight" d="M46 35c-2 17-9 27-9 46m7 10 3-1"/><circle class="bottle-label" cx="52" cy="64" r="16"/><ellipse class="eye-white" cx="47" cy="59" rx="5" ry="7"/><ellipse class="eye-white" cx="57" cy="59" rx="5" ry="7"/><circle class="pupil" cx="48" cy="61" r="2"/><circle class="pupil" cx="56" cy="61" r="2"/><path class="bottle-smile" d="M45 69q7 6 14 0"/><path class="cappy-glove" d="M22 14c-3-7 0-9 2-3-1-8 3-8 4-1 1-6 5-4 4 2 3-4 6 0 3 5-3 6-8 9-13 7Zm118 16c-1-7 2-9 4-3 1-7 5-6 4 1 4-5 7-1 3 4 5-3 7 2 2 5-4 5-8 7-12 7Z"/><path class="cappy-shoe" d="M46 105c-10-1-18 5-17 10 2 5 18 2 24-3M70 106c8-2 15 3 14 8-2 5-16 2-21-2M99 104c-9 0-15 5-13 10 3 4 16 1 21-3M122 104c9-1 16 4 15 9-2 5-16 3-22-1"/><path class="cappy-body" d="M109 29c4 0 5-3 9-2s4 4 8 5 7-1 9 2 0 6 3 9 6 1 7 5-2 6-1 9 5 4 4 8-5 4-5 8 4 5 2 8-7 2-8 5 1 7-3 8-6-2-10 0-3 5-7 4-5-4-10-4-5 4-9 1-1-6-5-8-6 2-8-2 2-6-1-10-6-1-7-5 4-4 3-8-5-3-4-7 6-3 7-6-4-5-2-9 6-1 7-4 1-5 5-6 8 1 11-1 2-4 6-4 5 3 9 2 3-4 7-3Z"/><circle class="cap-face" cx="109" cy="63" r="27"/><path class="cappy-brow" d="M96 49l5-2m20 3-4-3"/><ellipse class="eye-white" cx="99" cy="59" rx="6" ry="8"/><ellipse class="eye-white" cx="119" cy="58" rx="6" ry="8"/><circle class="pupil" cx="101" cy="59" r="2.5"/><circle class="pupil" cx="120" cy="59" r="2.5"/><path class="cappy-nose" d="M109 62c-7 2-6 7 2 7"/><path class="cappy-mouth" d="M97 72q13 16 25 0-13 7-25 0Z"/><circle class="cappy-cheek" cx="94" cy="70" r="4"/><circle class="cappy-cheek" cx="125" cy="68" r="4"/>',
    bootMessages: ['PRESSURIZING SERVICE LINES...', 'VERIFYING FORMULA ARCHIVE...', 'LINKING BOTTLING NETWORK...', 'HAVE A REFRESHING DAY!']
  }
};

const commands = [
  { id: 'newTab', label: 'New tab', icon: '+', keys: 'Ctrl+Shift+T', run: () => createTab() },
  { id: 'closeTab', label: 'Close tab', icon: '×', keys: 'Ctrl+Shift+W', run: closeActiveTab },
  { id: 'nextTab', label: 'Next tab', icon: '→', keys: 'Ctrl+Tab', run: () => cycleTab(1) },
  { id: 'previousTab', label: 'Previous tab', icon: '←', keys: 'Ctrl+Shift+Tab', run: () => cycleTab(-1) },
  { id: 'splitRight', label: 'Split pane right', icon: '║', keys: 'Alt+Shift+=', run: () => splitActive('row') },
  { id: 'splitDown', label: 'Split pane down', icon: '═', keys: 'Alt+Shift+-', run: () => splitActive('column') },
  { id: 'closePane', label: 'Close active pane', icon: '⊘', keys: 'Ctrl+Shift+W', run: closeActivePane },
  { id: 'focusLeft', label: 'Focus pane left', icon: '←', keys: 'Alt+Left', run: () => focusAdjacent(-1) },
  { id: 'focusRight', label: 'Focus pane right', icon: '→', keys: 'Alt+Right', run: () => focusAdjacent(1) },
  { id: 'copy', label: 'Copy selection', icon: '⧉', keys: 'Ctrl+Shift+C', run: copySelection },
  { id: 'paste', label: 'Paste', icon: '▣', keys: 'Ctrl+V', run: () => pasteClipboard() },
  { id: 'find', label: 'Find in buffer', icon: '⌕', keys: 'Ctrl+Shift+F', run: openFind },
  { id: 'clear', label: 'Clear buffer', icon: '⌫', keys: 'Ctrl+K', run: () => activePane()?.terminal.clear() },
  { id: 'broadcast', label: 'Toggle broadcast input', icon: '⌁', keys: 'Ctrl+Shift+B', run: toggleBroadcast },
  { id: 'previousMark', label: 'Previous command mark', icon: '↑', keys: 'Ctrl+Up', run: () => jumpMark(-1) },
  { id: 'nextMark', label: 'Next command mark', icon: '↓', keys: 'Ctrl+Down', run: () => jumpMark(1) },
  { id: 'quake', label: 'Toggle quake mode', icon: '⌄', keys: 'Global shortcut summons', run: () => window.hackers.windowAction('quake') },
  { id: 'zoomIn', label: 'Increase font size', icon: 'A+', keys: 'Ctrl++', run: () => zoom(1) },
  { id: 'zoomOut', label: 'Decrease font size', icon: 'A−', keys: 'Ctrl+-', run: () => zoom(-1) },
  { id: 'resetZoom', label: 'Reset font size', icon: 'A', keys: 'Ctrl+0', run: () => setFontSize(14) },
  { id: 'fullscreen', label: 'Toggle fullscreen', icon: '□', keys: 'F11', run: () => window.hackers.windowAction('fullscreen') },
  { id: 'settings', label: 'Open settings', icon: '⚙', keys: 'Ctrl+,', run: openSettings },
  { id: 'checkUpdates', label: 'Check for updates', icon: '⇪', keys: 'Automatic on launch', run: checkUpdates },
  { id: 'palette', label: 'Command palette', icon: '⌘', keys: 'Ctrl+Shift+P', run: openPalette }
];

async function loadScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src; script.onload = resolve; script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.append(script);
  });
}

async function loadTerminalLibraries() {
  for (const src of [
    '../../node_modules/@xterm/xterm/lib/xterm.js',
    '../../node_modules/@xterm/addon-fit/lib/addon-fit.js',
    '../../node_modules/@xterm/addon-search/lib/addon-search.js',
    '../../node_modules/@xterm/addon-web-links/lib/addon-web-links.js'
  ]) await loadScript(src);
}

async function init() {
  await loadTerminalLibraries();
  const boot = await window.hackers.bootstrap();
  state.settings = boot.settings;
  state.themes = boot.themes;
  state.windowsPty = boot.windowsPty;
  state.broadcast = Boolean(state.settings.broadcastInput);
  if (boot.shortcutStatus) {
    const status = $('#quake-status');
    status.textContent = boot.shortcutStatus.registered ? `Registered globally: ${boot.shortcutStatus.accelerator}` : `Shortcut unavailable: ${boot.shortcutStatus.accelerator}`;
  }
  $('#version').textContent = boot.version;
  bindUi(); populateSettings(); applyAppearance();
  window.hackers.onPtyData(({ id, data }) => {
    const pane = [...state.panes.values()].find((item) => item.ptyId === id);
    if (pane) pane.terminal.write(data);
  });
  window.hackers.onPtyExit(({ id, exitCode }) => {
    const pane = [...state.panes.values()].find((item) => item.ptyId === id);
    if (!pane) return;
    pane.exited = true;
    pane.terminal.write(`\r\n\x1b[38;2;255;43;214m[ CONNECTION CLOSED // CODE ${exitCode} ]\x1b[0m\r\n`);
    toast('LINK TERMINATED', `${pane.profile.name} exited with code ${exitCode}.`); sound('disconnect');
  });
  window.hackers.onPtyError(({ id, message }) => {
    const pane = [...state.panes.values()].find((item) => item.ptyId === id);
    if (pane) pane.terminal.write(`\r\n\x1b[38;2;255;52;95m[ ELEVATED LINK ERROR // ${message} ]\x1b[0m\r\n`);
    toast('LINK ERROR', message);
  });
  window.hackers.onQuakeChange(({ active }) => { state.quake = active; document.body.classList.toggle('quake-mode', active); requestAnimationFrame(fitAll); });
  window.hackers.onShortcutStatus(({ accelerator, registered }) => {
    const status = $('#quake-status');
    if (status) status.textContent = registered ? `Registered globally: ${accelerator}` : `Shortcut unavailable: ${accelerator}`;
  });
  window.hackers.onUpdateStatus(applyUpdateState);
  applyUpdateState(boot.update);
  if (state.settings.restoreWorkspace && boot.workspace?.tabs?.length) await restoreWorkspace(boot.workspace);
  else await createTab(undefined, false);
  state.workspaceReady = true;
  updateBroadcastUi();
  scheduleWorkspaceSave();
  updateClock(); setInterval(updateClock, 1000); runBoot();
}

function bindUi() {
  $('#new-tab').addEventListener('click', () => createTab());
  $('#profile-menu-button').addEventListener('click', (event) => { event.stopPropagation(); $('#profile-menu').classList.toggle('hidden'); });
  document.addEventListener('click', () => $('#profile-menu').classList.add('hidden'));
  $$('.window-controls button').forEach((button) => button.addEventListener('click', () => window.hackers.windowAction(button.dataset.window)));
  $$('.toolbar-actions button').forEach((button) => button.addEventListener('click', () => executeCommand(button.dataset.command)));
  document.addEventListener('keydown', handleShortcuts, true);
  window.addEventListener('resize', fitAll);
  $('#find-input').addEventListener('input', () => search(false));
  $('#find-input').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); search(event.shiftKey); } if (event.key === 'Escape') closeFind(); });
  $('#find-prev').addEventListener('click', () => search(true)); $('#find-next').addEventListener('click', () => search(false)); $('#find-close').addEventListener('click', closeFind);
  $('#palette-input').addEventListener('input', renderPalette); $('#palette-input').addEventListener('keydown', paletteKeys);
  $('#palette').addEventListener('mousedown', (event) => { if (event.target === $('#palette')) closePalette(); });
  $('#settings-close').addEventListener('click', closeSettings);
  $('#settings').addEventListener('mousedown', (event) => { if (event.target === $('#settings')) closeSettings(); });
  $$('[data-settings-page]').forEach((button) => button.addEventListener('click', () => showSettingsPage(button.dataset.settingsPage)));
  $('#settings-save').addEventListener('click', saveSettings); $('#settings-reset').addEventListener('click', resetSettingsForm);
  $('#discover-ssh').addEventListener('click', discoverSsh);
  $('#import-wt').addEventListener('click', importWindowsTerminal);
  $('#apply-profile-json').addEventListener('click', applyProfileJson);
  $('#profile-json').addEventListener('input', validateProfileJson);
  ['setting-theme', 'setting-font', 'setting-font-size', 'setting-opacity', 'setting-scanlines', 'setting-glow', 'setting-cursor'].forEach((id) => $(`#${id}`).addEventListener('input', previewSettings));
  $('#setting-experience').addEventListener('change', () => {
    const experience = $('#setting-experience').value;
    const current = state.themes[$('#setting-theme').value];
    refreshThemeOptions(experience);
    if (!current || current.family !== experience) $('#setting-theme').value = experience === 'fallout' ? 'pipBoy' : 'acidBurn';
    previewSettings();
  });
  $('#setting-opacity').addEventListener('input', () => $('#opacity-output').value = `${$('#setting-opacity').value}%`);
  $('#update-badge').addEventListener('click', () => { if (state.update.state === 'ready') window.hackers.installUpdate(); });
}

function profileById(id) { return state.settings.profiles.find((profile) => profile.id === id) || state.settings.profiles[0]; }

async function createTab(profileId = state.settings.defaultProfile, persist = true) {
  const profile = profileById(profileId);
  const tab = { id: `tab-${state.nextTab++}`, title: profile.name, root: null, activePaneId: null };
  const pane = createPane(profile);
  tab.root = { type: 'pane', paneId: pane.id }; tab.activePaneId = pane.id;
  state.tabs.push(tab); state.activeTabId = tab.id;
  renderTabs(); renderWorkspace(); openPane(pane);
  try { await spawnPane(pane); }
  catch (error) {
    disposePane(pane.id);
    state.tabs = state.tabs.filter((item) => item !== tab);
    state.activeTabId = state.tabs.at(-1)?.id || null;
    renderTabs(); renderWorkspace();
    toast(profile.elevated ? 'ELEVATION CANCELLED' : 'LINK FAILED', error.message);
    if (!state.tabs.length && persist) await createTab(state.settings.defaultProfile, false);
    return null;
  }
  sound('connect');
  if (persist) scheduleWorkspaceSave();
  return tab;
}

function createPane(profile) {
  const id = `pane-${state.nextPane++}`;
  const element = document.createElement('section');
  element.className = 'pane'; element.dataset.paneId = id;
  element.innerHTML = '<div class="pane-terminal"></div><div class="mark-rail"></div><span class="pane-badge">ACTIVE LINK</span>';
  element.addEventListener('mousedown', () => activatePane(id));
  const paneTheme = state.themes[profile.theme] || state.themes[state.settings.theme];
  const terminal = new Terminal({
    allowTransparency: true, cursorBlink: state.settings.cursorBlink,
    cursorStyle: state.settings.cursorStyle, fontFamily: state.settings.fontFamily,
    fontSize: state.settings.fontSize, fontWeight: '400', lineHeight: state.settings.lineHeight,
    linkHandler: { activate: openTerminalLink },
    scrollback: state.settings.scrollback, theme: paneTheme, windowsPty: state.windowsPty
  });
  const fitAddon = new FitAddon.FitAddon(); const searchAddon = new SearchAddon.SearchAddon();
  terminal.loadAddon(fitAddon); terminal.loadAddon(searchAddon);
  terminal.loadAddon(new WebLinksAddon.WebLinksAddon(openTerminalLink));
  const pane = { id, ptyId: null, terminal, fitAddon, searchAddon, element, profile, opened: false, exited: false, marks: [], markCursor: -1 };
  state.panes.set(id, pane);
  element.addEventListener('mouseup', (event) => {
    if (event.button === 0 && terminal.hasSelection()) copyPaneSelection(pane, true).catch((error) => toast('CLIPBOARD FAILED', error.message));
  });
  // Right-click is copy-if-selected, otherwise paste. No menu: a terminal only ever has
  // these two answers, and a menu turns one gesture into two.
  element.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    activatePane(id);
    const action = terminal.hasSelection() ? copySelection() : pasteClipboard(pane);
    Promise.resolve(action).catch((error) => toast('CLIPBOARD FAILED', error.message));
  });
  terminal.onData((data) => {
    if (pane.ptyId && !pane.exited) {
      if (state.broadcast && tabForPane(pane.id)?.id === state.activeTabId) {
        treePaneIds(activeTab().root).map((paneId) => state.panes.get(paneId)).filter((target) => target?.ptyId && !target.exited).forEach((target) => window.hackers.writePty(target.ptyId, data));
      } else window.hackers.writePty(pane.ptyId, data);
    }
    if (state.settings.keySounds && data.length === 1 && data >= ' ') sound('key');
  });
  terminal.onResize(({ cols, rows }) => { if (pane.ptyId) window.hackers.resizePty(pane.ptyId, cols, rows); renderMarkRail(pane); });
  terminal.onScroll(() => renderMarkRail(pane));
  terminal.parser.registerOscHandler(133, (payload) => handleShellMark(pane, payload));
  terminal.onTitleChange((title) => { const tab = tabForPane(id); if (tab && title.trim()) { tab.title = title.trim().slice(0, 48); renderTabs(); scheduleWorkspaceSave(); } });
  terminal.attachCustomKeyEventHandler((event) => !isAppShortcut(event));
  return pane;
}

// Opens and fits synchronously: the element is already laid out by the time this runs, and the
// shell must be spawned at the size it will actually have. A pty born at 80x24 and corrected a
// frame later is a pty whose first prompt — and any program that reads its width at startup —
// wrapped against the wrong terminal.
function openPane(pane) {
  if (!pane.opened) { pane.terminal.open($('.pane-terminal', pane.element)); pane.opened = true; }
  fitPane(pane);
  pane.terminal.focus();
  requestAnimationFrame(() => fitPane(pane));
}

async function spawnPane(pane) {
  if (pane.ptyId) return pane;
  const session = await window.hackers.createPty(pane.profile, { cols: pane.terminal.cols, rows: pane.terminal.rows });
  pane.ptyId = session.id;
  // Any fit that settled while the pty was still being created had nowhere to go; replay it.
  window.hackers.resizePty(pane.ptyId, pane.terminal.cols, pane.terminal.rows);
  return pane;
}
function activeTab() { return state.tabs.find((tab) => tab.id === state.activeTabId); }
function activePane() { const tab = activeTab(); return tab ? state.panes.get(tab.activePaneId) : null; }
function tabForPane(paneId) { return state.tabs.find((tab) => treePaneIds(tab.root).includes(paneId)); }

function renderTabs() {
  const tabs = $('#tabs'); tabs.replaceChildren();
  state.tabs.forEach((tab, index) => {
    const pane = state.panes.get(tab.activePaneId); const button = document.createElement('button');
    button.className = `tab${tab.id === state.activeTabId ? ' active' : ''}`; button.setAttribute('role', 'tab');
    button.innerHTML = `<span class="tab-icon">${escapeHtml(pane?.profile.icon || '›_')}</span><span class="tab-title">${escapeHtml(tab.title)}</span><span class="tab-close" title="Close">×</span>`;
    button.addEventListener('click', (event) => event.target.closest('.tab-close') ? closeTab(tab.id) : activateTab(tab.id));
    button.addEventListener('auxclick', (event) => { if (event.button === 1) closeTab(tab.id); });
    if (index < 9) button.title = `Alt+${index + 1}`; tabs.append(button);
  }); updateReadouts();
}

function renderWorkspace() {
  const workspace = $('#workspace'); workspace.replaceChildren(); const tab = activeTab(); if (!tab) return;
  const root = document.createElement('div'); root.className = 'tab-workspace'; root.append(renderNode(tab.root)); workspace.append(root);
  treePaneIds(tab.root).forEach((paneId) => state.panes.get(paneId).element.classList.toggle('active', paneId === tab.activePaneId));
  requestAnimationFrame(fitAll); updateReadouts();
}

function renderNode(node) {
  if (node.type === 'pane') return state.panes.get(node.paneId).element;
  const split = document.createElement('div'); split.className = `split ${node.direction}`;
  node.children.forEach((child, index) => {
    const wrapper = document.createElement('div'); wrapper.className = 'split-child'; wrapper.style.flexGrow = String(node.sizes?.[index] || 1); wrapper.append(renderNode(child));
    if (index < node.children.length - 1) { const handle = document.createElement('div'); handle.className = 'resize-handle'; handle.addEventListener('mousedown', (event) => beginResize(event, node, index, split)); wrapper.append(handle); }
    split.append(wrapper);
  }); return split;
}

async function splitActive(direction) {
  const tab = activeTab(); const source = activePane(); if (!tab || !source) return;
  const previousRoot = tab.root, previousActive = tab.activePaneId;
  const pane = createPane(source.profile);
  tab.root = replacePaneWithSplit(tab.root, source.id, direction, pane.id); tab.activePaneId = pane.id;
  renderWorkspace(); renderTabs(); openPane(pane);
  try { await spawnPane(pane); }
  catch (error) {
    disposePane(pane.id);
    tab.root = previousRoot; tab.activePaneId = previousActive;
    renderWorkspace(); renderTabs(); activePane()?.terminal.focus();
    toast(source.profile.elevated ? 'ELEVATION CANCELLED' : 'LINK FAILED', error.message);
    return;
  }
  sound('split'); scheduleWorkspaceSave();
}
function replacePaneWithSplit(node, targetId, direction, newId) {
  if (node.type === 'pane') return node.paneId === targetId ? { type: 'split', direction, sizes: [1, 1], children: [node, { type: 'pane', paneId: newId }] } : node;
  return { ...node, children: node.children.map((child) => replacePaneWithSplit(child, targetId, direction, newId)) };
}
function removePaneNode(node, targetId) {
  if (node.type === 'pane') return node.paneId === targetId ? null : node;
  const children = node.children.map((child) => removePaneNode(child, targetId)).filter(Boolean);
  return children.length === 1 ? children[0] : { ...node, children, sizes: children.map(() => 1) };
}

function closeActivePane() {
  const tab = activeTab(); if (!tab) return; const ids = treePaneIds(tab.root); if (ids.length === 1) { closeTab(tab.id); return; }
  const closing = tab.activePaneId; const index = ids.indexOf(closing); disposePane(closing); tab.root = removePaneNode(tab.root, closing);
  const remaining = treePaneIds(tab.root); tab.activePaneId = remaining[Math.min(index, remaining.length - 1)]; renderWorkspace(); renderTabs(); activePane()?.terminal.focus();
  scheduleWorkspaceSave();
}
function closeActiveTab() { const tab = activeTab(); if (!tab) return; treePaneIds(tab.root).length > 1 ? closeActivePane() : closeTab(tab.id); }
function closeTab(id) {
  const index = state.tabs.findIndex((tab) => tab.id === id); if (index < 0) return;
  treePaneIds(state.tabs[index].root).forEach(disposePane); state.tabs.splice(index, 1);
  if (!state.tabs.length) { window.hackers.windowAction('close'); return; }
  if (state.activeTabId === id) state.activeTabId = state.tabs[Math.min(index, state.tabs.length - 1)].id;
  renderTabs(); renderWorkspace(); activePane()?.terminal.focus();
  scheduleWorkspaceSave();
}
function disposePane(id) { const pane = state.panes.get(id); if (!pane) return; if (pane.ptyId) window.hackers.killPty(pane.ptyId); pane.terminal.dispose(); state.panes.delete(id); }
function activateTab(id) { if (!state.tabs.some((tab) => tab.id === id)) return; state.activeTabId = id; renderTabs(); renderWorkspace(); activePane()?.terminal.focus(); scheduleWorkspaceSave(); }
function activatePane(id) { const tab = activeTab(); if (!tab || !treePaneIds(tab.root).includes(id)) return; tab.activePaneId = id; $$('.pane', $('#workspace')).forEach((el) => el.classList.toggle('active', el.dataset.paneId === id)); renderTabs(); state.panes.get(id)?.terminal.focus(); scheduleWorkspaceSave(); }
function cycleTab(delta) { const index = state.tabs.findIndex((tab) => tab.id === state.activeTabId); activateTab(state.tabs[(index + delta + state.tabs.length) % state.tabs.length].id); }
function focusAdjacent(delta) { const tab = activeTab(); if (!tab) return; const ids = treePaneIds(tab.root); const index = ids.indexOf(tab.activePaneId); activatePane(ids[(index + delta + ids.length) % ids.length]); }
function treePaneIds(node) { if (!node) return []; return node.type === 'pane' ? [node.paneId] : node.children.flatMap(treePaneIds); }

function serializeWorkspaceNode(node) {
  if (node.type === 'pane') {
    const pane = state.panes.get(node.paneId);
    return { type: 'pane', profileId: pane?.profile.id || state.settings.defaultProfile };
  }
  return { type: 'split', direction: node.direction, sizes: [...(node.sizes || node.children.map(() => 1))], children: node.children.map(serializeWorkspaceNode) };
}

function workspaceSnapshot() {
  return {
    version: 1,
    activeTabIndex: Math.max(0, state.tabs.findIndex((tab) => tab.id === state.activeTabId)),
    tabs: state.tabs.filter((tab) => tab.root).map((tab) => {
      const ids = treePaneIds(tab.root);
      return { title: tab.title, activePaneIndex: Math.max(0, ids.indexOf(tab.activePaneId)), root: serializeWorkspaceNode(tab.root) };
    })
  };
}

function scheduleWorkspaceSave() {
  if (!state.workspaceReady || !state.settings.restoreWorkspace) return;
  clearTimeout(state.workspaceSaveTimer);
  state.workspaceSaveTimer = setTimeout(() => window.hackers.saveWorkspace(workspaceSnapshot()), 180);
}

async function restoreWorkspace(saved) {
  const openedPanes = [];
  for (const savedTab of saved.tabs.slice(0, 20)) {
    try {
      const tab = { id: `tab-${state.nextTab++}`, title: String(savedTab.title || 'Restored link').slice(0, 48), root: null, activePaneId: null };
      tab.root = restoreWorkspaceNode(savedTab.root, openedPanes);
      const ids = treePaneIds(tab.root);
      tab.activePaneId = ids[Math.min(Number(savedTab.activePaneIndex) || 0, ids.length - 1)];
      state.tabs.push(tab);
    } catch (error) { toast('RESTORE SKIPPED', error.message); }
  }
  if (!state.tabs.length) { await createTab(state.settings.defaultProfile, false); return; }
  state.activeTabId = state.tabs[Math.min(Number(saved.activeTabIndex) || 0, state.tabs.length - 1)].id;
  renderTabs(); renderWorkspace();
  // Lay every pane out first, then connect them: each shell is spawned at the size it landed on.
  openedPanes.forEach(openPane);
  for (const pane of openedPanes) {
    try { await spawnPane(pane); }
    catch (error) { toast(pane.profile.elevated ? 'ELEVATION CANCELLED' : 'LINK FAILED', error.message); }
  }
  activePane()?.terminal.focus();
  toast('WORKSPACE RESTORED', `${state.tabs.length} tab${state.tabs.length === 1 ? '' : 's'} reconnected.`);
}

function restoreWorkspaceNode(node, openedPanes) {
  if (!node || node.type === 'pane') {
    const pane = createPane(profileById(node?.profileId || state.settings.defaultProfile));
    openedPanes.push(pane);
    return { type: 'pane', paneId: pane.id };
  }
  const children = (node.children || []).slice(0, 12).map((child) => restoreWorkspaceNode(child, openedPanes));
  if (!children.length) return restoreWorkspaceNode(null, openedPanes);
  if (children.length === 1) return children[0];
  return { type: 'split', direction: node.direction === 'column' ? 'column' : 'row', sizes: Array.isArray(node.sizes) ? node.sizes.slice(0, children.length) : children.map(() => 1), children };
}

function beginResize(event, node, index, splitElement) {
  event.preventDefault(); const children = [...splitElement.children]; const before = children[index]; const after = children[index + 1]; const direction = node.direction;
  const start = direction === 'row' ? event.clientX : event.clientY; const beforeSize = direction === 'row' ? before.offsetWidth : before.offsetHeight; const afterSize = direction === 'row' ? after.offsetWidth : after.offsetHeight; const total = beforeSize + afterSize;
  document.body.style.cursor = direction === 'row' ? 'col-resize' : 'row-resize';
  const move = (moveEvent) => { const current = direction === 'row' ? moveEvent.clientX : moveEvent.clientY; const nextBefore = Math.max(90, Math.min(total - 90, beforeSize + current - start)); node.sizes[index] = nextBefore; node.sizes[index + 1] = total - nextBefore; before.style.flexGrow = String(nextBefore); after.style.flexGrow = String(total - nextBefore); fitAll(); };
  const up = () => { document.body.style.cursor = ''; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); fitAll(); scheduleWorkspaceSave(); };
  document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
}
function fitPane(pane) { if (!pane?.opened || !pane.element.isConnected || pane.element.offsetWidth < 20 || pane.element.offsetHeight < 20) return; try { pane.fitAddon.fit(); } catch {} }
function fitAll() { const tab = activeTab(); if (tab) treePaneIds(tab.root).forEach((id) => fitPane(state.panes.get(id))); }

function handleShellMark(pane, payload) {
  if (!state.settings.shellIntegrationMarks) return false;
  const [kind, value] = String(payload).split(';');
  if (kind === 'A') {
    const marker = pane.terminal.registerMarker(0);
    if (marker) {
      pane.marks.push({ marker, exitCode: null });
      if (pane.marks.length > 500) pane.marks.shift();
      pane.markCursor = pane.marks.length - 1;
      renderMarkRail(pane);
    }
  } else if (kind === 'D' && pane.marks.length) {
    pane.marks[pane.marks.length - 1].exitCode = Number.isFinite(Number(value)) ? Number(value) : null;
    renderMarkRail(pane);
  }
  return true;
}

function renderMarkRail(pane) {
  const rail = $('.mark-rail', pane.element);
  if (!rail) return;
  rail.replaceChildren();
  const total = Math.max(1, pane.terminal.buffer.active.baseY + pane.terminal.rows);
  pane.marks = pane.marks.filter((mark) => !mark.marker.isDisposed);
  pane.marks.forEach((mark) => {
    const dot = document.createElement('i');
    dot.className = `mark-dot${mark.exitCode && mark.exitCode !== 0 ? ' failed' : ''}`;
    dot.style.top = `${Math.min(99, Math.max(0, mark.marker.line / total * 100))}%`;
    rail.append(dot);
  });
}

function jumpMark(delta) {
  const pane = activePane();
  if (!pane?.marks.length) { toast('NO COMMAND MARKS', 'This shell has not emitted an OSC 133 prompt mark yet.'); return; }
  pane.marks = pane.marks.filter((mark) => !mark.marker.isDisposed);
  pane.markCursor = Math.max(0, Math.min(pane.marks.length - 1, (pane.markCursor < 0 ? pane.marks.length : pane.markCursor) + delta));
  const mark = pane.marks[pane.markCursor];
  if (mark) pane.terminal.scrollToLine(mark.marker.line);
}

function toggleBroadcast() {
  state.broadcast = !state.broadcast;
  state.settings.broadcastInput = state.broadcast;
  updateBroadcastUi();
  window.hackers.saveSettings(state.settings);
  toast(state.broadcast ? 'BROADCAST ARMED' : 'BROADCAST DISARMED', state.broadcast ? 'Keystrokes will reach every pane in this tab.' : 'Input is isolated to the active pane.');
}

function updateBroadcastUi() {
  $('#app').classList.toggle('broadcasting', state.broadcast);
  $('#broadcast-toggle')?.classList.toggle('active', state.broadcast);
}

function applyUpdateState(update) {
  state.update = update || { state: 'idle' };
  const badge = $('#update-badge');
  const ready = state.update.state === 'ready';
  const downloading = state.update.state === 'downloading';
  badge.classList.toggle('hidden', !ready && !downloading);
  badge.classList.toggle('ready', ready);
  if (ready) badge.textContent = `⇪ ${state.update.version} READY — RESTART`;
  else if (downloading) badge.textContent = `⇩ PULLING ${state.update.version || ''} ${state.update.percent || 0}%`;
  // The badge is permanent, so announce the arrival exactly once rather than on every progress tick.
  if (ready && !state.updateAnnounced) {
    state.updateAnnounced = true;
    toast('UPGRADE STAGED', `Version ${state.update.version} is ready. Restart to install.`);
    sound('save');
  }
}

async function checkUpdates() {
  const result = await window.hackers.checkForUpdates();
  applyUpdateState(result);
  if (result.state === 'idle') toast('UPDATES UNAVAILABLE', 'Self-update only runs in the installed build, not from source.');
  else if (result.state === 'current') toast('UP TO DATE', 'This is the newest release.');
  else if (result.state === 'error') toast('UPDATE CHECK FAILED', result.message || 'The release feed could not be reached.');
  else if (result.state === 'downloading') toast('UPGRADE FOUND', `Pulling version ${result.version} in the background.`);
}

// The single source of truth for "this keystroke belongs to the app, not the shell". Both the
// dispatcher and xterm's key filter read it, so the app can never claim a key it does not
// actually act on — the old filter swallowed every Ctrl+Shift and Alt+Shift combination and
// those never reached the running program.
function commandForEvent(event) {
  const ctrl = event.ctrlKey, shift = event.shiftKey, alt = event.altKey;
  if (ctrl && alt) return null; // AltGr on international layouts; belongs to the shell.
  if (ctrl && shift && event.code === 'KeyT') return 'newTab';
  if (ctrl && shift && event.code === 'KeyW') return treePaneIds(activeTab()?.root).length > 1 ? 'closePane' : 'closeTab';
  if (ctrl && shift && event.code === 'KeyP') return 'palette';
  if (ctrl && shift && event.code === 'KeyF') return 'find';
  if (ctrl && shift && event.code === 'KeyB') return 'broadcast';
  if (ctrl && shift && event.code === 'KeyC') return 'copy';
  if (ctrl && event.code === 'KeyV') return 'paste';
  // Bare Ctrl+C only copies while something is selected, and copying clears the selection, so
  // the next press falls through to the shell as an interrupt.
  if (ctrl && !shift && event.code === 'KeyC' && activePane()?.terminal.hasSelection()) return 'copy';
  if (ctrl && !shift && event.code === 'Insert') return 'copy';
  if (!ctrl && shift && event.code === 'Insert') return 'paste';
  if (ctrl && !shift && event.code === 'Comma') return 'settings';
  if (ctrl && !shift && event.code === 'KeyK') return 'clear';
  if (ctrl && event.code === 'Tab') return shift ? 'previousTab' : 'nextTab';
  if (ctrl && ['Equal', 'NumpadAdd'].includes(event.code)) return 'zoomIn';
  if (ctrl && ['Minus', 'NumpadSubtract'].includes(event.code)) return 'zoomOut';
  if (ctrl && event.code === 'Digit0') return 'resetZoom';
  if (ctrl && !shift && event.code === 'ArrowUp') return 'previousMark';
  if (ctrl && !shift && event.code === 'ArrowDown') return 'nextMark';
  if (alt && shift && event.code === 'Equal') return 'splitRight';
  if (alt && shift && event.code === 'Minus') return 'splitDown';
  if (alt && !shift && event.code === 'ArrowLeft') return 'focusLeft';
  if (alt && !shift && event.code === 'ArrowRight') return 'focusRight';
  if (event.code === 'F11') return 'fullscreen';
  return null;
}
function isTabSelect(event) { return event.altKey && !event.ctrlKey && !event.shiftKey && /^Digit[1-9]$/.test(event.code); }
function isEditableTarget(event) { return event.target instanceof HTMLElement && Boolean(event.target.closest('input, textarea, select')); }

function handleShortcuts(event) {
  if (!$('#settings').classList.contains('hidden')) { if (event.key === 'Escape') { event.preventDefault(); closeSettings(); } return; }
  if (!$('#palette').classList.contains('hidden')) return;
  if (event.key === 'Escape' && !$('#find-bar').classList.contains('hidden')) { event.preventDefault(); closeFind(); return; }
  if (isTabSelect(event)) { const index = Number(event.code.slice(-1)) - 1; if (state.tabs[index]) { event.preventDefault(); activateTab(state.tabs[index].id); } return; }
  const command = commandForEvent(event);
  if (!command) return;
  // Let the browser's own clipboard handling win inside the find box and the profile editor.
  if (isEditableTarget(event) && ['copy', 'paste', 'clear'].includes(command)) return;
  event.preventDefault(); event.stopPropagation(); executeCommand(command);
}
function isAppShortcut(event) { return Boolean(commandForEvent(event)) || isTabSelect(event); }
function executeCommand(id) {
  const result = commands.find((command) => command.id === id)?.run();
  Promise.resolve(result).catch((error) => toast('COMMAND FAILED', error.message));
}

function openPalette() { $('#palette').classList.remove('hidden'); $('#palette').setAttribute('aria-hidden', 'false'); $('#palette-input').value = ''; state.paletteIndex = 0; renderPalette(); $('#palette-input').focus(); sound('open'); }
function closePalette() { $('#palette').classList.add('hidden'); $('#palette').setAttribute('aria-hidden', 'true'); activePane()?.terminal.focus(); }
function renderPalette() {
  const query = $('#palette-input').value.trim().toLowerCase(); state.paletteCommands = commands.filter((command) => command.label.toLowerCase().includes(query)); state.paletteIndex = Math.min(state.paletteIndex, Math.max(0, state.paletteCommands.length - 1));
  const list = $('#palette-list'); list.replaceChildren(); state.paletteCommands.forEach((command, index) => { const button = document.createElement('button'); button.className = `palette-command${index === state.paletteIndex ? ' selected' : ''}`; button.innerHTML = `<i>${command.icon}</i><span>${escapeHtml(command.label)}</span><kbd>${escapeHtml(command.keys)}</kbd>`; button.addEventListener('mouseenter', () => { state.paletteIndex = index; $$('.palette-command', list).forEach((item, itemIndex) => item.classList.toggle('selected', itemIndex === index)); }); button.addEventListener('click', () => { closePalette(); command.run(); }); list.append(button); });
}
function paletteKeys(event) { if (event.key === 'Escape') { event.preventDefault(); closePalette(); } if (event.key === 'ArrowDown') { event.preventDefault(); state.paletteIndex = Math.min(state.paletteIndex + 1, state.paletteCommands.length - 1); renderPalette(); } if (event.key === 'ArrowUp') { event.preventDefault(); state.paletteIndex = Math.max(state.paletteIndex - 1, 0); renderPalette(); } if (event.key === 'Enter' && state.paletteCommands[state.paletteIndex]) { event.preventDefault(); const command = state.paletteCommands[state.paletteIndex]; closePalette(); command.run(); } }

function openFind() { $('#find-bar').classList.remove('hidden'); $('#find-input').focus(); $('#find-input').select(); }
function closeFind() { $('#find-bar').classList.add('hidden'); activePane()?.searchAddon.clearDecorations(); activePane()?.terminal.focus(); }
function search(previous) { const pane = activePane(); if (!pane) return; const term = $('#find-input').value; const theme = state.themes[state.settings.theme]; const options = { caseSensitive: $('#find-case').checked, decorations: { matchBackground: theme.accent, activeMatchBackground: theme.accent2 } }; previous ? pane.searchAddon.findPrevious(term, options) : pane.searchAddon.findNext(term, options); }
async function copyPaneSelection(pane, notify = false) {
  const text = pane?.terminal.getSelection();
  if (!text) return false;
  await window.hackers.writeClipboard(text);
  if (notify) toast('BUFFER COPIED', `${text.length} characters secured.`);
  return true;
}
// Dropping the selection after an explicit copy is what frees Ctrl+C to send SIGINT again:
// while a selection survives, every Ctrl+C is read as another copy and the shell never
// sees the interrupt.
async function copySelection() {
  const pane = activePane();
  const copied = await copyPaneSelection(pane, true);
  if (copied) pane.terminal.clearSelection();
  return copied;
}
// Paste must go through xterm, never straight down the pty. terminal.paste() collapses the
// clipboard's CRLFs to a single CR and wraps the text in the bracketed-paste markers when the
// running program has asked for them. Writing raw text skips both, so every newline arrives as
// a bare Enter and a multi-line paste submits itself line by line.
async function pasteClipboard(pane = activePane()) {
  if (!pane || pane.exited) return;
  const text = await window.hackers.readClipboard();
  if (text) pane.terminal.paste(text);
}
async function openTerminalLink(event, uri) {
  if (!event.ctrlKey) return;
  event.preventDefault();
  event.stopPropagation();
  const result = await window.hackers.openExternal(uri);
  if (!result?.opened) toast('LINK FAILED', result?.error || 'The browser could not be opened.');
}
function zoom(delta) { setFontSize(state.settings.fontSize + delta); }
function setFontSize(size) { state.settings.fontSize = Math.min(32, Math.max(9, size)); state.panes.forEach((pane) => pane.terminal.options.fontSize = state.settings.fontSize); $('#font-label').textContent = `${state.settings.fontSize} PX`; requestAnimationFrame(fitAll); }

function populateSettings() { $('#setting-experience').value = state.settings.experience; refreshThemeOptions(state.settings.experience); renderProfileMenus(); writeSettingsForm(state.settings); }
function refreshThemeOptions(experience = $('#setting-experience')?.value || state.settings.experience) {
  const themeSelect = $('#setting-theme'); const selected = themeSelect.value || state.settings.theme;
  const available = Object.values(state.themes).filter((theme) => !theme.family || theme.family === experience);
  themeSelect.replaceChildren(...available.map((theme) => new Option(theme.name, theme.id)));
  themeSelect.value = available.some((theme) => theme.id === selected) ? selected : experience === 'fallout' ? 'pipBoy' : 'acidBurn';
}
function renderProfileMenus() {
  const popup = $('#profile-menu'); popup.replaceChildren();
  state.settings.profiles.forEach((profile) => {
    const button = document.createElement('button'); button.className = 'profile-item'; button.style.setProperty('--profile-color', profile.color);
    button.innerHTML = `<i>${escapeHtml(profile.icon)}</i><span>${escapeHtml(profile.name)}${profile.elevated ? ' <b title="Administrator profile">▲</b>' : ''}<small>${escapeHtml(profile.command)}</small></span>`;
    button.addEventListener('click', () => createTab(profile.id)); popup.append(button);
  });
  const container = $('#profile-settings'); container.replaceChildren();
  state.settings.profiles.forEach((profile) => {
    const label = document.createElement('label'); label.className = 'profile-setting'; label.style.setProperty('--profile-color', profile.color);
    label.innerHTML = `<em>${escapeHtml(profile.icon)}</em><span>${escapeHtml(profile.name)}<small>${escapeHtml(profile.command)} ${escapeHtml(profile.args.join(' '))}</small></span>${profile.elevated ? '<em class="elevated-badge">ADMIN</em>' : ''}<input type="radio" name="default-profile" value="${escapeHtml(profile.id)}">`;
    container.append(label);
  });
  const defaultRadio = $(`input[name="default-profile"][value="${CSS.escape(state.settings.defaultProfile)}"]`);
  if (defaultRadio) defaultRadio.checked = true;
}
function writeSettingsForm(settings) {
  $('#setting-experience').value = settings.experience;
  refreshThemeOptions(settings.experience);
  $('#setting-theme').value = settings.theme; $('#setting-font').value = settings.fontFamily; $('#setting-font-size').value = settings.fontSize; $('#setting-opacity').value = settings.opacity; $('#opacity-output').value = `${settings.opacity}%`; $('#setting-scanlines').checked = settings.scanlines; $('#setting-glow').checked = settings.glow; $('#setting-cursor').checked = settings.cursorBlink; $('#setting-scrollback').value = settings.scrollback; $('#setting-sounds').checked = settings.sounds; $('#setting-keysounds').checked = settings.keySounds; $('#setting-startup').checked = settings.startupSequence;
  $('#setting-restore').checked = settings.restoreWorkspace;
  $('#setting-marks').checked = settings.shellIntegrationMarks;
  $('#setting-quake-shortcut').value = settings.quakeShortcut;
  $('#profile-json').value = JSON.stringify(settings.profiles, null, 2);
  validateProfileJson();
  const radio = $(`input[name="default-profile"][value="${CSS.escape(settings.defaultProfile)}"]`); if (radio) radio.checked = true;
}
function readSettingsForm(base = state.settings) { return { ...base, experience: $('#setting-experience').value, theme: $('#setting-theme').value, fontFamily: $('#setting-font').value.trim() || base.fontFamily, fontSize: Number($('#setting-font-size').value), opacity: Number($('#setting-opacity').value), scanlines: $('#setting-scanlines').checked, glow: $('#setting-glow').checked, cursorBlink: $('#setting-cursor').checked, scrollback: Number($('#setting-scrollback').value), sounds: $('#setting-sounds').checked, keySounds: $('#setting-keysounds').checked, startupSequence: $('#setting-startup').checked, restoreWorkspace: $('#setting-restore').checked, shellIntegrationMarks: $('#setting-marks').checked, quakeShortcut: $('#setting-quake-shortcut').value.trim() || base.quakeShortcut, defaultProfile: $('input[name="default-profile"]:checked')?.value || base.defaultProfile }; }
function openSettings() { renderProfileMenus(); writeSettingsForm(state.settings); $('#settings').classList.remove('hidden'); $('#settings').setAttribute('aria-hidden', 'false'); sound('open'); }
function closeSettings() { $('#settings').classList.add('hidden'); $('#settings').setAttribute('aria-hidden', 'true'); applyAppearance(); activePane()?.terminal.focus(); }
function showSettingsPage(page) { $$('[data-settings-page]').forEach((button) => button.classList.toggle('active', button.dataset.settingsPage === page)); $$('.settings-page').forEach((element) => element.classList.toggle('active', element.dataset.page === page)); }
function previewSettings() { applyAppearance(readSettingsForm()); }
async function saveSettings() {
  const selectedDefault = $('input[name="default-profile"]:checked')?.value;
  if (!applyProfileJson(false)) { showSettingsPage('profiles'); return; }
  if (selectedDefault && state.settings.profiles.some((profile) => profile.id === selectedDefault)) state.settings.defaultProfile = selectedDefault;
  const wasRestoring = state.settings.restoreWorkspace;
  state.settings = await window.hackers.saveSettings(readSettingsForm({ ...state.settings, profiles: state.settings.profiles }));
  state.themes = { ...state.themes, ...(state.settings.customThemes || {}) };
  state.broadcast = Boolean(state.settings.broadcastInput);
  applyAppearance(); renderProfileMenus(); closeSettings();
  if (wasRestoring && !state.settings.restoreWorkspace) await window.hackers.clearWorkspace(); else scheduleWorkspaceSave();
  toast('CONFIGURATION SAVED', 'Profiles, visual signal, and behavior updated.'); sound('save');
}
function resetSettingsForm() { const defaults = { ...state.settings, experience: 'hackers', theme: 'acidBurn', fontFamily: "'Cascadia Mono', 'Consolas', monospace", fontSize: 14, opacity: 94, scanlines: true, glow: true, cursorBlink: true, scrollback: 10000, sounds: true, keySounds: false, startupSequence: true, restoreWorkspace: true, shellIntegrationMarks: true, quakeShortcut: 'Control+Shift+Space', defaultProfile: 'powershell' }; writeSettingsForm(defaults); previewSettings(); }

function validateProfileJson() {
  const editor = $('#profile-json'), status = $('#profile-json-status');
  try {
    const parsed = JSON.parse(editor.value);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('Expected a non-empty JSON array.');
    parsed.forEach((profile, index) => { if (!profile || typeof profile.command !== 'string' || !profile.command.trim()) throw new Error(`Profile ${index + 1} needs a command.`); });
    editor.classList.remove('invalid'); status.textContent = `${parsed.length} valid profile${parsed.length === 1 ? '' : 's'}.`; return true;
  } catch (error) { editor.classList.add('invalid'); status.textContent = error.message; return false; }
}

function applyProfileJson(showNotice = true) {
  if (!validateProfileJson()) return false;
  const parsed = JSON.parse($('#profile-json').value);
  state.settings.profiles = parsed.map((profile, index) => ({
    ...profile,
    id: String(profile.id || `profile-${index + 1}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    name: String(profile.name || profile.id || `Profile ${index + 1}`),
    command: profile.command.trim(), args: Array.isArray(profile.args) ? profile.args.map(String) : [],
    icon: String(profile.icon || '>_'), color: /^#[0-9a-f]{6}$/i.test(profile.color) ? profile.color : '#18e8ff',
    elevated: Boolean(profile.elevated), shellIntegration: profile.shellIntegration !== false
  }));
  if (!state.settings.profiles.some((profile) => profile.id === state.settings.defaultProfile)) state.settings.defaultProfile = state.settings.profiles[0].id;
  renderProfileMenus();
  if (showNotice) toast('PROFILE JSON APPLIED', `${state.settings.profiles.length} access profiles staged for save.`);
  return true;
}

function mergeProfiles(profiles) {
  const merged = new Map(state.settings.profiles.map((profile) => [profile.id, profile]));
  profiles.forEach((profile) => merged.set(profile.id, profile));
  state.settings.profiles = [...merged.values()];
  $('#profile-json').value = JSON.stringify(state.settings.profiles, null, 2);
  validateProfileJson(); renderProfileMenus();
}

async function discoverSsh() {
  try {
    const result = await window.hackers.discoverSshProfiles();
    if (!result.profiles.length) { toast('NO SSH HOSTS FOUND', `No named hosts were found in ${result.sourcePath}.`); return; }
    mergeProfiles(result.profiles); toast('SSH HOSTS DISCOVERED', `${result.profiles.length} profile${result.profiles.length === 1 ? '' : 's'} imported from OpenSSH config.`);
  } catch (error) { toast('SSH DISCOVERY FAILED', error.message); }
}

async function importWindowsTerminal() {
  try {
    const result = await window.hackers.importWindowsTerminal();
    if (!result.sourcePath) { toast('WINDOWS TERMINAL NOT FOUND', 'No settings.json was found in the standard install locations.'); return; }
    mergeProfiles(result.profiles);
    if (result.defaultProfileId) state.settings.defaultProfile = result.defaultProfileId;
    state.settings.customThemes = { ...(state.settings.customThemes || {}), ...result.themes };
    state.themes = { ...state.themes, ...result.themes };
    refreshThemeOptions(); renderProfileMenus();
    toast('WINDOWS TERMINAL IMPORTED', `${result.profiles.length} profiles and ${Object.keys(result.themes).length} color schemes staged.`);
  } catch (error) { toast('IMPORT FAILED', error.message); }
}

function applyAppearance(settings = state.settings) {
  const theme = state.themes[settings.theme] || Object.values(state.themes)[0]; const root = document.documentElement;
  applyExperience(settings.experience || 'hackers', settings.theme);
  root.style.setProperty('--bg', theme.background); root.style.setProperty('--fg', theme.foreground); root.style.setProperty('--accent', theme.accent); root.style.setProperty('--accent2', theme.accent2); root.style.setProperty('--glow', theme.glow); root.style.setProperty('--opacity', settings.opacity / 100);
  $('#app').classList.toggle('scanlines', settings.scanlines); $('#app').classList.toggle('glow', settings.glow); $('#theme-label').textContent = theme.name.toUpperCase(); $('#font-label').textContent = `${settings.fontSize} PX`;
  state.panes.forEach((pane) => { pane.terminal.options.theme = state.themes[pane.profile.theme] || theme; pane.terminal.options.fontFamily = pane.profile.fontFamily || settings.fontFamily; pane.terminal.options.fontSize = pane.profile.fontSize || settings.fontSize; pane.terminal.options.cursorBlink = settings.cursorBlink; pane.terminal.options.scrollback = settings.scrollback; }); requestAnimationFrame(fitAll);
}

function applyExperience(id, themeId) {
  const baseExperience = EXPERIENCES[id] || EXPERIENCES.hackers;
  const experience = id === 'fallout' ? { ...baseExperience, ...(FALLOUT_SYSTEMS[themeId] || FALLOUT_SYSTEMS.robco) } : baseExperience;
  $('#app').classList.toggle('fallout', id === 'fallout');
  $('#app').dataset.experience = id;
  $('#app').dataset.system = id === 'fallout' ? (FALLOUT_SYSTEMS[themeId] ? themeId : 'robco') : 'hackers';
  $('#brand-title').textContent = experience.brand;
  $('#brand-subtitle').textContent = experience.subtitle;
  $('#status-logo').textContent = experience.status;
  $('#boot-title').textContent = experience.bootTitle;
  $('#boot-subtitle').textContent = experience.bootSubtitle;
  const flavor = $('#boot-flavor');
  flavor.textContent = experience.flavor || '';
  flavor.classList.toggle('hidden', !experience.flavor);
  const brandMark = $('.brand-mark');
  const bootMark = $('.boot-core svg');
  brandMark.setAttribute('viewBox', experience.brandViewBox || '0 0 40 40');
  bootMark.setAttribute('viewBox', experience.bootViewBox || '0 0 100 100');
  brandMark.innerHTML = experience.brandMark;
  bootMark.innerHTML = experience.bootMark;
  $('.settings-panel header p').textContent = id === 'fallout' ? 'ROBCO CONTROL DECK' : 'CONTROL DECK';
  $('.settings-panel header h1').textContent = id === 'fallout' ? 'System configuration' : 'Terminal setup';
  document.title = experience.title;
}
function updateReadouts() { const pane = activePane(); const tab = activeTab(); $('#active-profile').textContent = pane ? pane.profile.name.toUpperCase() : 'SYSTEM IDLE'; $('#session-readout').textContent = tab ? `CONNECTION ${String(state.tabs.indexOf(tab) + 1).padStart(2, '0')}` : 'NO CONNECTION'; $('#pane-count').innerHTML = `<b>LINKS</b> ${tab ? treePaneIds(tab.root).length : 0}`; }
function updateClock() { $('#clock').textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); }
function runBoot() { const boot = $('#boot'); if (!state.settings.startupSequence) { boot.classList.add('done'); return; } const experience = state.settings.experience === 'fallout' ? { ...EXPERIENCES.fallout, ...(FALLOUT_SYSTEMS[state.settings.theme] || FALLOUT_SYSTEMS.robco) } : EXPERIENCES.hackers; experience.bootMessages.forEach((message, index) => setTimeout(() => $('#boot-status').textContent = message, 350 + index * 470)); sound('boot'); setTimeout(() => { boot.classList.add('done'); activePane()?.terminal.focus(); }, state.settings.experience === 'fallout' ? 2350 : 2050); }

function sound(type) {
  if (!state.settings?.sounds) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext; state.audio ||= new AudioContext(); const ctx = state.audio, now = ctx.currentTime;
    const hackerCues = { key: [[0, 1400, .008, 'square', .008]], open: [[0, 280, .025, 'sine', .045], [.035, 560, .018, 'sine', .06]], save: [[0, 420, .03, 'triangle', .08], [.065, 840, .025, 'triangle', .11]], connect: [[0, 190, .018, 'square', .04], [.04, 760, .02, 'sine', .08]], disconnect: [[0, 500, .025, 'sawtooth', .06], [.05, 150, .02, 'sawtooth', .1]], split: [[0, 320, .02, 'square', .04], [.025, 480, .018, 'square', .06]], boot: [[0, 110, .025, 'sawtooth', .22], [.26, 170, .018, 'square', .16], [.48, 980, .02, 'sine', .1], [.65, 1470, .018, 'sine', .13]] };
    const falloutCues = { key: [[0, 680, .009, 'square', .012]], open: [[0, 95, .035, 'square', .055], [.07, 190, .018, 'triangle', .1]], save: [[0, 220, .028, 'square', .08], [.08, 330, .025, 'square', .1], [.16, 440, .02, 'triangle', .14]], connect: [[0, 75, .038, 'sawtooth', .1], [.12, 300, .022, 'square', .13]], disconnect: [[0, 240, .026, 'square', .08], [.08, 85, .032, 'sawtooth', .18]], split: [[0, 120, .028, 'square', .045], [.055, 240, .022, 'square', .08]], boot: [[0, 55, .04, 'sawtooth', .3], [.32, 82, .03, 'square', .22], [.62, 164, .025, 'triangle', .18], [.92, 328, .022, 'square', .2], [1.22, 492, .018, 'triangle', .24]] };
    const cues = state.settings.experience === 'fallout' ? falloutCues : hackerCues;
    for (const [delay, frequency, gainValue, wave, duration] of cues[type] || []) { const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, now + delay); gain.gain.setValueAtTime(gainValue, now + delay); gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration); oscillator.connect(gain).connect(ctx.destination); oscillator.start(now + delay); oscillator.stop(now + delay + duration); }
  } catch {}
}
function toast(title, message) { const item = document.createElement('div'); item.className = 'toast'; item.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(message)}</span>`; $('#toast-region').append(item); setTimeout(() => item.remove(), 3200); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]); }

init().catch((error) => { console.error(error); $('#boot-status').textContent = `BOOT FAILURE: ${error.message}`; });
