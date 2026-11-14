using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace GlucoseWidget
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Directory.CreateDirectory(App.DataFolder);
            Log.Folder = App.DataFolder;

            // Only one copy runs. Opening it again just brings the widget up.
            using (var mutex = new Mutex(true, @"Local\GlucoseWidget.Single", out var first))
            {
                if (!first)
                {
                    try { EventWaitHandle.OpenExisting(@"Local\GlucoseWidget.Show").Set(); } catch { /* ignore */ }
                    return;
                }
                var showSignal = new EventWaitHandle(false, EventResetMode.AutoReset, @"Local\GlucoseWidget.Show");

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
                Application.ThreadException += (s, e) => Log.Write("ui exception", e.Exception.ToString());
                AppDomain.CurrentDomain.UnhandledException += (s, e) => Log.Write("fatal", e.ExceptionObject.ToString());
                TaskScheduler.UnobservedTaskException += (s, e) => { Log.Write("task exception", e.Exception.ToString()); e.SetObserved(); };

                var app = new App();
                var ui = SynchronizationContext.Current ?? new WindowsFormsSynchronizationContext();
                new Thread(() =>
                {
                    while (true) { showSignal.WaitOne(); ui.Post(_ => app.ShowWidget(), null); }
                }) { IsBackground = true }.Start();

                Application.Run(app);
                GC.KeepAlive(mutex);
            }
        }
    }
}
