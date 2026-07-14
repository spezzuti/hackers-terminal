; HACKERS Terminal installer skin — original mid-90s cyberculture art and copy.
; This file is prepended by electron-builder before MUI2 page declarations.

; Native checkbox/radio labels do not consistently honor MUI_TEXTCOLOR on all
; Windows themes, so use a high-contrast light content surface. The custom
; sidebar/header retain the dark neon identity.
!define MUI_BGCOLOR "F2EAF8"
!define MUI_TEXTCOLOR "180C22"
!define MUI_INSTFILESPAGE_COLORS "18E8FF 05020B"
!define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
!define MUI_FINISHPAGE_TITLE "ACCESS GRANTED"
!define MUI_FINISHPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TEXT "HACKERS Terminal is inside the system. Open a link and explore the network."
!define MUI_FINISHPAGE_RUN_TEXT "ENTER THE NETWORK"
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "Abort the connection and leave setup?"

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "WELCOME TO THE NETWORK"
  !define MUI_WELCOMEPAGE_TITLE_3LINES
  !define MUI_WELCOMEPAGE_TEXT "This link installs HACKERS Terminal — a fast Windows terminal dressed in original mid-'90s cyberculture style.$\r$\n$\r$\nTabs. Split panes. PowerShell. Command Prompt. WSL.$\r$\n$\r$\nClose other terminal sessions before continuing."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customHeader
  BrandingText "HACKERS TERMINAL // SECURE INSTALL LINK"
!macroend
