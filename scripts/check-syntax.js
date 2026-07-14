'use strict';

const { execFileSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const path = require('node:path');

function javascriptFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? javascriptFiles(file) : file.endsWith('.js') ? [file] : [];
  });
}

const files = [...javascriptFiles(path.join(__dirname, '..', 'src')), ...javascriptFiles(__dirname)];
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
console.log(`Syntax OK: ${files.length} JavaScript files`);
