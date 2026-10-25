import { state, emit, today } from './state.js';
import { icon } from './icons.js';
import { $, fmt, toast, grantRewards, rewardChips, onTab, onScreen, selectTab, activeTab, timeLeft, paintBanner } from './ui.js';
import { sfx, buzz } from './audio.js';
import { burst } from './fx.js';
import { eventReward } from './game.js';

const body = $('#events-body');

// ---------- daily streak ----------
const STREAK = [
  { coins: 5000 }, { energy: 100 }, { hammer: 2 }, { coins: 20000 },
  { packs: 1 }, { energy: 300, rotate: 2 }, { coins: 100000, packs: 2, keys: 5 },
];
const MAIN_ICON = r => icon(r.packs ? 'pack' : r.coins ? 'coin' : r.energy ? 'bolt' : r.hammer ? 'hammer' : 'gift');

function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
export function streakReady() { return state.streak.last !== today(); }

function renderStreak() {
  const s = state.streak;
  const ready = streakReady();
  const running = s.last === today() || s.last === yesterday() ? s.count : 0;
  const nextIdx = ready ? running % 7 : (running - 1) % 7;
  body.innerHTML = `<div class="section-title">DAILY STREAK</div>
    <p class="center" style="margin:-4px 0 12px;font-weight:700;color:#b9b5ff">Come back every day. Day 7 is the jackpot!<br>Current streak: <b style="color:#ffd02a">${running} day${running === 1 ? '' : 's'}</b></p>
    <div class="streak-grid">${STREAK.map((r, i) => {
      const done = i < nextIdx || (!ready && i === nextIdx);
      const isToday = ready && i === nextIdx;
      return `<div class="streak-day ${i === 6 ? 'big' : ''} ${done ? 'done' : ''} ${isToday ? 'today' : ''}">
        <small>DAY ${i + 1}</small><span class="ic">${MAIN_ICON(r)}</span>
        <small>${Object.entries(r).map(([k, v]) => k === 'coins' || k === 'energy' ? fmt(v) : 'x' + v + ' ' + k).join(' + ')}</small></div>`;
    }).join('')}</div>
    <div class="center mt"><button class="btn ${ready ? 'green' : 'blue'} big" id="streak-claim" ${ready ? '' : 'disabled'}>${ready ? 'Claim Day ' + (nextIdx + 1) : 'Come back tomorrow'}</button></div>`;
  $('#streak-claim').addEventListener('click', claimStreak);
}

function claimStreak() {
  if (!streakReady()) return;
  const s = state.streak;
  s.count = s.last === yesterday() ? s.count + 1 : 1;
  s.last = today();
  state.shields = 3;
  const r = STREAK[(s.count - 1) % 7];
  grantRewards(r, `DAY ${((s.count - 1) % 7) + 1}!`, 'flame');
  renderStreak();
  updateDots();
}

// ---------- trail ----------
const TRAIL_LEN = 30;
const LINES_PER_STEP = 3;
function trailReward(step) {
  if (step % 5 === 0) {
    const t = step / 5;
    return [{ coins: 25000 }, { tickets: 2, energy: 150 }, { packs: 1, hammer: 2 }, { coins: 80000, tickets: 2 }, { packs: 2, energy: 300 }, { coins: 250000, packs: 3, keys: 10 }][t - 1];
  }
  return { coins: 1500 * step };
}

export function addTrailLines(lines) {
  const t = state.trail;
  t.points = (t.points || 0) + lines;
  while (t.points >= LINES_PER_STEP && t.step < TRAIL_LEN) {
    t.points -= LINES_PER_STEP;
    t.step++;
    const r = trailReward(t.step);
    if (t.step % 5 === 0) setTimeout(() => grantRewards(r, `TRAIL STEP ${t.step}!`, 'flag'), 700);
    else { state.coins += r.coins; toast(`Trail step ${t.step}: +${fmt(r.coins)} coins`); }
  }
  emit();
}

function renderTrail() {
  const t = state.trail;
  const rows = [];
  for (let i = 1; i <= TRAIL_LEN; i++) {
    const prize = i % 5 === 0;
    const x = 50 + Math.sin(i * 0.9) * 32;
    const cls = i <= t.step ? 'done' : i === t.step + 1 ? 'here' : '';
    const r = trailReward(i);
    rows.push(`<div class="trail-step" title="${prize ? 'Prize' : fmt(r.coins) + ' coins'}">
      <div class="trail-node ${cls} ${prize ? 'prize' : ''}" style="left:calc(${x}% - ${prize ? 35 : 29}px)">
        ${prize ? `<span class="ic">${icon(i === TRAIL_LEN ? 'chest' : 'gift')}</span>` : i}</div></div>`);
  }
  body.innerHTML = `<div class="section-title">TRAIL</div>
    <p class="center" style="margin:-4px 0 6px;font-weight:700;color:#b9b5ff">Clear ${LINES_PER_STEP} lines to move 1 step. Big prizes every 5 steps!<br>
    Step <b style="color:#ffd02a">${t.step}/${TRAIL_LEN}</b> · ${t.points || 0}/${LINES_PER_STEP} lines · ends in ${timeLeft(t.endsAt)}</p>
    <div class="trail-path">${rows.join('')}</div>
    <div class="center"><button class="btn green big" data-go="play">Play!</button></div>`;
  const here = body.querySelector('.trail-node.here, .trail-node.done:last-of-type');
  here?.scrollIntoView({ block: 'center' });
}

// ---------- hide & pick ----------
function newLayout(round) {
  const prizes = [
    { coins: 3000 * round }, { energy: 40 }, { hammer: 1 }, { coins: 6000 * round }, { rotate: 1 },
    { single: 1 }, { energy: 80 }, { coins: 1500 * round },
  ];
  const golden = { coins: 50000 * round, packs: 1, energy: 200 };
  const cells = [...prizes.sort(() => Math.random() - 0.5).slice(0, 8), { golden: true, ...golden }];
  return cells.sort(() => Math.random() - 0.5);
}

function renderHide() {
  const h = state.hidePick;
  if (!h.layout) { h.layout = newLayout(h.round); h.picks = []; emit(); }
  body.innerHTML = `<div class="section-title">HIDE &amp; PICK</div>
    <p class="center" style="margin:-4px 0 10px;font-weight:700;color:#b9b5ff">Round ${h.round}. Find the <b style="color:#ffd02a">golden chest</b> to win the jackpot.<br>Each pick costs 1 ticket. Earn tickets from the event gift and Trail.</p>
    <div class="center" style="margin-bottom:12px"><span class="reward-chip" style="display:inline-flex"><span class="ic">${icon('ticket')}</span>${h.tickets} tickets</span></div>
    <div class="pick-grid">${h.layout.map((p, i) => {
      const open = h.picks.includes(i);
      const { golden, ...rew } = p;
      return `<button class="pick-tile ${open ? 'flipped' : ''} ${golden ? 'golden' : ''}" data-i="${i}">
        <div class="front">?</div>
        <div class="back"><span class="ic">${icon(golden ? 'chest' : Object.keys(rew)[0] === 'coins' ? 'coin' : Object.keys(rew)[0] === 'energy' ? 'bolt' : Object.keys(rew)[0])}</span>
        <small>${golden ? 'JACKPOT' : Object.values(rew)[0] > 999 ? fmt(Object.values(rew)[0]) : 'x' + Object.values(rew)[0]}</small></div></button>`;
    }).join('')}</div>
    <p class="center mt" style="font-weight:700;color:#b9b5ff">Jackpot: ${rewardChips((({ golden, ...r }) => r)(h.layout.find(p => p.golden)))}</p>`;
  body.querySelectorAll('.pick-tile').forEach(t => t.addEventListener('click', () => pick(+t.dataset.i, t)));
}

function pick(i, el) {
  const h = state.hidePick;
  if (h.picks.includes(i)) return;
  if (h.tickets <= 0) { toast('No tickets! Fill the event bar or walk the Trail.'); sfx.bad(); return; }
  h.tickets--;
  h.picks.push(i);
  el.classList.add('flipped');
  sfx.pick();
  buzz(15);
  const { golden, ...rew } = h.layout[i];
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, golden ? 'gold' : 'cyan', golden ? 30 : 10, golden ? 9 : 5);
  if (golden) {
    setTimeout(() => {
      grantRewards(rew, 'JACKPOT!', 'chest');
      h.round++;
      h.layout = null;
      emit();
      renderHide();
    }, 600);
  } else {
    for (const [k, v] of Object.entries(rew)) {
      if (k in state.boosters) state.boosters[k] += v; else state[k] += v;
    }
    toast('+' + rewardText(rew));
    emit();
    setTimeout(renderHide, 550);
  }
}
const rewardText = r => Object.entries(r).map(([k, v]) => (v > 999 ? fmt(v) : v) + ' ' + k).join(', ');

// ---------- golden ----------
const GOLDEN_TIERS = [
  { at: 15, r: { coins: 50000 } }, { at: 30, r: { packs: 2 } }, { at: 45, r: { hammer: 3, single: 3 } }, { at: 60, r: { coins: 500000, packs: 3, energy: 500 } },
];
export function addKeys(n) {
  const g = state.golden;
  g.keys += n;
  g.claimed = g.claimed || [];
  for (const t of GOLDEN_TIERS) {
    if (g.keys >= t.at && !g.claimed.includes(t.at)) {
      g.claimed.push(t.at);
      setTimeout(() => grantRewards(t.r, 'GOLDEN REWARD!', 'key'), 900);
    }
  }
  emit();
}

function renderGolden() {
  const g = state.golden;
  g.claimed = g.claimed || [];
  body.innerHTML = `<div class="section-title">GOLDEN</div>
    <div class="golden-hero"><span class="ic">${icon('key')}</span>
      <div style="font-size:18px">Golden keys sometimes drop when you clear lines.<br>Higher bets drop more keys!</div>
      <div class="big-bar"><i style="width:${Math.min(100, g.keys / g.goal * 100)}%"></i><span>${Math.min(g.keys, g.goal)}/${g.goal}</span></div>
      <small>Ends in ${timeLeft(g.endsAt)}</small></div>
    <div class="tier-row">${GOLDEN_TIERS.map(t => `<div class="tier ${g.claimed.includes(t.at) ? 'got' : ''}">
      <span class="ic">${icon(t.r.packs ? 'pack' : t.r.coins ? 'coin' : 'hammer')}</span>${t.at} keys</div>`).join('')}</div>`;
}

// ---------- event bar gift ----------
export function claimEventGift() {
  const ev = state.event;
  if (ev.tokens < ev.goal) {
    toast(`Clear lines to fill the bar: ${ev.tokens}/${ev.goal}`);
    return;
  }
  const r = eventReward();
  ev.tokens -= ev.goal;
  ev.claimed++;
  ev.goal = Math.min(1000, ev.goal + 100);
  grantRewards(r, 'EVENT GIFT!', 'gift');
}

// Restarts events whose timer ran out.
export function rollEvents() {
  const now = Date.now();
  if (now > state.event.endsAt) Object.assign(state.event, { tokens: 0, goal: 400, claimed: 0, endsAt: now + 3 * 864e5 });
  if (now > state.trail.endsAt) Object.assign(state.trail, { step: 0, points: 0, endsAt: now + 3 * 864e5 });
  if (now > state.golden.endsAt) Object.assign(state.golden, { keys: 0, claimed: [], endsAt: now + 6 * 864e5 });
}

export function updateDots() {
  $('#events-dot').hidden = !(streakReady() || state.hidePick.tickets > 0);
  const g = state.golden;
  $('#golden-mini').style.width = Math.min(100, g.keys / g.goal * 100) + '%';
  $('#golden-mini-txt').textContent = `${Math.min(g.keys, g.goal)}/${g.goal}`;
  const dot = $('#ticket-dot');
  dot.hidden = !state.hidePick.tickets;
  dot.textContent = state.hidePick.tickets;
}

const RENDER = { streak: renderStreak, trail: renderTrail, hide: renderHide, golden: renderGolden };
export function initEvents() {
  onTab('events', tab => RENDER[tab]?.());
  onScreen('events', tab => {
    paintBanner($('.events-banner'), ['pink', 'orange', 'gold', 'violet']);
    if (!tab) tab = activeTab('events') || 'streak';
    selectTab('events', tab);
  });
  document.querySelector('[data-tabs="events"]').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]');
    if (b) { sfx.tap(); selectTab('events', b.dataset.tab); }
  });
  $('#gift-badge').addEventListener('click', claimEventGift);
}
