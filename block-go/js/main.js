import { state, emit, subscribe, tickEnergy } from './state.js';
import { hydrateIcons } from './icons.js';
import { $, fmt, bindNav, current, onScreen } from './ui.js';
import { initGame, refreshControls, onLines, timers, fitTable } from './game.js';
import { initEvents, addTrailLines, addKeys, rollEvents, updateDots } from './events.js';
import { initCards } from './cards.js';
import { initShop } from './shop.js';
import { initSocial, vsLines, socialTick } from './social.js';
import { initMenu, openHowTo } from './menu.js';

function refreshHud() {
  $('#hud-coins .val').textContent = fmt(state.coins);
  $('#hud-stars .val').textContent = fmt(state.stars);
  $('#hud-shields .val').textContent = `${state.shields}/3`;
  refreshControls();
  updateDots();
}

hydrateIcons();
bindNav();
document.body.dataset.screen = 'play';
onScreen('play', () => requestAnimationFrame(fitTable));
rollEvents();
initGame();
initEvents();
initCards();
initShop();
initSocial();
initMenu();

onLines(lines => {
  addTrailLines(lines);
  vsLines(lines);
  // Higher bets make golden keys more likely.
  const chance = Math.min(0.9, 0.25 + Math.log10(state.bet) * 0.25);
  let keys = 0;
  for (let i = 0; i < lines; i++) if (Math.random() < chance) keys++;
  if (keys) addKeys(keys);
});

subscribe(refreshHud);
refreshHud();
timers();

setInterval(() => { tickEnergy(); timers(); refreshControls(); }, 1000);
setInterval(() => { rollEvents(); if (!document.hidden) socialTick(); }, 5000);

if (!state.seenTutorial) {
  state.seenTutorial = true;
  emit();
  setTimeout(openHowTo, 400);
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.deferredInstall = e; });

// Expose for debugging in the console.
window.blockgo = { state, current: () => current };
