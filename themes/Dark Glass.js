// @theme {"id": "glass", "name": "Dark Glass", "width": 300, "height": 180}
// Glucose Widget theme: "Dark Glass". Delete this file to remove the theme; put it back to restore it.
(function () {
  // Dark Glass theme: smooth white line with a soft fill.
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
  /* ---- Dark Glass theme ---- */
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
      linear-gradient(160deg, rgba(22,24,30,max(.8, calc(.94 * var(--ga, 1)))), rgba(8,9,12,max(.86, calc(.96 * var(--ga, 1)))));
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.42), inset 0 -1px 0 rgba(255,255,255,.10), inset 1px 0 0 rgba(255,255,255,.16),
      inset -1px 0 0 rgba(255,255,255,.08), inset 0 0 24px rgba(255,255,255,.05), 0 0 0 .5px rgba(0,0,0,.6), 0 3px 6px rgba(0,0,0,.35); }
  #lg::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
    background: linear-gradient(170deg, rgba(255,255,255,.13), transparent 32%); }
  /* see-through mode: Windows blurs the desktop behind the window; the page lets it show */
  html.seethrough, html.seethrough body { background: transparent !important; }
  /* see-through stays dark mode: a dark smoky tint always sits under the glass, even on a bright desktop */
  html.seethrough #lg { text-shadow: 0 1px 3px rgba(0,0,0,.55); }
  #lg #lgVal { text-shadow: none !important; } /* a shadow would paint over the gradient digits and grey them */
  html.seethrough #lg::before { background: linear-gradient(170deg, rgba(255,255,255,.10), transparent 32%); }
  #lg.ok { --lc: #30d158; } #lg.high { --lc: #ff9f0a; } #lg.low { --lc: #ff453a; } #lg.stale { --lc: #8e8e93; }
  #lg .top { position: relative; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  #lg .top .ago { font-weight: 500; color: rgba(255,255,255,.55); font-size: 11px; }
  #lg .top .ago.bad { color: #ffd27a; }
  #lg .row { position: relative; display: flex; align-items: flex-end; gap: 8px; margin-top: 3px; }
  #lg #lgVal { font-size: 58px; font-weight: 700; line-height: .95; letter-spacing: -2px;
    background: linear-gradient(180deg, #ffffff 0%, #dededf 55%, #a7a8ac); -webkit-background-clip: text; color: transparent; /* solid, so nothing shows through the digits */
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

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.glass button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 11px; height: 11px;
    background: rgba(255,255,255,.85); -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.glass #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.glass #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #ffd27a; }
  body.glass #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.glass #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }

  /* frame: a glass rim tinted by the zone colour */
  body.glass #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30; --fc: #30d158;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.22), inset 0 1.5px 0 rgba(255,255,255,.5), inset 0 0 0 2.5px color-mix(in srgb, var(--fc) 45%, transparent), inset 0 0 18px color-mix(in srgb, var(--fc) 20%, transparent); }
  body.glass #card:has(#lg.high)::after { --fc: #ff9f0a; }
  body.glass #card:has(#lg.low)::after { --fc: #ff453a; }
  body.glass #card:has(#lg.stale)::after { --fc: #8e8e93; }
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
