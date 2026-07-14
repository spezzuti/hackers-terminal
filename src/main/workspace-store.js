'use strict';

const fs = require('node:fs');
const path = require('node:path');

class WorkspaceStore {
  constructor(userDataPath) { this.file = path.join(userDataPath, 'workspace.json'); }
  load() {
    try {
      const value = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return value?.version === 1 && Array.isArray(value.tabs) ? value : null;
    } catch { return null; }
  }
  save(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.tabs)) return false;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(temp, this.file);
    return true;
  }
  clear() { try { fs.unlinkSync(this.file); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
}

module.exports = { WorkspaceStore };
