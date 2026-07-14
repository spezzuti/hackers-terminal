'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { THEMES, DEFAULT_SETTINGS, mergeSettings } = require('../src/shared/defaults');

test('all color schemes expose a complete terminal palette', () => {
  const required = ['background', 'foreground', 'cursor', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite', 'accent', 'accent2'];
  assert.equal(Object.keys(THEMES).length, 8);
  for (const theme of Object.values(THEMES)) required.forEach((key) => assert.match(theme[key], /^#|^rgb/, `${theme.name}.${key}`));
});

test('Fallout experience includes four complete display systems', () => {
  const fallout = Object.values(THEMES).filter((theme) => theme.family === 'fallout');
  assert.deepEqual(fallout.map((theme) => theme.id), ['pipBoy', 'robco', 'vaultTec', 'nukaCola']);
  assert.equal(mergeSettings({ experience: 'fallout', theme: 'pipBoy' }).experience, 'fallout');
  assert.equal(mergeSettings({ experience: 'unknown' }).experience, 'hackers');
});

test('settings validation clamps unsafe visual and buffer values', () => {
  const settings = mergeSettings({ fontSize: 200, opacity: 1, scrollback: 9999999, theme: 'nope' });
  assert.equal(settings.fontSize, 32);
  assert.equal(settings.opacity, 60);
  assert.equal(settings.scrollback, 100000);
  assert.equal(settings.theme, DEFAULT_SETTINGS.theme);
});

test('an invalid default profile falls back to an available profile', () => {
  const settings = mergeSettings({ defaultProfile: 'missing', profiles: [{ id: 'test', name: 'Test', command: 'cmd.exe', args: [] }] });
  assert.equal(settings.defaultProfile, 'test');
});
