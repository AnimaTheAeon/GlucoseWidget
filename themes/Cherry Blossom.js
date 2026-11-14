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
      swayAmp: rand(8, 20), swayFreq: rand(0.28, 0.6), swayPhase: rand(0, 6.28),
      flip: rand(0, 6.28), flipRate: rand(1.1, 3.0) * (Math.random() < 0.5 ? -1 : 1),   // tumbling end over end
      spin: rand(0, 6.28), spinRate: rand(-0.8, 0.8),   // turning flat in the air
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
    let t = 0;
    const draw = (dt) => {
      t += dt;
      gb.clearRect(0, 0, W, H); gf.clearRect(0, 0, W, H);
      step(layers.back, gb, dt, t);
      step(layers.front, gf, dt, t);
    };
    window.__sakuraStep = draw; // lets a recorder step time evenly
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.body.classList.contains('sakura') && !window.__sakuraManual) draw(dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ---------- the grove behind (painted once, softly out of focus) ----------
  function paintScene() {
    const c = $('skScene');
    const g = setup(c);
    let k = 21;
    const rnd = (a, b) => { k = (k * 9301 + 49297) % 233280; return a + (k / 233280) * (b - a); };
    const HZ = 112; // horizon
    // sky
    let gr = g.createLinearGradient(0, 0, 0, HZ);
    gr.addColorStop(0, '#fff3f6'); gr.addColorStop(1, '#fbe2ea');
    g.fillStyle = gr; g.fillRect(0, 0, W, HZ + 2);
    // ground: fresh grass near the horizon, a carpet of fallen petals nearer
    gr = g.createLinearGradient(0, HZ, 0, H);
    gr.addColorStop(0, '#d6dcc4'); gr.addColorStop(0.25, '#e6c7d2'); gr.addColorStop(1, '#e2a9c0');
    g.fillStyle = gr; g.fillRect(0, HZ, W, H - HZ);
    // a lighter path down the middle of the avenue
    g.fillStyle = 'rgba(255,240,245,.55)';
    g.beginPath(); g.moveTo(140, HZ); g.lineTo(160, HZ); g.lineTo(250, H); g.lineTo(50, H); g.closePath(); g.fill();
    // fallen petals on the ground
    for (let i = 0; i < 260; i++) {
      const y = rnd(HZ + 2, H); const near = (y - HZ) / (H - HZ);
      g.fillStyle = `rgba(${Math.round(rnd(220, 245))},${Math.round(rnd(110, 160))},${Math.round(rnd(160, 195))},${(0.25 + near * 0.35).toFixed(2)})`;
      g.beginPath(); g.ellipse(rnd(0, W), y, 0.6 + near * 1.6, 0.4 + near * 0.8, rnd(0, 3), 0, 6.28); g.fill();
    }
    function tree(x, base, scale, pale) {
      // dappled shade under the crown
      g.fillStyle = `rgba(150,60,110,${(0.16 * (1 - pale)).toFixed(2)})`;
      g.beginPath(); g.ellipse(x, base + 1, 26 * scale, 4 * scale, 0, 0, 6.28); g.fill();
      // trunk and a few limbs
      const trunk = pale > 0.5 ? `rgba(110,90,96,${(1 - pale).toFixed(2)})` : '#3d2b2f';
      g.strokeStyle = trunk; g.lineCap = 'round';
      g.lineWidth = 3.2 * scale;
      const top = base - 30 * scale;
      g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x - 3 * scale, base - 15 * scale, x + rnd(-2, 2) * scale, top); g.stroke();
      g.lineWidth = 1.6 * scale;
      for (const d of [-1, 1, -0.5, 0.6]) {
        g.beginPath(); g.moveTo(x, top + 6 * scale);
        g.quadraticCurveTo(x + d * 10 * scale, top - 2 * scale, x + d * 20 * scale, top - rnd(6, 14) * scale); g.stroke();
      }
      // the crown: many overlapping blossom clumps, deeper pink underneath, lighter on top
      const n = Math.round(26 + 30 * scale);
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.28); const rr = Math.sqrt(rnd(0, 1));
        const cx = x + Math.cos(a) * rr * 30 * scale; const cy = top - 8 * scale + Math.sin(a) * rr * 17 * scale;
        const lift = (top - cy) / (20 * scale);
        const r = Math.round(228 + lift * 14 + rnd(-6, 6)); const gg = Math.round(100 + lift * 45 + rnd(-15, 15)); const b = Math.round(172 + lift * 22 + rnd(-10, 10));
        g.fillStyle = `rgba(${r},${gg},${b},${(0.78 - pale * 0.3).toFixed(2)})`;
        g.beginPath(); g.arc(cx, cy, rnd(4.5, 8.5) * scale, 0, 6.28); g.fill();
      }
    }
    // far rows fade into pink haze; nearer trees stand at the edges, leaving the middle calm
    for (let x = -6; x < W + 10; x += rnd(13, 19)) tree(x, HZ + rnd(1, 4), rnd(0.3, 0.4), 0.6);
    for (const [x, b, sc] of [[36, HZ + 14, 0.7], [96, HZ + 7, 0.48], [206, HZ + 7, 0.5], [262, HZ + 14, 0.72]]) tree(x, b, sc, 0.3);
    for (const [x, b, sc] of [[-10, H - 4, 1.45], [314, H - 2, 1.5]]) tree(x, b, sc, 0.05);
    // a pale wash so everything sits back
    g.fillStyle = 'rgba(255,240,245,.1)'; g.fillRect(0, 0, W, H);
  }

  // ---------- the branch ----------
  // Built from smooth curves that taper from thick to thin, with light on top, shade underneath,
  // the horizontal bark marks (lenticels) cherry trees have, and blossoms in clusters on short stems.
  function curve(pts, n) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n; const t2 = t * t; const t3 = t2 * t;
        const f = (a0, a1, a2, a3) => 0.5 * ((2 * a1) + (-a0 + a2) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2 + (-a0 + 3 * a1 - 3 * a2 + a3) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function limb(pts, w0, w1, seed) {
    const c = curve(pts, 10);
    const L = []; const R = []; const top = []; const marks = [];
    let rnd = seed;
    const rand2 = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
    for (let i = 0; i < c.length; i++) {
      const a = c[Math.max(0, i - 1)]; const b = c[Math.min(c.length - 1, i + 1)];
      let tx = b[0] - a[0]; let ty = b[1] - a[1]; const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
      const nx = -ty; const ny = tx;
      const t = i / (c.length - 1);
      const w = (w0 + (w1 - w0) * Math.pow(t, 0.8)) * (1 + (rand2() - 0.5) * 0.12);
      L.push([c[i][0] + nx * w / 2, c[i][1] + ny * w / 2]);
      R.push([c[i][0] - nx * w / 2, c[i][1] - ny * w / 2]);
      top.push([c[i][0] - nx * w * 0.22, c[i][1] - ny * w * 0.22]);
      if (w > 2.4 && rand2() < 0.42) marks.push([c[i][0] + nx * w * (rand2() - 0.5) * 0.5, c[i][1] + ny * w * (rand2() - 0.5) * 0.5, nx, ny, w * (0.5 + rand2() * 0.6)]);
    }
    const poly = (arr) => arr.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    let s = `<path d="${poly(L)} ${poly(R.slice().reverse()).replace('M', 'L')} Z" fill="url(#skBark)"/>`;
    s += `<path d="${poly(top)}" fill="none" stroke="#8a6656" stroke-width="${Math.max(0.5, w0 * 0.22).toFixed(1)}" stroke-linecap="round" opacity=".45"/>`;
    for (const [x, y, nx, ny, w] of marks) {
      // lenticels: short pale bands running across the branch
      const h = w * 0.16;
      s += `<path d="M${(x + nx * h).toFixed(1)},${(y + ny * h).toFixed(1)} L${(x - nx * h).toFixed(1)},${(y - ny * h).toFixed(1)}" stroke="#b09486" stroke-width=".55" opacity=".5" stroke-linecap="round"/>`;
    }
    return { svg: s, at: (t) => c[Math.round(t * (c.length - 1))] };
  }
  function flower(x, y, r, rot, squash) {
    let s = `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(1 ${squash})">`;
    for (let i = 0; i < 5; i++) {
      const L = r * (0.92 + (i % 2) * 0.08);
      s += `<path transform="rotate(${i * 72 + (i % 2) * 4})" d="M0,0 C${(-L * 0.62).toFixed(1)},${(-L * 0.3).toFixed(1)} ${(-L * 0.55).toFixed(1)},${(-L * 0.98).toFixed(1)} ${(-L * 0.15).toFixed(1)},${(-L).toFixed(1)} L0,${(-L * 0.82).toFixed(1)} L${(L * 0.15).toFixed(1)},${(-L).toFixed(1)} C${(L * 0.55).toFixed(1)},${(-L * 0.98).toFixed(1)} ${(L * 0.62).toFixed(1)},${(-L * 0.3).toFixed(1)} 0,0 Z"
        fill="url(#skPet)" stroke="rgba(214,120,150,.35)" stroke-width=".35"/>`;
    }
    s += `<circle r="${(r * 0.3).toFixed(1)}" fill="url(#skEye)"/>`;
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * 6.283 + 0.2; const l = r * (0.42 + (i % 3) * 0.06);
      const ex = (Math.cos(a) * l).toFixed(1); const ey = (Math.sin(a) * l).toFixed(1);
      s += `<line x1="0" y1="0" x2="${ex}" y2="${ey}" stroke="#d65a80" stroke-width=".3"/><circle cx="${ex}" cy="${ey}" r=".55" fill="#f0c24a"/>`;
    }
    return s + '</g>';
  }
  function bud(x, y, rot, s) {
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})">
      <path d="M0,0 C-2.6,-2.2 -2.4,-6.4 0,-8 C2.4,-6.4 2.6,-2.2 0,0 Z" fill="#f3829f" stroke="#c4527a" stroke-width=".35"/>
      <path d="M0,0.4 C-1.8,-0.6 -2,-2.6 -1.2,-3.4 C-0.6,-2 0.6,-2 1.2,-3.4 C2,-2.6 1.8,-0.6 0,0.4 Z" fill="#7a3a2a"/></g>`;
  }
  function cluster(x, y, flowers, seed) {
    // short stems radiating from one spur, each ending in a flower or a bud
    let s = `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#4a2e26"/>`;
    let k = seed;
    const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    for (let i = 0; i < flowers.length; i++) {
      const ang = (-150 + (i / Math.max(1, flowers.length - 1)) * 120 + (r2() - 0.5) * 30) * Math.PI / 180;
      const len = 6 + r2() * 6;
      const fx = x + Math.cos(ang) * len; const fy = y + Math.sin(ang) * len + 4;
      s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} Q${((x + fx) / 2 + 2).toFixed(1)},${((y + fy) / 2 + 2).toFixed(1)} ${fx.toFixed(1)},${fy.toFixed(1)}" stroke="#6b8a3a" stroke-width=".7" fill="none"/>`;
      s += flowers[i] === 'b' ? bud(fx, fy, ang * 57.3 + 90, 0.8 + r2() * 0.3) : flower(fx, fy, flowers[i], Math.round(r2() * 70), (0.72 + r2() * 0.28).toFixed(2));
    }
    return s;
  }
  function branch() {
    let s = `<defs>
      <radialGradient id="skPet" cx="50%" cy="85%" r="95%"><stop offset="0" stop-color="#f6a9c0"/><stop offset=".35" stop-color="#ffd9e4"/><stop offset=".8" stop-color="#fff6f8"/><stop offset="1" stop-color="#fffdfd"/></radialGradient>
      <radialGradient id="skEye"><stop offset="0" stop-color="#c2305a"/><stop offset="1" stop-color="#f39ab2"/></radialGradient>
      <linearGradient id="skBark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d3e33"/><stop offset=".55" stop-color="#3b2620"/><stop offset="1" stop-color="#24150f"/></linearGradient>
    </defs>`;
    const main = limb([[-10, 4], [28, 11], [66, 19], [106, 27], [146, 39], [196, 62]], 8.5, 1.6, 7);
    const sub1 = limb([main.at(0.34), [72, 34], [79, 47], [92, 60]], 3.6, 1, 3);
    const sub2 = limb([main.at(0.6), [121, 41], [130, 51], [143, 58]], 3, 0.9, 5);
    const twig1 = limb([main.at(0.45), [92, 15], [97, 6], [101, 0]], 2.4, 0.8, 9);
    const twig2 = limb([main.at(0.78), [164, 41], [176, 40], [186, 42]], 2, 0.7, 11);
    s += sub1.svg + sub2.svg + twig1.svg + twig2.svg + main.svg;
    s += cluster(...main.at(0.18), [6.4, 'b', 5.8], 2);
    s += cluster(...main.at(0.5), [6.8, 7.2, 'b'], 4);
    s += cluster(...main.at(0.7), [6.2, 6.6, 6], 6);
    s += cluster(...main.at(0.9), ['b', 5.4], 8);
    s += cluster(...sub1.at(0.65), [6, 'b', 6.4], 10);
    s += cluster(...sub2.at(0.7), [5.6, 5.8], 12);
    s += cluster(...twig1.at(0.8), [5.4, 'b'], 14);
    s += cluster(...twig2.at(0.85), ['b', 5.2], 16);
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
  #sk canvas.scene { filter: blur(1.1px); }
  /* soft light behind the number and the details so the grove never fights the reading */
  #sk .haze { position: absolute; inset: 0;
    background: radial-gradient(ellipse 110px 62px at 70px 108px, rgba(255,246,249,.6), transparent 70%),
      radial-gradient(ellipse 96px 62px at 232px 112px, rgba(255,246,249,.5), transparent 70%),
      linear-gradient(180deg, rgba(255,244,247,.25), rgba(255,244,247,0) 40%); }
  #sk canvas { position: absolute; inset: 0; width: 300px; height: 180px; }
  #sk canvas.back { filter: blur(1.1px); opacity: .75; }
  #sk svg.branch { position: absolute; left: 0; top: 0; width: 200px; height: 92px; }
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

  /* frame */
  body.sakura #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30;
    box-shadow: inset 0 0 0 1px rgba(200,110,140,.5), inset 0 0 0 4px rgba(255,250,252,.92), inset 0 0 0 5px rgba(214,120,150,.55); }
`,
    html: String.raw`
  <div id="sk" class="stale">
    <canvas class="scene" id="skScene"></canvas>
    <div class="haze"></div>
    <canvas class="back" id="skBack"></canvas>
    <svg class="branch" id="skBranch" viewBox="0 0 200 92"></svg>
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
      paintScene();
      $('skBranch').innerHTML = branch();
      $('skFlower').innerHTML = flower(12, 12, 10.5, 0, 1).split('url(#skPet)').join('currentColor').split('url(#skEye)').join('#fff');
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
