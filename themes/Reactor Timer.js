// @theme {"id": "reactor", "name": "Reactor Timer", "width": 300, "height": 180}
// Glucose Widget theme: "Reactor Timer". Delete this file to remove the theme; put it back to restore it.
(function () {
  const RC = { ok: '#e8f0ff', high: '#ffc000', low: '#ff3030', stale: '#7d86a0', none: '#7d86a0' };
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', L: 'def', H: 'bcefg' };
  const segH = (x1, x2, cy, t = 8) => `${x1},${cy} ${x1 + t / 2},${cy - t / 2} ${x2 - t / 2},${cy - t / 2} ${x2},${cy} ${x2 - t / 2},${cy + t / 2} ${x1 + t / 2},${cy + t / 2}`;
  const segV = (cx, y1, y2, t = 8) => `${cx},${y1} ${cx + t / 2},${y1 + t / 2} ${cx + t / 2},${y2 - t / 2} ${cx},${y2} ${cx - t / 2},${y2 - t / 2} ${cx - t / 2},${y1 + t / 2}`;
  const SHAPES = { a: segH(5, 35, 4), g: segH(5, 35, 36), d: segH(5, 35, 68), f: segV(4, 5, 35), b: segV(36, 5, 35), e: segV(4, 37, 67), c: segV(36, 37, 67) };
  let lastSegKey = '';
  let lastTimerKey = '';

  function digit(ch, col, scale) {
    const on = SEG[ch] || '';
    return `<svg width="${40 * scale}" height="${72 * scale}" viewBox="0 0 40 72" style="filter:drop-shadow(0 0 ${3 * scale + 1}px ${col})">`
      + Object.keys(SHAPES).map((k) => `<polygon points="${SHAPES[k]}" fill="${on.includes(k) ? col : 'rgba(255,255,255,.07)'}"/>`).join('')
      + '</svg>';
  }
  function colon(col, scale) {
    return `<svg width="${14 * scale}" height="${72 * scale}" viewBox="0 0 14 72"><rect x="3" y="20" width="8" height="8" fill="${col}"/><rect x="3" y="46" width="8" height="8" fill="${col}"/></svg>`;
  }
  function arrow(trend) {
    if (!(trend in ANGLES)) return '';
    const one = (dx, sc) => `<polygon stroke="none" fill="currentColor" transform="translate(${dx} 0) rotate(${ANGLES[trend]} 14 14) translate(14 14) scale(${sc}) translate(-14 -14)" points="3,11 15,11 15,5 25,14 15,23 15,17 3,17"/>`;
    return trend.startsWith('Double') ? one(-7, 0.62) + one(7, 0.62) : one(0, 1);
  }
  // Counts down to the next reading (one is due every 5 minutes); counts up as LATE if it does not arrive.
  function timerParts(s, zone, now) {
    const r = s.reading;
    if (!r) return { label: '', text: '--:--' };
    const over = now - (r.time + 5 * 60000);
    const late = over >= 90000 || zone === 'stale';
    const secs = Math.min(5999, Math.floor(Math.max(0, late ? over : -over) / 1000));
    const two = (n) => String(n).padStart(2, '0');
    return { label: late ? 'LATE' : 'NEXT', text: `${two(Math.floor(secs / 60))}:${two(secs % 60)}` };
  }
  function renderTimer(c) {
    const col = RC[c.zone] || RC.none;
    const t = timerParts(c.s, c.zone, Date.now());
    const key = t.label + t.text + col;
    if (key === lastTimerKey) return;
    lastTimerKey = key;
    $('tl').textContent = t.label || ' ';
    $('timer').innerHTML = t.text.split('').map((ch) => (ch === ':' ? colon(col, 0.24) : digit(ch, col, 0.24))).join('');
  }

  GlucoseWidget.registerTheme({
    id: 'reactor',
    palette: { ok: '#e8f0ff', high: '#ffc000', low: '#ff3030', stale: '#7d86a0' },
    css: String.raw`
  /* ---- Reactor timer theme ---- */
  body.reactor .ok { --c: #e8f0ff; } body.reactor .high { --c: #ffc000; } body.reactor .low { --c: #ff3030; }
  body.reactor .stale, body.reactor .none { --c: #7d86a0; }
  body.reactor #card { border-radius: 7px; padding: 7px 11px; border: 2px solid #d4d8e0;
    background: linear-gradient(160deg, #1436b8 0%, #0a1f7a 45%, #020830 100%);
    box-shadow: inset 0 0 0 1px #3a4058; color: #e8f0ff; }
  body.reactor #card.high { box-shadow: inset 0 0 0 1px #3a4058, inset 0 0 12px rgba(255,192,0,.45), 0 0 4px 1px rgba(255,192,0,.7); }
  body.reactor #card.low { box-shadow: inset 0 0 0 1px #3a4058, inset 0 0 14px rgba(255,48,48,.6), 0 0 4px 1px rgba(255,48,48,.9); }
  body.reactor #card.alarm { animation: rpulse 0.8s ease-in-out 30; }
  @keyframes rpulse { 50% { box-shadow: inset 0 0 0 1px #3a4058, inset 0 0 34px 8px var(--c), 0 0 4px 1px var(--c); } }
  body.reactor #top { height: 16px; }
  body.reactor #status { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--c); text-shadow: 1px 1px 0 #000; }
  body.reactor #status.bad { color: #ff9a9c; }
  body.reactor #card.stale #status.bad { color: var(--c); }
  body.reactor button { color: #aab4d0; height: 16px; }
  body.reactor button.on { color: #ffc000; }
  body.reactor #main { height: 72px; margin-top: 24px; gap: 10px; }
  body.reactor #card { padding: 12px 16px; }
  body.reactor #value, body.reactor canvas, body.reactor #foot { display: none; }
  body.reactor #segs { display: flex; gap: 5px; transform: skewX(-5deg); flex: none; }
  body.reactor #arrow { width: 30px; height: 30px; margin-left: 2px; filter: drop-shadow(1px 1px 0 #000); }
  body.reactor #side { font-size: 10px; letter-spacing: 1px; color: #aab4d0; text-shadow: 1px 1px 0 #000; line-height: 1.3; }
  body.reactor #delta { letter-spacing: 0; min-height: 18px; }
  body.reactor .ronly { display: block; }
  body.reactor #tl { margin-top: 5px; }
  body.reactor #timer { display: flex; gap: 2px; justify-content: flex-end; align-items: center; margin-top: 2px; transform: skewX(-5deg); }
`,
    html: '',
    render(c) {
      $('arrow').innerHTML = c.showArrow ? arrow(c.r.trend) : '';
      const chars = c.text === 'LOW' ? ' L0' : c.text === 'HIGH' ? ' H1' : c.text.padStart(3, ' ');
      const col = RC[c.zone] || RC.none;
      if (chars + col !== lastSegKey) {
        lastSegKey = chars + col;
        $('segs').innerHTML = chars.split('').map((ch) => digit(ch, col, 0.95)).join('');
      }
      renderTimer(c);
    },
    tick(c) { renderTimer(c); },
  });
}());
