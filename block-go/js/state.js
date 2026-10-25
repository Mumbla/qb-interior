import { emptyBoard } from './board.js';
import { randomPiece } from './pieces.js';

const KEY = 'blockgo.save.v1';
const listeners = new Set();

function makePlayerId() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'BG-' + Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join('');
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

function fresh() {
  return {
    name: 'Player',
    avatar: 0,
    playerId: makePlayerId(),
    coins: 25000,
    stars: 0,
    shields: 3,
    energy: 500,
    energyMax: 100,
    lastEnergyTick: Date.now(),
    bet: 1,
    boosters: { hammer: 5, single: 3, rotate: 5, trash: 3 },
    board: emptyBoard(),
    piece: randomPiece(),
    next: randomPiece(),
    combo: 0,
    bestScore: 0,
    runScore: 0,
    linesTotal: 0,
    event: { tokens: 0, goal: 400, claimed: 0, endsAt: Date.now() + 3 * 864e5 },
    trail: { step: 0, points: 0, endsAt: Date.now() + 3 * 864e5 },
    golden: { keys: 0, goal: 60, claimed: [], endsAt: Date.now() + 6 * 864e5 },
    hidePick: { tickets: 3, picks: [], round: 1 },
    cards: {},
    packs: 1,
    streak: { count: 0, last: null },
    friends: [],
    requests: [],
    pending: [],
    news: [],
    sent: {},
    dismissed: [],
    gifts: [],
    vs: { wins: 0, games: 0, active: null },
    settings: { sound: true, haptics: true, music: false },
    seenTutorial: false,
  };
}

function deepMerge(base, saved) {
  for (const k of Object.keys(saved)) {
    const v = saved[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]))
      deepMerge(base[k], v);
    else base[k] = v;
  }
  return base;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return deepMerge(fresh(), JSON.parse(raw));
  } catch { /* storage unavailable or corrupt; start fresh */ }
  return fresh();
}

export const state = load();

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, 150);
}

export function emit() {
  save();
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  location.reload();
}

// Regenerates one energy every 90 seconds while below the cap.
export function tickEnergy() {
  const now = Date.now();
  const step = 90_000;
  if (state.energy >= state.energyMax) { state.lastEnergyTick = now; return; }
  const gained = Math.floor((now - state.lastEnergyTick) / step);
  if (gained > 0) {
    state.energy = Math.min(state.energyMax, state.energy + gained);
    state.lastEnergyTick += gained * step;
    emit();
  }
}
