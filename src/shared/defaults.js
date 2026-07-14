'use strict';

const THEMES = {
  acidBurn: {
    id: 'acidBurn',
    name: 'Acid Burn',
    family: 'hackers',
    background: '#05020b',
    foreground: '#efe7ff',
    cursor: '#ff2bd6',
    cursorAccent: '#05020b',
    selectionBackground: '#652c8eaa',
    black: '#09070d', red: '#ff345f', green: '#20fca4', yellow: '#f5ef4a',
    blue: '#4477ff', magenta: '#ff2bd6', cyan: '#18e8ff', white: '#d7d0e5',
    brightBlack: '#655b75', brightRed: '#ff6989', brightGreen: '#67ffc3', brightYellow: '#fff87a',
    brightBlue: '#72a0ff', brightMagenta: '#ff72e4', brightCyan: '#72f2ff', brightWhite: '#ffffff',
    accent: '#ff2bd6', accent2: '#18e8ff', glow: 'rgba(255,43,214,.28)'
  },
  crashOverride: {
    id: 'crashOverride',
    name: 'Crash Override',
    family: 'hackers',
    background: '#02090b',
    foreground: '#d8fff2',
    cursor: '#5bff9d',
    cursorAccent: '#02090b',
    selectionBackground: '#087f6588',
    black: '#03100e', red: '#ff4f68', green: '#5bff9d', yellow: '#dfff4f',
    blue: '#28a9ff', magenta: '#cb5cff', cyan: '#18f0dc', white: '#cce9df',
    brightBlack: '#527069', brightRed: '#ff8295', brightGreen: '#95ffc0', brightYellow: '#edff91',
    brightBlue: '#7acaff', brightMagenta: '#e19cff', brightCyan: '#81fff4', brightWhite: '#ffffff',
    accent: '#5bff9d', accent2: '#18f0dc', glow: 'rgba(91,255,157,.25)'
  },
  garbageFile: {
    id: 'garbageFile',
    name: 'Garbage File',
    family: 'hackers',
    background: '#080703',
    foreground: '#fff2bd',
    cursor: '#f5ef4a',
    cursorAccent: '#080703',
    selectionBackground: '#9f681488',
    black: '#100f08', red: '#ff543d', green: '#a4ed4b', yellow: '#f5ef4a',
    blue: '#3da9ff', magenta: '#ff5bbd', cyan: '#55e6d0', white: '#e8dfc3',
    brightBlack: '#706b55', brightRed: '#ff8b78', brightGreen: '#c8ff82', brightYellow: '#fff891',
    brightBlue: '#8aceff', brightMagenta: '#ff96d8', brightCyan: '#9dfff1', brightWhite: '#fffef5',
    accent: '#f5ef4a', accent2: '#ff543d', glow: 'rgba(245,239,74,.22)'
  },
  gibson: {
    id: 'gibson',
    name: 'The Gibson',
    family: 'hackers',
    background: '#010713',
    foreground: '#d9f3ff',
    cursor: '#18e8ff',
    cursorAccent: '#010713',
    selectionBackground: '#165ea499',
    black: '#020c1c', red: '#fa4169', green: '#31f2b3', yellow: '#ffdc55',
    blue: '#268cff', magenta: '#b45cff', cyan: '#18e8ff', white: '#cedfec',
    brightBlack: '#4c6275', brightRed: '#ff7893', brightGreen: '#77ffd1', brightYellow: '#ffeb8f',
    brightBlue: '#72b3ff', brightMagenta: '#d49aff', brightCyan: '#75f4ff', brightWhite: '#ffffff',
    accent: '#18e8ff', accent2: '#b45cff', glow: 'rgba(24,232,255,.24)'
  },
  pipBoy: {
    id: 'pipBoy', name: 'Pip-Boy 3000', family: 'fallout',
    background: '#020d04', foreground: '#79ff6b', cursor: '#c4ff9b', cursorAccent: '#020d04', selectionBackground: '#3d8f3977',
    black: '#071208', red: '#ff655c', green: '#65e85d', yellow: '#d7e86a', blue: '#48a56b', magenta: '#85c978', cyan: '#62e8a0', white: '#b6d7a9',
    brightBlack: '#416044', brightRed: '#ff8c79', brightGreen: '#a3ff8d', brightYellow: '#f1ff9b', brightBlue: '#71d595', brightMagenta: '#b4f0a4', brightCyan: '#a2ffd0', brightWhite: '#e8ffe1',
    accent: '#65ff5b', accent2: '#c5ff79', glow: 'rgba(101,255,91,.28)'
  },
  robco: {
    id: 'robco', name: 'RobCo Unified', family: 'fallout',
    background: '#130a02', foreground: '#ffc15b', cursor: '#ffe094', cursorAccent: '#130a02', selectionBackground: '#a8622877',
    black: '#170d05', red: '#ff604d', green: '#b3c858', yellow: '#edb74a', blue: '#a07445', magenta: '#d48b55', cyan: '#d6b363', white: '#ddc69c',
    brightBlack: '#6c4b2b', brightRed: '#ff8b69', brightGreen: '#d9ec7a', brightYellow: '#ffda72', brightBlue: '#c49b65', brightMagenta: '#f0af78', brightCyan: '#f2d58c', brightWhite: '#fff1cd',
    accent: '#f3a640', accent2: '#ffe07a', glow: 'rgba(243,166,64,.26)'
  },
  vaultTec: {
    id: 'vaultTec', name: 'Vault-Tec Overseer', family: 'fallout',
    background: '#03101b', foreground: '#8ed6f4', cursor: '#ffd451', cursorAccent: '#03101b', selectionBackground: '#176da377',
    black: '#061522', red: '#ff625c', green: '#55d49d', yellow: '#ffd451', blue: '#238ac4', magenta: '#9e79d6', cyan: '#55c9e9', white: '#b9d9e8',
    brightBlack: '#456579', brightRed: '#ff8d84', brightGreen: '#8df0c0', brightYellow: '#ffe68a', brightBlue: '#62bcec', brightMagenta: '#c3a0ee', brightCyan: '#8ae8ff', brightWhite: '#eefaff',
    accent: '#32a7df', accent2: '#ffd451', glow: 'rgba(50,167,223,.26)'
  },
  nukaCola: {
    id: 'nukaCola', name: 'Nuka-Cola Service Console', family: 'fallout',
    background: '#120405', foreground: '#ffe7c5', cursor: '#ff4052', cursorAccent: '#120405', selectionBackground: '#8f203b77',
    black: '#180708', red: '#e72b42', green: '#65b89b', yellow: '#e7bd62', blue: '#318c9d', magenta: '#bb527d', cyan: '#54c6c1', white: '#e2cdb0',
    brightBlack: '#714044', brightRed: '#ff5a69', brightGreen: '#91ddc1', brightYellow: '#ffdd8a', brightBlue: '#62b9c8', brightMagenta: '#e47ba4', brightCyan: '#86eee5', brightWhite: '#fff5df',
    accent: '#e72b42', accent2: '#f4dfbd', glow: 'rgba(231,43,66,.28)'
  }
};

const DEFAULT_SETTINGS = {
  experience: 'hackers',
  theme: 'acidBurn',
  fontFamily: "'Cascadia Mono', 'Consolas', monospace",
  fontSize: 14,
  lineHeight: 1.12,
  cursorStyle: 'block',
  cursorBlink: true,
  scrollback: 10000,
  opacity: 94,
  acrylic: true,
  scanlines: true,
  glow: true,
  sounds: true,
  keySounds: false,
  startupSequence: true,
  restoreWorkspace: true,
  broadcastInput: false,
  shellIntegrationMarks: true,
  quakeShortcut: 'Control+Shift+Space',
  customThemes: {},
  defaultProfile: 'powershell',
  profiles: [
    { id: 'powershell', name: 'PowerShell', command: 'powershell.exe', args: ['-NoLogo'], icon: 'PS', color: '#18e8ff', elevated: false, shellIntegration: true },
    { id: 'command', name: 'Command Prompt', command: 'cmd.exe', args: [], icon: 'C:\\', color: '#f5ef4a', elevated: false },
    { id: 'wsl', name: 'WSL', command: 'wsl.exe', args: [], icon: 'WSL', color: '#5bff9d', elevated: false }
  ]
};

function sanitizeProfiles(profiles) {
  const used = new Set();
  return profiles.filter((profile) => profile && typeof profile === 'object' && String(profile.command || '').trim()).map((profile, index) => {
    let id = String(profile.id || `profile-${index + 1}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || `profile-${index + 1}`;
    while (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    return {
      ...profile,
      id,
      name: String(profile.name || id).slice(0, 80),
      command: String(profile.command).trim(),
      args: Array.isArray(profile.args) ? profile.args.map(String).slice(0, 64) : [],
      icon: String(profile.icon || '>_').slice(0, 8),
      color: /^#[0-9a-f]{6}$/i.test(profile.color) ? profile.color : '#18e8ff',
      elevated: Boolean(profile.elevated),
      shellIntegration: profile.shellIntegration !== false,
      startingDirectory: profile.startingDirectory ? String(profile.startingDirectory) : undefined
    };
  });
}

function mergeSettings(value = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...value };
  merged.experience = ['hackers', 'fallout'].includes(merged.experience) ? merged.experience : 'hackers';
  merged.fontSize = Math.min(32, Math.max(9, Number(merged.fontSize) || 14));
  merged.opacity = Math.min(100, Math.max(60, Number(merged.opacity) || 94));
  merged.scrollback = Math.min(100000, Math.max(1000, Number(merged.scrollback) || 10000));
  merged.customThemes = merged.customThemes && typeof merged.customThemes === 'object' && !Array.isArray(merged.customThemes) ? merged.customThemes : {};
  if (!THEMES[merged.theme] && !merged.customThemes[merged.theme]) merged.theme = merged.experience === 'fallout' ? 'pipBoy' : DEFAULT_SETTINGS.theme;
  const selectedTheme = THEMES[merged.theme] || merged.customThemes[merged.theme];
  if (selectedTheme?.family && selectedTheme.family !== merged.experience) merged.theme = merged.experience === 'fallout' ? 'pipBoy' : DEFAULT_SETTINGS.theme;
  if (!Array.isArray(merged.profiles) || !merged.profiles.length) merged.profiles = DEFAULT_SETTINGS.profiles;
  merged.profiles = sanitizeProfiles(merged.profiles);
  if (!merged.profiles.length) merged.profiles = sanitizeProfiles(DEFAULT_SETTINGS.profiles);
  merged.quakeShortcut = String(merged.quakeShortcut || DEFAULT_SETTINGS.quakeShortcut).slice(0, 80);
  if (!merged.profiles.some((p) => p.id === merged.defaultProfile)) merged.defaultProfile = merged.profiles[0].id;
  return merged;
}

module.exports = { THEMES, DEFAULT_SETTINGS, mergeSettings, sanitizeProfiles };
