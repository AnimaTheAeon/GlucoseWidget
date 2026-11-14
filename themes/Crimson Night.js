// @theme {"id": "crimson", "name": "Crimson Night", "width": 300, "height": 180}
// Glucose Widget theme: "Crimson Night". Delete this file to remove the theme; put it back to restore it.
// A gritty rooftop at night: rain, a dark skyline, a stone gargoyle on the ledge,
// and a red targeting reticle locked on your number.
(function () {
  const COL = { ok: '#e1212b', high: '#ff8a1f', low: '#ff1a1a', stale: '#6a6466' };

  GlucoseWidget.registerTheme({
    id: 'crimson',
    palette: { ok: COL.ok, high: COL.high, low: COL.low, stale: COL.stale },
    css: String.raw`
  #cn { display: none; }
  body.crimson #card { inset: 0; padding: 0; border: 0; border-radius: 0; background: transparent; }
  body.crimson #card > *:not(#cn):not(#top) { display: none; }
  body.crimson #card.alarm { animation: none; }
  body.crimson #top { position: absolute; right: 10px; top: 8px; height: 15px; z-index: 5; }
  body.crimson #status { display: none; }
  body.crimson .btns { gap: 4px; }
  body.crimson button { width: 16px; height: 15px; border-radius: 0; font-size: 0; position: relative; background: rgba(0,0,0,.45); box-shadow: inset 0 0 0 1px #6a1a20; }
  body.crimson button::before { position: absolute; inset: 0; font: 700 9px/15px Bahnschrift, "Arial Narrow", sans-serif; color: #e9e4e4; text-align: center; }
  body.crimson #snooze::before { content: "Z"; } body.crimson #gear::before { content: "S"; } body.crimson #min::before { content: "\2013"; }
  body.crimson button:hover { box-shadow: inset 0 0 0 1px #e1212b; }
  body.crimson button.on::before { color: #ff8a1f; }
  body.crimson #cn { display: block; }
  #cn { position: absolute; inset: 0; overflow: hidden; color: #ece6e6; font-family: Bahnschrift, "Arial Narrow", "Segoe UI", sans-serif;
    background: radial-gradient(ellipse at 78% 18%, rgba(160,20,30,.35), transparent 45%), linear-gradient(180deg, #0a0a0e 0%, #141218 55%, #1e0a0e 100%); }
  #cn.ok { --cc: #e1212b; } #cn.high { --cc: #ff8a1f; } #cn.low { --cc: #ff1a1a; } #cn.stale { --cc: #6a6466; }
  #cn .moon { position: absolute; right: 54px; top: 18px; width: 26px; height: 26px; border-radius: 50%; background: radial-gradient(circle at 40% 40%, #f2e6d8, #b8a898 70%);
    box-shadow: 0 0 18px rgba(242,230,216,.25); opacity: .55; }
  #cn .rain { position: absolute; inset: -40px 0 0 0; opacity: .5;
    background: repeating-linear-gradient(104deg, rgba(220,220,235,.10) 0 1px, transparent 1px 9px), repeating-linear-gradient(98deg, rgba(220,220,235,.06) 0 1px, transparent 1px 13px);
    animation: rain .6s linear infinite; }
  @keyframes rain { from { transform: translate(0, 0); } to { transform: translate(-8px, 40px); } }
  #cn svg.city { position: absolute; left: 0; right: 0; bottom: 0; width: 300px; height: 70px; }
  #cn .glow { position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: linear-gradient(transparent, color-mix(in srgb, var(--cc) 22%, transparent)); }
  #cn .slash { position: absolute; left: -30px; top: 122px; width: 380px; height: 4px; transform: rotate(-7deg);
    background: linear-gradient(90deg, transparent, var(--cc) 25%, var(--cc) 75%, transparent); box-shadow: 0 0 10px var(--cc); opacity: .7; }
  #cn .ret { position: absolute; left: 16px; top: 18px; width: 120px; height: 120px; }
  #cn .ret .spin { transform-origin: 60px 60px; animation: spin 14s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  #cn .num { position: absolute; left: 16px; top: 52px; width: 120px; text-align: center; font-family: Impact, "Arial Black", Bahnschrift, sans-serif;
    font-size: 46px; line-height: 1; letter-spacing: 1px; color: #f4f0f0; text-shadow: 2px 2px 0 #000, 0 0 16px rgba(0,0,0,.9); }
  #cn .num.word { font-size: 32px; top: 60px; }
  #cn .unit { position: absolute; left: 16px; top: 100px; width: 120px; text-align: center; font-size: 9px; letter-spacing: 3px; color: #b8aeae; }
  #cn .side { position: absolute; left: 152px; top: 34px; right: 12px; }
  #cn .tag { display: inline-block; padding: 3px 10px; font-size: 12px; font-weight: 700; letter-spacing: 3px; background: var(--cc); color: #0a0a0e;
    clip-path: polygon(6% 0, 100% 0, 94% 100%, 0 100%); }
  #cn .ln { margin-top: 8px; font-size: 10px; letter-spacing: 2px; color: #b8aeae; }
  #cn .big { font-size: 19px; color: #f4f0f0; letter-spacing: 1px; }
  #cn .ar { display: inline-block; width: 17px; height: 17px; vertical-align: -3px; color: var(--cc); }
  #cn .msg { margin-top: 6px; font-size: 10px; letter-spacing: 1.5px; color: #ffb0a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  body.crimson #card.alarm #cn .ret { animation: retflash .5s steps(2) 50; }
  @keyframes retflash { 50% { filter: brightness(2) drop-shadow(0 0 8px var(--cc)); } }

  /* icon buttons: bell = snooze (crossed out while snoozed), gear = settings, arrow-into-tray = hide */
  body.crimson button::before { content: "" !important; position: absolute; inset: 0; margin: auto; width: 10px; height: 10px;
    background: #e9e4e4; -webkit-mask: var(--gwi) center / contain no-repeat; mask: var(--gwi) center / contain no-repeat; }
  body.crimson #snooze::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3C/svg%3E"); }
  body.crimson #snooze.on::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cdefs%3E%3Cmask%20id='m'%3E%3Crect%20width='24'%20height='24'%20fill='white'/%3E%3Cpath%20d='M2,2%20L22,22'%20stroke='black'%20stroke-width='4.6'/%3E%3C/mask%3E%3C/defs%3E%3Cpath%20fill='black'%20mask='url(%23m)'%20d='M12,2.2%20a1.5,1.5%200%200%201%201.5,1.5%20v.7%20A6.3,6.3%200%200%201%2018.3,10.6%20v4.2%20l2,2.4%20v1.2%20H3.7%20v-1.2%20l2,-2.4%20v-4.2%20A6.3,6.3%200%200%201%2010.5,4.4%20v-.7%20A1.5,1.5%200%200%201%2012,2.2%20Z%20M9.4,19.8%20h5.2%20a2.6,2.6%200%200%201%20-5.2,0%20Z'/%3E%3Cpath%20d='M3,3%20L21,21'%20stroke='black'%20stroke-width='2.2'%20stroke-linecap='round'/%3E%3C/svg%3E"); background: #ff8a1f; }
  body.crimson #gear::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20fill='black'%20fill-rule='evenodd'%20d='M19.11,9.32%20L22.39,9.89%20L22.39,14.11%20L19.11,14.68%20L18.92,15.14%20L20.84,17.86%20L17.86,20.84%20L15.14,18.92%20L14.68,19.11%20L14.11,22.39%20L9.89,22.39%20L9.32,19.11%20L8.86,18.92%20L6.14,20.84%20L3.16,17.86%20L5.08,15.14%20L4.89,14.68%20L1.61,14.11%20L1.61,9.89%20L4.89,9.32%20L5.08,8.86%20L3.16,6.14%20L6.14,3.16%20L8.86,5.08%20L9.32,4.89%20L9.89,1.61%20L14.11,1.61%20L14.68,4.89%20L15.14,5.08%20L17.86,3.16%20L20.84,6.14%20L18.92,8.86%20Z%20M12,8.6%20A3.4,3.4%200%201%200%2012,15.4%20A3.4,3.4%200%201%200%2012,8.6%20Z'/%3E%3C/svg%3E"); }
  body.crimson #min::before { --gwi: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M12,3.5%20V13.5%20M7.2,9%20L12,13.8%20L16.8,9'%20fill='none'%20stroke='black'%20stroke-width='2.6'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M4,18.5%20H20'%20stroke='black'%20stroke-width='2.8'%20stroke-linecap='round'/%3E%3C/svg%3E"); }

  /* frame */
  body.crimson #card::after { content: ""; position: absolute; inset: 0; border-radius: 8px; pointer-events: none; z-index: 30;
    box-shadow: inset 0 0 0 1px #000, inset 0 0 0 3px #1c1a1e, inset 0 0 0 4px rgba(225,33,43,.8), inset 0 0 0 5px #0a0a0e, inset 0 0 16px rgba(225,33,43,.18); }
`,
    html: String.raw`
  <div id="cn" class="stale">
    <div class="moon"></div>
    <div class="rain"></div>
    <div class="glow"></div>
    <svg class="city" viewBox="0 0 300 70" preserveAspectRatio="none">
      <path fill="#07070a" d="M0,70 L0,40 L12,40 L12,28 L22,28 L22,36 L34,36 L34,18 L40,12 L46,18 L46,36 L60,36 L60,30 L74,30 L74,42 L88,42 L88,22 L100,22 L100,34 L114,34 L114,10 L120,4 L126,10 L126,32 L142,32 L142,40 L158,40 L158,24 L172,24 L172,36 L188,36 L188,14 L200,14 L200,34 L216,34 L216,28 L230,28 L230,40 L246,40 L246,20 L258,20 L258,32 L274,32 L274,26 L288,26 L288,38 L300,38 L300,70 Z"/>
      <g fill="#e1212b" opacity=".75"><rect x="38" y="24" width="2" height="2"/><rect x="118" y="16" width="2" height="2"/><rect x="192" y="20" width="2" height="2"/><rect x="250" y="26" width="2" height="2"/><rect x="92" y="28" width="2" height="2"/></g>
      <!-- stone ledge and a crouching gargoyle -->
      <path fill="#030304" d="M206,70 L206,56 L300,56 L300,70 Z"/>
      <path fill="#030304" d="M248,56 C247,49 250,44 255,42 C254,38 255,34 258,32 L256,26 L261,31 C263,30 266,30 268,31 L273,26 L271,32 C274,34 275,38 274,42 C279,44 282,49 281,56 Z M252,46 C244,42 238,38 234,30 C241,33 246,36 252,40 Z M277,46 C285,42 291,38 295,30 C288,33 283,36 277,40 Z"/>
    </svg>
    <div class="slash"></div>
    <svg class="ret" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="44" fill="rgba(0,0,0,.42)"/>
      <g class="spin"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--cc)" stroke-width="2" stroke-dasharray="58 24" opacity=".9"/></g>
      <circle cx="60" cy="60" r="42" fill="none" stroke="var(--cc)" stroke-width="1" stroke-dasharray="2 5" opacity=".7"/>
      <g stroke="var(--cc)" stroke-width="2.4"><line x1="60" y1="0" x2="60" y2="16"/><line x1="60" y1="104" x2="60" y2="120"/><line x1="0" y1="60" x2="16" y2="60"/><line x1="104" y1="60" x2="120" y2="60"/></g>
    </svg>
    <div class="num" id="cnNum">---</div><div class="unit">MG/DL</div>
    <div class="side">
      <span class="tag" id="cnTag">NO SIGNAL</span>
      <div class="ln">TREND <span class="ar" id="cnArrow"></span> <span class="big" id="cnDelta"></span></div>
      <div class="ln">LAST SEEN<br><span class="big" id="cnAgo">--</span></div>
      <div class="msg" id="cnMsg"></div>
    </div>
  </div>
`,
    render(c) {
      const { s, r, zone, text, showArrow, mins, snoozed, st, bad } = c;
      const z = zone === 'none' ? 'stale' : zone;
      $('cn').className = z;
      $('cnNum').textContent = text;
      $('cnNum').classList.toggle('word', text === 'LOW' || text === 'HIGH');
      $('cnTag').textContent = { ok: 'IN RANGE', high: 'HIGH', low: 'LOW', stale: 'NO SIGNAL' }[z];
      $('cnArrow').innerHTML = showArrow && r.trend in ANGLES
        ? `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${arrowSvg(r.trend)}</svg>` : '—';
      $('cnDelta').textContent = $('delta').textContent;
      $('cnAgo').textContent = r ? (mins < 1 ? 'JUST NOW' : `${mins} MIN AGO`) : '--';
      $('cnMsg').textContent = snoozed || bad || (s.status !== 'ok' && z !== 'stale') ? st.toUpperCase() : '';
    },
  });
}());
