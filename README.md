# Glucose Widget

A small always-on-top Windows 11 desktop widget that shows your Dexcom glucose
(through Dexcom Share, or your own Nightscout site) and dings when you go high or low.

- Written in C# for .NET Framework 4.8 (built into Windows 11), using Windows' own
  Edge engine (WebView2) to draw the widget. The download is about 2 MB.
- Every look except Classic is one file in `themes/`. Delete a file to remove a look.
- GitHub builds it automatically: every push to `main` runs the checks and publishes
  the zip under **Releases**.

Not a medical device. Keep your phone or receiver alarms on.

## Layout

| Folder | What's in it |
| --- | --- |
| `src/GlucoseWidget` | The Windows app: Dexcom/Nightscout, alerts, tray, windows |
| `ui` | The widget and Settings pages |
| `themes` | One file per look |
| `tests` | Checks for the Dexcom parsing and alert rules |

Settings and the log live in `%APPDATA%\GlucoseWidget`.
