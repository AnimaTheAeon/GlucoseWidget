using System;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace GlucoseWidget
{
    // Saved to %APPDATA%\GlucoseWidget\settings.json. Passwords are scrambled with Windows' own
    // per-user lock (DPAPI), so they can only be read back by this Windows account.
    public class Settings
    {
        public string source { get; set; } = "share";
        public string username { get; set; } = "";
        public string passwordEnc { get; set; } = "";
        public string region { get; set; } = "us";
        public string nsUrl { get; set; } = "";
        public string nsSecretEnc { get; set; } = "";
        public double high { get; set; } = 250;
        public double low { get; set; } = 70;
        public double repeatLow { get; set; } = 5;
        public double repeatHigh { get; set; } = 15;
        public double repeatStale { get; set; } = 30;
        public double staleMin { get; set; } = 20;
        public double volume { get; set; } = 0.8;
        public double snoozeMin { get; set; } = 30;
        public bool alwaysOnTop { get; set; } = true;
        public bool autoStart { get; set; } = true;
        public bool minToTray { get; set; } = true;
        public string theme { get; set; } = "classic";
        public int? posX { get; set; }
        public int? posY { get; set; }

        static string File => Path.Combine(App.DataFolder, "settings.json");

        public static Settings Load()
        {
            try { if (System.IO.File.Exists(File)) return Json.Read<Settings>(System.IO.File.ReadAllText(File)) ?? new Settings(); }
            catch { return new Settings(); }
            return FromOldVersion();
        }

        // First start: copy what we can from the old (Electron) version. Its password was locked
        // with a key only that version can open, so the password has to be typed in again.
        static Settings FromOldVersion()
        {
            var s = new Settings();
            try
            {
                var old = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Glucose Widget", "settings.json");
                if (!System.IO.File.Exists(old)) return s;
                var d = Json.Obj(Json.Read(System.IO.File.ReadAllText(old)));
                string Str(string k) => Json.Str(d, k);
                double N(string k, double lo, double hi, double fb) => d.ContainsKey(k) ? Num(d[k], lo, hi, fb) : fb;
                if (Str("source") == "nightscout") s.source = "nightscout";
                s.username = Str("username"); s.nsUrl = Str("nsUrl");
                if (Str("region") == "ous" || Str("region") == "jp") s.region = Str("region");
                s.high = N("high", 120, 400, 250); s.low = N("low", 40, 120, 70);
                s.repeatLow = N("repeatLow", 1, 120, 5); s.repeatHigh = N("repeatHigh", 1, 240, 15);
                s.staleMin = N("staleMin", 11, 120, 20); s.snoozeMin = N("snoozeMin", 5, 240, 30); s.volume = N("volume", 0, 1, 0.8);
                if (d.ContainsKey("alwaysOnTop") && d["alwaysOnTop"] is bool top) s.alwaysOnTop = top;
                if (d.ContainsKey("minToTray") && d["minToTray"] is bool tray) s.minToTray = tray;
                if (Str("theme") != "") s.theme = Str("theme");
                var pos = Json.Obj(d.ContainsKey("pos") ? d["pos"] : null);
                if (pos.ContainsKey("x") && pos.ContainsKey("y")) { s.posX = (int)Num(pos["x"], -100000, 100000, 0); s.posY = (int)Num(pos["y"], -100000, 100000, 0); }
                Log.Write("copied settings from the old version");
                s.Save();
            }
            catch (Exception e) { Log.Write("old settings not copied", e.Message); }
            return s;
        }

        public void Save()
        {
            try
            {
                var tmp = File + ".tmp";
                System.IO.File.WriteAllText(tmp, Json.Write(this));
                if (System.IO.File.Exists(File)) System.IO.File.Replace(tmp, File, null);
                else System.IO.File.Move(tmp, File);
            }
            catch (Exception e) { Log.Write("settings save failed", e.Message); }
        }

        public AlertSettings Alerts() => new AlertSettings { low = low, high = high, staleMin = staleMin, repeatLow = repeatLow, repeatHigh = repeatHigh, repeatStale = repeatStale };

        static readonly byte[] Entropy = Encoding.UTF8.GetBytes("GlucoseWidget.v2");

        public static string Protect(string plain)
        {
            if (string.IsNullOrEmpty(plain)) return "";
            try { return Convert.ToBase64String(ProtectedData.Protect(Encoding.UTF8.GetBytes(plain), Entropy, DataProtectionScope.CurrentUser)); }
            catch { return ""; }
        }

        public static string Unprotect(string b64)
        {
            if (string.IsNullOrEmpty(b64)) return "";
            try { return Encoding.UTF8.GetString(ProtectedData.Unprotect(Convert.FromBase64String(b64), Entropy, DataProtectionScope.CurrentUser)); }
            catch { return ""; }
        }

        public static double Num(object v, double lo, double hi, double fallback)
        {
            double n;
            if (v is string s) { if (!double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out n)) return fallback; }
            else { try { n = Convert.ToDouble(v, CultureInfo.InvariantCulture); } catch { return fallback; } }
            if (double.IsNaN(n) || double.IsInfinity(n)) return fallback;
            return Math.Min(hi, Math.Max(lo, n));
        }
    }
}
