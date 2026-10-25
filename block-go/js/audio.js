import { state } from './state.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, { dur = 0.12, type = 'sine', gain = 0.15, delay = 0, slide = 0 } = {}) {
  if (!state.settings.sound) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  tap: () => tone(660, { dur: 0.06, type: 'triangle', gain: 0.08 }),
  pick: () => tone(520, { dur: 0.08, type: 'triangle', gain: 0.1, slide: 1.3 }),
  place: () => { tone(220, { dur: 0.1, type: 'square', gain: 0.06 }); tone(330, { dur: 0.08, type: 'triangle', gain: 0.08, delay: 0.02 }); },
  bad: () => tone(160, { dur: 0.18, type: 'sawtooth', gain: 0.06, slide: 0.7 }),
  clear: (lines = 1) => {
    const base = [523, 659, 784, 1047, 1319];
    for (let i = 0; i < Math.min(lines + 2, 5); i++) tone(base[i], { dur: 0.16, type: 'triangle', gain: 0.1, delay: i * 0.06 });
  },
  coin: () => { tone(988, { dur: 0.07, type: 'square', gain: 0.05 }); tone(1319, { dur: 0.12, type: 'square', gain: 0.05, delay: 0.06 }); },
  smash: () => tone(120, { dur: 0.25, type: 'sawtooth', gain: 0.12, slide: 0.4 }),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { dur: 0.25, type: 'triangle', gain: 0.12, delay: i * 0.1 })),
};

export function buzz(ms = 15) {
  if (state.settings.haptics && navigator.vibrate) navigator.vibrate(ms);
}
