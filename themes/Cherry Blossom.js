// @theme {"id": "sakura", "name": "Cherry Blossom", "width": 300, "height": 180}
// Glucose Widget theme: "Cherry Blossom". Delete this file to remove the theme; put it back to restore it.
// Cherry petals fall the way real ones do: single notched petals that tumble end over end, show
// their paler or deeper side as they flip, swing side to side, and drift with soft gusts of wind.
// Some petals are further away (smaller, softer, slower) and pass behind the reading.
(function () {
  const W = 300; const H = 180;
  const ZT = { ok: '#2f8a5a', high: '#c26a10', low: '#c8102e', stale: '#8a7a80' };
  let started = false;
  let lastSpark = '';

  // ---------- petals ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  function petal(depth, anywhere) {
    const near = depth === 'front';
    return {
      x: rand(-20, W + 10),
      y: anywhere ? rand(-20, H) : rand(-40, -10),
      size: near ? rand(5.5, 8.5) : rand(3, 5),
      fall: near ? rand(16, 26) : rand(9, 15),          // px per second, steady sink rate
      swayAmp: rand(8, 22), swayFreq: rand(0.35, 0.8), swayPhase: rand(0, 6.28),
      flip: rand(0, 6.28), flipRate: rand(1.6, 4.2) * (Math.random() < 0.5 ? -1 : 1),   // tumbling end over end
      spin: rand(0, 6.28), spinRate: rand(-1.2, 1.2),   // turning flat in the air
      tilt: rand(0.25, 0.9),                            // how much the tumble shows
      tint: rand(0, 1),
    };
  }
  const layers = { back: [], front: [] };
  for (let i = 0; i < 16; i++) layers.back.push(petal('back', true));
  for (let i = 0; i < 13; i++) layers.front.push(petal('front', true));

  // wind: a slow breeze to the right, with gentle gusts that come and go
  function wind(t) {
    const gust = Math.max(0, Math.sin(t * 0.21) * Math.sin(t * 0.077 + 1.3)) * 26;
    return 7 + Math.sin(t * 0.37) * 4 + gust;
  }

  function drawPetal(g, p, t) {
    const flipC = Math.cos(p.flip);
    const sx = Math.max(0.12, Math.abs(flipC) * p.tilt + (1 - p.tilt) * 0.55); // narrow when edge-on
    const front = flipC >= 0;
    const s = p.size;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.spin);
    g.scale(sx, 1);
    const grad = g.createLinearGradient(0, -s, 0, s);
    // the outer tip (with the notch) is lighter; the base deeper pink; the underside a little duller
    if (front) {
      grad.addColorStop(0, p.tint > 0.5 ? '#fff7f9' : '#fff1f5');
      grad.addColorStop(0.55, p.tint > 0.5 ? '#ffd3df' : '#fbc8d6');
      grad.addColorStop(1, '#f19ab3');
    } else {
      grad.addColorStop(0, '#f6dde5');
      grad.addColorStop(0.6, '#eebccb');
      grad.addColorStop(1, '#de94ab');
    }
    g.fillStyle = grad;
    g.beginPath();
    // a cherry petal: rounded, narrowing to the base, with a small V notch at the tip
    g.moveTo(0, s);
    g.bezierCurveTo(-s * 0.95, s * 0.45, -s * 0.9, -s * 0.7, -s * 0.28, -s * 0.95);
    g.lineTo(0, -s * 0.66);
    g.lineTo(s * 0.28, -s * 0.95);
    g.bezierCurveTo(s * 0.9, -s * 0.7, s * 0.95, s * 0.45, 0, s);
    g.closePath();
    g.fill();
    // faint centre vein and a soft edge so it reads against the sky
    g.strokeStyle = front ? 'rgba(214,120,150,.35)' : 'rgba(170,90,115,.3)';
    g.lineWidth = 0.5;
    g.stroke();
    g.beginPath(); g.moveTo(0, s * 0.85); g.lineTo(0, -s * 0.5); g.stroke();
    g.restore();
  }

  function step(list, g, dt, t) {
    const w = wind(t);
    for (const p of list) {
      const depth = p.size < 5.2 ? 0.55 : 1;
      p.flip += p.flipRate * dt;
      p.spin += p.spinRate * dt;
      // a petal sinks a little faster when it is edge-on, and hangs when it is flat
      const flat = Math.abs(Math.cos(p.flip));
      p.y += p.fall * (0.75 + (1 - flat) * 0.5) * dt;
      p.x += (w * depth + Math.cos(t * p.swayFreq * 6.28 + p.swayPhase) * p.swayAmp * p.swayFreq * 1.2) * dt;
      if (p.y > H + 14 || p.x > W + 20) Object.assign(p, petal(depth < 1 ? 'back' : 'front', false), { x: rand(-30, W * 0.85) });
      drawPetal(g, p, t);
    }
  }

  function setup(c) {
    const dpr = window.devicePixelRatio || 1;
    c.width = W * dpr; c.height = H * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  }

  function start() {
    if (started) return;
    started = true;
    const gb = setup($('skBack')); const gf = setup($('skFront'));
    let last = performance.now();
    const t0 = last;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
      if (document.body.classList.contains('sakura')) {
        gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
        step(layers.back, gb, dt, t);
        step(layers.front, gf, dt, t);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- the branch ----------
  function flower(x, y, r, rot, open) {
    let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`;
    for (let i = 0; i < 5; i++) {
      s += `<path transform="rotate(${i * 72})" d="M0,0 C${-r * 0.55},${-r * 0.35} ${-r * 0.5},${-r * 0.95} ${-r * 0.14},${-r} L0,${-r * 0.8} L${r * 0.14},${-r} C${r * 0.5},${-r * 0.95} ${r * 0.55},${-r * 0.35} 0,0 Z"
        fill="url(#skPet)" stroke="rgba(214,120,150,.45)" stroke-width=".4" opacity="${open}"/>`;
    }
    s += `<circle r="${r * 0.22}" fill="#e2557c"/>`;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28; const l = r * 0.45;
      s += `<line x1="0" y1="0" x2="${(Math.cos(a) * l).toFixed(1)}" y2="${(Math.sin(a) * l).toFixed(1)}" stroke="#c9375f" stroke-width=".35"/><circle cx="${(Math.cos(a) * l).toFixed(1)}" cy="${(Math.sin(a) * l).toFixed(1)}" r=".55" fill="#f2c94c"/>`;
    }
    return s + '</g>';
  }
  function branch() {
    const fl = [[70, 22, 7, 10], [92, 12, 6, -20], [118, 30, 7.5, 30], [143, 22, 6.5, 5], [52, 38, 6, -35], [160, 44, 5.5, 50], [100, 46, 5, 12], [30, 18, 5.5, 20], [133, 56, 4.5, -10], [80, 60, 4, 40]];
    const buds = [[176, 52], [64, 8], [150, 64], [110, 64]];
    let s = `<defs><radialGradient id="skPet" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#fffafb"/><stop offset=".6" stop-color="#ffd6e1"/><stop offset="1" stop-color="#f3a2ba"/></radialGradient></defs>`;
    s += `<path d="M-6,4 C30,12 60,18 96,24 C120,28 150,36 186,56" stroke="#4a2c26" stroke-width="4.2" fill="none" stroke-linecap="round"/>
      <path d="M58,19 C66,34 74,48 84,62" stroke="#4a2c26" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M110,27 C114,40 122,52 136,60" stroke="#4a2c26" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M86,22 C90,14 92,8 96,2" stroke="#4a2c26" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M-6,4 C30,12 60,18 96,24 C120,28 150,36 186,56" stroke="rgba(255,255,255,.18)" stroke-width="1" fill="none" transform="translate(0,-1.2)"/>`;
    for (const [x, y] of buds) s += `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.6" fill="#f07a9a" stroke="#b84a6a" stroke-width=".4"/>`;
    for (const [x, y, r, rot] of fl) s += flower(x, y, r, rot, 1);
    return s;
  }

  function spark(s) {
    const now = Date.now(); const span = 3 * 3600000;
    const pts = (s.history || []).filter((p) => now - p.time <= span).sort((a, b) => a.time - b.time);
    if (pts.length < 2) return '';
    const vals = pts.map((p) => p.value);
    const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
    const X = (t) => ((t - (now - span)) / span) * 268; const Y = (v) => 24 - ((v - lo) / (hi - lo)) * 22;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.time).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ');
    const last = pts[pts.length - 1];
    return `<rect x="0" y="${Y(s.settings.high)}" width="268" height="${Math.max(0, Y(s.settings.low) - Y(s.settings.high))}" rx="3" fill="rgba(255,255,255,.45)"/>
      <path d="${d}" fill="none" stroke="#c7647f" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${X(last.time)}" cy="${Y(last.value)}" r="2.6" fill="#e2557c" stroke="#fff" stroke-width="1"/>`;
  }

  GlucoseWidget.registerTheme({
    id: 'sakura',
    palette: { ok: '#2f8a5a', high: '#c26a10', low: '#c8102e', stale: '#8a7a80' },
    css: String.raw`
  #sk { display: none; }
  body.sakura #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.sakura #card > *:not(#sk):not(#top) { display: none; }
  body.sakura #card.alarm { animation: none; }
  body.sakura #top { position: absolute; right: 10px; top: 8px; height: 18px; z-index: 6; }
  body.sakura #status { display: none; }
  body.sakura .btns { gap: 5px; }
  body.sakura button { width: 18px; height: 18px; border-radius: 50%; font-size: 0; position: relative;
    background: rgba(255,255,255,.55); box-shadow: 0 1px 2px rgba(120,60,80,.25), inset 0 0 0 1px rgba(255,255,255,.8); }
  body.sakura button:hover { background: rgba(255,255,255,.85); }
  body.sakura #sk { display: block; }
  #sk { position: absolute; inset: 0; overflow: hidden; font-family: "Segoe UI Variable Display", "Segoe UI", "Yu Gothic UI", sans-serif; color: #4a2a38;
    background: radial-gradient(ellipse at 15% 0%, #fff4f6 0%, transparent 55%), linear-gradient(180deg, #fde8ee 0%, #f9dbe4 45%, #f2d4dc 100%); }
  #sk.ok { --zc: #5f2a44; --zt: #2f8a5a; } #sk.high { --zc: #a3570f; --zt: #c26a10; } #sk.low { --zc: #b3122e; --zt: #c8102e; } #sk.stale { --zc: #8a7a80; --zt: #8a7a80; }
  #sk .haze { position: absolute; inset: 0; background: radial-gradient(ellipse at 90% 110%, rgba(255,255,255,.7), transparent 50%); }
  #sk canvas { position: absolute; inset: 0; width: 300px; height: 180px; }
  #sk canvas.back { filter: blur(1.1px); opacity: .75; }
  #sk svg.branch { position: absolute; left: 0; top: 0; width: 190px; height: 92px; }
  #sk .num { position: absolute; left: 20px; top: 70px; font-size: 56px; font-weight: 300; line-height: 1; letter-spacing: -1px; color: var(--zc);
    text-shadow: 0 1px 0 rgba(255,255,255,.8), 0 0 18px rgba(255,255,255,.9); }
  #sk .num.word { font-size: 40px; top: 78px; }
  #sk .unit { position: absolute; left: 24px; top: 128px; font-size: 11px; letter-spacing: 1px; color: #8a5a6c; }
  #sk .side { position: absolute; right: 16px; top: 64px; width: 120px; text-align: right; }
  #sk .chip { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px; border-radius: 11px; font-size: 12px; font-weight: 600; color: var(--zt);
    background: rgba(255,255,255,.7); box-shadow: 0 1px 3px rgba(120,60,80,.18), inset 0 0 0 1px rgba(255,255,255,.9); }
  #sk .chip svg { width: 12px; height: 12px; }
  #sk .ln { margin-top: 8px; font-size: 12px; color: #6a4454; }
  #sk .ln b { font-size: 16px; font-weight: 600; color: var(--zc); }
  #sk .ln svg { width: 16px; height: 16px; vertical-align: -3px; color: var(--zc); }
  #sk .msg { margin-top: 4px; font-size: 10.5px; color: #b3122e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #sk svg.spark { position: absolute; left: 16px; right: 16px; bottom: 10px; width: 268px; height: 26px; }
  body.sakura #card.alarm #sk .num { animation: skpulse .7s ease-in-out 30; }
  @keyframes skpulse { 50% { text-shadow: 0 0 2px #fff, 0 0 22px var(--zt); } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.sakura button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 10px; height: 10px;
    background: #8a4a62; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.sakura #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.sakura #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #c26a10; }
  body.sakura #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.sakura #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }
`,
    html: String.raw`
  <div id="sk" class="stale">
    <div class="haze"></div>
    <canvas class="back" id="skBack"></canvas>
    <svg class="branch" id="skBranch" viewBox="0 0 190 92"></svg>
    <div class="num" id="skNum">---</div><div class="unit">mg/dL</div>
    <div class="side">
      <span class="chip"><svg viewBox="0 0 24 24" id="skFlower"></svg><span id="skZone">No signal</span></span>
      <div class="ln"><span id="skArrow"></span> <b id="skDelta"></b></div>
      <div class="ln" id="skAgo"></div>
      <div class="msg" id="skMsg"></div>
    </div>
    <svg class="spark" id="skSpark" viewBox="0 0 268 26" preserveAspectRatio="none"></svg>
    <canvas class="front" id="skFront"></canvas>
  </div>
`,
    init() {
      $('skBranch').innerHTML = branch();
      $('skFlower').innerHTML = flower(12, 12, 10.5, 0, 1).split('url(#skPet)').join('currentColor');
      start();
    },
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('sk').className = z;
      $('skFlower').style.color = ZT[z];
      $('skNum').textContent = text;
      $('skNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('skZone').textContent = { ok: 'In range', high: 'High', low: 'Low', stale: 'No signal' }[z];
      $('skArrow').innerHTML = showArrow && r.trend in ANGLES
        ? `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${arrowSvg(r.trend)}</svg>` : '';
      $('skDelta').textContent = $('delta').textContent;
      $('skAgo').textContent = r ? (mins < 1 ? 'just now' : `${mins} min ago`) : '';
      $('skMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st : '';
      const sp = spark(s);
      if (sp !== lastSpark) { lastSpark = sp; $('skSpark').innerHTML = sp; }
    },
  });
}());
