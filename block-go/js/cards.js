import { state, emit } from './state.js';
import { icon } from './icons.js';
import { drawBlock } from './render.js';
import { SHAPES } from './pieces.js';
import { $, fmt, openModal, grantRewards, onScreen, paintBanner } from './ui.js';
import { sfx, buzz } from './audio.js';
import { confetti } from './fx.js';

export const ALBUMS = [
  {
    id: 'crew', name: 'The Go Crew', bg: ['#7fd7ff', '#3b5cf0'], reward: { coins: 150000, packs: 1 },
    cards: [['Blu', 'cyan', 1], ['Pinky', 'pink', 1], ['Limey', 'lime', 1], ['Sunny', 'gold', 2], ['Tango', 'orange', 2], ['Vee', 'violet', 3], ['Rojo', 'red', 3], ['Twins', 'pink', 4], ['Captain Go', 'gold', 5]],
  },
  {
    id: 'fair', name: 'Night Fair', bg: ['#ff8cc4', '#7c3aed'], reward: { coins: 300000, packs: 2 },
    cards: [['Ferris', 'violet', 1], ['Cotton', 'pink', 1], ['Popcorn', 'gold', 1], ['Bumper', 'red', 2], ['Coaster', 'cyan', 2], ['Hot Dog', 'orange', 3], ['Prize Duck', 'gold', 3], ['Lanterns', 'lime', 4], ['Fireworks', 'violet', 5]],
  },
  {
    id: 'legends', name: 'Block Legends', bg: ['#ffe680', '#ff6a1f'], reward: { coins: 750000, packs: 3, energy: 500 },
    cards: [['Tower', 'cyan', 2], ['Zig', 'lime', 2], ['Zag', 'red', 2], ['Elle', 'orange', 3], ['Jay', 'violet', 3], ['Square', 'gold', 3], ['Pyramid', 'pink', 4], ['The Cross', 'cyan', 4], ['Golden Go', 'gold', 5]],
  },
];

const ALL = ALBUMS.flatMap(a => a.cards.map(([name, color, stars], i) => ({ id: `${a.id}-${i}`, album: a, name, color, stars, i })));

function cardArt(canvas, card) {
  const dpr = devicePixelRatio || 1;
  const w = canvas.clientWidth || 100, h = canvas.clientHeight || 133;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  g.scale(dpr, dpr);
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, card.album.bg[0]);
  bg.addColorStop(1, card.album.bg[1]);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  // sunburst
  g.save();
  g.translate(w / 2, h * 0.45);
  g.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-10, -h); g.lineTo(10, -h); g.fill(); }
  g.restore();
  const shape = SHAPES[(card.i * 3 + card.album.id.length) % SHAPES.length];
  const s = w * 0.17;
  const maxC = Math.max(...shape.map(c => c[1])) + 1, maxR = Math.max(...shape.map(c => c[0])) + 1;
  shape.forEach(([r, c]) => drawBlock(g, w / 2 - (maxC * s) / 2 + c * s, h * 0.12 + r * s * 0.6, s, card.color, { alpha: 0.5 }));
  const big = w * 0.56;
  drawBlock(g, (w - big) / 2, h * 0.3 + (maxR > 2 ? 4 : 0), big, card.color, { face: true });
}

function cardHTML(card, count, isNew = false) {
  const locked = !count;
  return `<div class="gcard ${locked ? 'locked' : ''} ${isNew ? 'new' : ''}" data-card="${card.id}">
    <canvas></canvas><span class="stars">${'★'.repeat(card.stars)}</span>
    ${count > 1 ? `<span class="cnt">${count}</span>` : ''}
    <span class="nm">${locked ? '???' : card.name}</span></div>`;
}

function paintCards(root) {
  root.querySelectorAll('.gcard').forEach(el => cardArt(el.querySelector('canvas'), ALL.find(c => c.id === el.dataset.card)));
}

function render() {
  const body = $('#cards-body');
  body.innerHTML = `<div class="pack-bar"><span class="ic">${icon('pack')}</span>
      <div>Card Packs: ${state.packs}<br><small style="font-weight:700">Each pack has 3 cards. Finish an album for a big prize!</small></div>
      <button class="btn green" id="open-pack" ${state.packs ? '' : 'disabled'}>Open</button></div>
    ${ALBUMS.map(a => {
      const owned = a.cards.filter((_, i) => state.cards[`${a.id}-${i}`]).length;
      const done = state.cards[`album-${a.id}`];
      return `<div class="album"><div class="album-head"><b>${a.name}</b><small>${done ? '✓ COMPLETE' : `${owned}/9 · Prize: ${fmt(a.reward.coins)} coins`}</small></div>
        <div class="card-grid">${a.cards.map((_, i) => cardHTML(ALL.find(c => c.id === `${a.id}-${i}`), state.cards[`${a.id}-${i}`] || 0)).join('')}</div></div>`;
    }).join('')}`;
  paintCards(body);
  $('#open-pack').addEventListener('click', openPack);
  body.querySelectorAll('.gcard:not(.locked)').forEach(el => el.addEventListener('click', () => showCard(ALL.find(c => c.id === el.dataset.card))));
  $('#cards-dot').hidden = !state.packs;
}

function showCard(card) {
  sfx.tap();
  const m = openModal({
    title: card.name,
    html: `<div style="width:200px;margin:0 auto">${cardHTML(card, state.cards[card.id])}</div>
      <p class="center" style="font-weight:700;margin:10px 0 0">${card.album.name} · ${'★'.repeat(card.stars)}<br>You own ${state.cards[card.id]}</p>`,
  });
  paintCards(m.inner);
}

function drawCard() {
  // Rarer cards (more stars) are much less likely.
  const weights = ALL.map(c => [40, 25, 12, 5, 1.5][c.stars - 1]);
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ALL.length; i++) { roll -= weights[i]; if (roll <= 0) return ALL[i]; }
  return ALL[0];
}

function openPack() {
  if (!state.packs) return;
  state.packs--;
  const got = [drawCard(), drawCard(), drawCard()];
  let dupStars = 0;
  const fresh = got.map(c => {
    const had = state.cards[c.id] || 0;
    state.cards[c.id] = had + 1;
    if (had) dupStars += c.stars * 5;
    return !had;
  });
  state.stars += dupStars;
  emit();
  sfx.win();
  buzz(30);
  confetti(40);
  const m = openModal({
    title: 'NEW CARDS!',
    html: `<div class="pack-reveal">${got.map((c, i) => cardHTML(c, 1, true).replace('class="gcard', `style="animation-delay:${i * 0.15}s" class="gcard`)).join('')}</div>
      <p class="center" style="font-weight:700;margin:10px 0">${fresh.filter(Boolean).length} new${dupStars ? ` · duplicates gave +${dupStars} stars` : ''}</p>
      <div class="center"><button class="btn green big">Nice!</button></div>`,
    onClose: () => { render(); checkAlbums(); },
  });
  paintCards(m.inner);
  m.inner.querySelector('.btn').addEventListener('click', () => m.close());
}

function checkAlbums() {
  for (const a of ALBUMS) {
    const key = `album-${a.id}`;
    if (state.cards[key]) continue;
    if (a.cards.every((_, i) => state.cards[`${a.id}-${i}`])) {
      state.cards[key] = 1;
      grantRewards(a.reward, `${a.name.toUpperCase()} COMPLETE!`, 'cards');
      confetti(120);
      render();
      return;
    }
  }
}

export function initCards() {
  onScreen('cards', () => { paintBanner($('.cards-banner'), ['cyan', 'violet', 'lime', 'gold']); render(); });
  $('#cards-dot').hidden = !state.packs;
}
export { render as renderCards };
