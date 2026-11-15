; Glucose Widget installer (built by GitHub Actions with Inno Setup).
; Installs just for the current user (no admin needed) into %LOCALAPPDATA%\Programs\GlucoseWidget,
; so the "themes" folder can be changed freely.

#ifndef MyAppVersion
  #define MyAppVersion "0.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "..\out\GlucoseWidget"
#endif

#define MyAppName "Glucose Widget"
#define MyAppExe "GlucoseWidget.exe"

[Setup]
AppId={{6B0C9E9A-4E2F-4C1B-9A55-2F1D7C3E8B41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=AnimaTheAeon
DefaultDirName={localappdata}\Programs\GlucoseWidget
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0.17763
OutputDir=..\dist
OutputBaseFilename=GlucoseWidget-Setup-v{#MyAppVersion}
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\{#MyAppExe}
UninstallDisplayName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
; close a running widget before updating or uninstalling
AppMutex=Local\GlucoseWidget.Single
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Put a shortcut on my desktop"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
Name: "{autoprograms}\{#MyAppName} - Start Here"; Filename: "{app}\START HERE.txt"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "Open Glucose Widget now"; Flags: nowait postinstall skipifsilent

[Code]
// When uninstalling: stop it starting with Windows, and ask whether to keep settings.
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  DataDir: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    RegDeleteValue(HKEY_CURRENT_USER, 'Software\Microsoft\Windows\CurrentVersion\Run', 'GlucoseWidget');
    DataDir := ExpandConstant('{userappdata}\GlucoseWidget');
    if DirExists(DataDir) then
      if MsgBox('Also delete your Glucose Widget settings (your Dexcom login, alert levels and log)?' + #13#10 + #13#10 +
                'Choose No to keep them in case you install it again.', mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES then
        DelTree(DataDir, True, True, True);
  end;
end;
