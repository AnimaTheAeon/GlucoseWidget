// @theme {"id": "shield", "name": "Shield HUD", "width": 300, "height": 180}
// Glucose Widget theme: "Shield HUD". Delete this file to remove the theme; put it back to restore it.
// Sci-fi helmet HUD: ammo-style counter (top left), shield bar (top right), motion tracker (bottom left).
(function () {
  const COL = { ok: '#6ec9ff', high: '#ffd34a', low: '#ff4a3a', stale: '#5f7380' };
  let lastBullets = '';
  let lastDots = '';

  function bullets(s, z) {
    // one bullet per reading in the last 3 hours (newest first), like an ammo counter
    const now = Date.now();
    const pts = (s.history || []).filter((p) => now - p.time <= 3 * 3600000).slice(0, 36);
    let html = '';
    for (let i = 0; i < 36; i++) {
      const p = pts[i];
      const zc = !p ? 'spent' : z === 'stale' ? 'stale' : p.value < s.settings.low ? 'low' : p.value > s.settings.high ? 'high' : 'ok';
      html += `<i class="${zc}"></i>`;
    }
    return html;
  }

  function dots(s, z) {
    if (z === 'stale') return '';
    const now = Date.now();
    const pts = (s.history || []).filter((p) => now - p.time <= 3 * 3600000).slice(0, 14);
    // newest at the top of the tracker, older readings sweep around; further out = higher glucose
    return pts.map((p, i) => {
      const a = (-90 + i * 24) * Math.PI / 180;
      const r = 8 + Math.min(32, Math.max(3, ((p.value - 40) / 360) * 32));
      const c = p.value < s.settings.low ? COL.low : p.value > s.settings.high ? COL.high : COL.ok;
      return `<b style="left:${43 + Math.cos(a) * r}px;top:${43 + Math.sin(a) * r}px;background:${c};color:${c};opacity:${(1 - i / 18).toFixed(2)}"></b>`;
    }).join('');
  }

  GlucoseWidget.registerTheme({
    id: 'shield',
    palette: { ok: COL.ok, high: COL.high, low: COL.low, stale: COL.stale },
    css: String.raw`
  #sh { display: none; }
  body.shield #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.shield #card > *:not(#sh):not(#top) { display: none; }
  body.shield #card.alarm { animation: none; }
  body.shield #top { position: absolute; right: 10px; top: 7px; height: 15px; z-index: 5; }
  body.shield #status { display: none; }
  body.shield .btns { gap: 4px; }
  body.shield button { width: 16px; height: 15px; border-radius: 0; font-size: 0; position: relative; background: rgba(110,201,255,.06);
    box-shadow: inset 0 0 0 1px rgba(110,201,255,.55); clip-path: polygon(20% 0, 100% 0, 80% 100%, 0 100%); }
  body.shield button::before { position: absolute; inset: 0; font: 600 9px/15px Bahnschrift, "Segoe UI", sans-serif; color: #9fdcff; text-align: center; }
  body.shield #snooze::before { content: "Z"; } body.shield #gear::before { content: "S"; } body.shield #min::before { content: "\2013"; }
  body.shield button:hover { background: rgba(110,201,255,.25); }
  body.shield button.on::before { color: #ffd34a; }
  body.shield #sh { display: block; }
  #sh { position: absolute; inset: 0; overflow: hidden; color: var(--hc); font-family: Bahnschrift, "Segoe UI", sans-serif;
    background: radial-gradient(ellipse at 50% 130%, #183041 0%, #0a131b 55%, #04080b 100%); }
  #sh::before { content: ""; position: absolute; inset: 0; opacity: .3;
    background: repeating-linear-gradient(0deg, rgba(110,201,255,.05) 0 1px, transparent 1px 3px); }
  #sh .vis { position: absolute; inset: -30px -40px; border-radius: 50%; box-shadow: inset 0 0 60px 30px rgba(0,0,0,.75); pointer-events: none; }
  #sh.ok { --hc: #6ec9ff; } #sh.high { --hc: #ffd34a; } #sh.low { --hc: #ff4a3a; } #sh.stale { --hc: #5f7380; }

  /* ammo-style counter */
  #sh .ammo { position: absolute; left: 14px; top: 10px; display: flex; align-items: flex-start; gap: 10px; }
  #sh .num { font-size: 48px; font-weight: 600; line-height: .9; letter-spacing: 1px; text-shadow: 0 0 10px var(--hc); }
  #sh .num.word { font-size: 34px; }
  #sh .bul { display: grid; grid-template-columns: repeat(12, 4px); gap: 3px 2px; margin-top: 4px; }
  #sh .bul i { width: 4px; height: 9px; border-radius: 2px 2px 0 0; background: #6ec9ff; box-shadow: 0 0 3px currentColor; }
  #sh .bul i.ok { background: #6ec9ff; color: #6ec9ff; } #sh .bul i.high { background: #ffd34a; color: #ffd34a; }
  #sh .bul i.low { background: #ff4a3a; color: #ff4a3a; } #sh .bul i.stale { background: #5f7380; color: transparent; }
  #sh .bul i.spent { background: rgba(110,201,255,.12); box-shadow: none; }
  #sh .unit { position: absolute; left: 16px; top: 58px; font-size: 9px; letter-spacing: 3px; opacity: .8; }

  /* shield bar */
  #sh .shield { position: absolute; right: 14px; top: 32px; width: 92px; height: 13px; }
  #sh .shield .fr { position: absolute; inset: -3px; border: 1px solid color-mix(in srgb, var(--hc) 65%, transparent);
    clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%); }
  #sh .shield .bg { position: absolute; inset: 0; background: rgba(110,201,255,.08); clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%); }
  #sh .shield .fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--hc) 60%, #fff), var(--hc));
    box-shadow: 0 0 8px var(--hc); clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%); transition: width .6s; }
  #sh .shield .ticks { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 9px, rgba(0,0,0,.45) 9px 10px); }
  #sh .slbl { position: absolute; right: 14px; top: 52px; font-size: 9px; letter-spacing: 3px; }
  #sh.low .shield .fill, #sh.low .slbl { animation: shflash .7s steps(2) infinite; }
  @keyframes shflash { 50% { opacity: .25; } }

  /* motion tracker */
  #sh .trk { position: absolute; left: 12px; bottom: 9px; width: 86px; height: 86px; border-radius: 50%;
    background: radial-gradient(circle, rgba(110,201,255,.10) 0 32%, rgba(110,201,255,.05) 32% 33%, rgba(110,201,255,.10) 33% 66%, rgba(110,201,255,.05) 66% 67%, rgba(8,24,36,.75) 67%);
    box-shadow: inset 0 0 0 1px rgba(110,201,255,.55), 0 0 10px rgba(110,201,255,.2); overflow: hidden; }
  #sh .trk .x, #sh .trk .y { position: absolute; background: rgba(110,201,255,.22); }
  #sh .trk .x { left: 50%; top: 0; bottom: 0; width: 1px; } #sh .trk .y { top: 50%; left: 0; right: 0; height: 1px; }
  #sh .trk .pulse { position: absolute; left: 50%; top: 50%; width: 0; height: 0; border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(110,201,255,.7); animation: trk 2.2s linear infinite; }
  @keyframes trk { from { width: 0; height: 0; margin: 0; opacity: 1; } to { width: 86px; height: 86px; margin: -43px; opacity: 0; } }
  #sh .trk b { position: absolute; width: 6px; height: 6px; margin: -3px; border-radius: 50%; box-shadow: 0 0 5px currentColor; }
  #sh .trk .me { position: absolute; left: 50%; top: 50%; width: 0; height: 0; margin: -5px 0 0 -4px;
    border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid #e8f6ff; }
  #sh .trk .rng { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font-size: 8px; letter-spacing: 1px; color: rgba(159,220,255,.75); }

  /* readout */
  #sh .info { position: absolute; right: 14px; bottom: 14px; text-align: right; font-size: 10px; letter-spacing: 2.5px; line-height: 1.7; color: #9fdcff; }
  #sh .info .big { font-size: 22px; letter-spacing: 1px; color: var(--hc); text-shadow: 0 0 8px var(--hc); }
  #sh .info svg { width: 20px; height: 20px; vertical-align: -4px; margin-right: 4px; color: var(--hc); }
  #sh .info .msg { color: #ffd34a; }
  body.shield #card.alarm #sh .num { animation: shflash .5s steps(2) 40; }
`,
    html: String.raw`
  <div id="sh" class="stale">
    <div class="ammo"><span class="num" id="shNum">---</span><span class="bul" id="shBul"></span></div>
    <div class="unit">MG / DL</div>
    <div class="shield"><div class="fr"></div><div class="bg"></div><div class="fill" id="shFill"></div><div class="ticks"></div></div>
    <div class="slbl" id="shLbl">NO SIGNAL</div>
    <div class="trk"><div class="x"></div><div class="y"></div><div class="pulse"></div><div id="shDots"></div><div class="me"></div><div class="rng">3 HR</div></div>
    <div class="info"><div><span id="shArrow"></span><span class="big" id="shDelta"></span></div><div id="shAgo"></div><div class="msg" id="shMsg"></div></div>
    <div class="vis"></div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('sh').className = z;
      $('shNum').textContent = text;
      $('shNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      const b = bullets(s, z);
      if (b !== lastBullets) { lastBullets = b; $('shBul').innerHTML = b; }
      const d = dots(s, z);
      if (d !== lastDots) { lastDots = d; $('shDots').innerHTML = d; }
      const v = r && Number.isFinite(r.value) ? r.value : 40;
      $('shFill').style.width = z === 'stale' ? '6%' : `${Math.max(4, Math.min(100, ((v - 40) / 360) * 100))}%`;
      $('shLbl').textContent = { ok: 'IN RANGE', high: 'HIGH', low: 'LOW  //  WARNING', stale: 'NO SIGNAL' }[z];
      $('shArrow').innerHTML = showArrow && r.trend in ANGLES
        ? `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square">${arrowSvg(r.trend)}</svg>` : '';
      $('shDelta').textContent = $('delta').textContent;
      $('shAgo').textContent = r ? (mins < 1 ? 'SYNC  JUST NOW' : `SYNC  ${mins} MIN AGO`) : 'SYNC  --';
      $('shMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st.toUpperCase() : '';
    },
  });
}());
