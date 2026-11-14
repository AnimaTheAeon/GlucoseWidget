// @theme {"id": "neon", "name": "Night City HUD", "width": 300, "height": 180}
// Glucose Widget theme: "Night City HUD". Delete this file to remove the theme; put it back to restore it.
(function () {
  const PAL = { ok: '#5ef6ff', high: '#fcee0a', low: '#ff3b3b', stale: '#8a6a6e' };
  function drawCpSpark(s) {
    const c = $('cpSpark');
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth; const h = c.clientHeight;
    if (!w || !h) return;
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const now = Date.now(); const span = 3 * 3600000;
    const pts = (s.history || []).filter((p) => now - p.time <= span).sort((a, b) => a.time - b.time);
    const vals = pts.map((p) => p.value);
    const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
    const x = (t) => w - ((now - t) / span) * w;
    const y = (v) => h - 1 - ((v - lo) / (hi - lo)) * (h - 2);
    g.strokeStyle = 'rgba(255,70,70,.18)'; g.lineWidth = 1;
    for (let gx = w; gx > 0; gx -= w / 6) { g.beginPath(); g.moveTo(Math.round(gx) - 0.5, 0); g.lineTo(Math.round(gx) - 0.5, h); g.stroke(); }
    g.fillStyle = 'rgba(94,246,255,.07)';
    g.fillRect(0, y(s.settings.high), w, y(s.settings.low) - y(s.settings.high));
    const pal = PAL;
    g.lineWidth = 1.3;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]; const b = pts[i];
      if (b.time - a.time > 16 * 60000) continue;
      g.strokeStyle = b.value < s.settings.low ? pal.low : b.value > s.settings.high ? pal.high : pal.ok;
      g.beginPath(); g.moveTo(x(a.time), y(a.value)); g.lineTo(x(b.time), y(b.value)); g.stroke();
    }
  }

  GlucoseWidget.registerTheme({
    id: 'neon',
    palette: {"ok": "#5ef6ff", "high": "#fcee0a", "low": "#ff3b3b", "stale": "#8a6a6e"},
    css: String.raw`
  /* ---- Neon city theme (red HUD menu, cyan selection) ---- */
  #cp { display: none; }
  body.neon #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.neon #card > *:not(#cp):not(#top) { display: none; }
  body.neon #card.alarm { animation: none; }
  body.neon #top { position: absolute; right: 8px; top: 7px; height: 16px; z-index: 3; }
  body.neon #status { display: none; }
  body.neon .btns { gap: 3px; }
  body.neon button { width: 18px; height: 16px; border-radius: 0; border: 1px solid #6a1d22; color: #ff5b4f;
    background: rgba(40,6,10,.6); font-size: 11px; }
  body.neon button:hover { border-color: #5ef6ff; color: #5ef6ff; background: rgba(94,246,255,.08); }
  body.neon button.on { color: #fcee0a; border-color: #fcee0a; }
  body.neon #cp { display: block; position: absolute; inset: 0; overflow: hidden; color: #ff5b4f;
    font-family: Bahnschrift, "Arial Narrow", "Liberation Sans Narrow", "Roboto Condensed", sans-serif; font-stretch: 75%;
    background:
      repeating-linear-gradient(0deg, rgba(255,70,70,.035) 0 1px, transparent 1px 3px),
      linear-gradient(90deg, transparent 0 49%, rgba(255,60,60,.05) 49% 50%, transparent 50%) 0 0 / 22px 22px,
      radial-gradient(ellipse at 85% 30%, #3a0c12 0%, #160509 55%, #0b0306 100%);
    border: 1px solid #4a1217; }
  #cp .cp-corner { position: absolute; width: 8px; height: 8px; border-color: #5ef6ff; border-style: solid; opacity: .8; }
  #cp .tl { left: 2px; top: 2px; border-width: 1px 0 0 1px; } #cp .br { right: 2px; bottom: 2px; border-width: 0 1px 1px 0; }
  #cp .cp-hud { position: absolute; left: 12px; top: 8px; font-size: 9px; letter-spacing: 2px; color: #a8343a; }
  #cp .cp-line { position: absolute; left: 12px; right: 8px; top: 27px; height: 1px; background: linear-gradient(90deg, #7a1e24, #3a0c12 70%, transparent); }
  #cp .cp-line::after { content: ""; position: absolute; right: 60px; top: -2px; width: 24px; height: 5px; border: 1px solid #5a161b; border-top: 0; }
  #cp .cp-panel { position: absolute; left: 8px; top: 34px; bottom: 26px; width: 98px; padding: 6px 6px;
    background: linear-gradient(90deg, rgba(120,22,28,.42), rgba(70,12,18,.18)); border-right: 1px solid #7a1e24; }
  #cp .cp-item { position: relative; height: 18px; line-height: 16px; padding: 0 6px; margin-bottom: 3px;
    font-size: 11px; letter-spacing: 1px; color: #ff5b4f; border: 1px solid transparent; white-space: nowrap; }
  #cp .cp-item.sel { color: var(--zc); border-color: var(--zc); background: color-mix(in srgb, var(--zc) 9%, transparent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--zc) 35%, transparent); }
  #cp .cp-item.sel::after { content: ""; position: absolute; right: 4px; top: 5px; width: 6px; height: 6px; background: var(--zc); }
  #cp .cp-main { position: absolute; left: 116px; right: 10px; top: 30px; }
  #cp .cp-num { display: flex; align-items: center; gap: 6px; height: 62px; }
  #cp #cpVal { font-size: 62px; font-weight: 300; line-height: 1; color: var(--zc); letter-spacing: 1px;
    text-shadow: 0 0 10px color-mix(in srgb, var(--zc) 55%, transparent); }
  #cp #cpVal.word { font-size: 46px; letter-spacing: 3px; }
  #cp #cpArrow { width: 26px; height: 26px; color: var(--zc); }
  #cp .cp-sub { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 1.5px; color: #c8434a; margin-top: -2px; }
  #cp #cpDelta { color: #ffd0cc; letter-spacing: .5px; }
  #cp #cpSpark { display: block; width: 100%; height: 52px; margin-top: 6px; }
  #cp .cp-status { position: absolute; left: 12px; bottom: 8px; font-size: 9px; letter-spacing: 1.5px; color: #a8343a; max-width: 150px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #cp .cp-status.bad { color: #fcee0a; }
  #cp .cp-reward { position: absolute; right: 8px; bottom: 6px; display: flex; align-items: center; gap: 5px; height: 14px; padding-right: 6px;
    border: 1px solid #5ef6ff88; font-size: 9px; letter-spacing: 1.2px; color: #9fe9ef; background: rgba(94,246,255,.05); }
  #cp .cp-idx { width: 12px; height: 12px; border-right: 1px solid #5ef6ff88; text-align: center; line-height: 12px; color: #5ef6ff; }
  #cp .ok { --zc: #5ef6ff; } #cp .high { --zc: #fcee0a; } #cp .low { --zc: #ff3b3b; } #cp .stale { --zc: #8a6a6e; }
  body.neon #card.alarm #cpVal { animation: glitch .9s steps(2) 25; }
  body.neon #card.alarm .cp-panel { animation: cpflash .8s ease-in-out 30; }
  @keyframes glitch {
    0% { transform: translate(0); text-shadow: 2px 0 #ff3b3b, -2px 0 #5ef6ff; }
    25% { transform: translate(-2px, 1px); text-shadow: -3px 0 #ff3b3b, 3px 0 #5ef6ff; }
    50% { transform: translate(2px, -1px); clip-path: inset(10% 0 35% 0); }
    75% { transform: translate(-1px, 0); text-shadow: 3px 0 #fcee0a, -2px 0 #5ef6ff; }
    100% { transform: translate(0); } }
  @keyframes cpflash { 50% { background: linear-gradient(90deg, color-mix(in srgb, var(--fc, #ff3b3b) 45%, transparent), rgba(70,12,18,.18)); } }

  /* frame */
  body.neon #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30;
    border: 1px solid rgba(255,70,70,.55);
    background:
      linear-gradient(#5ef6ff, #5ef6ff) left 3px top 3px / 14px 2px no-repeat, linear-gradient(#5ef6ff, #5ef6ff) left 3px top 3px / 2px 14px no-repeat,
      linear-gradient(#5ef6ff, #5ef6ff) right 3px bottom 3px / 14px 2px no-repeat, linear-gradient(#5ef6ff, #5ef6ff) right 3px bottom 3px / 2px 14px no-repeat,
      linear-gradient(#ff3b3b, #ff3b3b) right 3px top 3px / 6px 2px no-repeat, linear-gradient(#ff3b3b, #ff3b3b) left 3px bottom 3px / 6px 2px no-repeat; }
`,
    html: String.raw`
  <div id="cp">
    <span class="cp-corner tl"></span><span class="cp-corner br"></span>
    <div class="cp-hud">GLU//MON &nbsp;·&nbsp; MG/DL</div>
    <div class="cp-line"></div>
    <div class="cp-panel" id="cpPanel">
      <div class="cp-item ok" data-z="ok">IN RANGE</div>
      <div class="cp-item high" data-z="high">HIGH</div>
      <div class="cp-item low" data-z="low">LOW</div>
      <div class="cp-item stale" data-z="stale">NO SIGNAL</div>
    </div>
    <div class="cp-main" id="cpMain">
      <div class="cp-num"><span id="cpVal">---</span><svg id="cpArrow" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"></svg></div>
      <div class="cp-sub"><span>MG/DL</span><span id="cpDelta"></span></div>
      <canvas id="cpSpark"></canvas>
    </div>
    <div class="cp-status" id="cpStatus"></div>
    <div class="cp-reward"><span class="cp-idx">5</span><span id="cpAgo">--</span></div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;

      const cz = zone === 'none' ? 'stale' : zone;
      for (const it of document.querySelectorAll('#cp .cp-item')) it.classList.toggle('sel', it.dataset.z === cz);
      for (const id of ['cpMain', 'cpPanel']) { $(id).className = id === 'cpMain' ? 'cp-main ' + cz : 'cp-panel ' + cz; }
      $('cpPanel').style.setProperty('--fc', PAL[cz]);
      $('cpVal').textContent = text;
      $('cpVal').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('cpArrow').innerHTML = showArrow && r.trend in ANGLES
        ? (r.trend.startsWith('Double') ? [-6, 6] : [0]).map((dx) => `<g transform="translate(${dx} 0) rotate(${ANGLES[r.trend]} 14 14)"><path d="M4 14H23M16 7l7 7-7 7"/></g>`).join('')
        : '';
      $('cpDelta').textContent = $('delta').textContent ? 'Δ ' + $('delta').textContent : '';
      $('cpAgo').textContent = r ? (mins < 1 ? 'SYNC: JUST NOW' : `SYNC: ${mins} MIN AGO`) : 'SYNC: --';
      const msg = snoozed || bad || s.status !== 'ok' ? st : '';
      $('cpStatus').textContent = msg ? '> ' + msg.toUpperCase() : '';
      $('cpStatus').classList.toggle('bad', bad && !snoozed);
      drawCpSpark(s);
    },
  });
}());
