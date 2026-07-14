'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('boot primer runs before the main renderer and covers every Fallout machine', () => {
  const html = fs.readFileSync(path.join(root, 'src', 'renderer', 'index.html'), 'utf8');
  const primer = fs.readFileSync(path.join(root, 'src', 'renderer', 'boot-primer.js'), 'utf8');
  assert.ok(html.indexOf('boot-primer.js') < html.indexOf('renderer.js'));
  for (const id of ['pipBoy', 'robco', 'vaultTec', 'nukaCola']) assert.match(primer, new RegExp(`${id}:`));
  assert.match(primer, /boot-primer:\$\{initial\.experience\}:\$\{initial\.theme\}/);
});

test('startup appearance is passed to preload before Chromium paints', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  assert.match(main, /additionalArguments:.*ht-experience/);
  assert.match(preload, /initialAppearance: Object\.freeze/);
});

test('each Fallout machine has unique brand and boot vector art', () => {
  const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'renderer.js'), 'utf8');
  for (const fragment of ['3000 PERSONAL PROCESSOR', 'INDUSTRIAL AUTOMATION CONTROL', 'WELCOME, OVERSEER', 'ENJOY A REFRESHING SYSTEM CHECK']) assert.match(renderer, new RegExp(fragment));
  for (const artClass of ['device', 'robco-word', 'vault-logo', 'cappy-body']) assert.match(renderer, new RegExp(artClass));
});
