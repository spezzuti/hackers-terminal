'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeExternalUrl } = require('../src/shared/external-links');

const root = path.join(__dirname, '..');

test('external links accept only normalized HTTP and HTTPS URLs', () => {
  assert.equal(normalizeExternalUrl(' https://example.com/docs?q=terminal '), 'https://example.com/docs?q=terminal');
  assert.equal(normalizeExternalUrl('HTTP://EXAMPLE.COM'), 'http://example.com/');
  for (const value of ['javascript:alert(1)', 'file:///C:/secret.txt', 'mailto:test@example.com', 'not a url']) assert.equal(normalizeExternalUrl(value), null);
});

test('terminal links use explicit external IPC and clipboard writes are acknowledged', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main', 'main.js'), 'utf8');
  assert.match(renderer, /WebLinksAddon\.WebLinksAddon\(openTerminalLink\)/);
  assert.match(renderer, /linkHandler: \{ activate: openTerminalLink \}/);
  assert.match(renderer, /if \(!event\.ctrlKey\) return/);
  assert.match(preload, /invoke\('links:open-external'/);
  assert.match(preload, /invoke\('clipboard:write'/);
  assert.match(main, /handle\('links:open-external'/);
  assert.match(main, /handle\('clipboard:write'/);
});

test('paste is routed through xterm so bracketed paste and CRLF normalization survive', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  // terminal.paste() collapses CRLF to a single CR and applies the bracketed-paste markers.
  // Writing clipboard text straight to the pty skips both, and every newline lands as Enter.
  assert.match(renderer, /pane\.terminal\.paste\(text\)/);
  assert.doesNotMatch(renderer, /writePty\([^)]*,\s*text\)/);
  // Copying must drop the selection, otherwise bare Ctrl+C is read as a copy forever and the
  // interrupt never reaches the shell.
  assert.match(renderer, /clearSelection\(\)/);
});

test('xterm is told the pty is ConPTY so wrapping and reflow stay correct', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main', 'main.js'), 'utf8');
  // windowsMode makes xterm guess wrap state from trailing whitespace, which marks every
  // full-width box-drawing row as a continuation of the row above, and it disables reflow.
  assert.doesNotMatch(renderer, /windowsMode/);
  assert.match(renderer, /windowsPty: state\.windowsPty/);
  assert.match(main, /backend: buildNumber >= 18309 \? 'conpty' : 'winpty'/);
});

test('shells are spawned at the size the pane actually has', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  // A pty born at a hardcoded 80x24 and corrected a frame later hands its first prompt, and any
  // program that reads its width at startup, the wrong terminal size.
  assert.doesNotMatch(renderer, /createPty\([^)]*\{ cols: 80, rows: 24 \}/);
  assert.match(renderer, /createPty\(pane\.profile, \{ cols: pane\.terminal\.cols, rows: pane\.terminal\.rows \}\)/);
  // The pane is laid out and fitted before it is connected, so cols/rows are real by then.
  assert.match(renderer, /renderWorkspace\(\); openPane\(pane\);\n  try \{ await spawnPane\(pane\)/);
  // Nothing may touch the pty before it exists.
  assert.match(renderer, /if \(pane\.ptyId && !pane\.exited\)/);
  assert.match(renderer, /if \(pane\.ptyId\) window\.hackers\.resizePty/);
});

test('quake mode can be left, not just hidden', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main', 'main.js'), 'utf8');
  // leaveQuakeMode used to be unreachable, so entering quake mode was a one-way trip.
  assert.match(main, /function leaveQuakeMode/);
  assert.match(main, /if \(quakeActive\) leaveQuakeMode\(\); else enterQuakeMode\(\);/);
  assert.match(main, /if \(action === 'quake'\) toggleQuakeMode\(\)/);
});

test('right click acts directly and no context menu is built', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main', 'main.js'), 'utf8');
  assert.match(renderer, /addEventListener\('contextmenu'/);
  assert.match(renderer, /terminal\.hasSelection\(\) \? copySelection\(\) : pasteClipboard\(pane\)/);
  assert.doesNotMatch(main, /Menu\.buildFromTemplate/);
  assert.doesNotMatch(preload, /terminal:context-menu/);
});
