'use strict';

const path = require('node:path');
const { THEMES, mergeSettings } = require(path.join(__dirname, '..', 'release', 'win-unpacked', 'resources', 'app.asar', 'src', 'shared', 'defaults.js'));
const nuka = THEMES.nukaCola;
const valid = nuka?.family === 'fallout' && nuka.accent === '#e72b42' && nuka.accent2 === '#f4dfbd' && mergeSettings({ experience: 'fallout', theme: 'nukaCola' }).theme === 'nukaCola';
process.exit(valid ? 0 : 2);
