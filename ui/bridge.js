// Connects the pages to the Windows app (C#) through the Edge engine's message channel.
// Gives the pages the same window.api they always used.
(function () {
  const wv = window.chrome && window.chrome.webview;
  if (!wv) return;
  document.documentElement.classList.add('native');
  let seq = 0;
  const pending = {};
  const handlers = { state: [], alert: [] };
  wv.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'reply') {
      const done = pending[m.id];
      if (done) { delete pending[m.id]; done(m.result); }
    } else if (m.type === 'event') {
      for (const cb of handlers[m.name] || []) { try { cb(m.data); } catch (err) { console.error(err); } }
    }
  });
  const invoke = (name, args) => new Promise((resolve) => {
    const id = ++seq;
    pending[id] = resolve;
    wv.postMessage({ type: 'invoke', id, name, args });
  });
  const send = (name, args) => wv.postMessage({ type: 'send', name, args });

  window.api = {
    getState: () => invoke('get-state'),
    onState: (cb) => handlers.state.push(cb),
    onAlert: (cb) => handlers.alert.push(cb),
    action: (name) => send('widget-action', name),
    setTrayIcon: (dataUrl) => send('tray-icon', dataUrl),
    loadSettings: () => invoke('settings-load'),
    testSettings: (form) => invoke('settings-test', form),
    saveSettings: (form) => invoke('settings-save', form),
    closeSettings: () => send('settings-close'),
  };

  // The widget has no title bar: press anywhere that is not a button to drag it.
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !document.getElementById('card')) return;
    if (e.target.closest('button, input, select, textarea, a, [data-nodrag]')) return;
    send('drag');
  });
}());
