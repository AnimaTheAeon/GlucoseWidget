// @theme {"id": "farm", "name": "Farm Sign", "width": 300, "height": 180}
// Glucose Widget theme: "Farm Sign". Delete this file to remove the theme; put it back to restore it.
(function () {
  // "Farm sign" theme: drawn as real pixel art on a small canvas (130x90), shown at 2x.
  (function () {
    const W = 150; const H = 90;
    const K = '#4a2208'; // dark outline brown

    const FONT = {
      A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
      B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
      C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
      D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
      E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
      F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
      G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
      H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
      I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
      J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
      K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
      L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
      M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
      N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
      O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
      P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
      Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
      R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
      S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
      T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
      U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
      V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
      W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
      X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
      Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
      Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
      0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
      1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
      2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
      3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
      4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
      5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
      6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
      7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
      8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
      9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
      '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
      '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
      ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
      '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
      '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
      ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    };

    const SKY = {
      ok: ['#1b2f7a', '#2346a0', '#2f63c2', '#3f86da', '#58a9ea', '#7cc8f2'],
      high: ['#3a2a6a', '#6a3a7a', '#b0507a', '#e0786a', '#f4a060', '#ffc870'],
      low: ['#2a0a1a', '#4a1022', '#6e1a26', '#952a2a', '#b8402e', '#d0603a'],
      stale: ['#0c1030', '#121a40', '#1a2450', '#222e5a', '#2a3866', '#344472'],
    };
    const CLOUD = {
      ok: ['#ffffff', '#cfe6f5'], high: ['#ffe2c4', '#e8b49a'],
      low: ['#e8a49a', '#b86a60'], stale: ['#5a6488', '#454e70'],
    };
    const WOOD = {
      ok: { base: '#e8a65a', hi: '#f6c886', shade: '#b9692e', grain: '#d18f48', nail: '#6b3a1a' },
      high: { base: '#f2b21f', hi: '#ffd96a', shade: '#b97a0e', grain: '#dc9a16', nail: '#6b3a1a' },
      low: { base: '#d94a3a', hi: '#f17d6c', shade: '#9b2b22', grain: '#c03d2f', nail: '#4a1410' },
      stale: { base: '#a7988a', hi: '#c9bdb0', shade: '#77695d', grain: '#968779', nail: '#4a4038' },
    };
    const TEXT = { ok: '#3f8a2b', high: '#d26a10', low: '#c8312a', stale: '#7a6a58' };
    const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', L: 'def', H: 'bcefg', O: 'abcdef', I: 'bc' };
    const ANGLES = { DoubleUp: -90, SingleUp: -90, FortyFiveUp: -45, Flat: 0, FortyFiveDown: 45, SingleDown: 90, DoubleDown: 90 };

    const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

    function text(g, s, x, y, col, shadow) {
      s = String(s).toUpperCase();
      for (const pass of shadow ? [1, 0] : [0]) {
        let cx = x;
        for (const ch of s) {
          const gl = FONT[ch] || FONT[' '];
          for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
            if (gl[r][c] === '1') P(g, cx + c + pass, y + r + pass, pass ? shadow : col);
          }
          cx += 6;
        }
      }
    }
    const textW = (s) => String(s).length * 6 - 1;

    // Draw any shape from a test function, with a 1px outline around it.
    function shape(g, x0, y0, w, h, inside, color, outline) {
      const m = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = inside(x + 0.5, y + 0.5);
      const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (at(x, y)) P(g, x0 + x, y0 + y, color(x, y));
        else if (outline && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) P(g, x0 + x, y0 + y, outline);
      }
    }

    function sprite(g, rows, x, y, map) {
      rows.forEach((row, r) => [...row].forEach((ch, c) => { if (map[ch]) P(g, x + c, y + r, map[ch]); }));
    }

    // Little wooden box like the menu buttons: dark edge, orange frame, sand inside.
    function box(g, x, y, w, h) {
      R(g, x, y, w, h, K);
      R(g, x + 1, y + 1, w - 2, h - 2, '#b5612a');
      R(g, x + 1, y + 1, w - 2, 1, '#d98a44');
      R(g, x + 1, y + h - 2, w - 2, 1, '#8a4519');
      R(g, x + 2, y + 2, w - 4, h - 4, '#f9e0a6');
      R(g, x + 2, y + 2, w - 4, 1, '#ecc584');
      R(g, x + 2, y + 2, 1, h - 4, '#ecc584');
    }

    function cloud(g, blobs, col) {
      for (const [cx, cy, r] of blobs) {
        shape(g, cx - r - 1, cy - r - 1, r * 2 + 2, r * 2 + 2,
          (x, y) => Math.hypot(x - r - 1, y - r - 1) <= r,
          (x, y) => (y > r + 2 ? col[1] : col[0]), null);
      }
    }

    function star(g, x, y) {
      P(g, x, y, '#ffffff');
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P(g, x + dx, y + dy, '#bcd2ff');
    }

    function ring(g, cx, cy) {
      shape(g, cx - 4, cy - 4, 8, 8, (x, y) => { const r = Math.hypot(x - 4, y - 4); return r >= 1.4 && r <= 3; },
        (x, y) => (y < 4 ? '#f0c88a' : '#c98a4a'), K);
    }

    function leaf(g, x0, y0, deg) {
      const a = deg * Math.PI / 180; const c = Math.cos(a); const s = Math.sin(a);
      const rot = (x, y) => { const dx = x - 6; const dy = y - 5; return [dx * c + dy * s, -dx * s + dy * c]; };
      shape(g, x0, y0, 12, 10, (x, y) => { const [u, v] = rot(x, y); return (u / 4.8) ** 2 + (v / 2.3) ** 2 <= 1; },
        (x, y) => { const [, v] = rot(x + 0.5, y + 0.5); return Math.abs(v) < 0.55 ? '#2e7a24' : v < 0 ? '#86d455' : '#4caf3a'; },
        '#1f4a14');
    }

    function arrow(g, x0, y0, deg, sc) {
      const a = deg * Math.PI / 180; const c = Math.cos(a); const s = Math.sin(a);
      shape(g, x0, y0, 17, 17, (x, y) => {
        const dx = x - 8.5; const dy = y - 8.5;
        const u = dx * c + dy * s; const v = -dx * s + dy * c;
        if (u >= -6 * sc && u <= 0.5 && Math.abs(v) <= 2 * sc) return true;
        return u >= 0 && u <= 6 * sc && Math.abs(v) <= 5 * sc * (1 - u / (6 * sc));
      }, (x, y) => (y < 8 ? '#f8b25a' : '#e07a2a'), K);
    }

    function plank(g, x, y, w, h, p, horiz, seed) {
      R(g, x - 1, y - 1, w + 2, h + 2, K);
      R(g, x, y, w, h, p.base);
      if (horiz) {
        R(g, x, y, w, 1, p.hi); R(g, x, y + h - 1, w, 1, p.shade);
        R(g, x + 3 + (seed % 3), y + 2, w - 9, 1, p.grain);
        P(g, x + 1, y + 2, p.nail); P(g, x + w - 2, y + 2, p.nail);
      } else {
        R(g, x, y, 1, h, p.hi); R(g, x + w - 1, y, 1, h, p.shade);
        R(g, x + 2, y + 3 + (seed % 3), 1, h - 9, p.grain);
        P(g, x + 2, y + 1, p.nail); P(g, x + 2, y + h - 2, p.nail);
      }
    }

    function digit(g, ch, x, y, p, seed) {
      const on = SEG[ch] || '';
      const j = (k) => ((seed * 7 + k * 13) % 3) - 1;
      const V = { f: [x, y, 16], b: [x + 11, y, 16], e: [x, y + 14, 16], c: [x + 11, y + 14, 16] };
      const Hz = { a: [x, y], g: [x, y + 12], d: [x, y + 25] };
      let k = 0;
      for (const s of 'fbec') { k++; if (on.includes(s)) { const [vx, vy, vh] = V[s]; plank(g, vx, vy + j(k), 5, vh, p, false, seed + k); } }
      for (const s of 'agd') { k++; if (on.includes(s)) { const [hx, hy] = Hz[s]; plank(g, hx + j(k), hy, 16, 5, p, true, seed + k); } }
    }

    function bell(g, x, y, snoozed) {
      sprite(g, ['...k...', '..kyk..', '.kyyyk.', '.kyyyk.', '.kyyyk.', 'kkkkkkk', '...k...'], x, y,
        { k: K, y: snoozed ? '#b8a890' : '#f5c13a' });
      if (snoozed) for (let i = 0; i < 7; i++) P(g, x + i, y + i, '#c8312a');
    }

    function gear(g, x, y) {
      shape(g, x, y, 9, 9, (px, py) => {
        const dx = px - 4.5; const dy = py - 4.5; const r = Math.hypot(dx, dy); const t = Math.atan2(dy, dx);
        return (r >= 1.1 && r <= 2.4) || (r > 2.4 && r <= 3.4 && Math.abs(Math.cos(4 * t)) > 0.7);
      }, (px, py) => (py < 4 ? '#d0d4da' : '#9aa0a8'), K);
    }

    // d: { chars, trend, delta, foot, status, statusZone, zone, history, low, high, snoozed }
    window.drawFarm = function drawFarm(canvas, d) {
      canvas.width = W; canvas.height = H;
      const g = canvas.getContext('2d');
      const z = SKY[d.zone] ? d.zone : 'stale';

      // sky in bands, with a dithered edge between bands
      const sky = SKY[z]; const band = H / sky.length;
      for (let y = 0; y < H; y++) {
        const i = Math.min(sky.length - 1, Math.floor(y / band));
        const edge = y - i * band < 2 && i > 0;
        for (let x = 0; x < W; x++) P(g, x, y, edge && (x + y) % 2 ? sky[i - 1] : sky[i]);
      }
      [[70, 4], [84, 9], [95, 3], [104, 8], [78, 11]].forEach(([x, y]) => star(g, x, y));
      cloud(g, [[110, 90, 6], [120, 85, 7], [131, 88, 7], [142, 84, 6], [150, 89, 5]], CLOUD[z]);
      cloud(g, [[66, 92, 4], [73, 89, 5], [80, 92, 4]], CLOUD[z]);

      // the big wooden sign
      const sx = 3; const sy = 15; const sw = 144; const sh = 44;
      R(g, sx, sy, sw, sh, K);
      R(g, sx + 1, sy + 1, sw - 2, sh - 2, '#b5612a');
      R(g, sx + 1, sy + 1, sw - 2, 1, '#d98a44');
      R(g, sx + 1, sy + sh - 2, sw - 2, 1, '#8a4519');
      R(g, sx + 3, sy + 3, sw - 6, sh - 6, K);
      const px0 = sx + 4; const py0 = sy + 4; const pw = sw - 8;
      for (let row = 0; row < 6; row++) {
        const y = py0 + row * 6;
        const h = Math.min(6, sy + sh - 4 - y);
        if (h <= 0) break;
        R(g, px0, y, pw, h, row % 2 ? '#f2c983' : '#f6d08f');
        R(g, px0, y + h - 1, pw, 1, '#d9a25e');
        const joint = px0 + ((row * 37 + 20) % (pw - 10)) + 5;
        R(g, joint, y, 1, h - 1, '#d9a25e');
        for (let n = 0; n < 3; n++) R(g, px0 + ((row * 29 + n * 41 + 7) % (pw - 8)), y + 2 + (n % 2), 5, 1, '#ebbd78');
      }
      R(g, px0, py0, pw, 1, '#c98a4a');
      [[sx + 1, sy + 1], [sx + sw - 2, sy + 1], [sx + 1, sy + sh - 2], [sx + sw - 2, sy + sh - 2]].forEach(([x, y]) => ring(g, x, y));
      leaf(g, -1, sy - 6, -35);
      leaf(g, sx + sw - 11, sy - 6, 35);
      leaf(g, sx + sw - 14, sy + sh - 6, 160);

      // the number, built from nailed planks
      const wood = WOOD[z];
      let x = 14;
      [...d.chars].forEach((ch, i) => { digit(g, ch, x, 21, wood, i + 3); x += 20; });
      if (d.trend in ANGLES) {
        const deg = ANGLES[d.trend];
        if (d.trend.startsWith('Double')) { arrow(g, x - 3, 27, deg, 0.7); arrow(g, x + 7, 27, deg, 0.7); } else arrow(g, x - 1, 27, deg, 1);
      }
      if (d.delta) text(g, d.delta, 141 - textW(d.delta), 25, K, '#e7b672');
      text(g, 'MG/DL', 141 - textW('MG/DL'), 36, '#8a4f1e', null);

      // status box and the three buttons (the real click targets sit on top in HTML)
      const st = String(d.status).toUpperCase().slice(0, 14);
      box(g, 1, 1, textW(st) + 8, 11);
      text(g, st, 5, 3, TEXT[d.statusZone] || TEXT.stale, null);
      [114, 126, 138].forEach((bx) => box(g, bx, 1, 11, 11));
      bell(g, 116, 3, d.snoozed);
      gear(g, 127, 2);
      R(g, 141, 7, 5, 2, K);

      // 3-hour history strip
      box(g, 1, 61, 148, 17);
      const gx = 3; const gy = 63; const gw = 144; const gh = 13;
      const now = Date.now(); const span = 3 * 3600000;
      const pts = (d.history || []).filter((p) => now - p.time <= span);
      const vals = pts.map((p) => p.value);
      const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
      const yOf = (v) => gy + gh - 2 - Math.round(((v - lo) / (hi - lo)) * (gh - 2));
      R(g, gx, yOf(d.high), gw, yOf(d.low) - yOf(d.high), '#d7e8a6');
      for (const p of pts) {
        const c = p.value < d.low ? TEXT.low : p.value > d.high ? TEXT.high : TEXT.ok;
        R(g, gx + Math.round(gw - 2 - ((now - p.time) / span) * (gw - 2)), yOf(p.value), 2, 2, c);
      }

      if (d.foot) text(g, d.foot, 3, 81, '#ffffff', '#1a2050');
    };
  }());

  GlucoseWidget.registerTheme({
    id: 'farm',
    palette: {"ok": "#2e7d32", "high": "#c75b00", "low": "#c62828", "stale": "#8a7a62"},
    css: String.raw`
  /* ---- Farm sign theme (pixel art drawn by farm.js) ---- */
  #farm { display: none; }
  body.farm #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.farm #card > *:not(#farm):not(#top) { display: none; }
  body.farm #farm { display: block; position: absolute; inset: 0; width: 300px; height: 180px; image-rendering: pixelated; }
  body.farm #top { position: absolute; left: 228px; top: 2px; height: 22px; z-index: 2; }
  body.farm #status { display: none; }
  body.farm .btns { gap: 2px; }
  body.farm button { width: 22px; height: 22px; border-radius: 0; color: transparent; background: transparent; }
  body.farm button:hover { background: rgba(255,255,255,.25); }
  body.farm #card.alarm { animation: none; }
  body.farm #card.alarm #farm { animation: fpulse 0.8s ease-in-out 30; }
  @keyframes fpulse { 50% { filter: brightness(1.35) saturate(1.4); } }
`,
    html: String.raw`
  <canvas id="farm"></canvas>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;

      let fs = { low: 'LOW', high: 'HIGH', ok: 'IN RANGE' }[zone] || 'DEXCOM';
      let fz = zone;
      if (s.status === 'setup') { fs = 'LOG IN: GEAR'; fz = 'low'; }
      else if (s.status === 'auth') { fs = 'LOGIN PROBLEM'; fz = 'low'; }
      else if (s.status === 'error') { fs = 'RETRYING'; fz = 'low'; }
      else if (zone === 'stale') fs = 'NO NEW DATA';
      else if (s.status === 'loading') fs = 'CONNECTING';
      else if (s.message) { fs = 'NO READINGS'; fz = 'stale'; }
      if (snoozed) {
        fs = 'SNOOZE ' + new Date(s.snoozeUntil).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s/g, '');
        fz = 'stale';
      }
      const chars = text === 'LOW' ? 'LO' : text === 'HIGH' ? 'HI' : text;
      window.drawFarm($('farm'), {
        chars, trend: showArrow ? r.trend : '', delta: $('delta').textContent.replace('\u2212', '-'),
        foot: r ? (mins < 1 ? 'JUST NOW' : `${mins} MIN AGO`) : '',
        status: fs, statusZone: fz, zone: zone === 'none' ? 'stale' : zone,
        history: s.history, low: s.settings.low, high: s.settings.high, snoozed,
      });
    },
  });
}());
