// @theme {"id": "glass", "name": "Liquid glass (dark)", "width": 300, "height": 180}
// Glucose Widget theme: "Liquid glass (dark)". Delete this file to remove the theme; put it back to restore it.
(function () {
  // Liquid glass theme: smooth white line with a soft fill.
  function drawLgChart(s) {
    const W = 264; const H = 30;
    const now = Date.now(); const span = 3 * 3600000;
    const pts = (s.history || []).filter((p) => now - p.time <= span).sort((a, b) => a.time - b.time);
    const vals = pts.map((p) => p.value);
    const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
    const X = (t) => ((t - (now - span)) / span) * W;
    const Y = (v) => H - 3 - ((v - lo) / (hi - lo)) * (H - 6);
    $('lgBand').setAttribute('y', Y(s.settings.high));
    $('lgBand').setAttribute('height', Math.max(0, Y(s.settings.low) - Y(s.settings.high)));
    const dot = $('lgDotWrap');
    if (pts.length < 2) { $('lgLine').setAttribute('d', ''); $('lgArea').setAttribute('d', ''); dot.style.display = 'none'; return; }
    const P = pts.map((p) => [X(p.time), Y(p.value)]);
    let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)]; const p1 = P[i]; const p2 = P[i + 1]; const p3 = P[Math.min(P.length - 1, i + 2)];
      d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const last = P[P.length - 1];
    $('lgLine').setAttribute('d', d);
    $('lgArea').setAttribute('d', `${d} L${last[0].toFixed(1)},${H} L${P[0][0].toFixed(1)},${H} Z`);
    // dot as HTML so it stays round even though the chart stretches
    const svg = $('lgChart').getBoundingClientRect(); const box = $('lg').getBoundingClientRect();
    dot.style.display = '';
    dot.style.left = (svg.left - box.left + (last[0] / W) * svg.width - 4) + 'px';
    dot.style.top = (svg.top - box.top + (last[1] / H) * svg.height - 4) + 'px';
  }

  GlucoseWidget.registerTheme({
    id: 'glass',
    palette: {"ok": "#30d158", "high": "#ff9f0a", "low": "#ff453a", "stale": "#8e8e93"},
    css: String.raw`
  /* ---- Liquid glass theme (dark) ---- */
  #lg { display: none; }
  body.glass #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.glass #card > *:not(#lg):not(#top) { display: none; }
  body.glass #card.alarm { animation: none; }
  body.glass #top { position: absolute; right: 18px; top: 15px; height: 20px; z-index: 5; }
  body.glass #status { display: none; }
  body.glass .btns { gap: 6px; }
  body.glass button { width: 20px; height: 20px; border-radius: 50%; font-size: 0; position: relative;
    background: linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,.04));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 0 .5px rgba(255,255,255,.25); }
  body.glass button::before { position: absolute; inset: 0; font: 600 10px/20px "Segoe UI", sans-serif; color: rgba(255,255,255,.85); text-align: center; }
  body.glass #snooze::before { content: "z"; } body.glass #gear::before { content: "\2699\FE0E"; font-size: 11px; } body.glass #min::before { content: "\2013"; }
  body.glass button:hover { background: linear-gradient(rgba(255,255,255,.3), rgba(255,255,255,.1)); }
  body.glass button.on { box-shadow: inset 0 1px 0 rgba(255,255,255,.45), inset 0 0 0 1px var(--lc); }
  body.glass #lg { display: block; }
  #lg { position: absolute; inset: 6px; border-radius: 30px; overflow: hidden; padding: 13px 18px; color: #fff;
    font-family: "Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif;
    background:
      radial-gradient(ellipse at 12% -10%, color-mix(in srgb, var(--lc) 34%, transparent), transparent 58%),
      radial-gradient(ellipse at 105% 110%, color-mix(in srgb, var(--lc) 22%, transparent), transparent 55%),
      radial-gradient(ellipse at 60% 40%, rgba(120,130,170,.10), transparent 70%),
      linear-gradient(160deg, rgba(38,40,48,.94), rgba(16,17,22,.95));
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.42), inset 0 -1px 0 rgba(255,255,255,.10), inset 1px 0 0 rgba(255,255,255,.16),
      inset -1px 0 0 rgba(255,255,255,.08), inset 0 0 24px rgba(255,255,255,.05), 0 0 0 .5px rgba(0,0,0,.6), 0 3px 6px rgba(0,0,0,.35); }
  #lg::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: linear-gradient(170deg, rgba(255,255,255,.13), transparent 32%); }
  #lg.ok { --lc: #30d158; } #lg.high { --lc: #ff9f0a; } #lg.low { --lc: #ff453a; } #lg.stale { --lc: #8e8e93; }
  #lg .top { position: relative; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  #lg .top .ago { font-weight: 500; color: rgba(255,255,255,.55); font-size: 11px; }
  #lg .top .ago.bad { color: #ffd27a; }
  #lg .row { position: relative; display: flex; align-items: flex-end; gap: 8px; margin-top: 3px; }
  #lg #lgVal { font-size: 58px; font-weight: 700; line-height: .95; letter-spacing: -2px;
    background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,.86) 55%, rgba(255,255,255,.6)); -webkit-background-clip: text; color: transparent;
    filter: drop-shadow(0 1px 0 rgba(255,255,255,.35)) drop-shadow(0 2px 8px rgba(0,0,0,.4)); }
  #lg #lgVal.word { font-size: 40px; }
  #lg .side { margin-bottom: 6px; font-size: 11px; line-height: 1.3; color: rgba(255,255,255,.65); }
  #lg .side b { display: block; font-size: 13px; color: #fff; }
  .lgglass { background: linear-gradient(rgba(255,255,255,.18), rgba(255,255,255,.04));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.55), inset 0 0 0 .5px rgba(255,255,255,.3), 0 2px 8px rgba(0,0,0,.3); }
  #lg .pill { position: absolute; right: 18px; top: 46px; height: 22px; padding: 0 10px; border-radius: 11px; font-size: 11.5px; font-weight: 700; line-height: 22px; }
  #lg .pill i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--lc); margin-right: 5px; box-shadow: 0 0 7px var(--lc); }
  #lg .ar { position: absolute; right: 18px; top: 74px; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; }
  #lg .ar svg { width: 17px; height: 17px; }
  #lg svg.ch { position: absolute; left: 18px; right: 18px; bottom: 13px; width: calc(100% - 36px); height: 36px; }
  body.glass #card.alarm #lg { animation: lgpulse .8s ease-in-out 30; }
  @keyframes lgpulse { 50% { box-shadow: inset 0 1.5px 0 rgba(255,255,255,.42), inset 0 0 40px color-mix(in srgb, var(--lc) 70%, transparent), 0 0 0 .5px rgba(0,0,0,.6); } }
`,
    html: String.raw`
  <div id="lg" class="stale">
    <div class="top"><svg width="10" height="13" viewBox="0 0 10 13"><path d="M5 0C5 0 0 6 0 8.5a5 5 0 0 0 10 0C10 6 5 0 5 0z" fill="#ff5a6a"/></svg>Glucose<span class="ago" id="lgAgo"></span></div>
    <div class="row"><span id="lgVal">---</span><div class="side"><b id="lgDelta">&nbsp;</b>mg/dL</div></div>
    <div class="pill lgglass"><i></i><span id="lgZone">No Signal</span></div>
    <div class="ar lgglass" id="lgArWrap"><svg id="lgArrow" viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    <svg class="ch" id="lgChart" viewBox="0 0 264 30" preserveAspectRatio="none">
      <defs><linearGradient id="lgFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect id="lgBand" x="0" width="264" rx="3" fill="#fff" opacity=".07"/>
      <path id="lgArea" fill="url(#lgFill)"/><path id="lgLine" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>
    <div id="lgDotWrap" style="position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 6px rgba(255,255,255,.7);display:none"></div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;

      const gz = zone === 'none' ? 'stale' : zone;
      $('lg').className = gz;
      $('lgVal').textContent = text;
      $('lgVal').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('lgDelta').innerHTML = $('delta').textContent || '&nbsp;';
      $('lgZone').textContent = { ok: 'In Range', high: 'High', low: 'Low', stale: 'No Signal' }[gz];
      const ok = showArrow && r.trend in ANGLES;
      $('lgArWrap').style.display = ok ? '' : 'none';
      $('lgArrow').innerHTML = ok ? arrowSvg(r.trend) : '';
      const msg = snoozed || bad || (s.status !== 'ok' && zone !== 'stale');
      $('lgAgo').textContent = msg ? '\u00b7 ' + st : (r ? '\u00b7 ' + (mins < 1 ? 'just now' : `${mins} min ago`) : '');
      $('lgAgo').classList.toggle('bad', bad && !snoozed);
      drawLgChart(s);
    },
  });
}());
