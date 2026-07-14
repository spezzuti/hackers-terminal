'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function expandPath(value, env = process.env) {
  if (!value) return value;
  let result = String(value).replace(/^~(?=[\\/]|$)/, os.homedir());
  result = result.replace(/%([^%]+)%/g, (match, name) => env[name] ?? env[name.toUpperCase()] ?? match);
  return result;
}

function parseSshConfig(text) {
  const profiles = [];
  let current = null;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(\S+)\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim().replace(/^"|"$/g, '');
    if (key === 'host') {
      const aliases = value.split(/\s+/).filter((host) => host && !/[*!?]/.test(host));
      current = aliases.length ? { aliases, options: {} } : null;
      if (current) profiles.push(current);
    } else if (current && current.options[key] === undefined) {
      current.options[key] = value;
    }
  }
  return profiles.flatMap(({ aliases, options }) => aliases.map((alias) => {
    const args = [];
    if (options.port) args.push('-p', options.port);
    if (options.identityfile) args.push('-i', expandPath(options.identityfile));
    const targetHost = options.hostname || alias;
    args.push(options.user ? `${options.user}@${targetHost}` : targetHost);
    return {
      id: `ssh-${slug(alias)}`,
      name: `SSH · ${alias}`,
      command: 'ssh.exe',
      args,
      icon: 'SSH',
      color: '#5bff9d',
      source: 'ssh',
      host: alias,
      startingDirectory: os.homedir()
    };
  }));
}

function discoverSshProfiles(file = path.join(os.homedir(), '.ssh', 'config')) {
  try { return { sourcePath: file, profiles: parseSshConfig(fs.readFileSync(file, 'utf8')) }; }
  catch (error) {
    if (error.code === 'ENOENT') return { sourcePath: file, profiles: [] };
    throw error;
  }
}

function stripJsonComments(text) {
  let output = '', inString = false, escaped = false, lineComment = false, blockComment = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index], next = text[index + 1];
    if (lineComment) { if (char === '\n') { lineComment = false; output += char; } continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index++; } continue; }
    if (!inString && char === '/' && next === '/') { lineComment = true; index++; continue; }
    if (!inString && char === '/' && next === '*') { blockComment = true; index++; continue; }
    output += char;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
  }
  return output.replace(/,\s*([}\]])/g, '$1');
}

function splitCommandLine(commandLine) {
  const result = [];
  let value = '', quoted = false, backslashes = 0;
  const push = () => { if (value) { result.push(value); value = ''; } };
  for (const char of String(commandLine || '').trim()) {
    if (char === '\\') { backslashes++; continue; }
    if (char === '"') {
      value += '\\'.repeat(Math.floor(backslashes / 2));
      if (backslashes % 2) value += '"'; else quoted = !quoted;
      backslashes = 0; continue;
    }
    value += '\\'.repeat(backslashes); backslashes = 0;
    if (/\s/.test(char) && !quoted) push(); else value += char;
  }
  value += '\\'.repeat(backslashes); push();
  return result;
}

function terminalSchemeToTheme(scheme, index) {
  const id = `wt-${slug(scheme.name || `scheme-${index}`)}`;
  const purple = scheme.purple || scheme.magenta || '#881798';
  const brightPurple = scheme.brightPurple || scheme.brightMagenta || '#B4009E';
  return [id, {
    id, name: `WT · ${scheme.name || `Scheme ${index + 1}`}`,
    background: scheme.background || '#0C0C0C', foreground: scheme.foreground || '#CCCCCC',
    cursor: scheme.cursorColor || scheme.foreground || '#FFFFFF', cursorAccent: scheme.background || '#0C0C0C',
    selectionBackground: scheme.selectionBackground || '#FFFFFF55',
    black: scheme.black, red: scheme.red, green: scheme.green, yellow: scheme.yellow,
    blue: scheme.blue, magenta: purple, cyan: scheme.cyan, white: scheme.white,
    brightBlack: scheme.brightBlack, brightRed: scheme.brightRed, brightGreen: scheme.brightGreen,
    brightYellow: scheme.brightYellow, brightBlue: scheme.brightBlue, brightMagenta: brightPurple,
    brightCyan: scheme.brightCyan, brightWhite: scheme.brightWhite,
    accent: scheme.cursorColor || scheme.brightCyan || '#18e8ff', accent2: brightPurple,
    glow: 'rgba(24,232,255,.22)', source: 'windows-terminal'
  }];
}

function parseWindowsTerminalSettings(text, sourcePath = '') {
  const settings = JSON.parse(stripJsonComments(String(text)));
  const themeEntries = (settings.schemes || []).map(terminalSchemeToTheme);
  const themes = Object.fromEntries(themeEntries);
  const themeByName = new Map((settings.schemes || []).map((scheme, index) => [String(scheme.name).toLowerCase(), themeEntries[index][0]]));
  const defaults = Array.isArray(settings.profiles) ? {} : settings.profiles?.defaults || {};
  const list = Array.isArray(settings.profiles) ? settings.profiles : Array.isArray(settings.profiles?.list) ? settings.profiles.list : [];
  const profiles = list.filter((profile) => !profile.hidden && (profile.commandline || profile.source === 'Windows.Terminal.Wsl' || profile.source === 'Windows.Terminal.PowershellCore')).map((profile, index) => {
    const combined = { ...defaults, ...profile, font: { ...(defaults.font || {}), ...(profile.font || {}) } };
    const fallbackCommand = combined.source === 'Windows.Terminal.Wsl' ? `wsl.exe -d "${combined.name}"` : combined.source === 'Windows.Terminal.PowershellCore' ? 'pwsh.exe' : '';
    const parts = splitCommandLine(expandPath(combined.commandline || fallbackCommand));
    return {
      id: `wt-${slug(combined.guid || combined.name || String(index))}`,
      name: `WT · ${combined.name || `Profile ${index + 1}`}`,
      command: parts.shift() || 'cmd.exe', args: parts,
      icon: 'WT', color: combined.tabColor || '#18e8ff', source: 'windows-terminal',
      startingDirectory: expandPath(combined.startingDirectory || os.homedir()),
      elevated: Boolean(combined.elevate),
      theme: themeByName.get(String(typeof combined.colorScheme === 'string' ? combined.colorScheme : combined.colorScheme?.dark || '').toLowerCase()),
      fontFamily: combined.font?.face, fontSize: combined.font?.size
    };
  });
  const defaultProfileId = settings.defaultProfile ? `wt-${slug(settings.defaultProfile)}` : null;
  return { sourcePath, profiles, themes, defaultGuid: settings.defaultProfile || null, defaultProfileId: profiles.some((profile) => profile.id === defaultProfileId) ? defaultProfileId : null };
}

function importWindowsTerminalSettings() {
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const candidates = [
    path.join(local, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(local, 'Packages', 'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(local, 'Microsoft', 'Windows Terminal', 'settings.json')
  ];
  const sourcePath = candidates.find((file) => fs.existsSync(file));
  if (!sourcePath) return { sourcePath: null, profiles: [], themes: {}, defaultGuid: null, defaultProfileId: null };
  return parseWindowsTerminalSettings(fs.readFileSync(sourcePath, 'utf8'), sourcePath);
}

function slug(value) {
  return String(value).replace(/[{}]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'profile';
}

module.exports = { expandPath, parseSshConfig, discoverSshProfiles, stripJsonComments, splitCommandLine, parseWindowsTerminalSettings, importWindowsTerminalSettings, slug };
