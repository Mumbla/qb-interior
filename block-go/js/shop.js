import { state, emit } from './state.js';
import { icon } from './icons.js';
import { $, fmt, toast, grantRewards, onScreen, paintBanner } from './ui.js';
import { sfx } from './audio.js';

// Prices are in-game currency only. Real-money packs can be added later behind the same list.
const ITEMS = [
  { id: 'mega', feature: true, name: 'Mega Party Bundle', desc: '1,000 energy, 2 of every booster and 3 card packs', icon: 'chest', cost: { coins: 600000 }, give: { energy: 1000, hammer: 2, single: 2, rotate: 2, trash: 2, packs: 3 } },
  { id: 'e100', name: '100 Energy', desc: 'Keep the blocks coming', icon: 'bolt', cost: { coins: 20000 }, give: { energy: 100 } },
  { id: 'e500', name: '500 Energy', desc: 'Best value', icon: 'bolt', cost: { coins: 85000 }, give: { energy: 500 } },
  { id: 'pack', name: 'Card Pack', desc: '3 random cards', icon: 'pack', cost: { coins: 60000 }, give: { packs: 1 } },
  { id: 'pack-star', name: 'Star Pack', desc: 'Swap stars for a pack', icon: 'pack', cost: { stars: 150 }, give: { packs: 1 } },
  { id: 'hammer', name: 'Hammer x3', desc: 'Smash a plus-shaped area', icon: 'hammer', cost: { coins: 40000 }, give: { hammer: 3 } },
  { id: 'single', name: 'Single Block x3', desc: 'Turn any piece into 1 block', icon: 'single', cost: { coins: 32000 }, give: { single: 3 } },
  { id: 'rotate', name: 'Rotate x3', desc: 'Spin the current piece', icon: 'rotate', cost: { coins: 22000 }, give: { rotate: 3 } },
  { id: 'trash', name: 'Trash x3', desc: 'Skip a piece', icon: 'trash', cost: { coins: 22000 }, give: { trash: 3 } },
  { id: 'tickets', name: '2 Pick Tickets', desc: 'For Hide & Pick', icon: 'ticket', cost: { coins: 45000 }, give: { tickets: 2 } },
  { id: 'shields', name: 'Refill Shields', desc: 'Back to 3/3', icon: 'shield', cost: { stars: 60 }, give: { shieldsFull: 1 } },
];

function render() {
  const body = $('#shop-body');
  body.innerHTML = `<div class="shop-grid">${ITEMS.map(it => {
    const [cur, amt] = Object.entries(it.cost)[0];
    return `<div class="shop-item ${it.feature ? 'feature' : ''}"><span class="ic">${icon(it.icon)}</span>
      <div><b>${it.name}</b><br><small>${it.desc}</small></div>
      <button class="btn ${cur === 'stars' ? 'blue' : 'green'} small" data-buy="${it.id}"><span class="ic">${icon(cur === 'stars' ? 'star' : 'coin')}</span>${fmt(amt)}</button></div>`;
  }).join('')}</div>
  <p class="note">All items are bought with coins or stars you earn by playing.</p>`;
  body.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => buy(ITEMS.find(i => i.id === b.dataset.buy))));
}

function buy(it) {
  const [cur, amt] = Object.entries(it.cost)[0];
  if (state[cur] < amt) { sfx.bad(); toast(`Not enough ${cur}. Play more boards!`); return; }
  if (it.give.shieldsFull) {
    if (state.shields >= 3) { toast('Shields are already full'); return; }
    state[cur] -= amt;
    state.shields = 3;
    sfx.coin();
    emit();
    toast('Shields refilled!');
    return;
  }
  state[cur] -= amt;
  grantRewards(it.give, 'PURCHASED!', it.icon);
}

export function initShop() {
  onScreen('shop', () => { paintBanner($('.shop-banner'), ['gold', 'orange', 'pink', 'red']); render(); });
}
