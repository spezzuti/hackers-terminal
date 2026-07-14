'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = fs.readFileSync(path.join(__dirname, '..', 'electron-builder-release.yml'), 'utf8');
const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload.js'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer', 'renderer.js'), 'utf8');
const pkg = require('../package.json');

test('the release feed is configured and electron-updater ships at runtime', () => {
  assert.match(yaml, /provider: github/);
  assert.match(yaml, /owner: spezzuti/);
  assert.match(yaml, /repo: hackers-terminal/);
  // electron-updater is required by the main process, so it must be bundled, not a build-time tool.
  assert.ok(pkg.dependencies['electron-updater'], 'electron-updater must be a runtime dependency');
  assert.ok(!pkg.devDependencies?.['electron-updater']);
  assert.match(pkg.scripts.release, /--publish always/);
});

test('updates are only attempted from a packaged build', () => {
  // Unpackaged there is no resources/app-update.yml, so every check would error out.
  assert.match(main, /if \(!app\.isPackaged\) \{ trace\('update:skipped-unpackaged'\); return; \}/);
  assert.match(main, /autoUpdater\.autoInstallOnAppQuit = true/);
});

test('a staged update survives a renderer that subscribed too late', () => {
  // The first check can resolve before the renderer registers its listener; without the state
  // riding along on bootstrap, a downloaded update would have nothing in the UI to reveal it.
  assert.match(main, /update: updateState/);
  assert.match(renderer, /applyUpdateState\(boot\.update\)/);
  assert.match(renderer, /onUpdateStatus\(applyUpdateState\)/);
});

test('installing is gated on an update actually being ready', () => {
  assert.match(main, /if \(updateState\.state !== 'ready'\) return;/);
  assert.match(main, /autoUpdater\.quitAndInstall\(true, true\)/);
  assert.match(preload, /installUpdate: \(\) => ipcRenderer\.send\('update:install'\)/);
  assert.match(renderer, /if \(state\.update\.state === 'ready'\) window\.hackers\.installUpdate\(\)/);
});
