'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseSshConfig, stripJsonComments, splitCommandLine, parseWindowsTerminalSettings } = require('../src/main/integration-service');
const { WorkspaceStore } = require('../src/main/workspace-store');
const { preparedProfile } = require('../src/main/pty-manager');
const { lineReader } = require('../src/main/elevated-pty-broker');

test('SSH discovery maps named hosts and ignores wildcard blocks', () => {
  const profiles = parseSshConfig(`
    Host *
      ServerAliveInterval 30
    Host gibson
      HostName 10.0.0.95
      User zero-cool
      Port 2222
    Host burn crash
      IdentityFile ~/.ssh/cyberia
  `);
  assert.equal(profiles.length, 3);
  assert.deepEqual(profiles[0].args, ['-p', '2222', 'zero-cool@10.0.0.95']);
  assert.match(profiles[1].args[1], /\.ssh[\\/]cyberia$/);
});

test('Windows Terminal JSONC import maps profiles, elevation, WSL, and schemes', () => {
  const source = `{
    // profile deck
    "defaultProfile": "{A}",
    "profiles": { "defaults": { "font": { "face": "Cascadia Mono" } }, "list": [
      { "guid": "{A}", "name": "Admin PS", "commandline": "powershell.exe -NoLogo", "elevate": true, "colorScheme": "Neon", },
      { "guid": "{B}", "name": "Ubuntu", "source": "Windows.Terminal.Wsl" }
    ]},
    "schemes": [{"name":"Neon","background":"#010101","foreground":"#eeeeee","black":"#000000","red":"#ff0000","green":"#00ff00","yellow":"#ffff00","blue":"#0000ff","purple":"#ff00ff","cyan":"#00ffff","white":"#dddddd","brightBlack":"#777777","brightRed":"#ff7777","brightGreen":"#77ff77","brightYellow":"#ffff77","brightBlue":"#7777ff","brightPurple":"#ff77ff","brightCyan":"#77ffff","brightWhite":"#ffffff"}]
  }`;
  const imported = parseWindowsTerminalSettings(source, 'settings.json');
  assert.equal(imported.profiles.length, 2);
  assert.equal(imported.profiles[0].elevated, true);
  assert.equal(imported.profiles[0].theme, 'wt-neon');
  assert.deepEqual(imported.profiles[1].args, ['-d', 'Ubuntu']);
  assert.equal(imported.themes['wt-neon'].magenta, '#ff00ff');
});

test('JSONC stripper preserves URL-like content inside strings', () => {
  const parsed = JSON.parse(stripJsonComments('{"url":"https://example.test/a//b",/*x*/"ok":true,}'));
  assert.equal(parsed.url, 'https://example.test/a//b');
  assert.equal(parsed.ok, true);
});

test('Windows command line splitting preserves quoted arguments', () => {
  assert.deepEqual(splitCommandLine('"C:\\Program Files\\PowerShell\\pwsh.exe" -NoLogo -Command "Write-Host hi"'), ['C:\\Program Files\\PowerShell\\pwsh.exe', '-NoLogo', '-Command', 'Write-Host hi']);
});

test('PowerShell profiles receive OSC 133 integration unless opted out', () => {
  const integrated = preparedProfile({ command: 'powershell.exe', args: ['-NoLogo'] });
  assert.ok(integrated.args.includes('-Command'));
  assert.match(integrated.args.at(-1), /133;A/);
  const plain = preparedProfile({ command: 'powershell.exe', args: [], shellIntegration: false });
  assert.equal(plain.args.includes('-Command'), false);
});

test('elevated helper line protocol handles fragmented messages', () => {
  const messages = [];
  const read = lineReader((message) => messages.push(message));
  read(Buffer.from('{"type":"da'));
  read(Buffer.from('ta","data":"QQ=="}\n{"type":"exit","exitCode":0}\n'));
  assert.deepEqual(messages, [{ type: 'data', data: 'QQ==' }, { type: 'exit', exitCode: 0 }]);
});

test('workspace topology persists atomically', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hackers-workspace-test-'));
  const store = new WorkspaceStore(directory);
  const value = { version: 1, activeTabIndex: 0, tabs: [{ root: { type: 'pane', profileId: 'powershell' } }] };
  assert.equal(store.save(value), true);
  assert.deepEqual(store.load(), value);
  store.clear();
  assert.equal(store.load(), null);
  fs.rmSync(directory, { recursive: true, force: true });
});
