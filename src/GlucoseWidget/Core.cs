// Pure logic with no window code: data sources, alert rules, JSON and logging.
// The test project compiles this file on its own.
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

namespace GlucoseWidget
{
    public static class Json
    {
        static JavaScriptSerializer Make() => new JavaScriptSerializer { MaxJsonLength = 16 * 1024 * 1024 };
        public static string Write(object o) => Make().Serialize(o);
        public static object Read(string s) => Make().DeserializeObject(s);
        public static T Read<T>(string s) => Make().Deserialize<T>(s);

        public static Dictionary<string, object> Obj(object o) => o as Dictionary<string, object> ?? new Dictionary<string, object>();
        public static string Str(Dictionary<string, object> d, string k) => d.TryGetValue(k, out var v) && v != null ? Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture) : "";
        public static bool Bool(Dictionary<string, object> d, string k) => d.TryGetValue(k, out var v) && v is bool b && b;
    }

    public static class Log
    {
        static readonly object Gate = new object();
        public static string Folder = Path.GetTempPath();

        public static void Write(params object[] parts)
        {
            try
            {
                lock (Gate)
                {
                    var file = Path.Combine(Folder, "log.txt");
                    var info = new FileInfo(file);
                    if (info.Exists && info.Length > 1024 * 1024) File.WriteAllText(file, "");
                    File.AppendAllText(file, DateTime.UtcNow.ToString("o") + " " + string.Join(" ", parts) + Environment.NewLine);
                }
            }
            catch { /* logging must never crash the app */ }
        }
    }

    public class Reading
    {
        public double value { get; set; }
        public long time { get; set; }   // milliseconds since 1970 (UTC)
        public string trend { get; set; }
    }

    public class SourceException : Exception
    {
        // kind: auth (wrong login, do not retry), lockout, session (log in again), network, other
        public string Kind { get; }
        public SourceException(string kind, string message) : base(message) { Kind = kind; }
    }

    public interface IGlucoseSource
    {
        Task<List<Reading>> GetReadings(int minutes, int maxCount);
    }

    public static class Trends
    {
        static readonly string[] Names = { "None", "DoubleUp", "SingleUp", "FortyFiveUp", "Flat", "FortyFiveDown", "SingleDown", "DoubleDown", "NotComputable", "RateOutOfRange" };
        public static string Normalize(object t)
        {
            if (t is int i) return i >= 0 && i < Names.Length ? Names[i] : "None";
            if (t is long l) return l >= 0 && l < Names.Length ? Names[l] : "None";
            if (t is decimal m) return Normalize((int)m);
            var s = t as string;
            return s != null && Names.Contains(s) ? s : "None";
        }
    }

    public static class Http
    {
        static HttpClient shared;
        public static HttpClient Client(HttpMessageHandler handler)
        {
            if (handler != null) return new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(20) };
            if (shared == null)
            {
                System.Net.ServicePointManager.SecurityProtocol |= System.Net.SecurityProtocolType.Tls12;
                shared = new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
            }
            return shared;
        }
    }

    // Dexcom Share: the same cloud feed the Dexcom Follow app uses.
    public class DexcomShare : IGlucoseSource
    {
        const string ZeroId = "00000000-0000-0000-0000-000000000000";
        readonly string baseUrl, appId, username, password;
        readonly HttpClient http;
        string sessionId;

        public DexcomShare(string username, string password, string region, string baseUrlOverride = null, HttpMessageHandler handler = null)
        {
            string host;
            switch (region)
            {
                case "ous": host = "https://shareous1.dexcom.com"; appId = "d89443d2-327c-4a6f-89e5-496bbb0317db"; break;
                case "jp": host = "https://share.dexcom.jp"; appId = "d8665ade-9673-4e27-9ff6-92db4ce13d13"; break;
                default: host = "https://share2.dexcom.com"; appId = "d89443d2-327c-4a6f-89e5-496bbb0317db"; break;
            }
            baseUrl = (baseUrlOverride ?? host) + "/ShareWebServices/Services";
            this.username = username; this.password = password;
            http = Http.Client(handler);
        }

        async Task<object> Post(string path, object body)
        {
            HttpResponseMessage res;
            string text;
            try
            {
                var req = new HttpRequestMessage(HttpMethod.Post, baseUrl + path)
                {
                    Content = new StringContent(Json.Write(body ?? new Dictionary<string, object>()), Encoding.UTF8, "application/json"),
                };
                req.Headers.TryAddWithoutValidation("Accept", "application/json");
                req.Headers.TryAddWithoutValidation("User-Agent", "Dexcom Share/3.0.2.11 CFNetwork/672.0.2 Darwin/14.0.0");
                res = await http.SendAsync(req).ConfigureAwait(false);
                text = await res.Content.ReadAsStringAsync().ConfigureAwait(false);
            }
            catch (Exception e)
            {
                throw new SourceException("network", "Could not reach Dexcom (" + e.GetType().Name + ")");
            }
            object data = null;
            try { data = Json.Read(text); } catch { /* not JSON */ }
            if (!res.IsSuccessStatusCode)
            {
                var code = Json.Str(Json.Obj(data), "Code");
                if (Regex.IsMatch(code, "SessionIdNotFound|SessionNotValid", RegexOptions.IgnoreCase)) throw new SourceException("session", code);
                if (Regex.IsMatch(code, "MaxAttempts", RegexOptions.IgnoreCase))
                    throw new SourceException("lockout", "Dexcom locked the login after too many wrong tries. Wait a while, then check your password.");
                if (Regex.IsMatch(code, "Password|AccountNotFound|Authenticate", RegexOptions.IgnoreCase))
                    throw new SourceException("auth", "Dexcom did not accept that username or password.");
                if ((int)res.StatusCode >= 500 && code == "") throw new SourceException("network", "Dexcom server error " + (int)res.StatusCode);
                throw new SourceException("other", "Dexcom said: " + (code != "" ? code : ((int)res.StatusCode).ToString()));
            }
            return data;
        }

        public async Task Login()
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password)) throw new SourceException("auth", "Username and password are needed.");
            var accountId = await Post("/General/AuthenticatePublisherAccount", new Dictionary<string, object> { { "accountName", username }, { "password", password }, { "applicationId", appId } }).ConfigureAwait(false) as string;
            if (string.IsNullOrEmpty(accountId) || accountId == ZeroId) throw new SourceException("auth", "Dexcom did not accept that username or password.");
            var sid = await Post("/General/LoginPublisherAccountById", new Dictionary<string, object> { { "accountId", accountId }, { "password", password }, { "applicationId", appId } }).ConfigureAwait(false) as string;
            if (string.IsNullOrEmpty(sid) || sid == ZeroId) throw new SourceException("auth", "Dexcom did not accept that username or password.");
            sessionId = sid;
        }

        Task<object> ReadValues(int minutes, int maxCount) =>
            Post($"/Publisher/ReadPublisherLatestGlucoseValues?sessionId={Uri.EscapeDataString(sessionId)}&minutes={minutes}&maxCount={maxCount}", null);

        public static long? ParseDexDate(object s)
        {
            var m = Regex.Match(Convert.ToString(s ?? ""), @"Date\((\d+)");
            return m.Success ? long.Parse(m.Groups[1].Value) : (long?)null;
        }

        public async Task<List<Reading>> GetReadings(int minutes, int maxCount)
        {
            if (sessionId == null) await Login().ConfigureAwait(false);
            object raw;
            try { raw = await ReadValues(minutes, maxCount).ConfigureAwait(false); }
            catch (SourceException e) when (e.Kind == "session")
            {
                sessionId = null;
                await Login().ConfigureAwait(false);
                raw = await ReadValues(minutes, maxCount).ConfigureAwait(false);
            }
            if (!(raw is IEnumerable list) || raw is string) throw new SourceException("other", "Dexcom sent something unexpected.");
            var outList = new List<Reading>();
            foreach (var item in list)
            {
                var d = Json.Obj(item);
                if (!d.TryGetValue("Value", out var v) || v == null) continue;
                double value;
                try { value = Convert.ToDouble(v, System.Globalization.CultureInfo.InvariantCulture); } catch { continue; }
                var t = ParseDexDate(d.ContainsKey("ST") ? d["ST"] : null) ?? ParseDexDate(d.ContainsKey("DT") ? d["DT"] : null) ?? ParseDexDate(d.ContainsKey("WT") ? d["WT"] : null);
                if (t == null) continue;
                outList.Add(new Reading { value = value, time = t.Value, trend = Trends.Normalize(d.ContainsKey("Trend") ? d["Trend"] : null) });
            }
            return outList.OrderByDescending(r => r.time).ToList();
        }
    }

    // Optional second source: the user's own Nightscout site.
    public class Nightscout : IGlucoseSource
    {
        readonly string url, secret;
        readonly HttpClient http;

        public Nightscout(string url, string secret, HttpMessageHandler handler = null)
        {
            this.url = (url ?? "").Trim().TrimEnd('/');
            this.secret = secret ?? "";
            http = Http.Client(handler);
        }

        public static string Sha1Hex(string s)
        {
            using (var sha = SHA1.Create())
                return string.Concat(sha.ComputeHash(Encoding.UTF8.GetBytes(s)).Select(b => b.ToString("x2")));
        }

        public async Task<List<Reading>> GetReadings(int minutes, int maxCount)
        {
            if (!Regex.IsMatch(url, "^https?://", RegexOptions.IgnoreCase)) throw new SourceException("auth", "The Nightscout address should start with http:// or https://");
            HttpResponseMessage res;
            string text;
            try
            {
                var req = new HttpRequestMessage(HttpMethod.Get, $"{url}/api/v1/entries/sgv.json?count={maxCount}");
                req.Headers.TryAddWithoutValidation("Accept", "application/json");
                if (secret != "") req.Headers.TryAddWithoutValidation("api-secret", Sha1Hex(secret));
                res = await http.SendAsync(req).ConfigureAwait(false);
                text = await res.Content.ReadAsStringAsync().ConfigureAwait(false);
            }
            catch (Exception e)
            {
                throw new SourceException("network", "Could not reach Nightscout (" + e.GetType().Name + ")");
            }
            if ((int)res.StatusCode == 401 || (int)res.StatusCode == 403) throw new SourceException("auth", "Nightscout did not accept the API secret.");
            if (!res.IsSuccessStatusCode) throw new SourceException("network", "Nightscout error " + (int)res.StatusCode);
            object data;
            try { data = Json.Read(text); } catch { throw new SourceException("other", "Nightscout sent something unexpected."); }
            if (!(data is IEnumerable list) || data is string) throw new SourceException("other", "Nightscout sent something unexpected.");
            var cutoff = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - minutes * 60000L;
            var outList = new List<Reading>();
            foreach (var item in list)
            {
                var d = Json.Obj(item);
                try
                {
                    var value = Convert.ToDouble(d["sgv"], System.Globalization.CultureInfo.InvariantCulture);
                    var time = Convert.ToInt64(d["date"], System.Globalization.CultureInfo.InvariantCulture);
                    if (time >= cutoff) outList.Add(new Reading { value = value, time = time, trend = Trends.Normalize(d.ContainsKey("direction") ? d["direction"] : null) });
                }
                catch { /* skip odd entries */ }
            }
            return outList.OrderByDescending(r => r.time).ToList();
        }
    }

    // Alert rules:
    //  LOW  when value <  low (default 70);  HIGH when value > high (default 250);
    //  STALE when the newest reading is older than staleMin minutes.
    // Alerts fire the moment a zone is entered, then repeat while it lasts.
    // Snooze silences everything until it runs out; if still out of range then, it fires straight away.
    public class AlertSettings
    {
        public double low = 70, high = 250, staleMin = 20, repeatLow = 5, repeatHigh = 15, repeatStale = 30;
    }

    public class AlertState
    {
        public long lastLow, lastHigh, lastStale, snoozeUntil;
    }

    public static class Alerts
    {
        public static string ZoneOf(Reading r, AlertSettings s, long now)
        {
            if (r == null) return "none";
            if (now - r.time > s.staleMin * 60000) return "stale";
            if (r.value < s.low) return "low";
            if (r.value > s.high) return "high";
            return "ok";
        }

        // Returns the zone, and sets alert to "low" | "high" | "stale" when one should fire now.
        public static string Evaluate(AlertState st, Reading r, AlertSettings s, long now, out string alert)
        {
            alert = null;
            var zone = ZoneOf(r, s, now);
            if (zone != "low") st.lastLow = 0;
            if (zone != "high") st.lastHigh = 0;
            if (zone != "stale") st.lastStale = 0;
            if (zone == "none" || zone == "ok") return zone;
            if (now < st.snoozeUntil) return zone;
            var repeatMin = zone == "low" ? s.repeatLow : zone == "high" ? s.repeatHigh : s.repeatStale;
            var last = zone == "low" ? st.lastLow : zone == "high" ? st.lastHigh : st.lastStale;
            if (last == 0 || now - last >= repeatMin * 60000)
            {
                if (zone == "low") st.lastLow = now; else if (zone == "high") st.lastHigh = now; else st.lastStale = now;
                alert = zone;
            }
            return zone;
        }
    }

    // Theme files: every theme except Classic is one .js file in the "themes" folder.
    // Its first line says what it is:  // @theme {"id":"farm","name":"Farm sign",...}
    public class ThemeInfo
    {
        public string id { get; set; }
        public string name { get; set; }
    }

    public static class Themes
    {
        public static readonly ThemeInfo Classic = new ThemeInfo { id = "classic", name = "Classic (with graph)" };

        public static List<ThemeInfo> List(string folder)
        {
            var found = new List<ThemeInfo> { Classic };
            string[] files;
            try { files = Directory.GetFiles(folder, "*.js"); } catch { return found; }
            foreach (var file in files.OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
            {
                var stem = Path.GetFileNameWithoutExtension(file);
                if (!Regex.IsMatch(stem, "^[a-z0-9_-]+$", RegexOptions.IgnoreCase)) continue;
                try
                {
                    string head;
                    using (var r = new StreamReader(file)) { var buf = new char[400]; var n = r.Read(buf, 0, buf.Length); head = new string(buf, 0, n); }
                    var m = Regex.Match(head, @"@theme\s+(\{[^\n]*\})");
                    if (!m.Success) continue;
                    var meta = Json.Obj(Json.Read(m.Groups[1].Value));
                    var id = Json.Str(meta, "id");
                    if (id != stem) continue;
                    var name = Json.Str(meta, "name");
                    found.Add(new ThemeInfo { id = id, name = (name == "" ? id : name.Length > 40 ? name.Substring(0, 40) : name) });
                }
                catch (Exception e) { Log.Write("theme file skipped", Path.GetFileName(file), e.Message); }
            }
            return found;
        }
    }

    public static class Clock
    {
        public static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
}
