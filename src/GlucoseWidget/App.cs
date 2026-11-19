using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Win32;

namespace GlucoseWidget
{
    // The whole app: tray icon, widget window, polling Dexcom, and alerts.
    public class App : ApplicationContext
    {
        public const string Name = "Glucose Widget";
        public static string DataFolder => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "GlucoseWidget");
        public static string AppFolder => AppDomain.CurrentDomain.BaseDirectory;
        public static string ThemesFolder => Path.Combine(AppFolder, "themes");

        public Settings Settings;
        public CoreWebView2Environment WebEnv;
        WidgetForm widget;
        SettingsForm settingsForm, welcomeForm;
        readonly NotifyIcon tray;
        readonly ContextMenuStrip menu;
        readonly Control ui; // used to run code on the UI thread

        // data
        IGlucoseSource source;
        Reading latest;
        List<Reading> history = new List<Reading>();
        string status = "loading", message = "", zone = "none";
        int failCount;
        bool pollBusy, authNotified;
        long startedAt = Clock.Now(), lastPollKick = Clock.Now();
        readonly AlertState alertState = new AlertState();
        readonly Timer pollTimer = new Timer(), heartbeat = new Timer();
        IntPtr trayHicon = IntPtr.Zero;

        public App()
        {
            Directory.CreateDirectory(DataFolder);
            Log.Folder = DataFolder;
            Log.Write("started, version", Application.ProductVersion);
            Settings = Settings.Load();
            // themes used to be saved by their short file names
            var renamed = new Dictionary<string, string> { { "classic", "Classic" }, { "reactor", "Reactor Timer" }, { "farm", "Farm Sign" },
                { "neon", "Night City HUD" }, { "og", "Green Orb" }, { "glass", "Dark Glass" }, { "Dark Glass", "Dark Glass" } };
            if (renamed.TryGetValue(Settings.theme ?? "", out var newName)) { Settings.theme = newName; Settings.Save(); }
            ui = new Control();
            ui.CreateControl();

            menu = new ContextMenuStrip();
            tray = new NotifyIcon { Text = Name, Visible = true, ContextMenuStrip = menu };
            try { tray.Icon = new Icon(Path.Combine(AppFolder, "icon.ico")); } catch { tray.Icon = SystemIcons.Application; }
            tray.MouseClick += (s, e) => { if (e.Button == MouseButtons.Left) ShowWidget(); };
            BuildMenu();

            pollTimer.Tick += (s, e) => { pollTimer.Stop(); _ = Poll(); };
            heartbeat.Interval = 15000;
            heartbeat.Tick += (s, e) => Heartbeat();
            SystemEvents.PowerModeChanged += OnPower;
            SystemEvents.SessionSwitch += OnSession;

            ApplyAutoStart();
            _ = Start();
        }

        async Task Start()
        {
            try
            {
                var options = new CoreWebView2EnvironmentOptions("--autoplay-policy=no-user-gesture-required");
                WebEnv = await CoreWebView2Environment.CreateAsync(null, Path.Combine(DataFolder, "WebView2"), options);
            }
            catch (Exception e)
            {
                Log.Write("WebView2 missing", e.Message);
                MessageBox.Show("This app needs the Microsoft Edge WebView2 Runtime, which is part of Windows 11.\n\nIf it was removed, install it from Microsoft's website (search \"WebView2 Runtime\"), then open the widget again.",
                    Name, MessageBoxButtons.OK, MessageBoxIcon.Error);
                Quit();
                return;
            }
            Log.Write("themes found:", string.Join(", ", Themes.List(ThemesFolder).Select(t => t.id)));
            widget = new WidgetForm(this);
            widget.Show();
            heartbeat.Start();
            // Get the Settings window ready in the background so it opens instantly later.
            var warm = new Timer { Interval = 2500 };
            warm.Tick += (s, e) => { warm.Stop(); warm.Dispose(); EnsureSettingsForm(); };
            warm.Start();
            if (IsConfigured()) Schedule(500);
            else { status = "setup"; message = "Open Settings to log in"; OpenWelcome(); }
        }

        // ---------- secrets / config ----------
        public string Password => Settings.Unprotect(Settings.passwordEnc);
        public string NsSecret => Settings.Unprotect(Settings.nsSecretEnc);
        bool IsConfigured() => Settings.source == "nightscout" ? Settings.nsUrl != "" : Settings.username != "" && Password != "";

        IGlucoseSource BuildSource(Settings s, string password, string nsSecret) =>
            s.source == "nightscout" ? (IGlucoseSource)new Nightscout(s.nsUrl, nsSecret) : new DexcomShare(s.username, password, s.region);

        public bool SeeThrough => Settings.glassClear && Themes.List(ThemesFolder).Any(t => t.id == EffectiveTheme() && t.key == "glass");

        public string EffectiveTheme()
        {
            var t = Settings.theme;
            return Themes.List(ThemesFolder).Any(x => x.id == t) ? t : "Classic";
        }

        // ---------- state for the widget page ----------
        public Dictionary<string, object> PublicState() => new Dictionary<string, object>
        {
            { "reading", latest }, { "history", history }, { "status", status }, { "message", message }, { "zone", zone },
            { "snoozeUntil", alertState.snoozeUntil },
            { "settings", new Dictionary<string, object> {
                { "high", Settings.high }, { "low", Settings.low }, { "volume", Settings.volume },
                { "staleMin", Settings.staleMin }, { "snoozeMin", Settings.snoozeMin }, { "theme", EffectiveTheme() },
                { "glassClear", Settings.glassClear }, { "glassAmount", Settings.glassAmount } } },
        };

        void PushState()
        {
            widget?.Send("state", PublicState());
            UpdateTrayText();
        }

        // ---------- polling ----------
        void Schedule(int ms)
        {
            pollTimer.Stop();
            pollTimer.Interval = Math.Max(1, ms);
            pollTimer.Start();
        }

        async Task Poll()
        {
            if (pollBusy) return;
            pollTimer.Stop();
            lastPollKick = Clock.Now();
            if (!IsConfigured())
            {
                status = "setup"; message = "Open Settings to log in";
                PushState();
                return;
            }
            pollBusy = true;
            var delay = 60000;
            try
            {
                if (source == null) source = BuildSource(Settings, Password, NsSecret);
                var list = await source.GetReadings(180, 40);
                failCount = 0; authNotified = false;
                status = "ok"; message = "";
                history = list;
                if (list.Count > 0 && (latest == null || list[0].time >= latest.time))
                {
                    if (latest == null || list[0].time > latest.time) Log.Write("reading", list[0].value, list[0].trend);
                    latest = list[0];
                }
                if (list.Count == 0) message = "No readings in the last 3 hours";
                // Dexcom makes a new reading every 5 minutes: wake up just after the next one is due.
                if (latest != null)
                {
                    var due = latest.time + 5 * 60000 + 15000 - Clock.Now();
                    delay = due > 0 ? (int)Math.Min(Math.Max(due, 20000), 330000) : 45000;
                }
                else delay = 45000;
            }
            catch (Exception ex)
            {
                failCount++;
                var kind = (ex as SourceException)?.Kind ?? "other";
                Log.Write("poll failed", kind, ex.Message);
                if (kind == "auth" || kind == "lockout")
                {
                    status = "auth"; message = ex.Message;
                    source = null;
                    // Never hammer the login: wrong passwords can lock the Dexcom account.
                    delay = kind == "lockout" ? 30 * 60000 : 6 * 60 * 60000;
                    if (!authNotified) { authNotified = true; FireAlert("auth"); }
                }
                else
                {
                    status = "error"; message = ex is SourceException ? ex.Message : "Could not get data";
                    delay = new[] { 30000, 60000, 120000, 300000 }[Math.Min(failCount - 1, 3)];
                }
            }
            finally { pollBusy = false; }
            RunAlerts();
            PushState();
            Schedule(delay);
        }

        void RestartPolling()
        {
            source = null; failCount = 0; authNotified = false;
            startedAt = Clock.Now();
            status = "loading"; message = "";
            PushState();
            Schedule(200);
        }

        void Heartbeat()
        {
            // Re-check alerts, refresh "x min ago", and rescue the poll loop if it ever stops.
            RunAlerts();
            PushState();
            if (IsConfigured() && status != "auth" && !pollBusy && Clock.Now() - lastPollKick > 6 * 60000) _ = Poll();
        }

        void OnPower(object s, PowerModeChangedEventArgs e) { if (e.Mode == PowerModes.Resume) ui.BeginInvoke((Action)Wake); }
        void OnSession(object s, SessionSwitchEventArgs e) { if (e.Reason == SessionSwitchReason.SessionUnlock) ui.BeginInvoke((Action)Wake); }
        void Wake() { if (IsConfigured() && status != "auth") Schedule(3000); }

        // ---------- alerts ----------
        void RunAlerts()
        {
            // If we are set up but have never managed to get a reading, count that as stale too.
            var reading = latest ?? (IsConfigured() ? new Reading { value = double.NaN, time = startedAt } : null);
            zone = Alerts.Evaluate(alertState, reading, Settings.Alerts(), Clock.Now(), out var alert);
            if (alert != null) FireAlert(alert);
        }

        void FireAlert(string type)
        {
            var v = latest != null ? latest.value.ToString("0") : "?";
            string text;
            switch (type)
            {
                case "low": text = $"LOW: {v} mg/dL (below {Settings.low:0})"; break;
                case "high": text = $"HIGH: {v} mg/dL (above {Settings.high:0})"; break;
                case "stale": text = $"No new glucose data for over {Settings.staleMin:0} minutes. Check your phone."; break;
                default: text = "Dexcom login problem. Open Settings."; break;
            }
            Log.Write("ALERT", type, text);
            if (widget != null)
            {
                widget.ShowNoFocus();
                widget.Send("alert", new Dictionary<string, object> { { "type", type }, { "text", text } });
            }
            try { tray.ShowBalloonTip(8000, Name, text, ToolTipIcon.None); } catch { /* ignore */ }
        }

        void SetSnooze(bool on)
        {
            alertState.snoozeUntil = on ? Clock.Now() + (long)(Settings.snoozeMin * 60000) : 0;
            Log.Write(on ? "snoozed" : "snooze cancelled");
            RunAlerts();
            PushState();
            BuildMenu();
        }

        // ---------- window ----------
        public void ShowWidget() => widget?.ShowAndFocus();

        public void HideWidget()
        {
            if (widget == null) return;
            if (Settings.minToTray) widget.Hide(); else widget.WindowState = FormWindowState.Minimized;
        }

        // Showing or hiding the taskbar button means building a fresh widget window.
        void ApplyTaskbar()
        {
            if (widget == null || widget.ShowInTaskbar == !Settings.minToTray) return;
            widget.ForceClose();
            widget.Dispose();
            widget = new WidgetForm(this);
            widget.Show();
        }

        SettingsForm EnsureSettingsForm()
        {
            if (settingsForm == null || settingsForm.IsDisposed)
            {
                settingsForm = new SettingsForm(this);
                settingsForm.FormClosed += (s, e) => settingsForm = null;
                settingsForm.Warm();
            }
            return settingsForm;
        }

        public void OpenSettings() => EnsureSettingsForm().Present();

        // First-run guide: helps a new user turn on Dexcom Share, log in, and pick alerts and a look.
        public void OpenWelcome()
        {
            if (welcomeForm == null || welcomeForm.IsDisposed)
            {
                welcomeForm = new SettingsForm(this, "welcome.html", "Welcome to " + Name, 540, 660, keepAlive: false);
                welcomeForm.FormClosed += (s, e) => welcomeForm = null;
                welcomeForm.Warm();
            }
            welcomeForm.Present();
        }

        public void SavePosition(Point p)
        {
            Settings.posX = p.X; Settings.posY = p.Y;
            Settings.Save();
        }

        // ---------- tray ----------
        void UpdateTrayText()
        {
            var tip = Name;
            if (latest != null)
            {
                var mins = Math.Max(0, (Clock.Now() - latest.time) / 60000);
                tip = $"{latest.value:0} mg/dL, {mins} min ago";
            }
            else if (message != "") tip = message;
            if (tip.Length > 63) tip = tip.Substring(0, 63);
            try { tray.Text = tip; } catch { /* ignore */ }
        }

        [DllImport("user32.dll")] static extern bool DestroyIcon(IntPtr h);

        public void SetTrayImage(string dataUrl)
        {
            try
            {
                var comma = dataUrl.IndexOf(',');
                if (comma < 0) return;
                var bytes = Convert.FromBase64String(dataUrl.Substring(comma + 1));
                using (var ms = new MemoryStream(bytes))
                using (var bmp = new Bitmap(ms))
                {
                    var h = bmp.GetHicon();
                    var old = trayHicon;
                    tray.Icon = Icon.FromHandle(h);
                    trayHicon = h;
                    if (old != IntPtr.Zero) DestroyIcon(old);
                }
            }
            catch (Exception e) { Log.Write("tray icon failed", e.Message); }
        }

        public void ShowMenuAtCursor() => menu.Show(Cursor.Position);

        void BuildMenu()
        {
            menu.Items.Clear();
            var snoozed = Clock.Now() < alertState.snoozeUntil;
            menu.Items.Add("Show widget", null, (s, e) => ShowWidget());
            menu.Items.Add(snoozed ? "Turn alerts back on" : $"Snooze alerts for {Settings.snoozeMin:0} min", null, (s, e) => SetSnooze(!snoozed));
            menu.Items.Add("Settings…", null, (s, e) => OpenSettings());
            menu.Items.Add("Setup guide…", null, (s, e) => OpenWelcome());
            menu.Items.Add(new ToolStripSeparator());
            AddCheck("Always on top", Settings.alwaysOnTop, v => { Settings.alwaysOnTop = v; Settings.Save(); widget?.ApplyTopMost(); });
            AddCheck("Minimise to tray (no taskbar icon)", Settings.minToTray, v => { Settings.minToTray = v; Settings.Save(); ApplyTaskbar(); });
            AddCheck("Start with Windows", Settings.autoStart, v => { Settings.autoStart = v; Settings.Save(); ApplyAutoStart(); });
            menu.Items.Add("Open log file", null, (s, e) => { try { System.Diagnostics.Process.Start(Path.Combine(DataFolder, "log.txt")); } catch { } });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Quit (stops alerts)", null, (s, e) => Quit());
        }

        void AddCheck(string text, bool on, Action<bool> change)
        {
            var item = new ToolStripMenuItem(text) { Checked = on, CheckOnClick = true };
            item.CheckedChanged += (s, e) => change(item.Checked);
            menu.Items.Add(item);
        }

        void ApplyAutoStart()
        {
            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (key == null) return;
                    if (Settings.autoStart) key.SetValue("GlucoseWidget", "\"" + Application.ExecutablePath + "\"");
                    else if (key.GetValue("GlucoseWidget") != null) key.DeleteValue("GlucoseWidget");
                }
            }
            catch (Exception e) { Log.Write("autostart failed", e.Message); }
        }

        // ---------- messages from the pages ----------
        static Dictionary<string, object> AsForm(object args) => Json.Obj(args);

        Settings CleanForm(Dictionary<string, object> f, Settings into)
        {
            into.theme = Themes.List(ThemesFolder).Any(t => t.id == Json.Str(f, "theme")) ? Json.Str(f, "theme") : "Classic";
            into.source = Json.Str(f, "source") == "nightscout" ? "nightscout" : "share";
            into.username = Json.Str(f, "username").Trim();
            var region = Json.Str(f, "region");
            into.region = region == "ous" || region == "jp" ? region : "us";
            into.nsUrl = Json.Str(f, "nsUrl").Trim();
            into.high = Settings.Num(f.ContainsKey("high") ? f["high"] : null, 120, 400, 250);
            into.low = Settings.Num(f.ContainsKey("low") ? f["low"] : null, 40, 120, 70);
            into.repeatLow = Settings.Num(f.ContainsKey("repeatLow") ? f["repeatLow"] : null, 1, 120, 5);
            into.repeatHigh = Settings.Num(f.ContainsKey("repeatHigh") ? f["repeatHigh"] : null, 1, 240, 15);
            into.staleMin = Settings.Num(f.ContainsKey("staleMin") ? f["staleMin"] : null, 11, 120, 20);
            into.snoozeMin = Settings.Num(f.ContainsKey("snoozeMin") ? f["snoozeMin"] : null, 5, 240, 30);
            into.volume = Settings.Num(f.ContainsKey("volume") ? f["volume"] : null, 0, 1, 0.8);
            into.minToTray = Json.Bool(f, "minToTray");
            into.glassClear = Json.Bool(f, "glassClear");
            into.glassAmount = Settings.Num(f.ContainsKey("glassAmount") ? f["glassAmount"] : null, 0, 1, 0.5);
            return into;
        }

        // Handles a request from a page. Returns the reply (or null for one-way messages).
        public async Task<object> Handle(string name, object args, Form from)
        {
            switch (name)
            {
                case "get-state": return PublicState();
                case "widget-action":
                    var act = args as string;
                    if (act == "minimize") HideWidget();
                    else if (act == "settings") OpenSettings();
                    else if (act == "snooze") SetSnooze(Clock.Now() >= alertState.snoozeUntil);
                    else if (act == "menu") ShowMenuAtCursor();
                    return null;
                case "tray-icon": SetTrayImage(args as string ?? ""); return null;
                case "drag": (from as WidgetForm)?.BeginDrag(); return null;
                case "settings-load":
                {
                    var s = Settings;
                    return new Dictionary<string, object>
                    {
                        { "themes", Themes.List(ThemesFolder) }, { "theme", EffectiveTheme() },
                        { "source", s.source }, { "username", s.username }, { "region", s.region }, { "nsUrl", s.nsUrl },
                        { "high", s.high }, { "low", s.low }, { "repeatLow", s.repeatLow }, { "repeatHigh", s.repeatHigh },
                        { "staleMin", s.staleMin }, { "snoozeMin", s.snoozeMin }, { "volume", s.volume }, { "minToTray", s.minToTray }, { "glassClear", s.glassClear }, { "glassAmount", s.glassAmount },
                        { "hasPassword", Password != "" }, { "hasNsSecret", NsSecret != "" }, { "canEncrypt", true },
                    };
                }
                case "settings-test":
                {
                    var f = AsForm(args);
                    var trial = CleanForm(f, Json.Read<Settings>(Json.Write(Settings)));
                    var pw = Json.Str(f, "password"); var sec = Json.Str(f, "nsSecret");
                    try
                    {
                        var list = await BuildSource(trial, pw != "" ? pw : Password, sec != "" ? sec : NsSecret).GetReadings(180, 3);
                        if (list.Count == 0) return new Dictionary<string, object> { { "ok", true }, { "empty", true } };
                        return new Dictionary<string, object> { { "ok", true }, { "value", list[0].value }, { "ageMin", Math.Round((Clock.Now() - list[0].time) / 60000.0) } };
                    }
                    catch (Exception e)
                    {
                        Log.Write("test failed", (e as SourceException)?.Kind ?? "", e.Message);
                        return new Dictionary<string, object> { { "ok", false }, { "message", e is SourceException ? e.Message : "Something went wrong" } };
                    }
                }
                case "settings-save":
                {
                    var f = AsForm(args);
                    CleanForm(f, Settings);
                    var pw = Json.Str(f, "password"); var sec = Json.Str(f, "nsSecret");
                    if (pw != "") Settings.passwordEnc = Settings.Protect(pw);
                    if (sec != "") Settings.nsSecretEnc = Settings.Protect(sec);
                    Settings.Save();
                    Log.Write("settings saved, source", Settings.source, "theme", Settings.theme);
                    ApplyTaskbar();
                    widget?.ApplyGlass();
                    latest = null; history = new List<Reading>();
                    BuildMenu();
                    RestartPolling();
                    return true;
                }
                case "settings-close": settingsForm?.Hide(); return null;
                case "welcome-close": welcomeForm?.Close(); ShowWidget(); return null;
            }
            return null;
        }

        public void Quit()
        {
            Log.Write("quit");
            SystemEvents.PowerModeChanged -= OnPower;
            SystemEvents.SessionSwitch -= OnSession;
            pollTimer.Stop(); heartbeat.Stop();
            tray.Visible = false;
            tray.Dispose();
            widget?.ForceClose();
            settingsForm?.ForceClose();
            welcomeForm?.Close();
            ExitThread();
        }
    }
}
