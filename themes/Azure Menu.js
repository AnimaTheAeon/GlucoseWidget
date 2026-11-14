// @theme {"id": "azure", "name": "Azure Menu", "width": 300, "height": 180}
// Glucose Widget theme: "Azure Menu". Delete this file to remove the theme; put it back to restore it.
// Blue gradient battle-menu look: a party-style status row, a charge gauge that fills until the
// next reading, and a turn-order list of recent readings down the right side.
(function () {
  const COL = { ok: '#ffffff', high: '#ffe36a', low: '#ff8a7a', stale: '#9fb0d8' };
  let lastList = '';

  function gauge(s) {
    // fills over the 5 minutes between readings
    const r = s.reading;
    if (!r) return 0;
    const f = (Date.now() - r.time) / (5 * 60000);
    return Math.max(0, Math.min(1, f));
  }

  function turnList(s, z) {
    const pts = (s.history || []).slice(0, 6);
    if (!pts.length) return '<div class="tn now"><span>--</span><b>---</b></div>';
    const now = Date.now();
    return pts.map((p, i) => {
      const zc = z === 'stale' ? 'stale' : p.value < s.settings.low ? 'low' : p.value > s.settings.high ? 'high' : 'ok';
      const m = Math.max(0, Math.round((now - p.time) / 60000));
      const when = i === 0 ? (m < 1 ? 'now' : `${m}m`) : `${m}m`;
      return `<div class="tn ${i === 0 ? 'now ' : ''}${zc}"><span>${when}</span><b>${Math.round(p.value)}</b></div>`;
    }).join('');
  }

  function draw(c) {
    const p = gauge(c.s);
    $('azGauge').style.width = `${(p * 100).toFixed(1)}%`;
    $('azGaugeWrap').classList.toggle('full', p >= 1);
  }

  GlucoseWidget.registerTheme({
    id: 'azure',
    palette: { ok: '#7fd0ff', high: '#ffd34a', low: '#ff6a5a', stale: '#9fb0d8' },
    css: String.raw`
  #az { display: none; }
  body.azure #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.azure #card > *:not(#az):not(#top) { display: none; }
  body.azure #card.alarm { animation: none; }
  body.azure #top { position: absolute; left: 14px; bottom: 12px; height: 16px; z-index: 5; }
  body.azure #status { display: none; }
  body.azure .btns { gap: 5px; }
  body.azure button { width: 16px; height: 16px; border-radius: 50%; font-size: 0; position: relative;
    background: radial-gradient(circle at 38% 32%, #e8f0ff, #6d8fe0 55%, #22357e); box-shadow: 0 0 0 1px #0a1238, 0 0 6px rgba(150,190,255,.5); }
  body.azure button::before { position: absolute; inset: 0; font: 700 8.5px/16px Georgia, serif; color: #0a1238; text-align: center; }
  body.azure #snooze::before { content: "Z"; } body.azure #gear::before { content: "S"; } body.azure #min::before { content: "\2013"; }
  body.azure button:hover { filter: brightness(1.25); }
  body.azure button.on { background: radial-gradient(circle at 38% 32%, #fff4c0, #ffc23a 55%, #8a5a08); }
  body.azure #az { display: block; }
  #az { position: absolute; inset: 0; overflow: hidden; color: #fff; font-family: "Segoe UI", "Trebuchet MS", sans-serif;
    background: linear-gradient(180deg, #5d77c4 0%, #2f4aa2 18%, #1a2f82 55%, #0e1a55 100%);
    box-shadow: inset 0 0 0 2px #c8d8ff, inset 0 0 0 3px #3a56b4, inset 0 0 0 4px #8aa4ee, inset 0 0 26px rgba(0,8,40,.55); }
  #az::before { content: ""; position: absolute; left: 4px; right: 4px; top: 4px; height: 44%; border-radius: 0 0 50% 50% / 0 0 18px 18px;
    background: linear-gradient(rgba(255,255,255,.16), rgba(255,255,255,0)); pointer-events: none; }
  #az .t { text-shadow: 1px 1px 0 #0a1238, -1px 0 0 #0a1238, 0 -1px 0 #0a1238, 1px 0 0 #0a1238, 0 0 4px rgba(10,18,56,.9); }
  #az.ok { --ac: #ffffff; } #az.high { --ac: #ffe36a; } #az.low { --ac: #ff8a7a; } #az.stale { --ac: #9fb0d8; }

  /* party-style status row */
  #az .name { position: absolute; left: 16px; top: 12px; font-size: 14px; font-weight: 600; letter-spacing: .5px; }
  #az .zone { position: absolute; left: 92px; top: 13px; font-size: 11px; font-style: italic; color: #cfe0ff; }
  #az .lbl { position: absolute; left: 16px; top: 44px; font-size: 13px; font-weight: 700; color: #ffe9a8; letter-spacing: 1px; }
  #az .num { position: absolute; left: 46px; top: 28px; font-size: 46px; font-weight: 600; line-height: 1; color: var(--ac); letter-spacing: 1px; }
  #az .num.word { font-size: 34px; top: 34px; }
  #az .ar { position: absolute; left: 150px; top: 40px; width: 22px; height: 22px; color: var(--ac); filter: drop-shadow(1px 1px 0 #0a1238); }
  #az .sub { position: absolute; left: 48px; top: 78px; font-size: 11px; color: #cfe0ff; }
  #az .msg { position: absolute; left: 16px; top: 128px; font-size: 11px; color: #ffe36a; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* charge gauge (fills until the next reading) */
  #az .glbl { position: absolute; left: 16px; top: 100px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: #ffcf8a; }
  #az .gauge { position: absolute; left: 76px; top: 102px; width: 104px; height: 8px; border-radius: 4px; background: #08103a;
    box-shadow: inset 0 0 0 1px #6f88d8, 0 0 0 1px #0a1238; overflow: hidden; }
  #az .gauge i { display: block; height: 100%; border-radius: 4px; background: linear-gradient(90deg, #ff6a1a, #ffb43a 60%, #ffe9a0); }
  #az .gauge.full i { animation: azfull 1s ease-in-out infinite; }
  @keyframes azfull { 50% { filter: brightness(1.5); } }

  /* turn-order list */
  #az .turns { position: absolute; right: 10px; top: 10px; width: 92px; }
  #az .tn { position: relative; height: 22px; margin-bottom: 4px; border-radius: 5px; padding: 0 8px 0 10px; display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; background: linear-gradient(90deg, rgba(20,34,110,.95), rgba(42,66,170,.85)); box-shadow: inset 0 0 0 1px #8aa4ee, 0 1px 2px rgba(0,0,0,.5); }
  #az .tn::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 5px 0 0 5px; background: #7fd0ff; }
  #az .tn.high::before { background: #ffd34a; } #az .tn.low::before { background: #ff6a5a; } #az .tn.stale::before { background: #7a86a8; }
  #az .tn span { color: #cfe0ff; font-style: italic; text-shadow: 1px 1px 0 #0a1238; }
  #az .tn b { font-size: 13px; text-shadow: 1px 1px 0 #0a1238; }
  #az .tn.now { height: 28px; margin-left: -10px; background: linear-gradient(90deg, #3a62d8, #6f94ff); box-shadow: inset 0 0 0 1px #e8f0ff, 0 0 8px rgba(150,190,255,.6); }
  #az .tn.now b { font-size: 16px; }
  #az .tn.now::after { content: ""; position: absolute; left: -10px; top: 8px; border-left: 8px solid #fff; border-top: 6px solid transparent; border-bottom: 6px solid transparent;
    filter: drop-shadow(1px 1px 0 #0a1238); animation: azptr 1s ease-in-out infinite; }
  @keyframes azptr { 50% { transform: translateX(-3px); } }
  body.azure #card.alarm #az .num { animation: azblink .6s steps(2) 40; }
  @keyframes azblink { 50% { opacity: .35; } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.azure button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 9px; height: 9px;
    background: #0a1238; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.azure #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.azure #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #3a2000; }
  body.azure #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.azure #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }
`,
    html: String.raw`
  <div id="az" class="stale">
    <div class="name t">Glucose</div><div class="zone t" id="azZone"></div>
    <div class="lbl t">BG</div><div class="num t" id="azNum">---</div>
    <div class="ar" id="azArrowWrap"><svg id="azArrow" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    <div class="sub t" id="azSub">mg/dL</div>
    <div class="glbl t">NEXT</div><div class="gauge" id="azGaugeWrap"><i id="azGauge"></i></div>
    <div class="msg t" id="azMsg"></div>
    <div class="turns" id="azTurns"></div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('az').className = z;
      $('azNum').textContent = text;
      $('azNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('azZone').textContent = { ok: 'In range', high: 'High', low: 'Low', stale: 'No signal' }[z];
      const showA = showArrow && r.trend in ANGLES;
      $('azArrowWrap').style.display = showA ? '' : 'none';
      $('azArrow').innerHTML = showA ? arrowSvg(r.trend) : '';
      const d = $('delta').textContent;
      $('azSub').textContent = 'mg/dL' + (d ? '  ' + d : '') + (r ? '  ·  ' + (mins < 1 ? 'just now' : `${mins} min ago`) : '');
      $('azMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st : '';
      const list = turnList(s, z);
      if (list !== lastList) { lastList = list; $('azTurns').innerHTML = list; }
      draw(c);
    },
    tick(c) { draw(c); },
  });
}());
