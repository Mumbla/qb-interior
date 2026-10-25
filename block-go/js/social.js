// Simulated social layer. Everything goes through this module so a real backend
// (Supabase, Firebase, etc.) can replace the bots later without touching the screens.
import { state, emit, today } from './state.js';
import { icon } from './icons.js';
import { $, fmt, esc, toast, openModal, grantRewards, onTab, onScreen, selectTab, activeTab, avatarURL, paintBanner } from './ui.js';
import { sfx, buzz } from './audio.js';

const BOTS = [
  ['Mika', 3], ['JoJo Blocks', 7], ['Priya', 1], ['Kenji', 12], ['Lulu', 5], ['Sam R.', 9], ['Zara', 15],
  ['Tomás', 2], ['Nia', 18], ['Ollie', 4], ['Bea', 10], ['Rafi', 6], ['Quinn', 13], ['Ada', 20], ['Milo', 8],
].map(([name, av], i) => ({ id: 'bot' + i, name, avatar: av, skill: 0.6 + ((i * 37) % 10) / 12 }));
const bot = id => BOTS.find(b => b.id === id);

const REASONS = ['Is someone you played with', 'Has mutual friends', 'Plays at your level', 'Recently active'];
const VS_GOAL = 12;
const VS_TIME = 10 * 60_000;

const body = $('#friends-body');

// ---------- friends ----------
function suggestions() {
  return BOTS.filter(b => !state.friends.includes(b.id) && !state.dismissed.includes(b.id) && !(state.pending || []).includes(b.id)).slice(0, 4);
}

function inviteLink() {
  const u = new URL(location.href);
  u.search = '?ref=' + state.playerId;
  u.hash = '';
  return u.toString();
}

export async function inviteFriends() {
  const data = { title: 'Block Go', text: `Play Block Go with me! My player ID is ${state.playerId}`, url: inviteLink() };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(`${data.text} ${data.url}`);
    toast('Invite link copied!');
  } catch { /* share sheet dismissed */ }
}

function renderList() {
  const reqs = state.requests || [];
  const sugg = suggestions();
  const friends = state.friends.map(bot).filter(Boolean);
  body.innerHTML = `<div class="center"><button class="btn green big" id="invite">Invite friends <span style="border-left:2px solid #0004;padding-left:12px;margin-left:6px">+</span></button></div>
    <div class="section-title">REQUESTS</div>
    ${reqs.length ? reqs.map(id => row(bot(id), 'Wants to be your friend', `<button class="btn orange small" data-decline="${id}">Decline</button><button class="btn green small" data-accept="${id}">Accept</button>`)).join('')
      : `<div class="empty-box"><span style="width:56px;height:56px;flex:none">${icon('mascot')}</span>Friend requests will appear here...</div>`}
    ${friends.length ? `<div class="section-title">FRIENDS (${friends.length})</div>
      ${friends.map(f => row(f, `Best: ${fmt(botScore(f))}`, `${sentToday(f.id) ? '<button class="btn small blue" disabled>Sent</button>' : `<button class="btn small blue" data-send="${f.id}"><span class="ic">${icon('bolt')}</span>Gift</button>`}<button class="btn small orange" data-vs="${f.id}">VS</button>`)).join('')}` : ''}
    <div class="section-title">SUGGESTIONS</div>
    ${sugg.length ? sugg.map((b, i) => row(b, REASONS[(i + b.avatar) % REASONS.length], `<button class="btn orange small" data-dismiss="${b.id}">Dismiss</button><button class="btn green small" data-invite="${b.id}">Invite</button>`)).join('')
      : '<div class="empty-box">No more suggestions right now.</div>'}
    ${(state.pending || []).length ? `<p class="center" style="color:#b9b5ff;font-weight:700">Waiting on ${state.pending.length} invite${state.pending.length > 1 ? 's' : ''}...</p>` : ''}`;

  $('#invite').addEventListener('click', inviteFriends);
  body.querySelectorAll('[data-invite]').forEach(b => b.addEventListener('click', () => invite(b.dataset.invite)));
  body.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', () => { state.dismissed.push(b.dataset.dismiss); sfx.tap(); emit(); renderList(); }));
  body.querySelectorAll('[data-accept]').forEach(b => b.addEventListener('click', () => accept(b.dataset.accept)));
  body.querySelectorAll('[data-decline]').forEach(b => b.addEventListener('click', () => { state.requests = reqs.filter(x => x !== b.dataset.decline); state.dismissed.push(b.dataset.decline); emit(); renderList(); }));
  body.querySelectorAll('[data-send]').forEach(b => b.addEventListener('click', () => sendGift(b.dataset.send)));
  body.querySelectorAll('[data-vs]').forEach(b => b.addEventListener('click', () => startVs(b.dataset.vs)));
}

function row(p, sub, actions, cls = '') {
  return `<div class="card-row ${cls}"><img class="avatar" alt="" src="${avatarURL(p.avatar)}">
    <div class="who"><b>${esc(p.name)}</b><small>${sub}</small></div>
    <div style="display:flex;gap:6px">${actions}</div></div>`;
}

function invite(id) {
  state.pending = [...(state.pending || []), id];
  sfx.coin();
  toast(`Invite sent to ${bot(id).name}!`);
  emit();
  renderList();
  setTimeout(() => {
    state.pending = state.pending.filter(x => x !== id);
    if (!state.friends.includes(id)) state.friends.push(id);
    pushNews(`${bot(id).name} accepted your friend invite!`);
    toast(`${bot(id).name} is now your friend!`);
    emit();
    if (activeTab('friends') === 'list' && body.isConnected) renderList();
    refreshDots();
  }, 3000 + Math.random() * 4000);
}

function accept(id) {
  state.requests = (state.requests || []).filter(x => x !== id);
  if (!state.friends.includes(id)) state.friends.push(id);
  sfx.win();
  toast(`You and ${bot(id).name} are now friends!`);
  emit();
  renderList();
  refreshDots();
}

function sentToday(id) { return (state.sent || {})[id] === today(); }
function sendGift(id) {
  state.sent = { ...(state.sent || {}), [id]: today() };
  sfx.coin();
  toast(`Sent 25 energy to ${bot(id).name}`);
  // Friends usually return the favour.
  if (Math.random() < 0.7) setTimeout(() => receiveGift(id), 5000 + Math.random() * 10000);
  emit();
  renderList();
}

// ---------- gifts ----------
function receiveGift(id) {
  if (state.gifts.length >= 20) return;
  state.gifts.push({ from: id, amount: 25, at: Date.now() });
  emit();
  refreshDots();
  if (activeTab('friends') === 'gifts' && body.isConnected) renderGifts();
}

function renderGifts() {
  const gifts = state.gifts;
  body.innerHTML = `<div class="section-title">GIFTS</div>
    ${gifts.length ? `<div class="center" style="margin-bottom:12px"><button class="btn green big" id="claim-all">Claim all (+${gifts.reduce((a, g) => a + g.amount, 0)} energy)</button></div>
      ${gifts.map((g, i) => row(bot(g.from), `Sent you ${g.amount} energy`, `<button class="btn green small" data-claim="${i}"><span class="ic">${icon('bolt')}</span>Claim</button>`)).join('')}`
      : `<div class="empty-box"><span style="width:56px;height:56px;flex:none">${icon('gift')}</span>Gifts from friends land here. Send gifts to get some back!</div>`}`;
  $('#claim-all')?.addEventListener('click', () => claimGifts(gifts.map((_, i) => i)));
  body.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => claimGifts([+b.dataset.claim])));
}

function claimGifts(idx) {
  const take = state.gifts.filter((_, i) => idx.includes(i));
  state.gifts = state.gifts.filter((_, i) => !idx.includes(i));
  state.energy += take.reduce((a, g) => a + g.amount, 0);
  sfx.coin();
  buzz(15);
  toast(`+${take.reduce((a, g) => a + g.amount, 0)} energy`);
  emit();
  refreshDots();
  renderGifts();
}

// ---------- news ----------
function pushNews(text) {
  state.news = [{ text, at: Date.now() }, ...(state.news || [])].slice(0, 30);
}
const NEWS_TEMPLATES = [
  n => `${n} completed the Night Fair album!`, n => `${n} reached Trail step ${5 + Math.floor(Math.random() * 25)}.`,
  n => `${n} cleared 5 lines in one move!`, n => `${n} hit the Hide & Pick jackpot!`,
  n => `${n} is on a ${2 + Math.floor(Math.random() * 20)} day streak.`, n => `${n} won a VS match.`,
];
function maybeNews() {
  const pool = state.friends.length ? state.friends : BOTS.slice(0, 5).map(b => b.id);
  const b = bot(pool[Math.floor(Math.random() * pool.length)]);
  pushNews(NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)](b.name));
}
function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}
function renderNews() {
  if (!(state.news || []).length) { for (let i = 0; i < 4; i++) maybeNews(); emit(); }
  body.innerHTML = `<div class="section-title">NEWS</div>
    ${state.news.map(n => `<div class="card-row"><span class="avatar" style="padding:8px;background:#efe6ff">${icon('horncolor')}</span><div class="who"><b style="font-size:17px;white-space:normal">${esc(n.text)}</b><small>${ago(n.at)}</small></div></div>`).join('')}`;
}

// ---------- leaderboard ----------
function weekSeed() { return Math.floor(Date.now() / (7 * 864e5)); }
function botScore(b) {
  const base = ((weekSeed() * 7919 + b.avatar * 104729) % 90000) + 5000;
  const dayOfWeek = (Date.now() % (7 * 864e5)) / (7 * 864e5);
  return Math.round(base * b.skill * (0.4 + dayOfWeek));
}
function renderBoard() {
  const rows = [
    ...BOTS.map(b => ({ ...b, score: botScore(b), friend: state.friends.includes(b.id) })),
    { id: 'me', name: state.name + ' (you)', avatar: state.avatar, score: state.bestScore, me: true },
  ].sort((a, b) => b.score - a.score);
  body.innerHTML = `<div class="section-title">WEEKLY TOP</div>
    <p class="center" style="margin:-4px 0 12px;font-weight:700;color:#b9b5ff">Your best single-board earnings this week. Top 3 win prizes!</p>
    ${rows.map((r, i) => `<div class="card-row ${r.me ? 'me' : ''}"><span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
      <img class="avatar" alt="" src="${avatarURL(r.avatar)}"><div class="who"><b>${esc(r.name)}</b><small>${r.friend ? 'Friend · ' : ''}${fmt(r.score)}</small></div></div>`).join('')}`;
}

// ---------- VS ----------
export function startVs(id) {
  const v = state.vs;
  if (v.active) { showVs(); return; }
  const pool = state.friends.length ? state.friends : BOTS.map(b => b.id);
  id = id || pool[Math.floor(Math.random() * pool.length)];
  v.active = { opp: id, me: 0, them: 0, endsAt: Date.now() + VS_TIME, lastTick: Date.now() };
  sfx.win();
  emit();
  refreshVs();
  const m = openModal({
    title: 'VS MATCH!',
    html: `<div class="center"><div style="display:flex;justify-content:center;align-items:center;gap:14px">
        <img src="${avatarURL(state.avatar)}" style="width:80px;border-radius:12px;border:3px solid #1a1046">
        <b style="font-size:34px;color:#7c3aed">VS</b>
        <img src="${avatarURL(bot(id).avatar)}" style="width:80px;border-radius:12px;border:3px solid #1a1046"></div>
      <p style="font-size:18px;font-weight:700">First to clear <b>${VS_GOAL} lines</b> in 10 minutes beats <b>${esc(bot(id).name)}</b>!</p>
      <button class="btn green big" data-go="play">Let's Go!</button></div>`,
  });
  m.inner.querySelector('.btn').addEventListener('click', () => m.close());
}

function showVs() {
  const a = state.vs.active;
  if (!a) { startVs(); return; }
  const o = bot(a.opp);
  const bar = (n, col) => `<div class="big-bar" style="background:#2a2275"><i style="width:${n / VS_GOAL * 100}%;background:${col}"></i><span>${n}/${VS_GOAL}</span></div>`;
  openModal({
    title: 'VS MATCH',
    html: `<div style="display:grid;gap:10px;font-weight:800">
      <div style="display:flex;align-items:center;gap:8px"><img src="${avatarURL(state.avatar)}" style="width:48px;border-radius:10px">You${bar(a.me, 'linear-gradient(#8ff57f,#2aa61d)')}</div>
      <div style="display:flex;align-items:center;gap:8px"><img src="${avatarURL(o.avatar)}" style="width:48px;border-radius:10px">${esc(o.name)}${bar(a.them, 'linear-gradient(#ff9ab0,#d6246e)')}</div>
      <p class="center" style="margin:0">Time left: ${Math.max(0, Math.ceil((a.endsAt - Date.now()) / 60000))} min · Record ${state.vs.wins}W / ${state.vs.games - state.vs.wins}L</p></div>`,
  });
}

export function vsLines(n) {
  const a = state.vs.active;
  if (!a) return;
  a.me += n;
  refreshVs();
  if (a.me >= VS_GOAL) finishVs(true);
}

function tickVs() {
  const a = state.vs.active;
  if (!a) return;
  const o = bot(a.opp);
  // Opponent clears a line roughly every 40-70 seconds depending on skill.
  const elapsed = Date.now() - a.lastTick;
  const rate = 55_000 / o.skill;
  if (elapsed > rate) {
    a.them += Math.floor(elapsed / rate);
    a.lastTick = Date.now();
    emit();
  }
  if (a.them >= VS_GOAL) finishVs(false);
  else if (Date.now() > a.endsAt) finishVs(a.me > a.them);
  refreshVs();
}

function finishVs(won) {
  const a = state.vs.active;
  const o = bot(a.opp);
  state.vs.active = null;
  state.vs.games++;
  if (won) {
    state.vs.wins++;
    pushNews(`You beat ${o.name} in VS!`);
    grantRewards({ coins: 40000, stars: 25, energy: 100 }, 'YOU WIN!', 'cup');
  } else {
    pushNews(`${o.name} beat you in VS.`);
    sfx.bad();
    openModal({ title: 'SO CLOSE!', html: `<p class="center" style="font-size:18px;font-weight:700">${esc(o.name)} cleared ${VS_GOAL} lines first. Rematch any time from the VS button!</p>` });
  }
  emit();
  refreshVs();
}

function refreshVs() {
  const a = state.vs.active;
  $('#vs-txt').textContent = a ? `${a.me}/${VS_GOAL}` : 'Play';
}

// ---------- background activity ----------
export function socialTick() {
  tickVs();
  const r = Math.random();
  if (state.friends.length && r < 0.08) receiveGift(state.friends[Math.floor(Math.random() * state.friends.length)]);
  else if (r < 0.11 && !(state.requests || []).length) {
    const cands = BOTS.filter(b => !state.friends.includes(b.id) && !state.dismissed.includes(b.id));
    if (cands.length) { state.requests = [cands[Math.floor(Math.random() * cands.length)].id]; emit(); refreshDots(); }
  } else if (r < 0.2) { maybeNews(); emit(); }
}

function refreshDots() {
  const hasGifts = state.gifts.length > 0;
  $('#gift-dot').hidden = !hasGifts;
  $('#friends-dot').hidden = !(hasGifts || (state.requests || []).length);
}

const RENDER = { list: renderList, gifts: renderGifts, news: renderNews, board: renderBoard };
export function initSocial() {
  onTab('friends', tab => RENDER[tab]?.());
  onScreen('friends', tab => {
    paintBanner($('.friends-banner'), ['lime', 'cyan', 'gold', 'pink']);
    selectTab('friends', tab || activeTab('friends') || 'list');
  });
  document.querySelector('[data-tabs="friends"]').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]');
    if (b) { sfx.tap(); selectTab('friends', b.dataset.tab); }
  });
  $('#vs-badge').addEventListener('click', () => { sfx.tap(); state.vs.active ? showVs() : startVs(); });
  // Pending invites from a previous session resolve straight away.
  (state.pending || []).forEach(id => { if (!state.friends.includes(id)) state.friends.push(id); });
  state.pending = [];
  refreshVs();
  refreshDots();
}
