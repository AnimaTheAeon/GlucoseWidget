// First-run setup guide. Walks a new user through turning on Dexcom Share, logging in,
// choosing alerts and a look, then saves everything with the same calls the Settings page uses.
const $ = (id) => document.getElementById(id);
const steps = [...document.querySelectorAll('section')];
let current = 0;
let settings = {};
let sensor = '';
let tested = false;

function visibleSteps() {
  // Nightscout users skip the phone/Share step
  return steps.filter((s) => !(sensor === 'ns' && s.dataset.step === 'phone'));
}

function show(i) {
  const list = visibleSteps();
  current = Math.max(0, Math.min(list.length - 1, i));
  for (const s of steps) s.classList.toggle('on', s === list[current]);
  $('dots').innerHTML = list.map((_, k) => `<i class="${k <= current ? 'on' : ''}"></i>`).join('');
  $('count').textContent = `Step ${current + 1} of ${list.length}`;
  $('back').style.visibility = current === 0 ? 'hidden' : 'visible';
  const step = list[current].dataset.step;
  $('next').textContent = step === 'done' ? 'Finish' : step === 'welcome' ? "Let's start" : 'Next';
  $('skip').style.display = step === 'done' ? 'none' : '';
  updateNext();
}

function updateNext() {
  const step = visibleSteps()[current].dataset.step;
  let ok = true;
  if (step === 'sensor') ok = sensor !== '' && sensor !== 'stelo';
  if (step === 'login') ok = tested;
  $('next').disabled = !ok;
  if (step === 'login' && !tested) $('next').title = 'Test the connection first';
  else $('next').title = '';
}

// ---- sensor choice ----
for (const b of document.querySelectorAll('.choice')) {
  b.onclick = () => {
    sensor = b.dataset.sensor;
    for (const x of document.querySelectorAll('.choice')) x.classList.toggle('sel', x === b);
    $('steloNote').hidden = sensor !== 'stelo';
    const ns = sensor === 'ns';
    $('shareBox').hidden = ns;
    $('nsBox').hidden = !ns;
    $('loginTitle').textContent = ns ? 'Connect to Nightscout' : 'Log in to Dexcom';
    tab(sensor === 'g6' ? 'g6' : 'g7');
    tested = false;
    $('result').textContent = '';
    updateNext();
  };
}

// ---- G7 / G6 instructions ----
function tab(name) {
  for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('sel', b.dataset.tab === name);
  $('tab-g7').hidden = name !== 'g7';
  $('tab-g6').hidden = name !== 'g6';
}
for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => tab(b.dataset.tab);

// ---- form ----
function form() {
  const f = { ...settings };
  delete f.themes; delete f.hasPassword; delete f.hasNsSecret; delete f.canEncrypt;
  f.source = sensor === 'ns' ? 'nightscout' : 'share';
  f.username = $('username').value.trim();
  f.password = $('password').value;
  f.region = $('region').value;
  f.nsUrl = $('nsUrl').value.trim();
  f.nsSecret = $('nsSecret').value;
  f.low = $('low').value;
  f.high = $('high').value;
  f.volume = $('volume').value;
  f.theme = $('theme').value;
  f.minToTray = $('minToTray').checked;
  return f;
}

function say(text, good) {
  $('result').textContent = text;
  $('result').className = good ? 'good' : 'bad';
}

for (const id of ['username', 'password', 'region', 'nsUrl', 'nsSecret']) {
  $(id).addEventListener('input', () => { tested = false; updateNext(); });
}

$('test').onclick = async () => {
  const f = form();
  if (f.source === 'share' && (!f.username || (!f.password && !settings.hasPassword))) { say('Type your username and password first.', false); return; }
  if (f.source === 'nightscout' && !f.nsUrl) { say('Type your Nightscout address first.', false); return; }
  say('Checking…', true);
  $('test').disabled = true;
  const r = await window.api.testSettings(f);
  $('test').disabled = false;
  if (!r || !r.ok) {
    tested = false;
    say('That did not work: ' + ((r && r.message) || 'unknown problem') + (f.source === 'share' ? ' Check the username and password, and the "Where you live" box.' : ''), false);
  } else if (r.empty) {
    tested = true;
    say('Login worked! But there are no readings from the last 3 hours yet. Go back a step and check that Share is on and a follower has accepted. You can still continue.', false);
  } else {
    tested = true;
    say(`It works! Your latest reading is ${Math.round(r.value)} mg/dL, from ${r.ageMin} min ago.`, true);
  }
  updateNext();
};

for (const b of document.querySelectorAll('[data-sound]')) {
  b.onclick = () => playAlert(b.dataset.sound, $('volume').value);
}

// ---- navigation ----
$('back').onclick = () => show(current - 1);
$('next').onclick = async () => {
  const step = visibleSteps()[current].dataset.step;
  if (step === 'done') {
    $('next').disabled = true;
    await window.api.saveSettings(form());
    window.api.closeWelcome();
    return;
  }
  show(current + 1);
};
$('skip').onclick = () => window.api.closeWelcome();
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !$('next').disabled && document.activeElement.tagName !== 'BUTTON') $('next').click();
});

// ---- start ----
window.api.loadSettings().then((s) => {
  settings = s || {};
  $('theme').innerHTML = '';
  for (const t of settings.themes || []) {
    const o = document.createElement('option');
    o.value = t.id; o.textContent = t.name;
    $('theme').appendChild(o);
  }
  $('theme').value = settings.theme || 'Classic';
  $('username').value = settings.username || '';
  $('region').value = settings.region || 'us';
  $('nsUrl').value = settings.nsUrl || '';
  $('low').value = settings.low || 70;
  $('high').value = settings.high || 250;
  $('volume').value = settings.volume != null ? settings.volume : 0.8;
  $('minToTray').checked = settings.minToTray !== false;
  if (settings.hasPassword) $('password').placeholder = '(saved — leave empty to keep it)';
  if (settings.source === 'nightscout') document.querySelector('[data-sensor="ns"]').click();
  show(0);
});
