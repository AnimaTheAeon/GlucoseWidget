// @theme {"id": "washi", "name": "Japanese Ink", "width": 300, "height": 180}
// Glucose Widget theme: "Japanese Ink". Delete this file to remove the theme; put it back to restore it.
// Washi paper, a brush-drawn ensō around your number, the status written in vertical kanji,
// a red seal stamp (血糖, "blood sugar"), seigaiha waves and slow drifting ink mist.
(function () {
  const TATE = { ok: '良好', high: '高値', low: '低値', stale: '無信号' };
  const EN = { ok: 'In range', high: 'High', low: 'Low', stale: 'No signal' };
  let lastStroke = '';

  function waves() {
    // seigaiha: overlapping half-circle wave rings
    let s = '';
    const r = 14;
    for (let row = 0; row < 4; row++) {
      for (let col = -1; col < 13; col++) {
        const cx = col * r * 2 + (row % 2 ? r : 0); const cy = 44 - row * r * 0.55 * 1.0;
        for (const k of [1, 0.72, 0.44]) s += `<circle cx="${cx}" cy="${cy + 6}" r="${r * k}" fill="${k === 1 ? '#efe6d2' : 'none'}" stroke="#2e4a6b" stroke-width="1.1"/>`;
      }
    }
    return s;
  }

  function stroke(s) {
    // the last 3 hours as one brush stroke
    const now = Date.now(); const span = 3 * 3600000;
    const pts = (s.history || []).filter((p) => now - p.time <= span).sort((a, b) => a.time - b.time);
    if (pts.length < 2) return '';
    const vals = pts.map((p) => p.value);
    const lo = Math.min(50, ...vals) - 10; const hi = Math.max(280, ...vals) + 10;
    const X = (t) => ((t - (now - span)) / span) * 76 + 1; const Y = (v) => 31 - ((v - lo) / (hi - lo)) * 28;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.time).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#waBrush)" opacity=".85"/>`;
  }

  GlucoseWidget.registerTheme({
    id: 'washi',
    palette: { ok: '#2e4a6b', high: '#b5651d', low: '#c0392b', stale: '#8a8278' },
    css: String.raw`
  #wa { display: none; }
  body.washi #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.washi #card > *:not(#wa):not(#top) { display: none; }
  body.washi #card.alarm { animation: none; }
  body.washi #top { position: absolute; right: 10px; top: 8px; height: 18px; z-index: 6; }
  body.washi #status { display: none; }
  body.washi .btns { gap: 5px; }
  body.washi button { width: 18px; height: 18px; border-radius: 50%; font-size: 0; position: relative; background: transparent; box-shadow: inset 0 0 0 1px rgba(40,34,28,.35); }
  body.washi button:hover { background: rgba(40,34,28,.08); }
  body.washi #wa { display: block; }
  #wa { position: absolute; inset: 0; overflow: hidden; color: #1d1915;
    font-family: "Yu Mincho", "YuMincho", "MS Mincho", "Hiragino Mincho ProN", "Noto Serif CJK JP", "Noto Serif CJK SC", serif;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .28  0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23p)'/%3E%3C/svg%3E"), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180'%3E%3Cg fill='none' stroke='%23b8a888' stroke-width='.5' opacity='.45'%3E%3Cpath d='M10 30 q20 -6 44 4'/%3E%3Cpath d='M180 20 q16 10 40 2'/%3E%3Cpath d='M240 90 q-12 14 -34 12'/%3E%3Cpath d='M60 140 q24 -8 40 6'/%3E%3Cpath d='M140 70 q10 12 30 8'/%3E%3Cpath d='M270 150 q-20 -4 -30 10'/%3E%3Cpath d='M20 100 q14 6 20 22'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(ellipse at 50% 40%, #f7f1e3 0%, #efe6d2 70%, #e4d8bf 100%); }
  #wa.ok { --ink: #1d1915; --acc: #2e4a6b; } #wa.high { --ink: #6a3d0c; --acc: #b5651d; } #wa.low { --ink: #8e1b12; --acc: #c0392b; } #wa.stale { --ink: #6f6860; --acc: #8a8278; }
  #wa .mist { position: absolute; inset: -20px; opacity: .55; pointer-events: none;
    background: radial-gradient(ellipse at 20% 80%, rgba(120,110,95,.18), transparent 40%), radial-gradient(ellipse at 75% 30%, rgba(120,110,95,.12), transparent 45%);
    animation: mist 26s ease-in-out infinite alternate; }
  @keyframes mist { to { transform: translate(18px, -8px) scale(1.06); } }
  /* seigaiha waves along the bottom */
  #wa .waves { position: absolute; left: 0; right: 0; bottom: 0; height: 40px; opacity: .22;
    -webkit-mask: linear-gradient(transparent, #000 60%); mask: linear-gradient(transparent, #000 60%); }
  /* brush ensō around the number */
  #wa svg.enso { position: absolute; left: 10px; top: 16px; width: 140px; height: 140px; }
  #wa .num { position: absolute; left: 10px; top: 58px; width: 140px; text-align: center; font-size: 48px; font-weight: 600; line-height: 1; color: var(--ink); letter-spacing: 1px; }
  #wa .num.word { font-size: 34px; top: 66px; }
  #wa .unit { position: absolute; left: 10px; top: 108px; width: 140px; text-align: center; font-size: 10px; letter-spacing: 2px; color: #6f6455; font-family: "Segoe UI", sans-serif; }
  /* vertical status in kanji, read top to bottom */
  #wa .tate { position: absolute; left: 160px; top: 30px; writing-mode: vertical-rl; font-size: 24px; font-weight: 700; letter-spacing: 4px; color: var(--ink); }
  #wa .en { position: absolute; left: 194px; top: 34px; font-family: "Segoe UI", sans-serif; font-size: 10px; letter-spacing: 1.5px; color: #6f6455; text-transform: uppercase; }
  #wa .ln { position: absolute; left: 194px; font-size: 12px; color: #3a332b; }
  #wa .ln b { font-size: 17px; color: var(--ink); }
  #wa .ln svg { width: 15px; height: 15px; vertical-align: -2px; color: var(--ink); }
  #wa .l1 { top: 54px; } #wa .l2 { top: 80px; font-family: "Segoe UI", sans-serif; font-size: 11px; }
  #wa .msg { position: absolute; left: 194px; top: 98px; right: 12px; font-family: "Segoe UI", sans-serif; font-size: 10px; color: #8e1b12; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* red hanko seal */
  #wa .hanko { position: absolute; right: 16px; bottom: 30px; width: 40px; height: 40px; transform: rotate(-4deg); }
  /* history as a brush stroke */
  #wa svg.stroke { position: absolute; left: 156px; right: 66px; bottom: 16px; width: 78px; height: 34px; }
  body.washi #card.alarm #wa .hanko { animation: stamp .7s ease-in-out 30; }
  @keyframes stamp { 50% { transform: rotate(-4deg) scale(1.18); filter: brightness(1.2); } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.washi button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 10px; height: 10px;
    background: #2a241e; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.washi #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.washi #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #b5651d; }
  body.washi #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.washi #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }

  /* frame */
  body.washi #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30;
    box-shadow: inset 0 0 0 4px #3b3646, inset 0 0 0 5px #b89a5a, inset 0 0 0 7px #efe6d2, inset 0 0 0 7.8px rgba(29,25,21,.55); }
`,
    html: String.raw`
  <div id="wa" class="stale">
    <div class="mist"></div>
    <svg class="waves" viewBox="0 0 300 40" preserveAspectRatio="xMidYMax slice" id="waWaves"></svg>
    <svg class="enso" viewBox="0 0 140 140">
      <defs><filter id="waBrush" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter></defs>
      <path d="M95.4,22.1 L92.6,20.2 L89.6,18.5 L86.2,17.9 L82.9,17.1 L79.5,16.5 L76.2,16.3 L72.8,15.3 L69.4,14.9 L65.9,14.6 L62.5,15.4 L59.1,15.6 L55.7,16.4 L52.1,16.6 L48.8,17.8 L45.9,19.7 L42.3,20.5 L39.2,22.3 L36.5,24.6 L33.8,26.8 L31.5,29.5 L29.2,32.2 L26.7,34.5 L25.0,37.7 L23.1,40.6 L21.5,43.6 L20.3,46.9 L18.8,49.9 L17.9,53.2 L16.8,56.5 L16.6,59.9 L16.2,63.3 L16.3,66.7 L16.3,70.1 L16.9,73.4 L17.6,76.6 L17.7,80.0 L18.7,83.2 L20.0,86.2 L21.5,89.2 L23.3,91.9 L25.0,94.6 L26.8,97.3 L28.9,99.7 L30.4,102.5 L32.9,104.6 L34.9,107.1 L37.7,108.7 L39.9,111.1 L42.6,112.7 L45.7,113.6 L48.4,115.1 L51.0,117.0 L54.1,117.7 L57.0,119.1 L60.2,119.3 L63.4,119.5 L66.4,120.5 L69.6,120.8 L72.7,120.3 L75.8,119.9 L79.0,119.8 L82.3,119.9 L85.3,118.9 L88.1,117.3 L91.2,116.3 L94.0,114.8 L96.7,113.3 L99.9,112.2 L102.1,109.8 L104.8,108.0 L107.0,105.7 L109.0,103.2 L111.4,101.0 L112.7,98.0 L114.8,95.5 L115.7,92.4 L117.2,89.6 L117.9,86.4 L118.8,83.4 L120.2,80.5 L120.5,77.3 L120.2,74.1 L120.8,70.9 L120.0,67.8 L119.8,64.7 L119.6,61.5 L118.6,58.5 L117.1,55.7 L116.7,52.6 L114.6,50.1 L112.4,51.1 L114.4,53.5 L114.7,56.5 L116.2,59.1 L117.2,61.9 L117.3,64.9 L117.5,67.9 L118.3,70.9 L117.7,73.9 L118.0,76.9 L117.7,79.9 L116.4,82.7 L115.3,85.6 L114.3,88.4 L112.7,90.9 L111.6,93.7 L109.5,95.9 L108.1,98.5 L105.7,100.4 L103.8,102.6 L101.6,104.5 L99.0,106.0 L96.9,108.0 L93.9,108.8 L91.4,110.0 L88.8,111.1 L86.0,111.8 L83.5,113.1 L80.8,113.8 L77.9,113.5 L75.1,113.4 L72.3,113.5 L69.6,113.8 L66.9,113.3 L64.3,112.3 L61.7,111.9 L59.0,111.7 L56.6,110.3 L54.0,109.6 L51.9,107.8 L49.8,106.3 L47.1,105.6 L44.9,104.2 L43.2,102.1 L41.0,100.7 L39.4,98.5 L37.4,96.8 L36.3,94.3 L34.6,92.3 L33.3,90.1 L31.9,87.9 L30.4,85.6 L29.2,83.2 L28.1,80.7 L27.4,78.1 L27.4,75.4 L26.8,72.8 L26.3,70.1 L26.3,67.3 L26.2,64.5 L26.5,61.8 L26.5,59.0 L27.4,56.3 L28.1,53.6 L29.4,51.1 L30.3,48.4 L31.6,45.9 L33.1,43.5 L34.3,40.8 L36.4,38.8 L38.2,36.6 L39.9,34.2 L42.1,32.2 L44.3,30.2 L46.8,28.5 L49.8,27.9 L52.2,26.0 L54.9,24.8 L57.9,24.6 L60.7,23.6 L63.6,23.3 L66.5,22.3 L69.5,22.3 L72.5,22.4 L75.4,22.9 L78.4,23.1 L81.1,24.3 L83.8,25.6 L86.6,26.5 L88.9,28.3 L91.5,29.6 Z" fill="var(--ink)" opacity=".9" filter="url(#waBrush)"/>
      <path d="M84.9,113.6 L87.4,112.9 L89.8,112.0 L92.2,110.9 L94.5,109.8 L96.8,108.5 L98.9,107.0 L101.0,105.5 L103.0,103.8 L105.0,101.9 L106.7,100.0 L108.4,98.0 L110.0,95.8 L111.4,93.6 L112.7,91.3 L113.8,88.8 L114.8,86.4 L115.6,83.9 L116.2,81.3 L116.8,78.7" fill="none" stroke="var(--ink)" stroke-width="0.7" opacity="0.39" stroke-linecap="round"/>
      <path d="M50.3,110.0 L53.9,111.7 L57.6,113.1 L61.4,114.2 L65.2,114.9 L69.2,115.4 L73.2,115.5 L77.2,115.3 L81.2,114.7 L85.2,113.8 L89.1,112.6 L92.9,110.9 L96.5,109.0 L100.0,106.7 L103.2,104.0 L106.2,101.1 L108.9,97.9 L111.3,94.4 L113.3,90.7 L114.9,86.8" fill="none" stroke="var(--ink)" stroke-width="1.3" opacity="0.55" stroke-linecap="round"/>
      <path d="M57.6,115.5 L62.1,116.7 L66.6,117.4 L71.3,117.8 L75.9,117.7 L80.6,117.2 L85.2,116.2 L89.8,114.8 L94.2,112.9 L98.4,110.5 L102.3,107.7 L106.0,104.5 L109.3,101.0 L112.3,97.1 L114.8,92.9 L116.8,88.4 L118.3,83.7 L119.3,79.0 L119.8,74.1 L119.8,69.2" fill="none" stroke="var(--ink)" stroke-width="0.8" opacity="0.40" stroke-linecap="round"/>
      <path d="M68.6,115.9 L73.2,116.1 L77.8,115.9 L82.3,115.1 L86.8,114.0 L91.2,112.4 L95.4,110.3 L99.4,107.8 L103.2,104.9 L106.6,101.5 L109.6,97.9 L112.3,93.9 L114.5,89.6 L116.2,85.1 L117.4,80.5 L118.0,75.7 L118.2,71.0 L117.8,66.2 L116.9,61.6 L115.6,57.1" fill="none" stroke="var(--ink)" stroke-width="1.2" opacity="0.59" stroke-linecap="round"/>
      <path d="M75.0,117.0 L79.2,116.6 L83.3,115.8 L87.4,114.7 L91.4,113.3 L95.2,111.4 L98.9,109.2 L102.4,106.7 L105.6,103.8 L108.6,100.7 L111.2,97.2 L113.5,93.5 L115.4,89.6 L117.0,85.5 L118.1,81.3 L118.8,77.0 L119.1,72.7 L119.0,68.4 L118.4,64.1 L117.4,59.9" fill="none" stroke="var(--ink)" stroke-width="0.8" opacity="0.59" stroke-linecap="round"/>
    </svg>
    <div class="num" id="waNum">---</div><div class="unit">mg/dL</div>
    <div class="tate" id="waTate">無信号</div>
    <div class="en" id="waEn">No signal</div>
    <div class="ln l1"><span id="waArrow"></span> <b id="waDelta"></b></div>
    <div class="ln l2" id="waAgo"></div>
    <div class="msg" id="waMsg"></div>
    <svg class="stroke" viewBox="0 0 78 34" id="waStroke"></svg>
    <svg class="hanko" viewBox="0 0 40 40">
      <defs><filter id="waInk"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1.45" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>
      <g filter="url(#waInk)">
        <rect x="2" y="2" width="36" height="36" rx="4" fill="var(--acc)"/>
        <rect x="5" y="5" width="30" height="30" rx="2.5" fill="none" stroke="#f3ead6" stroke-width="1.6"/>
        <text x="20" y="18" text-anchor="middle" font-size="11.5" font-weight="700" fill="#f3ead6" font-family="Yu Mincho, MS Mincho, Noto Serif CJK JP, serif">血</text>
        <text x="20" y="31" text-anchor="middle" font-size="11.5" font-weight="700" fill="#f3ead6" font-family="Yu Mincho, MS Mincho, Noto Serif CJK JP, serif">糖</text>
      </g>
    </svg>
  </div>
`,
    init() { $('waWaves').innerHTML = waves(); },
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('wa').className = z;
      $('waNum').textContent = text;
      $('waNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('waTate').textContent = TATE[z];
      $('waEn').textContent = EN[z];
      $('waArrow').innerHTML = showArrow && r.trend in ANGLES
        ? `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${arrowSvg(r.trend)}</svg>` : '';
      $('waDelta').textContent = $('delta').textContent;
      $('waAgo').textContent = r ? (mins < 1 ? 'just now' : `${mins} min ago`) : '';
      $('waMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st : '';
      const sk = stroke(s);
      if (sk !== lastStroke) { lastStroke = sk; $('waStroke').innerHTML = sk; }
    },
  });
}());
