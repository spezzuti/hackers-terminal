'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { mergeSettings } = require('../shared/defaults');

class SettingsStore {
  constructor(userDataPath) {
    this.file = path.join(userDataPath, 'settings.json');
    this.value = this.load();
  }

  load() {
    try {
      return mergeSettings(JSON.parse(fs.readFileSync(this.file, 'utf8')));
    } catch {
      return mergeSettings();
    }
  }

  get() {
    return structuredClone(this.value);
  }

  save(next) {
    this.value = mergeSettings(next);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(this.value, null, 2), 'utf8');
    fs.renameSync(temp, this.file);
    return this.get();
  }
}

module.exports = { SettingsStore };
