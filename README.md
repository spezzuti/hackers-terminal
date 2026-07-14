# HACKERS // Terminal

A Windows terminal with a real ConPTY backend and an original mid-1990s cyberculture interface. It is inspired by the energy, color, and playful theatricality of the era without distributing movie artwork, logos, dialogue, or copyrighted audio.

Version 0.3 adds a complete optional Fallout-inspired retro-future experience. It uses original code-drawn marks and synthesized sounds rather than game artwork or sampled audio.

Version 0.4 rebuilds the terminal I/O layer. xterm is now told it is speaking to ConPTY, which restores line reflow on resize and stops the legacy wrap heuristic from mangling full-width TUIs. Paste is routed through xterm so bracketed paste and CRLF normalization apply, which fixes multi-line pastes submitting themselves a line at a time. `Ctrl+V` pastes, `Ctrl+C` interrupts again once a selection is copied, right-click copies or pastes directly instead of opening a menu, and shells are spawned at the size the pane actually has.

## What works

- Real PowerShell, Command Prompt, and WSL sessions through Windows ConPTY
- Tabs, arbitrary nested split panes, draggable pane resizing, and pane focus controls
- ANSI/VT, 24-bit color, Unicode, IME, mouse, links, scrollback, and full-screen terminal apps through xterm.js
- Search, copy/paste, zoom, fullscreen, tab switching, command palette, and familiar keyboard shortcuts
- OpenSSH host discovery from `~/.ssh/config`
- Windows Terminal `settings.json` import for profiles, WSL distributions, elevation flags, fonts, and custom color schemes
- Editable profile JSON with per-profile directories, colors, shell integration, and administrator mode
- Workspace restoration for tabs, nested split topology, ratios, active panes, and profiles
- Global quake-window shortcut (`Ctrl+Shift+Space` by default)
- Broadcast input across every pane in the active tab
- OSC 133 shell integration marks, success/error indicators, and previous/next command navigation
- UAC-elevated profiles embedded through a token-authenticated local named-pipe helper
- Four complete themes: Acid Burn, Crash Override, Garbage File, and The Gibson
- Full experience switch between HACKERS and Fallout-inspired RobCo/Vault styling
- Four retro-future display systems: Pip-Boy 3000, RobCo Unified, Vault-Tec Overseer, and Nuka-Cola Service Console
- Scheme-linked machine identities: each Fallout display system changes the top-left brand, subsystem label, status badge, window title, and boot identity
- First-frame boot priming prevents the HACKERS identity from flashing when a Fallout system is saved
- Machine-specific vector boot art and typography: Pip-Boy device diagnostics, RobCo atomic control, Vault-Tec overseer/vault-door startup, and a smiling Nuka-Cola bottle-cap console
- Experience-specific branding, panel geometry, status language, boot animation, startup copy, CRT treatment, and synthesized sound cues
- Persistent appearance, sound, behavior, and default-profile settings
- Synthesized startup/interface sounds; no sampled or copyrighted audio
- Branded NSIS installer, uninstaller, Start menu entry, desktop shortcut, and portable build

## Updates

Version 0.5 self-updates. The installed build checks GitHub Releases on launch and every six hours, downloads a newer release in the background, and shows a badge in the status bar. Clicking it restarts into the new version; ignoring it installs the update on the next normal quit. `Check for updates` is also in the command palette.

Two caveats worth knowing:

- **Only the installed build updates itself.** The portable `.exe` has nowhere to install to, so it will always need replacing by hand. Use `Hackers-Terminal-Setup-*.exe` if you want updates.
- Builds are unsigned, so the first install shows a Windows SmartScreen prompt (*More info → Run anyway*). Updates after that are silent.

Publishing a release requires a GitHub token with `repo` scope:

```powershell
$env:GH_TOKEN = (gh auth token)
npm version minor      # or patch/major
npm run release        # builds, uploads artifacts, and publishes the update feed
```

## Build and run

Requirements: Windows 10 or 11, Node.js 22 or newer, and npm.

```powershell
npm install
npm test
npm run lint
npm start
```

Build the installer and portable executable:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\generate-assets.ps1
npm run dist
```

Artifacts are written to `release/`.

## Keyboard map

| Action | Shortcut |
|---|---|
| New tab | `Ctrl+Shift+T` |
| Close pane/tab | `Ctrl+Shift+W` |
| Command palette | `Ctrl+Shift+P` |
| Find | `Ctrl+Shift+F` |
| Copy / Paste | `Ctrl+Shift+C` / `Ctrl+V` (also `Ctrl+Shift+V`) |
| Copy / Paste (mouse) | Drag to copy; right-click copies a selection, else pastes |
| Split right / down | `Alt+Shift+=` / `Alt+Shift+-` |
| Focus adjacent pane | `Alt+Left` / `Alt+Right` |
| Next / previous tab | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| Select tab 1–9 | `Alt+1` … `Alt+9` |
| Zoom | `Ctrl++` / `Ctrl+-` / `Ctrl+0` |
| Settings | `Ctrl+,` |
| Fullscreen | `F11` |
| Broadcast input | `Ctrl+Shift+B` |
| Previous / next command mark | `Ctrl+Up` / `Ctrl+Down` |
| Quake window | `Ctrl+Shift+Space` globally by default |

## Advanced integration

The Profiles page can discover OpenSSH hosts and import an installed Windows Terminal configuration. Imports are staged in the JSON editor and are not committed until **Save & Return** is selected.

Administrator profiles set `"elevated": true`. Opening one invokes the normal Windows UAC consent dialog, then hosts its ConPTY session in an elevated helper connected through a random, token-authenticated local named pipe. No network listener is created.

Workspace restoration saves layout metadata, not shell output or live processes. Reopening the app reconstructs the previous tab/split arrangement with fresh shell sessions.

Shell marks consume the standard OSC 133 `A`/`D` sequences. PowerShell profiles receive a lightweight prompt wrapper automatically unless `"shellIntegration": false` is set.

## Security

The renderer uses context isolation and has no direct Node.js access. Shell I/O is exposed through a narrow preload API, each pseudoterminal is bound to its originating renderer, navigation is blocked, and external links are opened by the OS browser.

## License

MIT. “HACKERS” and character references are thematic labels used for this private fan project; this project is not affiliated with or endorsed by the film's rights holders.
