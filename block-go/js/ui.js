import { state, emit } from './state.js';
import { icon } from './icons.js';
import { drawBlock, PALETTE } from './render.js';
import { sfx, buzz } from './audio.js';
import { confetti } from './fx.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e5) return Math.round(n / 1e3) + 'K';
  return n.toLocaleString('en-US');
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function timeLeft(ts) {
  const ms = Math.max(0, ts - Date.now());
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- navigation ----------
const screenHooks = {};
export function onScreen(name, fn) { screenHooks[name] = fn; }
export let current = 'play';

export function go(name, tab) {
  current = name;
  document.body.dataset.screen = name;
  $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
  $$('#dock button').forEach(b => b.classList.toggle('active', b.dataset.go === name));
  if (tab) selectTab(name, tab, false);
  screenHooks[name]?.(tab);
  sfx.tap();
}

const tabHooks = {};
export function onTab(group, fn) { tabHooks[group] = fn; }
export function selectTab(group, tab, render = true) {
  $$(`[data-tabs="${group}"] button`).forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (render) tabHooks[group]?.(tab);
}
export function activeTab(group) {
  return $(`[data-tabs="${group}"] button.active`)?.dataset.tab;
}

// ---------- modals ----------
export function openModal({ title = '', html = '', avatar = null, closable = true, onClose, cls = '' }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${cls}">
      ${avatar ? `<img class="avatar-big" alt="" src="${avatar}">` : ''}
      ${closable ? '<button class="close" aria-label="Close">✕</button>' : ''}
      ${title ? `<h2>${title}</h2>` : ''}
      <div class="inner">${html}</div>
    </div>`;
  $('#modal-root').appendChild(back);
  const close = () => {
    if (!back.isConnected) return;
    back.remove();
    onClose?.();
  };
  back.querySelector('.close')?.addEventListener('click', () => { sfx.tap(); close(); });
  back.addEventListener('pointerdown', e => { if (e.target === back && closable) close(); });
  return { el: back, inner: back.querySelector('.inner'), close };
}

export function closeAllModals() {
  $$('#modal-root .modal-back').forEach(m => m.remove());
}

// ---------- rewards ----------
const REWARD_META = {
  coins: { icon: 'coin', label: n => fmt(n) },
  stars: { icon: 'star', label: n => fmt(n) },
  energy: { icon: 'bolt', label: n => fmt(n) },
  hammer: { icon: 'hammer', label: n => 'x' + n },
  single: { icon: 'single', label: n => 'x' + n },
  rotate: { icon: 'rotate', label: n => 'x' + n },
  trash: { icon: 'trash', label: n => 'x' + n },
  packs: { icon: 'pack', label: n => 'x' + n },
  tickets: { icon: 'ticket', label: n => 'x' + n },
  keys: { icon: 'key', label: n => 'x' + n },
};

export function rewardChips(rewards) {
  return Object.entries(rewards).map(([k, v]) =>
    `<span class="reward-chip"><span class="ic">${icon(REWARD_META[k]?.icon || 'gift')}</span>${REWARD_META[k]?.label(v) ?? v}</span>`).join('');
}

export function applyRewards(rewards) {
  for (const [k, v] of Object.entries(rewards)) {
    if (k in state.boosters) state.boosters[k] += v;
    else if (k === 'tickets') state.hidePick.tickets += v;
    else if (k === 'keys') state.golden.keys += v;
    else state[k] = (state[k] || 0) + v;
  }
  emit();
}

export function grantRewards(rewards, title = 'REWARD!', heroIcon = 'gift') {
  applyRewards(rewards);
  sfx.win();
  buzz(30);
  confetti(60);
  const m = openModal({
    title,
    html: `<div class="reward-burst"><div class="ray"><span>${icon(heroIcon)}</span></div>
      <div class="reward-list">${rewardChips(rewards)}</div>
      <button class="btn green big mt">Collect</button></div>`,
  });
  m.inner.querySelector('.btn').addEventListener('click', () => { sfx.coin(); m.close(); });
  return m;
}

// ---------- avatars ----------
const AVATAR_COLORS = Object.keys(PALETTE);
const avatarCache = new Map();
export function avatarURL(idx = 0, size = 120) {
  const key = idx + ':' + size;
  if (avatarCache.has(key)) return avatarCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, '#d9ecff');
  bg.addColorStop(1, '#a9c4ff');
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  // little skyline of cubes behind the mascot
  const s = size * 0.22;
  ['gold', 'lime', 'pink', 'cyan'].forEach((col, i) => drawBlock(g, i * s * 1.25 - s * 0.2, size - s * (i % 2 ? 1.2 : 0.9), s, col, { alpha: 0.5 }));
  drawBlock(g, size * 0.16, size * 0.14, size * 0.68, color, { face: true });
  // accessory varies by index
  const acc = Math.floor(idx / AVATAR_COLORS.length) % 3;
  g.fillStyle = '#1a1046';
  if (acc === 1) { g.beginPath(); g.roundRect(size * 0.3, size * 0.06, size * 0.4, size * 0.12, 4); g.fill(); g.fillRect(size * 0.22, size * 0.16, size * 0.56, size * 0.04); }
  if (acc === 2) { g.fillStyle = '#ffd02a'; g.beginPath(); g.moveTo(size * 0.35, size * 0.18); g.lineTo(size * 0.42, size * 0.04); g.lineTo(size * 0.5, size * 0.14); g.lineTo(size * 0.58, size * 0.04); g.lineTo(size * 0.65, size * 0.18); g.fill(); }
  const url = c.toDataURL();
  avatarCache.set(key, url);
  return url;
}
export const AVATAR_COUNT = AVATAR_COLORS.length * 3;

// Pressing any [data-go] element switches screens.
export function bindNav() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-go]');
    if (!el) return;
    go(el.dataset.go, el.dataset.tab);
  });
}

// Banner art: a parade of mascot cubes.
export function paintBanner(el, colors) {
  let c = el.querySelector('canvas');
  if (!c) { c = document.createElement('canvas'); el.prepend(c); }
  const dpr = devicePixelRatio || 1;
  const w = el.clientWidth, h = el.clientHeight;
  if (!w) return;
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const s = h * 0.3;
  let seed = colors.length * 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let x = -s * 0.3; x < w; x += s * 0.9) {
    const stack = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < stack; i++)
      drawBlock(g, x, h - s * (i + 1) * 0.92 + 4, s, colors[Math.floor(rnd() * colors.length)], { alpha: 0.55, face: i === stack - 1 && rnd() > 0.5 });
  }
}
