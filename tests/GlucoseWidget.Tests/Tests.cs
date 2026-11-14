// Checks the parts that don't need a screen: Dexcom/Nightscout parsing and the alert rules.
// GitHub runs this on every build; the build fails if any check fails.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using GlucoseWidget;

static class Tests
{
    static int passed;
    static void Ok(string name) { passed++; Console.WriteLine("  ok  " + name); }
    static void Check(bool cond, string what) { if (!cond) throw new Exception("FAILED: " + what); }
    const long MIN = 60000;

    // Fake Dexcom / Nightscout server, no network needed.
    class FakeServer : HttpMessageHandler
    {
        public int Auth, Login, Read;
        public string Session = "sess-1", Password = "pw";
        public bool FailNextRead, Throw;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct)
        {
            if (Throw) throw new HttpRequestException("no route");
            var url = req.RequestUri.ToString();
            var body = req.Content == null ? "" : req.Content.ReadAsStringAsync().Result;
            var data = body == "" ? new Dictionary<string, object>() : Json.Obj(Json.Read(body));
            HttpResponseMessage Send(int code, object o) => new HttpResponseMessage((HttpStatusCode)code) { Content = new StringContent(Json.Write(o), Encoding.UTF8, "application/json") };
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            if (url.EndsWith("/General/AuthenticatePublisherAccount"))
            {
                Auth++;
                if (Json.Str(data, "password") != Password) return Task.FromResult(Send(500, new Dictionary<string, object> { { "Code", "AccountPasswordInvalid" } }));
                return Task.FromResult(Send(200, "acct-123"));
            }
            if (url.EndsWith("/General/LoginPublisherAccountById")) { Login++; return Task.FromResult(Send(200, Session)); }
            if (url.Contains("/Publisher/ReadPublisherLatestGlucoseValues"))
            {
                Read++;
                var sid = System.Web.HttpUtility.ParseQueryString(req.RequestUri.Query)["sessionId"];
                if (FailNextRead || sid != Session)
                {
                    FailNextRead = false;
                    return Task.FromResult(Send(500, new Dictionary<string, object> { { "Code", "SessionIdNotFound" } }));
                }
                return Task.FromResult(Send(200, new object[]
                {
                    new Dictionary<string, object> { { "WT", $"Date({now - 9 * MIN - 5 * 3600000})" }, { "ST", $"Date({now - 9 * MIN})" }, { "DT", $"Date({now - 9 * MIN}-0500)" }, { "Value", 150 }, { "Trend", 4 } },
                    new Dictionary<string, object> { { "WT", $"Date({now - 4 * MIN - 5 * 3600000})" }, { "ST", $"Date({now - 4 * MIN})" }, { "DT", $"Date({now - 4 * MIN}-0500)" }, { "Value", 162 }, { "Trend", "FortyFiveUp" } },
                }));
            }
            if (url.Contains("/api/v1/entries/sgv.json"))
            {
                req.Headers.TryGetValues("api-secret", out var secrets);
                if (secrets == null || secrets.FirstOrDefault() != "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3") return Task.FromResult(Send(401, new Dictionary<string, object>()));
                return Task.FromResult(Send(200, new object[]
                {
                    new Dictionary<string, object> { { "sgv", 99 }, { "date", now - 2 * MIN }, { "direction", "Flat" } },
                    new Dictionary<string, object> { { "sgv", 90 }, { "date", now - 7 * MIN }, { "direction", "SingleDown" } },
                }));
            }
            return Task.FromResult(Send(404, new Dictionary<string, object>()));
        }
    }

    static void AlertTests()
    {
        var S = new AlertSettings();
        long t0 = 1_700_000_000_000;
        Reading R(double v, long at) => new Reading { value = v, time = at };
        string A(AlertState st, Reading r, long now) { Alerts.Evaluate(st, r, S, now, out var a); return a; }

        var s = new AlertState();
        Check(A(s, null, t0) == null, "no reading is quiet");
        Check(A(s, R(120, t0), t0) == null, "in range quiet");
        Check(A(s, R(70, t0), t0) == null, "70 is not below 70");
        Check(A(s, R(250, t0), t0) == null, "250 is not above 250");
        Ok("in range and exact limits stay quiet");

        Check(A(s, R(69, t0), t0) == "low", "low fires");
        Check(A(s, R(69, t0), t0 + 1 * MIN) == null, "low waits");
        Check(A(s, R(65, t0 + 5 * MIN), t0 + 5 * MIN) == "low", "low repeats after 5 min");
        Ok("low alerts at once, then every 5 min");

        Check(A(s, R(100, t0 + 10 * MIN), t0 + 10 * MIN) == null, "back in range");
        Check(A(s, R(60, t0 + 11 * MIN), t0 + 11 * MIN) == "low", "re-armed");
        Ok("going back in range re-arms the alert");

        s = new AlertState();
        Check(A(s, R(251, t0), t0) == "high", "high fires");
        Check(A(s, R(260, t0 + 10 * MIN), t0 + 10 * MIN) == null, "high waits");
        Check(A(s, R(260, t0 + 15 * MIN), t0 + 15 * MIN) == "high", "high repeats after 15");
        Check(A(s, R(60, t0 + 16 * MIN), t0 + 16 * MIN) == "low", "crash to low fires at once");
        Ok("high repeats every 15 min, and a crash to low alerts right away");

        s = new AlertState { snoozeUntil = t0 + 30 * MIN };
        Check(A(s, R(300, t0), t0) == null, "snoozed");
        Check(A(s, R(300, t0 + 29 * MIN), t0 + 29 * MIN) == null, "still snoozed");
        Check(A(s, R(300, t0 + 30 * MIN), t0 + 30 * MIN) == "high", "fires when snooze ends");
        Ok("snooze silences, then alerts the moment it ends");

        s = new AlertState();
        Check(A(s, R(120, t0), t0 + 20 * MIN) == null, "20 min is not stale yet");
        Check(Alerts.Evaluate(s, R(120, t0), S, t0 + 21 * MIN, out var a1) == "stale" && a1 == "stale", "stale fires");
        Check(A(s, R(120, t0), t0 + 40 * MIN) == null, "stale waits");
        Check(A(s, R(120, t0), t0 + 51 * MIN) == "stale", "stale repeats after 30");
        Check(Alerts.ZoneOf(R(60, t0), S, t0 + 52 * MIN) == "stale", "old low value counts as stale");
        Ok("stale data warning");

        s = new AlertState();
        Check(A(s, R(double.NaN, t0), t0 + 5 * MIN) == null, "waiting for first reading");
        Check(A(s, R(double.NaN, t0), t0 + 21 * MIN) == "stale", "never getting a reading warns");
        Ok("never getting a first reading also warns");
    }

    static async Task ClientTests()
    {
        Check(DexcomShare.ParseDexDate("Date(1700000000000)") == 1700000000000, "date");
        Check(DexcomShare.ParseDexDate("/Date(1700000000000-0500)/") == 1700000000000, "date with zone");
        Check(DexcomShare.ParseDexDate("nope") == null, "bad date");
        Check(Trends.Normalize(4) == "Flat" && Trends.Normalize("DoubleDown") == "DoubleDown" && Trends.Normalize("weird") == "None", "trends");
        Ok("date and trend parsing");

        var fake = new FakeServer();
        var dex = new DexcomShare("me", "pw", "us", "https://fake.local", fake);
        var list = await dex.GetReadings(180, 40);
        Check(list.Count == 2 && list[0].value == 162 && list[0].trend == "FortyFiveUp" && list[1].trend == "Flat", "readings newest first");
        Check(Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - list[0].time - 4 * MIN) < 5000, "uses real UTC time");
        Check(fake.Auth == 1 && fake.Login == 1 && fake.Read == 1, "one login");
        Ok("login and read");

        await dex.GetReadings(180, 40);
        Check(fake.Auth == 1 && fake.Read == 2, "session reused");
        Ok("session is reused");

        fake.FailNextRead = true;
        list = await dex.GetReadings(180, 40);
        Check(list[0].value == 162 && fake.Auth == 2 && fake.Login == 2 && fake.Read == 4, "re-login after expiry");
        Ok("expired session logs in again by itself");

        try { await new DexcomShare("me", "wrong", "us", "https://fake.local", new FakeServer()).GetReadings(180, 40); Check(false, "should fail"); }
        catch (SourceException e) { Check(e.Kind == "auth", "auth kind"); }
        Ok("wrong password is reported as a login problem");

        try { await new DexcomShare("me", "pw", "us", "https://fake.local", new FakeServer { Throw = true }).GetReadings(180, 40); Check(false, "should fail"); }
        catch (SourceException e) { Check(e.Kind == "network", "network kind"); }
        Ok("unreachable server is reported as a network problem");

        var ns = await new Nightscout("https://fake.local/", "test", new FakeServer()).GetReadings(180, 40);
        Check(ns.Count == 2 && ns[0].value == 99 && ns[0].trend == "Flat", "nightscout read");
        try { await new Nightscout("https://fake.local", "nope", new FakeServer()).GetReadings(180, 40); Check(false, "should fail"); }
        catch (SourceException e) { Check(e.Kind == "auth", "nightscout auth"); }
        Ok("nightscout read and bad secret");
    }

    static void ThemeTests()
    {
        // walk up from the test program until the repo's "themes" folder is found
        var d = new System.IO.DirectoryInfo(AppDomain.CurrentDomain.BaseDirectory);
        while (d != null && !System.IO.Directory.Exists(System.IO.Path.Combine(d.FullName, "themes"))) d = d.Parent;
        Check(d != null, "themes folder exists");
        var list = Themes.List(System.IO.Path.Combine(d.FullName, "themes"));
        Console.WriteLine("  themes: " + string.Join(", ", list.Select(t => t.id)));
        Check(list[0].id == "classic" && list.Count >= 2, "theme files found");
        Ok("theme files are listed");
    }

    static int Main()
    {
        try
        {
            AlertTests();
            ClientTests().GetAwaiter().GetResult();
            ThemeTests();
            Console.WriteLine($"\n{passed} checks passed");
            return 0;
        }
        catch (Exception e)
        {
            Console.WriteLine("\n" + e);
            return 1;
        }
    }
}
