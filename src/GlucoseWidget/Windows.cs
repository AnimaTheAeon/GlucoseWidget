using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace GlucoseWidget
{
    // Puts one of our pages (ui/*.html) inside a window using Windows' built-in Edge engine,
    // and passes messages between the page and the app.
    public static class WebHost
    {
        public const string Origin = "https://app.glucose/";

        public static async Task Attach(App app, Form form, WebView2 web, string page)
        {
            await web.EnsureCoreWebView2Async(app.WebEnv);
            var core = web.CoreWebView2;
            var st = core.Settings;
            st.AreDefaultContextMenusEnabled = false;
            st.IsZoomControlEnabled = false;
            st.IsStatusBarEnabled = false;
            st.AreBrowserAcceleratorKeysEnabled = false;
            st.IsPinchZoomEnabled = false;
            st.IsSwipeNavigationEnabled = false;
            st.AreDevToolsEnabled = false;
            core.SetVirtualHostNameToFolderMapping("app.glucose", App.AppFolder, CoreWebView2HostResourceAccessKind.DenyCors);
            core.SetVirtualHostNameToFolderMapping("themes.glucose", App.ThemesFolder, CoreWebView2HostResourceAccessKind.Allow);
            core.NewWindowRequested += (s, e) => e.Handled = true;
            core.NavigationStarting += (s, e) => { if (!e.Uri.StartsWith(Origin, StringComparison.OrdinalIgnoreCase)) e.Cancel = true; };
            core.ProcessFailed += (s, e) =>
            {
                Log.Write("page process failed", e.ProcessFailedKind.ToString());
                if (e.ProcessFailedKind == CoreWebView2ProcessFailedKind.RenderProcessExited || e.ProcessFailedKind == CoreWebView2ProcessFailedKind.RenderProcessUnresponsive)
                {
                    try { core.Reload(); } catch { /* ignore */ }
                }
            };
            core.WebMessageReceived += async (s, e) =>
            {
                try
                {
                    var msg = Json.Obj(Json.Read(e.WebMessageAsJson));
                    var type = Json.Str(msg, "type");
                    var name = Json.Str(msg, "name");
                    msg.TryGetValue("args", out var args);
                    var result = await app.Handle(name, args, form);
                    if (type == "invoke")
                    {
                        msg.TryGetValue("id", out var id);
                        Post(core, new Dictionary<string, object> { { "type", "reply" }, { "id", id }, { "result", result } });
                    }
                }
                catch (Exception ex) { Log.Write("message failed", ex.Message); }
            };
            core.Navigate(Origin + "ui/" + page);
        }

        public static void Post(CoreWebView2 core, object msg)
        {
            try { core?.PostWebMessageAsJson(Json.Write(msg)); } catch (Exception e) { Log.Write("post failed", e.Message); }
        }
    }

    static class Native
    {
        [DllImport("user32.dll")] public static extern bool ReleaseCapture();
        [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);
        [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

        // Windows 11: smooth rounded corners and no extra 1px border on the borderless widget.
        public static void Round(IntPtr hwnd)
        {
            try
            {
                var round = 2; // DWMWCP_ROUND
                DwmSetWindowAttribute(hwnd, 33, ref round, 4);
                var none = unchecked((int)0xFFFFFFFE); // DWMWA_COLOR_NONE
                DwmSetWindowAttribute(hwnd, 34, ref none, 4);
            }
            catch { /* older Windows: square corners */ }
        }
    }

    // The little always-on-top widget. Every theme is 300 x 180.
    public class WidgetForm : Form
    {
        public const int W = 300, H = 180;
        readonly App app;
        readonly WebView2 web;
        readonly Timer moveTimer = new Timer { Interval = 500 };
        bool ready, forceClose, placed;

        public WidgetForm(App app)
        {
            this.app = app;
            Text = App.Name;
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = !app.Settings.minToTray;
            TopMost = app.Settings.alwaysOnTop;
            StartPosition = FormStartPosition.Manual;
            MaximizeBox = false;
            BackColor = Color.FromArgb(20, 25, 34);
            try { Icon = new Icon(Path.Combine(App.AppFolder, "icon.ico")); } catch { /* default icon */ }
            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(20, 25, 34) };
            Controls.Add(web);
            ClientSize = new Size(W, H);

            HandleCreated += (s, e) => { Native.Round(Handle); ApplySize(); Place(); };
            Load += async (s, e) =>
            {
                try { await WebHost.Attach(app, this, web, "widget.html"); ready = true; }
                catch (Exception ex) { Log.Write("widget page failed", ex.ToString()); }
            };
            DpiChanged += (s, e) => { Bounds = new Rectangle(e.SuggestedRectangle.Location, ScaledSize(e.DeviceDpiNew)); };
            moveTimer.Tick += (s, e) => { moveTimer.Stop(); if (WindowState == FormWindowState.Normal) app.SavePosition(Location); };
            Move += (s, e) => { if (placed) { moveTimer.Stop(); moveTimer.Start(); } };
            // Closing the window must not silently stop the alarms: hide it instead.
            FormClosing += (s, e) => { if (!forceClose && e.CloseReason == CloseReason.UserClosing) { e.Cancel = true; app.HideWidget(); } };
        }

        protected override bool ShowWithoutActivation => true;

        static Size ScaledSize(int dpi) => new Size(W * dpi / 96, H * dpi / 96);
        void ApplySize() => Size = ScaledSize(DeviceDpi);

        void Place()
        {
            var p = app.Settings.posX.HasValue && app.Settings.posY.HasValue ? new Point(app.Settings.posX.Value, app.Settings.posY.Value) : (Point?)null;
            var visible = p.HasValue && Screen.AllScreens.Any(sc =>
                p.Value.X + Width > sc.WorkingArea.Left + 20 && p.Value.X < sc.WorkingArea.Right - 20 &&
                p.Value.Y >= sc.WorkingArea.Top - 5 && p.Value.Y < sc.WorkingArea.Bottom - 20);
            if (visible) Location = p.Value;
            else
            {
                var a = Screen.PrimaryScreen.WorkingArea;
                Location = new Point(a.Right - Width - 24, a.Bottom - Height - 24);
            }
            placed = true;
        }

        public void Send(string name, object data)
        {
            if (!ready || web.CoreWebView2 == null) return;
            WebHost.Post(web.CoreWebView2, new Dictionary<string, object> { { "type", "event" }, { "name", name }, { "data", data } });
        }

        public void BeginDrag()
        {
            Native.ReleaseCapture();
            Native.SendMessage(Handle, 0xA1 /* WM_NCLBUTTONDOWN */, (IntPtr)2 /* HTCAPTION */, IntPtr.Zero);
        }

        public void ApplyTopMost()
        {
            TopMost = app.Settings.alwaysOnTop;
        }

        public void ShowNoFocus()
        {
            if (!Visible) Show();
            if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
            if (app.Settings.alwaysOnTop) { TopMost = false; TopMost = true; } else BringToFront();
        }

        public void ShowAndFocus()
        {
            ShowNoFocus();
            Activate();
        }

        public void ForceClose()
        {
            forceClose = true;
            Close();
        }
    }

    // Built once in the background and then kept: closing just hides it, so it opens instantly.
    public class SettingsForm : Form
    {
        readonly App app;
        readonly WebView2 web;
        bool ready, wantShow, forceClose, warming;

        public SettingsForm(App app)
        {
            this.app = app;
            Text = App.Name + " Settings";
            StartPosition = FormStartPosition.Manual;
            BackColor = Color.FromArgb(20, 25, 34);
            MinimizeBox = false; MaximizeBox = false;
            try { Icon = new Icon(Path.Combine(App.AppFolder, "icon.ico")); } catch { /* default icon */ }
            web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(20, 25, 34) };
            Controls.Add(web);
            FormClosing += (s, e) => { if (!forceClose && e.CloseReason == CloseReason.UserClosing) { e.Cancel = true; Hide(); } };
        }

        // Creates the window and loads the page without showing anything.
        public async void Warm()
        {
            if (warming) return;
            warming = true;
            try
            {
                CreateHandle();
                ClientSize = new Size(470 * DeviceDpi / 96, 800 * DeviceDpi / 96);
                await WebHost.Attach(app, this, web, "settings.html");
                web.CoreWebView2.NavigationCompleted += (s, e) =>
                {
                    ready = true;
                    if (wantShow) { wantShow = false; ShowNow(); }
                };
            }
            catch (Exception ex) { Log.Write("settings page failed", ex.ToString()); }
        }

        public void Present()
        {
            if (!ready) { wantShow = true; Warm(); return; }
            // fresh values every time it opens
            WebHost.Post(web.CoreWebView2, new Dictionary<string, object> { { "type", "event" }, { "name", "refresh" }, { "data", null } });
            ShowNow();
        }

        void ShowNow()
        {
            if (!Visible)
            {
                var a = Screen.FromPoint(Cursor.Position).WorkingArea;
                Location = new Point(a.Left + (a.Width - Width) / 2, a.Top + Math.Max(0, (a.Height - Height) / 2));
                Show();
            }
            if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
            Activate();
        }

        public void ForceClose()
        {
            forceClose = true;
            Close();
        }
    }
}
