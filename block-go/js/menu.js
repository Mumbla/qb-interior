import { state, emit, resetSave } from './state.js';
import { icon } from './icons.js';
import { $, esc, toast, openModal, closeAllModals, go, avatarURL, AVATAR_COUNT } from './ui.js';
import { sfx } from './audio.js';
import { inviteFriends } from './social.js';

export function openProfile() {
  sfx.tap();
  const items = [
    ['gear', 'Settings', openSettings], ['cart', 'Shop', () => go('shop')], ['cup', 'Leaderboard', () => go('friends', 'board')],
    ['cards', 'Cards', () => go('cards')], ['horncolor', 'Community', () => go('friends', 'news')], ['phone', 'Invite Friends', inviteFriends],
    ['help', 'Support', openSupport], ['flag', 'Events', () => go('events')], ['pointer', 'How To Play', openHowTo],
    ['ticket', 'Hide & Pick', () => go('events', 'hide')], ['flame', 'Daily Streak', () => go('events', 'streak')],
  ];
  const m = openModal({
    avatar: avatarURL(state.avatar, 240),
    html: `<div class="menu-grid">${items.map(([ic, label], i) => `<button data-i="${i}"><span class="mi">${icon(ic)}</span>${label}</button>`).join('')}</div>
      <div class="center" style="margin-top:22px"><button class="btn orange" id="copy-id">Copy my player ID</button>
      <p style="margin:6px 0 0;font-weight:700;color:#b39b86">${state.playerId}</p></div>`,
  });
  // Put the name row between the avatar and the white panel.
  const nameRow = document.createElement('div');
  nameRow.className = 'name-row';
  nameRow.innerHTML = `<b>${esc(state.name)}</b><button class="edit-btn" aria-label="Edit profile">${icon('pencil')}</button>`;
  m.inner.before(nameRow);
  nameRow.querySelector('.edit-btn').addEventListener('click', () => { m.close(); openEditProfile(); });
  m.el.querySelector('.avatar-big').addEventListener('click', () => { m.close(); openEditProfile(); });
  m.inner.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
    const fn = items[+b.dataset.i][2];
    if (fn !== inviteFriends) m.close();
    fn();
  }));
  m.inner.querySelector('#copy-id').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(state.playerId); toast('Player ID copied!'); }
    catch { toast(state.playerId); }
  });
}

function openEditProfile() {
  let pick = state.avatar;
  const m = openModal({
    title: 'PROFILE',
    html: `<label style="font-weight:800">Name<input class="field" id="name-in" maxlength="16" value="${esc(state.name)}"></label>
      <p style="font-weight:800;margin:12px 0 0">Pick your Go buddy</p>
      <div class="swatches">${Array.from({ length: AVATAR_COUNT }, (_, i) =>
        `<button data-a="${i}" class="${i === pick ? 'on' : ''}" style="background:url(${avatarURL(i)}) center/cover"></button>`).join('')}</div>
      <div class="center mt"><button class="btn green big" id="save-prof">Save</button></div>`,
  });
  m.inner.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
    pick = +b.dataset.a;
    m.inner.querySelectorAll('[data-a]').forEach(x => x.classList.toggle('on', x === b));
    sfx.tap();
  }));
  m.inner.querySelector('#save-prof').addEventListener('click', () => {
    const n = m.inner.querySelector('#name-in').value.trim();
    if (n) state.name = n.slice(0, 16);
    state.avatar = pick;
    emit();
    sfx.coin();
    m.close();
    openProfile();
  });
}

function openSettings() {
  const rows = [['sound', 'Sound effects'], ['haptics', 'Vibration']];
  const m = openModal({
    title: 'SETTINGS',
    html: `${rows.map(([k, l]) => `<div class="toggle-row">${l}<button class="switch ${state.settings[k] ? 'on' : ''}" data-k="${k}" aria-label="${l}"></button></div>`).join('')}
      <div class="toggle-row">Install app<button class="btn blue small" id="install">How?</button></div>
      <div class="center mt"><button class="btn red" id="reset">Reset progress</button></div>
      <p class="center" style="font-size:13px;color:#b39b86;font-weight:700;margin:10px 0 0">Block Go v1.0 · Player ${state.playerId}</p>`,
  });
  m.inner.querySelectorAll('.switch').forEach(s => s.addEventListener('click', () => {
    state.settings[s.dataset.k] = !state.settings[s.dataset.k];
    s.classList.toggle('on', state.settings[s.dataset.k]);
    emit();
    sfx.tap();
  }));
  m.inner.querySelector('#install').addEventListener('click', () => {
    if (window.deferredInstall) { window.deferredInstall.prompt(); return; }
    toast(/iPhone|iPad/.test(navigator.userAgent) ? 'Tap Share → Add to Home Screen' : 'Use your browser menu → Install app');
  });
  m.inner.querySelector('#reset').addEventListener('click', () => {
    if (confirm('Reset ALL progress? This cannot be undone.')) resetSave();
  });
}

function openSupport() {
  openModal({
    title: 'SUPPORT',
    html: `<div class="howto"><p>Need help? Send your player ID along with your question.</p>
      <p><b>Player ID:</b> ${state.playerId}</p>
      <p style="color:#b39b86">Your progress is saved on this device. Clearing your browser data will reset it.</p></div>`,
  });
}

export function openHowTo() {
  const m = openModal({
    title: 'HOW TO PLAY',
    html: `<div class="howto">
      <h3>1. Drag &amp; drop</h3><p>Drag the piece from the round launcher onto the 9×9 board.</p>
      <h3>2. Clear lines</h3><p>Fill a whole row or column to clear it and earn coins. Clear several at once, or keep clearing move after move, for combos!</p>
      <h3>3. Bet multiplier</h3><p>Tap the blue <b>x1</b> chip to raise your bet. Each move costs energy equal to the bet, and you win that many times the coins.</p>
      <h3>4. Boosters</h3><p><b>Single</b> turns your piece into 1 block · <b>Rotate</b> spins it · <b>Hammer</b> smashes blocks · <b>Trash</b> skips the piece.</p>
      <h3>5. Events</h3><p>Clearing lines fills the event bar, moves you along the Trail, and can drop Golden keys. Use tickets in Hide &amp; Pick to hunt for the jackpot.</p>
      <h3>6. Friends</h3><p>Invite friends, trade energy gifts, climb the weekly leaderboard and race them in VS!</p>
      <div class="center mt"><button class="btn green big">Got it!</button></div></div>`,
  });
  m.inner.querySelector('.btn').addEventListener('click', () => m.close());
}

export function initMenu() {
  $('#menu-btn').addEventListener('click', openProfile);
  $('#hud-shields').addEventListener('click', () => {
    sfx.tap();
    openModal({ title: 'SHIELDS', html: `<div class="center"><div style="width:90px;height:90px;margin:0 auto">${icon('shield')}</div>
      <p style="font-size:18px;font-weight:700">When no piece fits, a shield clears the 3 fullest rows so you keep your board.<br>Claiming your Daily Streak refills them to 3.</p></div>` });
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
}
