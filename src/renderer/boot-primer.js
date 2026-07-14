'use strict';

(() => {
  const initial = window.hackers?.initialAppearance || { experience: 'hackers', theme: 'acidBurn' };
  document.documentElement.classList.add('boot-priming');
  const palettes = {
    pipBoy: ['#020d04', '#79ff6b', '#65ff5b', '#c5ff79'],
    robco: ['#130a02', '#ffc15b', '#f3a640', '#ffe07a'],
    vaultTec: ['#03101b', '#8ed6f4', '#32a7df', '#ffd451'],
    nukaCola: ['#120405', '#ffe7c5', '#e72b42', '#f4dfbd']
  };
  const systems = {
    pipBoy: ['PIP-BOY', '3000 PERSONAL PROCESSOR', 'WANDERER LINK', 'PIP-BOY 3000', 'PERSONAL INFORMATION PROCESSOR', 'PERSONAL DATA // RADIATION // MAP', 'CHARGING DISPLAY MATRIX...', 'PIP-BOY 3000 // Terminal'],
    robco: ['ROBCO', 'UNIFIED TERMINAL', 'ROBCO NETWORK', 'ROBCO INDUSTRIES', 'UNIFIED OPERATING SYSTEM // REV 7.7', 'INDUSTRIAL AUTOMATION CONTROL', 'WARMING DISPLAY TUBES...', 'ROBCO // Unified Terminal'],
    vaultTec: ['VAULT-TEC', 'OVERSEER TERMINAL', 'VAULT NETWORK', 'VAULT-TEC', 'OVERSEER MAINFRAME // SECURE ACCESS', 'WELCOME, OVERSEER', 'VERIFYING VAULT INTEGRITY...', 'VAULT-TEC // Overseer Terminal'],
    nukaCola: ['Nuka-Cola', 'SERVICE CONSOLE', 'BOTTLING NETWORK', 'Nuka-Cola', 'SERVICE & DISTRIBUTION CONSOLE', 'ENJOY A REFRESHING SYSTEM CHECK', 'PRESSURIZING SERVICE LINES...', 'NUKA-COLA // Service Console']
  };
  const marks = {
    pipBoy: ['<rect class="device" x="3" y="7" width="34" height="25" rx="5"/><rect class="screen" x="8" y="11" width="20" height="15" rx="2"/><path class="signal" d="m10 20 4-4 4 7 4-9 4 6"/><circle class="knob" cx="32" cy="14" r="2"/><circle class="knob" cx="32" cy="24" r="2"/>', '<rect class="device" x="9" y="13" width="82" height="68" rx="13"/><rect class="screen" x="20" y="23" width="50" height="38" rx="4"/><path class="signal" d="m25 48 10-13 9 19 10-26 11 20"/><circle class="knob" cx="79" cy="31" r="5"/><circle class="knob" cx="79" cy="50" r="5"/><path class="strap" d="M27 81v11h46V81"/>'],
    robco: ['<text class="robco-word" x="60" y="29" text-anchor="middle">RobCo</text><text class="robco-industries" x="60" y="42" text-anchor="middle">INDUSTRIES</text>', '<text class="robco-word" x="110" y="67" text-anchor="middle">RobCo</text><text class="robco-industries" x="110" y="94" text-anchor="middle">INDUSTRIES</text>'],
    vaultTec: ['<path class="vault-logo" d="M20 18h61c2 0 4 2 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Zm-13 11h86c3 0 5 2 7 4-2 2-4 4-7 4H7c-3 0-5-2-7-4 2-2 4-4 7-4Zm13 13h61c2 0 4 1 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Z"/><circle class="vault-logo" cx="50" cy="33" r="20"/><circle class="vault-cutout" cx="50" cy="33" r="12.5"/><circle class="vault-logo" cx="50" cy="33" r="7.5"/>', '<path class="vault-logo" d="M20 18h61c2 0 4 2 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Zm-13 11h86c3 0 5 2 7 4-2 2-4 4-7 4H7c-3 0-5-2-7-4 2-2 4-4 7-4Zm13 13h61c2 0 4 1 5 3-1 2-3 3-5 3H20c-2 0-4-1-6-3 2-2 4-3 6-3Z"/><circle class="vault-logo" cx="50" cy="33" r="20"/><circle class="vault-cutout" cx="50" cy="33" r="12.5"/><circle class="vault-logo" cx="50" cy="33" r="7.5"/>'],
    nukaCola: ['<path class="cap-edge" d="M20 2c2.1 0 2.7 2.1 4.6 2.5s3.3-1.2 5 .1 1 3.4 2.5 4.7 3.6.4 4.6 2.2-.5 3.6.1 5.4 2.7 2.3 2.7 4.4-2.1 2.7-2.5 4.6 1.2 3.3-.1 5-3.4 1-4.7 2.5-.4 3.6-2.2 4.6-3.6-.5-5.4.1-2.3 2.7-4.4 2.7-2.7-2.1-4.6-2.5-3.3 1.2-5-.1-1-3.4-2.5-4.7-3.6-.4-4.6-2.2.5-3.6-.1-5.4-2.7-2.3-2.7-4.4 2.1-2.7 2.5-4.6-1.2-3.3.1-5 3.4-1 4.7-2.5.4-3.6 2.2-4.6 3.6.5 5.4-.1C17.9 4.1 17.9 2 20 2Z"/><circle class="cap-face" cx="20" cy="20" r="13"/><ellipse class="eye-white" cx="15" cy="17" rx="3" ry="3.5"/><ellipse class="eye-white" cx="25" cy="17" rx="3" ry="3.5"/><circle class="pupil" cx="16" cy="17.5" r="1.2"/><circle class="pupil" cx="24" cy="17.5" r="1.2"/><path class="smile" d="M13 23q7 8 14 0q-7 3-14 0Z"/><path class="cap-shine" d="M10 12q5-6 11-5"/>', '<path class="cappy-limb" d="M48 86c-2 13-4 18-2 24M62 86c1 12 6 18 9 22M105 87c-2 9-2 14-5 20M122 87c4 8 3 14 0 20M37 35C23 30 22 20 22 13M128 49c8-6 11-13 12-20"/><path class="nuka-bottle" d="M42 8h18l1 8-3 3v12c1 9 9 20 13 30 4 10 5 26 3 38-11 4-33 4-44 0-2-13-1-28 3-39 4-10 12-20 12-29V19l-3-3Z"/><path class="bottle-rim" d="M40 8h22v9H40Zm3 10h16v8H43Z"/><path class="bottle-highlight" d="M46 35c-2 17-9 27-9 46m7 10 3-1"/><circle class="bottle-label" cx="52" cy="64" r="16"/><ellipse class="eye-white" cx="47" cy="59" rx="5" ry="7"/><ellipse class="eye-white" cx="57" cy="59" rx="5" ry="7"/><circle class="pupil" cx="48" cy="61" r="2"/><circle class="pupil" cx="56" cy="61" r="2"/><path class="bottle-smile" d="M45 69q7 6 14 0"/><path class="cappy-glove" d="M22 14c-3-7 0-9 2-3-1-8 3-8 4-1 1-6 5-4 4 2 3-4 6 0 3 5-3 6-8 9-13 7Zm118 16c-1-7 2-9 4-3 1-7 5-6 4 1 4-5 7-1 3 4 5-3 7 2 2 5-4 5-8 7-12 7Z"/><path class="cappy-shoe" d="M46 105c-10-1-18 5-17 10 2 5 18 2 24-3M70 106c8-2 15 3 14 8-2 5-16 2-21-2M99 104c-9 0-15 5-13 10 3 4 16 1 21-3M122 104c9-1 16 4 15 9-2 5-16 3-22-1"/><path class="cappy-body" d="M109 29c4 0 5-3 9-2s4 4 8 5 7-1 9 2 0 6 3 9 6 1 7 5-2 6-1 9 5 4 4 8-5 4-5 8 4 5 2 8-7 2-8 5 1 7-3 8-6-2-10 0-3 5-7 4-5-4-10-4-5 4-9 1-1-6-5-8-6 2-8-2 2-6-1-10-6-1-7-5 4-4 3-8-5-3-4-7 6-3 7-6-4-5-2-9 6-1 7-4 1-5 5-6 8 1 11-1 2-4 6-4 5 3 9 2 3-4 7-3Z"/><circle class="cap-face" cx="109" cy="63" r="27"/><path class="cappy-brow" d="M96 49l5-2m20 3-4-3"/><ellipse class="eye-white" cx="99" cy="59" rx="6" ry="8"/><ellipse class="eye-white" cx="119" cy="58" rx="6" ry="8"/><circle class="pupil" cx="101" cy="59" r="2.5"/><circle class="pupil" cx="120" cy="59" r="2.5"/><path class="cappy-nose" d="M109 62c-7 2-6 7 2 7"/><path class="cappy-mouth" d="M97 72q13 16 25 0-13 7-25 0Z"/><circle class="cappy-cheek" cx="94" cy="70" r="4"/><circle class="cappy-cheek" cx="125" cy="68" r="4"/>']
  };
  const viewBoxes = {
    robco: ['0 0 120 44', '0 0 220 100'],
    vaultTec: ['0 0 100 66', '0 0 100 66'],
    nukaCola: ['0 0 40 40', '0 0 160 120']
  };
  if (initial.experience === 'fallout') {
    const colors = palettes[initial.theme] || palettes.robco;
    document.documentElement.dataset.initialExperience = 'fallout';
    document.documentElement.style.cssText = `background:${colors[0]};--bg:${colors[0]};--fg:${colors[1]};--accent:${colors[2]};--accent2:${colors[3]};--glow:${colors[2]}44`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (initial.experience !== 'fallout') return;
      const system = systems[initial.theme] || systems.robco;
      const app = document.getElementById('app');
      app.classList.add('fallout'); app.dataset.experience = 'fallout'; app.dataset.system = initial.theme;
      document.getElementById('brand-title').textContent = system[0];
      document.getElementById('brand-subtitle').textContent = system[1];
      document.getElementById('status-logo').textContent = system[2];
      document.getElementById('boot-title').textContent = system[3];
      document.getElementById('boot-subtitle').textContent = system[4];
      const flavor = document.getElementById('boot-flavor'); flavor.textContent = system[5]; flavor.classList.remove('hidden');
      document.getElementById('boot-status').textContent = system[6];
      const art = marks[initial.theme] || marks.robco;
      const boxes = viewBoxes[initial.theme] || ['0 0 40 40', '0 0 100 100'];
      const brandMark = document.querySelector('.brand-mark');
      const bootMark = document.querySelector('.boot-core svg');
      brandMark.setAttribute('viewBox', boxes[0]); bootMark.setAttribute('viewBox', boxes[1]);
      brandMark.innerHTML = art[0]; bootMark.innerHTML = art[1];
      document.title = system[7];
      console.info(`boot-primer:${initial.experience}:${initial.theme}`);
    } finally {
      document.documentElement.classList.remove('boot-priming');
      window.hackers?.bootPrimed?.();
    }
  }, { once: true });
})();
