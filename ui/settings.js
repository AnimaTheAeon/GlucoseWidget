const $ = (id) => document.getElementById(id);
const FIELDS = ['theme', 'source','username', 'region', 'nsUrl', 'low', 'high', 'repeatLow', 'repeatHigh', 'staleMin', 'snoozeMin', 'volume', 'glassAmount'];

function form() {
  const f = { password: $('password').value, nsSecret: $('nsSecret').value };
  for (const k of FIELDS) f[k] = $(k).value;
  f.minToTray = $('minToTray').checked;
  f.glassClear = $('glassClear').checked;
  return f;
}

function showSource() {
  const ns = $('source').value === 'nightscout';
  $('nsBox').hidden = !ns;
  $('shareBox').hidden = ns;
}

function say(text, good) {
  $('result').textContent = text;
  $('result').className = good ? 'good' : 'bad';
}

function loadAll() {
  $('password').value = ''; $('nsSecret').value = ''; $('result').textContent = '';
  return window.api.loadSettings().then((s) => {
  $('theme').innerHTML = '';
  for (const t of s.themes || []) {
    const o = document.createElement('option');
    o.value = t.id; o.textContent = t.name;
    $('theme').appendChild(o);
  }
  for (const k of FIELDS) $(k).value = s[k];
  $('minToTray').checked = Boolean(s.minToTray);
  $('glassClear').checked = Boolean(s.glassClear);
  showGlass();
  showSource();
  $('pwHint').textContent = s.hasPassword
    ? 'A password is already saved. Leave this empty to keep it.'
    : (s.canEncrypt ? 'Saved on this PC only, scrambled by Windows.' : 'This PC cannot store it safely, so you will be asked again after a restart.');
  if (s.hasNsSecret) $('nsSecret').placeholder = '(saved)';
  });
}
loadAll();
if (window.api.on) window.api.on('refresh', loadAll);

$('source').onchange = showSource;
function showGlass() { $('glassBox').style.opacity = $('theme').value === 'Dark Glass' ? '1' : '.45'; }
$('theme').onchange = showGlass;

$('test').onclick = async () => {
  say('Checking…', true);
  $('test').disabled = true;
  const r = await window.api.testSettings(form());
  $('test').disabled = false;
  if (!r.ok) say('Did not work: ' + r.message, false);
  else if (r.empty) say('Login worked, but there are no readings from the last 3 hours. Check that Share is turned on in the Dexcom app.', false);
  else say(`It works! Latest reading: ${r.value} mg/dL, ${r.ageMin} min ago.`, true);
};

for (const b of document.querySelectorAll('[data-sound]')) {
  b.onclick = () => playAlert(b.dataset.sound, $('volume').value);
}

$('cancel').onclick = () => window.api.closeSettings();
$('save').onclick = async () => {
  await window.api.saveSettings(form());
  window.api.closeSettings();
};
