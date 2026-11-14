// Alert sounds made with Web Audio, so there are no sound files to lose.
let audioCtx = null;

function tone(freq, at, dur, volume, type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

// type: 'low' (urgent triple beeps), 'high' (ding-dong), anything else (two soft beeps)
function playAlert(type, volume) {
  const v = Math.min(1, Math.max(0, Number(volume)));
  if (!v) return;
  if (!audioCtx) audioCtx = new AudioContext();
  audioCtx.resume();
  const t = audioCtx.currentTime + 0.05;
  if (type === 'low') {
    for (let group = 0; group < 3; group++) {
      for (let i = 0; i < 3; i++) tone(988, t + group * 1.1 + i * 0.25, 0.2, v, 'triangle');
    }
  } else if (type === 'high') {
    for (let group = 0; group < 2; group++) {
      tone(784, t + group * 1.2, 0.45, v);
      tone(1047, t + group * 1.2 + 0.3, 0.7, v);
    }
  } else {
    tone(440, t, 0.35, v);
    tone(440, t + 0.5, 0.35, v);
  }
}
