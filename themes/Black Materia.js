// @theme {"id": "materia", "name": "Black Materia", "width": 300, "height": 180}
// Glucose Widget theme: "Black Materia". Delete this file to remove the theme; put it back to restore it.
// A dark materia orb holds your number; black feathers drift down past a burning meteor.
// The panel's LIMIT bar fills until the next reading; the slots hold your last eight readings.
(function () {
  const MC = { ok: '#3dff8f', high: '#ffb02a', low: '#ff2a3a', stale: '#7a8088' };
  let lastSlots = '';

  function slots(s, z) {
    const pts = (s.history || []).slice(0, 8);
    const one = (p) => {
      if (!p) return '<span class="sl"></span>';
      const c = z === 'stale' ? MC.stale : p.value < s.settings.low ? MC.low : p.value > s.settings.high ? MC.high : MC.ok;
      return `<span class="sl" title="${Math.round(p.value)}"><b style="--mc:${c}"></b></span>`;
    };
    let h = '';
    for (let i = 0; i < 8; i += 2) h += `<span class="pair">${one(pts[i])}<i></i>${one(pts[i + 1])}</span>`;
    return h;
  }

  function limit(c) {
    const r = c.s.reading;
    const f = r ? Math.max(0, Math.min(1, (Date.now() - r.time) / (5 * 60000))) : 0;
    $('bmLim').style.width = `${(f * 100).toFixed(1)}%`;
    $('bmLimWrap').classList.toggle('full', f >= 1);
  }

  GlucoseWidget.registerTheme({
    id: 'materia',
    palette: { ok: MC.ok, high: MC.high, low: MC.low, stale: MC.stale },
    css: String.raw`
  #bmx { display: none; }
  body.materia #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.materia #card > *:not(#bmx):not(#top) { display: none; }
  body.materia #card.alarm { animation: none; }
  body.materia #top { position: absolute; right: 10px; top: 7px; height: 17px; z-index: 6; }
  body.materia #status { display: none; }
  body.materia .btns { gap: 5px; }
  body.materia button { width: 17px; height: 17px; border-radius: 50%; font-size: 0; position: relative;
    background: radial-gradient(circle at 35% 30%, #4a5a52, #0a0e0c 70%); box-shadow: 0 0 0 1px #2a3a32, 0 0 6px color-mix(in srgb, var(--bc, #3dff8f) 45%, transparent); }
  body.materia button:hover { filter: brightness(1.5); }
  body.materia #bmx { display: block; }
  #bmx { position: absolute; inset: 0; overflow: hidden; color: #fff; font-family: "Segoe UI", sans-serif;
    background: radial-gradient(ellipse at 26% 52%, color-mix(in srgb, var(--bc) 20%, #000) 0%, #05080a 48%, #020203 100%); }
  body.materia { --bc: #3dff8f; }
  #bmx.ok { --bc: #3dff8f; --sc: #7dffb0; } #bmx.high { --bc: #ffb02a; --sc: #ffd36a; } #bmx.low { --bc: #ff2a3a; --sc: #ff7a7a; } #bmx.stale { --bc: #7a8088; --sc: #b0b6be; }
  #bmx .sky { position: absolute; inset: 0; background: radial-gradient(ellipse at 90% -12%, rgba(170,30,20,.5), transparent 45%); }
  #bmx .meteor { position: absolute; right: 70px; top: 10px; width: 110px; height: 3px; border-radius: 2px; transform: rotate(-24deg); transform-origin: right;
    background: linear-gradient(90deg, transparent, rgba(255,120,60,.6) 70%, #ffd8a0); box-shadow: 0 0 8px rgba(255,120,60,.8); animation: flick 2.6s ease-in-out infinite; }
  #bmx .meteor::after { content: ""; position: absolute; right: -4px; top: -3px; width: 9px; height: 9px; border-radius: 50%; background: radial-gradient(#fff3d8, #ff7a2a 60%, transparent 70%); }
  @keyframes flick { 50% { opacity: .65; filter: brightness(1.3); } }

  /* falling black feathers */
  #bmx .fth { position: absolute; top: -34px; width: 11px; height: 28px; animation: fall linear infinite; }
  #bmx .fth svg { width: 100%; height: 100%; animation: sway ease-in-out infinite alternate; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--bc) 40%, transparent)); }
  @keyframes fall { from { transform: translateY(0); } to { transform: translateY(230px); } }
  @keyframes sway { from { transform: translateX(-9px) rotate(-35deg); } to { transform: translateX(9px) rotate(30deg); } }

  /* the Black Materia */
  #bmx .aura { position: absolute; left: 6px; top: 24px; width: 136px; height: 136px; border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--bc) 45%, transparent) 0%, transparent 62%); filter: blur(6px); animation: breathe 6s ease-in-out infinite; }
  @keyframes breathe { 50% { opacity: .6; transform: scale(.95); } }
  #bmx .orb { position: absolute; left: 18px; top: 36px; width: 112px; height: 112px; border-radius: 50%; overflow: hidden; background: #000;
    box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 0 22px color-mix(in srgb, var(--bc) 55%, transparent); }
  #bmx .swirl { position: absolute; inset: -10%; border-radius: 50%; animation: turn 22s linear infinite;
    background: radial-gradient(circle at 62% 70%, color-mix(in srgb, var(--bc) 55%, transparent) 0%, transparent 36%),
      conic-gradient(from 40deg, #000, color-mix(in srgb, var(--bc) 32%, #000), #000 30%, color-mix(in srgb, var(--bc) 18%, #000) 55%, #000 70%, color-mix(in srgb, var(--bc) 28%, #000), #000); }
  @keyframes turn { to { transform: rotate(360deg); } }
  #bmx .shine { position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(circle at 34% 28%, rgba(255,255,255,.75) 0 4%, rgba(255,255,255,.18) 9%, transparent 18%);
    box-shadow: inset 0 -10px 22px rgba(0,0,0,.9), inset 0 6px 14px rgba(255,255,255,.08); }
  #bmx .num { position: absolute; left: 18px; top: 66px; width: 112px; text-align: center; font-weight: 300; font-size: 42px; line-height: 1; letter-spacing: 1px;
    color: #f2fff6; text-shadow: 0 0 10px var(--bc), 0 0 2px #000; }
  #bmx .num.word { font-size: 30px; top: 72px; }
  #bmx .unit { position: absolute; left: 18px; top: 110px; width: 112px; text-align: center; font-size: 9px; letter-spacing: 3px; color: color-mix(in srgb, var(--bc) 60%, #fff); }
  #bmx .ar { position: absolute; left: 112px; top: 30px; width: 22px; height: 22px; color: var(--bc); filter: drop-shadow(0 0 4px var(--bc)); }

  /* materia panel */
  #bmx .pan { position: absolute; right: 10px; top: 30px; width: 144px; height: 140px; border-radius: 14px; padding: 9px 11px;
    background: radial-gradient(ellipse at 80% 110%, color-mix(in srgb, var(--bc) 26%, transparent), transparent 60%),
      radial-gradient(ellipse at 10% -20%, rgba(255,255,255,.10), transparent 50%), linear-gradient(160deg, #0d1210, #050706);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bc) 55%, transparent), inset 0 1px 0 rgba(255,255,255,.15),
      0 0 12px color-mix(in srgb, var(--bc) 25%, transparent), 0 3px 10px rgba(0,0,0,.6); }
  #bmx .hd { display: flex; justify-content: space-between; align-items: baseline; }
  #bmx .hd b { font-size: 13px; font-weight: 600; letter-spacing: .5px; }
  #bmx .hd span { font-size: 13px; color: var(--sc); }
  #bmx .row { display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: rgba(220,235,228,.6); }
  #bmx .row b { color: #e8f4ee; font-weight: 600; }
  #bmx .row b.st { color: var(--sc); text-shadow: 0 0 6px color-mix(in srgb, var(--bc) 60%, transparent); }
  #bmx .lim { margin-top: 8px; font-size: 9px; letter-spacing: 2px; color: rgba(220,235,228,.55); }
  #bmx .bar { position: relative; height: 5px; margin-top: 3px; border-radius: 3px; background: #020403; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); overflow: hidden; }
  #bmx .bar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: linear-gradient(90deg, #7a2ad8, #ff5ad8); }
  #bmx .bar.full i { animation: flick 1s ease-in-out infinite; }
  #bmx .msg { margin-top: 3px; font-size: 9.5px; color: #ffd36a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; height: 12px; }
  /* materia slots: one glowing orb per recent reading, linked in pairs like weapon slots */
  #bmx .slots { position: absolute; left: 11px; right: 11px; bottom: 10px; display: flex; justify-content: space-between; }
  #bmx .pair { display: flex; align-items: center; }
  #bmx .pair i { width: 5px; height: 2px; background: rgba(200,220,210,.35); }
  #bmx .sl { width: 12px; height: 12px; border-radius: 50%; background: #020403; box-shadow: inset 0 0 0 1px rgba(200,220,210,.35); position: relative; }
  #bmx .sl b { position: absolute; inset: 2px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, var(--mc) 45%, #000 100%); box-shadow: 0 0 5px var(--mc); }
  body.materia #card.alarm #bmx .orb { animation: alarmorb .6s ease-in-out 40; }
  @keyframes alarmorb { 50% { box-shadow: 0 0 0 1px rgba(255,255,255,.2), 0 0 40px 10px var(--bc); } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.materia button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 10px; height: 10px;
    background: #cfeedd; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.materia #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.materia #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #ffd36a; }
  body.materia #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.materia #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }

  /* frame */
  body.materia #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30;
    box-shadow: inset 0 0 0 1px #000, inset 0 0 0 2px color-mix(in srgb, var(--bc) 65%, #000), inset 0 0 0 4px #0b0f0d, inset 0 0 0 5px color-mix(in srgb, var(--bc) 30%, #000), inset 0 0 18px color-mix(in srgb, var(--bc) 30%, transparent); }
`,
    html: String.raw`
  <div id="bmx" class="stale">
    <div class="sky"></div><div class="meteor"></div>
    <div class="fth" style="left:18px;animation-duration:9s;animation-delay:0s"><svg viewBox="0 0 10 26" style="animation-duration:2.6s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:62px;animation-duration:11s;animation-delay:-4.5s"><svg viewBox="0 0 10 26" style="animation-duration:3.1s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:150px;animation-duration:8.5s;animation-delay:-2s"><svg viewBox="0 0 10 26" style="animation-duration:2.3s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:205px;animation-duration:12s;animation-delay:-7s"><svg viewBox="0 0 10 26" style="animation-duration:3.4s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:268px;animation-duration:10s;animation-delay:-1s"><svg viewBox="0 0 10 26" style="animation-duration:2.8s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:110px;animation-duration:13s;animation-delay:-9s"><svg viewBox="0 0 10 26" style="animation-duration:2.5s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div><div class="fth" style="left:238px;animation-duration:9.5s;animation-delay:-5.5s"><svg viewBox="0 0 10 26" style="animation-duration:3.0s"><path d="M5 0 C9 6 9 16 5 26 C1 16 1 6 5 0 Z" fill="#0b0b0e" stroke="#5a5a68" stroke-width=".7"/><path d="M5 2 L5 25" stroke="#6a6a78" stroke-width=".6"/></svg></div>
    <div class="aura"></div>
    <div class="orb"><div class="swirl"></div><div class="shine"></div></div>
    <div class="num" id="bmNum">---</div><div class="unit">MG / DL</div>
    <div class="ar" id="bmArWrap"><svg id="bmArrow" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    <div class="pan">
      <div class="hd"><b>Glucose</b><span id="bmDelta"></span></div>
      <div class="row"><span>Status</span><b class="st" id="bmSt">No signal</b></div>
      <div class="row"><span>Seen</span><b id="bmAgo">--</b></div>
      <div class="lim">LIMIT</div><div class="bar" id="bmLimWrap"><i id="bmLim"></i></div>
      <div class="msg" id="bmMsg"></div>
      <div class="slots" id="bmSlots"></div>
    </div>
    
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('bmx').className = z;
      document.body.style.setProperty('--bc', MC[z]);
      $('bmNum').textContent = text;
      $('bmNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      const showA = showArrow && r.trend in ANGLES;
      $('bmArWrap').style.display = showA ? '' : 'none';
      $('bmArrow').innerHTML = showA ? arrowSvg(r.trend) : '';
      $('bmDelta').textContent = $('delta').textContent;
      $('bmSt').textContent = { ok: 'In range', high: 'High', low: 'Low', stale: 'No signal' }[z];
      $('bmAgo').textContent = r ? (mins < 1 ? 'just now' : `${mins} min ago`) : '--';
      $('bmMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st : '';
      const sl = slots(s, z);
      if (sl !== lastSlots) { lastSlots = sl; $('bmSlots').innerHTML = sl; }
      limit(c);
    },
    tick(c) { limit(c); },
  });
}());
