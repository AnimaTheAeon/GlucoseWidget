// @theme {"id": "og", "name": "Green Orb", "width": 300, "height": 180}
// Glucose Widget theme: "Green Orb". Delete this file to remove the theme; put it back to restore it.
(function () {
  // Green orb theme: the glowing tube along the bottom is the real 3-hour glucose line.
  function drawOgGraph(s) {
    const now = Date.now(); const span = 3 * 3600000;
    const pts = (s.history || []).filter((p) => now - p.time <= span).sort((a, b) => a.time - b.time);
    const vals = pts.map((p) => p.value);
    const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
    const X = (t) => ((t - (now - span)) / span) * 300;
    const Y = (v) => 172 - ((v - lo) / (hi - lo)) * 36;
    let d;
    let tip = null;
    if (pts.length >= 2) {
      const P = pts.map((p) => [X(p.time), Y(p.value)]);
      d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
      for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)]; const p1 = P[i]; const p2 = P[i + 1]; const p3 = P[Math.min(P.length - 1, i + 2)];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      tip = P[P.length - 1];
    } else {
      d = 'M-10,166 C60,140 90,176 150,158 S240,120 310,126'; // no data yet: just a decorative tube
    }
    for (const id of ['ogG1', 'ogG2', 'ogG3', 'ogG4']) $(id).setAttribute('d', d);
    for (const [id, v] of [['ogHi', s.settings.high], ['ogLo', s.settings.low]]) { $(id).setAttribute('y1', Y(v)); $(id).setAttribute('y2', Y(v)); }
    $('ogLevels').style.display = pts.length >= 2 ? '' : 'none';
    for (const id of ['ogTip', 'ogTipGlow']) {
      $(id).style.display = tip ? '' : 'none';
      if (tip) { $(id).setAttribute('cx', tip[0]); $(id).setAttribute('cy', tip[1]); }
    }
  }

  GlucoseWidget.registerTheme({
    id: 'og',
    palette: {"ok": "#9be33a", "high": "#ffc23a", "low": "#ff5a3a", "stale": "#a5a8a0"},
    css: String.raw`
  /* ---- Green orb theme (original console dashboard look) ---- */
  #ogx { display: none; }
  body.og #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.og #card > *:not(#ogx):not(#top) { display: none; }
  body.og #card.alarm { animation: none; }
  body.og #top { position: absolute; right: 8px; top: 5px; height: 15px; z-index: 5; }
  body.og #status { display: none; }
  body.og .btns { gap: 5px; }
  body.og button { width: 15px; height: 15px; border-radius: 50%; font-size: 0; position: relative;
    background: radial-gradient(circle at 40% 35%, #cfff8a, #5aa618 60%, #1e4a08); box-shadow: 0 0 5px rgba(160,255,80,.5); }
  body.og button::before { position: absolute; inset: 0; font: 700 9px/15px "Segoe UI", sans-serif; color: #0b1d04; text-align: center; }
  body.og #snooze::before { content: "z"; } body.og #gear::before { content: "s"; } body.og #min::before { content: "\2013"; }
  body.og button:hover { filter: brightness(1.25); background: radial-gradient(circle at 40% 35%, #cfff8a, #5aa618 60%, #1e4a08); }
  body.og button.on { background: radial-gradient(circle at 40% 35%, #fff0b0, #ffc23a 60%, #8a5a08); }
  #ogx { position: absolute; inset: 0; overflow: hidden; border-radius: 10px; border: 1px solid #1d3a10;
    font-family: "Segoe UI", system-ui, sans-serif;
    background: radial-gradient(ellipse at 22% 45%, #18330a 0%, #0a1606 45%, #030602 100%); }
  body.og #ogx { display: block; }
  #ogx .tex { position: absolute; inset: 0; opacity: .35; background:
    repeating-linear-gradient(60deg, rgba(120,200,60,.05) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(-60deg, rgba(120,200,60,.05) 0 1px, transparent 1px 7px); }
  #ogx .art { position: absolute; inset: 0; }
  #ogx.high .art { filter: hue-rotate(-52deg) saturate(1.3); }
  #ogx.low .art { filter: hue-rotate(-92deg) saturate(1.5); }
  #ogx.stale .art { filter: grayscale(.85) brightness(.75); }
  #ogx svg.tubes { position: absolute; inset: 0; width: 300px; height: 180px; }
  #ogx .ring { position: absolute; left: 6px; top: 12px; width: 120px; height: 120px; border-radius: 50%;
    border: 2px solid rgba(160,255,80,.35); box-shadow: inset 0 0 14px rgba(160,255,80,.3), 0 0 10px rgba(160,255,80,.25); }
  #ogx .orb { position: absolute; left: 14px; top: 20px; width: 104px; height: 104px; border-radius: 50%;
    background: radial-gradient(circle at 42% 38%, #f2ffc0 0%, #b8ff3c 14%, #5fc016 34%, #2a6a0a 58%, rgba(20,60,5,0) 72%);
    animation: breathe 7s ease-in-out infinite; }
  @keyframes breathe { 0%,100% { box-shadow: 0 0 22px 4px rgba(120,230,40,.28); } 50% { box-shadow: 0 0 34px 10px rgba(140,240,60,.45); } }
  #ogx .bub { position: absolute; left: 98px; top: 16px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
    background: radial-gradient(circle at 40% 35%, #eaffb0, #7ad62a 60%, #2f6e0c); box-shadow: 0 0 8px rgba(160,255,80,.6); }
  #ogx .bub svg { width: 16px; height: 16px; }
  #ogx .num { position: absolute; left: 14px; top: 40px; width: 104px; text-align: center; font-weight: 700; font-size: 46px; line-height: 1;
    letter-spacing: -1px; color: #0e2205; text-shadow: 0 1px 0 rgba(255,255,255,.5), 0 0 12px rgba(240,255,190,.8); }
  #ogx .num.word { font-size: 30px; }
  #ogx .unit { position: absolute; left: 14px; top: 88px; width: 104px; text-align: center; font-size: 11px; font-weight: 600; color: #183a08; letter-spacing: .5px; }
  #ogx .ttl { position: absolute; left: 160px; top: 6px; font-size: 10px; color: #6fae36; letter-spacing: .6px; font-weight: 600;
    max-width: 76px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #ogx .ttl.bad { color: #ffc23a; }
  #ogx .menu { position: absolute; right: 12px; top: 26px; width: 128px; }
  #ogx .it { height: 21px; margin-bottom: 5px; border-radius: 11px; padding: 0 12px; line-height: 20px; font-size: 12px; font-weight: 600;
    color: #8fd04a; background: linear-gradient(#173a09, #0c2105); border: 1px solid #2f6512; letter-spacing: .3px; }
  #ogx .it.sel { color: #0b1d04; background: linear-gradient(#e6ff9a, #9be33a 55%, #5aa618); border-color: #d6ff7a; box-shadow: 0 0 10px rgba(170,255,70,.6); }
  #ogx.high .it.sel { background: linear-gradient(#fff0b0, #ffc23a 55%, #d88a10); border-color: #ffe08a; box-shadow: 0 0 10px rgba(255,190,60,.6); }
  #ogx.low .it.sel { background: linear-gradient(#ffc4b0, #ff5a3a 55%, #c0200e); border-color: #ff9a80; box-shadow: 0 0 10px rgba(255,80,50,.6); color: #2a0400; }
  #ogx.stale .it.sel { background: linear-gradient(#e6e6e0, #a5a8a0 55%, #6e716a); border-color: #cfd2ca; box-shadow: none; }
  #ogx .pulse { animation: flow 7s linear infinite; }
  #ogx .pulse.p2 { animation-delay: -3.5s; }
  #ogx .pulse.slow { animation-duration: 12s; }
  @keyframes flow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
  #ogx .tip { animation: tip 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes tip { 50% { transform: scale(1.6); opacity: .6; } }
  body.og #card.alarm .orb { animation: alarmorb .6s ease-in-out 40; }
  body.og #card.alarm .it.sel { animation: alarmorb .6s ease-in-out 40; }
  @keyframes alarmorb { 50% { filter: brightness(1.6); box-shadow: 0 0 40px 14px rgba(255,255,200,.55); } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.og button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 9px; height: 9px;
    background: #0b1d04; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.og #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.og #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #3a2000; }
  body.og #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.og #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }
`,
    html: String.raw`
  <div id="ogx" class="stale">
    <div class="tex"></div>
    <div class="art">
      <svg class="tubes" viewBox="0 0 300 180">
        <defs>
          <linearGradient id="ogtg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f8f12" stop-opacity=".15"/><stop offset=".5" stop-color="#9eff3a"/><stop offset="1" stop-color="#3f8f12" stop-opacity=".2"/></linearGradient>
          <filter id="ogglow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <filter id="ogglow2" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter>
        </defs>
        <g id="ogDeco">
          <path d="M138,-10 C168,30 150,60 200,70 S290,80 310,118" stroke="url(#ogtg)" stroke-width="5" fill="none" filter="url(#ogglow)" opacity=".45"/>
          <path d="M138,-10 C168,30 150,60 200,70 S290,80 310,118" stroke="#e8ffb0" stroke-width="2.5" fill="none" pathLength="100" stroke-dasharray="7 93" class="pulse slow" filter="url(#ogglow2)" opacity=".7"/>
        </g>
        <g id="ogLevels" stroke="#9eff3a" stroke-opacity=".16" stroke-width="1" stroke-dasharray="2 4"><line id="ogHi" x1="0" x2="300"/><line id="ogLo" x1="0" x2="300"/></g>
        <path id="ogG1" stroke="url(#ogtg)" stroke-width="9" fill="none" filter="url(#ogglow)" opacity=".7"/>
        <path id="ogG2" stroke="#c8ff7a" stroke-width="1.7" fill="none" opacity=".75"/>
        <path id="ogG3" stroke="#f4ffd0" stroke-width="3" fill="none" pathLength="100" stroke-dasharray="9 91" class="pulse" filter="url(#ogglow2)"/>
        <path id="ogG4" stroke="#f4ffd0" stroke-width="3" fill="none" pathLength="100" stroke-dasharray="9 91" class="pulse p2" filter="url(#ogglow2)"/>
        <circle id="ogTipGlow" r="5" fill="#b8ff3c" opacity=".5" filter="url(#ogglow)"/>
        <circle id="ogTip" r="2.4" fill="#f4ffd0" class="tip"/>
      </svg>
      <div class="ring"></div><div class="orb"></div>
      <div class="bub"><svg id="ogArrow" viewBox="0 0 28 28" fill="none" stroke="#0e2205" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    </div>
    <div class="num" id="ogVal">---</div><div class="unit" id="ogUnit">mg/dL</div>
    <div class="ttl" id="ogTtl">glucose</div>
    <div class="menu">
      <div class="it" data-z="ok">in range</div><div class="it" data-z="high">high</div>
      <div class="it" data-z="low">low</div><div class="it" data-z="stale">no signal</div>
    </div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;

      const oz = zone === 'none' ? 'stale' : zone;
      $('ogx').className = oz;
      for (const it of document.querySelectorAll('#ogx .it')) it.classList.toggle('sel', it.dataset.z === oz);
      $('ogVal').textContent = text;
      $('ogVal').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('ogArrow').innerHTML = showArrow ? arrowSvg(r.trend) : '';
      $('ogArrow').parentElement.style.visibility = showArrow && r.trend in ANGLES ? 'visible' : 'hidden';
      $('ogUnit').textContent = 'mg/dL' + ($('delta').textContent ? ' ' + $('delta').textContent : '');
      const msg = snoozed || bad || (s.status !== 'ok' && zone !== 'stale');
      $('ogTtl').textContent = msg ? st.toLowerCase() : (r ? (mins < 1 ? 'just now' : `${mins} min ago`) : 'glucose');
      $('ogTtl').classList.toggle('bad', bad && !snoozed);
      drawOgGraph(s);
    },
  });
}());
