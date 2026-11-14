const $ = (id) => document.getElementById(id);
const COLORS = { ok: '#3ddc84', high: '#ffb020', low: '#ff4d4f', stale: '#8a93a3', none: '#8a93a3' };
const ANGLES = { DoubleUp: -90, SingleUp: -90, FortyFiveUp: -45, Flat: 0, FortyFiveDown: 45, SingleDown: 90, DoubleDown: 90 };
let state = null;
let lastTrayKey = '';

function valueText(v) {
  if (!Number.isFinite(v)) return '---';
  if (v < 40) return 'LOW';
  if (v > 400) return 'HIGH';
  return String(v);
}

// ---------- theme files ----------
// Each theme lives in its own file in the "themes" folder and registers itself here.
// If a theme file is missing or broken, the widget falls back to the built-in Classic look.
const THEMES = {};
const themeLoad = {}; // id -> 'loading' | 'failed'
let lastCtx = null;

window.GlucoseWidget = {
  registerTheme(def) {
    if (!def || !def.id || THEMES[def.id]) return;
    THEMES[def.id] = def;
    if (def.css) { const el = document.createElement('style'); el.dataset.theme = def.id; el.textContent = def.css; document.head.appendChild(el); }
    if (def.html) $('card').insertAdjacentHTML('beforeend', def.html);
    try { if (def.init) def.init({ action: (name) => window.api.action(name) }); } catch (e) { console.error(e); }
    render();
  },
};

function activeTheme(id) {
  if (!id || id === 'classic') return 'classic';
  if (THEMES[id]) return id;
  if (!themeLoad[id] && /^[a-z0-9_-]+$/i.test(id)) {
    themeLoad[id] = 'loading';
    const el = document.createElement('script');
    el.src = `https://themes.glucose/${id}.js`;
    el.onerror = () => { themeLoad[id] = 'failed'; console.warn('theme file missing:', id); render(); };
    document.head.appendChild(el);
  }
  return 'classic';
}

// ---------- classic theme pieces ----------
function arrowSvg(trend) {
  if (!(trend in ANGLES)) return '';
  const one = (dx) => `<g transform="translate(${dx} 0) rotate(${ANGLES[trend]} 14 14)"><path d="M5 14H22M15 7l7 7-7 7"/></g>`;
  return trend.startsWith('Double') ? one(-6) + one(6) : one(0);
}

function drawSpark(s) {
  const c = $('spark');
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth; const h = c.clientHeight;
  if (!w || !h) return;
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.clearRect(0, 0, w, h);
  const now = Date.now(); const span = 3 * 3600000;
  const pts = (s.history || []).filter((p) => now - p.time <= span);
  const vals = pts.map((p) => p.value);
  const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
  const x = (t) => w - ((now - t) / span) * w;
  const y = (v) => h - ((v - lo) / (hi - lo)) * h;
  const pal = COLORS;
  g.globalAlpha = 0.13;
  g.fillStyle = pal.ok;
  g.fillRect(0, y(s.settings.high), w, y(s.settings.low) - y(s.settings.high));
  g.globalAlpha = 1;
  for (const p of pts) {
    g.fillStyle = p.value < s.settings.low ? pal.low : p.value > s.settings.high ? pal.high : pal.ok;
    g.beginPath(); g.arc(x(p.time), y(p.value), 1.8, 0, Math.PI * 2); g.fill();
  }
}

// ---------- shared ----------
function drawTray(text, color) {
  const key = text + color;
  if (key === lastTrayKey) return;
  lastTrayKey = key;
  const c = document.createElement('canvas');
  c.width = 32; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.beginPath(); g.roundRect(0, 0, 32, 32, 7); g.fill();
  g.fillStyle = '#10141b';
  g.font = `bold ${text.length >= 4 ? 12 : text.length === 3 ? 17 : 22}px "Segoe UI", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 16, 17);
  window.api.setTrayIcon(c.toDataURL('image/png'));
}

function render() {
  if (!state) return;
  const s = state; const r = s.reading; const now = Date.now();
  const theme = activeTheme(s.settings.theme);
  document.body.className = theme;
  const zone = COLORS[s.zone] ? s.zone : 'none';
  $('card').classList.remove('ok', 'high', 'low', 'stale', 'none');
  $('card').classList.add(zone);

  const text = r ? valueText(r.value) : '---';
  $('value').textContent = text;
  $('value').classList.toggle('word', text === 'LOW' || text === 'HIGH');
  const showArrow = r && zone !== 'stale';
  $('arrow').innerHTML = showArrow ? arrowSvg(r.trend) : '';

  const prev = r && (s.history || []).find((p) => p.time < r.time);
  const showDelta = prev && r.time - prev.time < 8 * 60000 && zone !== 'stale';
  const d = showDelta ? r.value - prev.value : 0;
  $('delta').textContent = showDelta ? (d > 0 ? '+' + d : d < 0 ? '−' + Math.abs(d) : '0') : '';

  const mins = r ? Math.max(0, Math.floor((now - r.time) / 60000)) : null;
  $('foot').textContent = r ? (mins < 1 ? 'Just now' : `${mins} min ago`) : ' ';

  const snoozed = now < s.snoozeUntil;
  let st = 'Dexcom'; let bad = false;
  if (s.status === 'setup') { st = 'Click the gear to log in'; bad = true; }
  else if (s.status === 'auth') { st = 'Login problem: open Settings'; bad = true; }
  else if (s.status === 'error') { st = 'No connection, retrying'; bad = true; }
  else if (zone === 'stale') { st = 'No new data'; bad = true; }
  else if (s.status === 'loading') st = 'Connecting…';
  else if (s.message) st = s.message;
  else if (zone === 'low') st = 'LOW';
  else if (zone === 'high') st = 'HIGH';
  else if (zone === 'ok') st = 'In range';
  if (snoozed) st = 'Snoozed until ' + new Date(s.snoozeUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('status').textContent = st;
  $('status').classList.toggle('bad', bad && !snoozed);
  $('status').title = s.message || '';
  $('snooze').classList.toggle('on', snoozed);
  $('snooze').title = snoozed ? 'Turn alerts back on' : `Snooze alerts for ${s.settings.snoozeMin} min`;
  if (zone === 'ok' || snoozed) $('card').classList.remove('alarm');

  lastCtx = { s, r, zone, text, showArrow, mins, snoozed, st, bad };
  const def = THEMES[theme];
  if (def && def.render) {
    try { def.render(lastCtx); } catch (e) { console.error('theme', theme, e); }
  } else {
    drawSpark(s);
  }
  drawTray(r && zone !== 'stale' ? (text === 'HIGH' ? 'HI' : text === 'LOW' ? 'LO' : text) : '--', COLORS[zone]);
}

$('min').onclick = () => window.api.action('minimize');
$('gear').onclick = () => window.api.action('settings');
$('snooze').onclick = () => window.api.action('snooze');
window.addEventListener('contextmenu', (e) => { e.preventDefault(); window.api.action('menu'); });

window.api.onState((s) => { state = s; render(); });
window.api.onAlert((a) => {
  playAlert(a.type, state ? state.settings.volume : 0.8);
  const card = $('card');
  card.classList.remove('alarm');
  void card.offsetWidth; // restart the animation
  card.classList.add('alarm');
});
window.api.getState().then((s) => { state = s; render(); });
setInterval(render, 10000);
setInterval(() => {
  const def = state && THEMES[activeTheme(state.settings.theme)];
  if (def && def.tick && lastCtx) { try { def.tick(lastCtx); } catch (e) { console.error(e); } }
}, 1000);
