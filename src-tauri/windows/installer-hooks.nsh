; MD Reader NSIS Installer Hooks
; Adds context menu and optional file association for .md files

!include "LogicLib.nsh"

!macro NSIS_HOOK_POSTINSTALL
  ; Always add context menu entry (non-intrusive)
  WriteRegStr HKCU "Software\Classes\.md\shell\MDReader" "" "Open with MD Reader"
  WriteRegStr HKCU "Software\Classes\.md\shell\MDReader" "Icon" "$INSTDIR\MD Reader.exe,0"
  WriteRegStr HKCU "Software\Classes\.md\shell\MDReader\command" "" '"$INSTDIR\MD Reader.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\.markdown\shell\MDReader" "" "Open with MD Reader"
  WriteRegStr HKCU "Software\Classes\.markdown\shell\MDReader" "Icon" "$INSTDIR\MD Reader.exe,0"
  WriteRegStr HKCU "Software\Classes\.markdown\shell\MDReader\command" "" '"$INSTDIR\MD Reader.exe" "%1"'

  ; Ask user about file association
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to set MD Reader as the default app for .md files?$\n$\n(You can always change this later in Windows Settings)" IDNO SkipDefault

  ; User clicked Yes - set as default
  WriteRegStr HKCU "Software\Classes\MDReader.Document" "" "Markdown Document"
  WriteRegStr HKCU "Software\Classes\MDReader.Document\DefaultIcon" "" "$INSTDIR\MD Reader.exe,0"
  WriteRegStr HKCU "Software\Classes\MDReader.Document\shell\open\command" "" '"$INSTDIR\MD Reader.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\.md" "" "MDReader.Document"
  WriteRegStr HKCU "Software\Classes\.markdown" "" "MDReader.Document"

  SkipDefault:
  ; Notify shell of changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Remove context menu entries
  DeleteRegKey HKCU "Software\Classes\.md\shell\MDReader"
  DeleteRegKey HKCU "Software\Classes\.markdown\shell\MDReader"

  ; Remove file type registration
  DeleteRegKey HKCU "Software\Classes\MDReader.Document"

  ; Reset associations if they point to our app
  ReadRegStr $0 HKCU "Software\Classes\.md" ""
  ${If} $0 == "MDReader.Document"
    DeleteRegValue HKCU "Software\Classes\.md" ""
  ${EndIf}

  ReadRegStr $0 HKCU "Software\Classes\.markdown" ""
  ${If} $0 == "MDReader.Document"
    DeleteRegValue HKCU "Software\Classes\.markdown" ""
  ${EndIf}

  ; Notify shell of changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
