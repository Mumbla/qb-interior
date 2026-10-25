import { state, emit } from './state.js';
import { SIZE, emptyBoard, canPlace, fitsAnywhere, place, scoreFor, isEmpty } from './board.js';
import { randomPiece, rotate, size as pieceSize } from './pieces.js';
import { drawBoard, drawPiece } from './render.js';
import { sfx, buzz } from './audio.js';
import { burst, floatText, coinFly, shake } from './fx.js';
import { $, $$, fmt, toast, openModal, current, timeLeft } from './ui.js';
import { icon } from './icons.js';

export const BETS = [1, 2, 3, 5, 10, 20, 50];
const BOOST_PRICE = { hammer: 15000, single: 12000, rotate: 8000, trash: 8000 };
const BOOST_NAME = { hammer: 'Hammer', single: 'Single Block', rotate: 'Rotate', trash: 'Trash' };

const boardCanvas = $('#board');
const pieceCanvas = $('#piece');
const nextCanvas = $('#next-piece');
const dragCanvas = $('#drag-piece');

let drag = null;          // { x, y, cell, offX, offY, ghost }
let hammerArmed = false;
let flashes = [];
let pulse = 0;
const lineListeners = [];
export function onLines(fn) { lineListeners.push(fn); }

// ---------- rendering ----------
function boardMetrics() {
  const r = boardCanvas.getBoundingClientRect();
  return { left: r.left, top: r.top, cell: r.width / SIZE, width: r.width };
}

function frame(t) {
  requestAnimationFrame(frame);
  if (current !== 'play' || document.hidden) return;
  pulse = t / 1000;
  flashes.forEach(f => { f.t -= 0.06; });
  flashes = flashes.filter(f => f.t > 0);
  drawBoard(boardCanvas, state.board, {
    ghost: drag?.ghost || null,
    betLabel: state.bet > 1 ? String(state.bet) : '',
    flashes,
    pulse,
  });
}

export function refreshPieces() {
  drawPiece(pieceCanvas, state.piece);
  drawPiece(nextCanvas, state.next, { face: false });
}

export function refreshControls() {
  for (const [k, n] of Object.entries(state.boosters)) {
    const b = $(`.boost[data-boost="${k}"]`);
    b.querySelector('b').textContent = n;
    b.classList.toggle('empty', n <= 0);
  }
  $('.boost.hammer').classList.toggle('armed', hammerArmed);
  $('#bet-chip').textContent = 'x' + state.bet;
  $('#win-mult').textContent = 'x' + state.bet;
  $('#energy-txt').textContent = `${fmt(state.energy)}/${state.energyMax}`;
  $('#energy-pill').classList.toggle('low', state.energy < state.bet);
  $('#energy-timer').textContent = state.energy < state.energyMax
    ? '+1 in ' + Math.max(0, Math.ceil((state.lastEnergyTick + 90_000 - Date.now()) / 1000)) + 's' : '';

  const ev = state.event;
  $('#event-fill').style.width = Math.min(100, (ev.tokens / ev.goal) * 100) + '%';
  $('#event-txt').textContent = `${Math.min(ev.tokens, ev.goal)}/${ev.goal}`;
  $('#event-reward').textContent = fmt(eventReward().energy);
  $('#gift-badge').classList.toggle('ready', ev.tokens >= ev.goal);
}

export function eventReward() {
  const tier = state.event.claimed;
  return { energy: 300 + tier * 150, coins: 20000 + tier * 15000, tickets: 1 };
}

// ---------- drag & drop ----------
function startDrag(e) {
  if (drag || !state.piece) return;
  if (hammerArmed) { toast('Tap a block on the board to smash it'); return; }
  if (state.energy < state.bet) { outOfEnergy(); return; }
  e.preventDefault();
  const { cell } = boardMetrics();
  const { rows, cols } = pieceSize(state.piece.cells);
  dragCanvas.style.width = cols * cell + 'px';
  dragCanvas.style.height = rows * cell + 'px';
  dragCanvas.style.display = 'block';
  drawPiece(dragCanvas, state.piece, { cell, face: true });
  // Lift the piece above the finger so it stays visible.
  drag = { cell, w: cols * cell, h: rows * cell, lift: Math.max(70, rows * cell * 0.6 + 40), pointerId: e.pointerId };
  pieceCanvas.classList.add('lift');
  sfx.pick();
  buzz(8);
  moveDrag(e);
  addEventListener('pointermove', moveDrag, { passive: false });
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', cancelDrag);
}

function moveDrag(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  e.preventDefault();
  const x = e.clientX - drag.w / 2;
  const y = e.clientY - drag.h - drag.lift + drag.h / 2;
  dragCanvas.style.transform = `translate(${x}px, ${y}px) scale(1.04)`;
  const m = boardMetrics();
  const col = Math.round((x - m.left) / m.cell);
  const row = Math.round((y - m.top) / m.cell);
  const onBoard = x + drag.w > m.left && x < m.left + m.width && y + drag.h > m.top && y < m.top + m.width;
  if (!onBoard) { drag.ghost = null; return; }
  const ok = canPlace(state.board, state.piece.cells, row, col);
  const ghost = { cells: state.piece.cells, row, col, ok, color: state.piece.color, lines: null };
  if (ok) {
    const sim = place(state.board, state.piece, row, col);
    if (sim.cleared.length) ghost.lines = sim.cleared.map(c => c.r * SIZE + c.c);
  }
  drag.ghost = ghost;
}

function endDrag(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const g = drag.ghost;
  finishDrag();
  if (g?.ok) commitPlacement(g.row, g.col);
  else if (g) { sfx.bad(); buzz(20); }
}

function cancelDrag() { finishDrag(); }

function finishDrag() {
  removeEventListener('pointermove', moveDrag);
  removeEventListener('pointerup', endDrag);
  removeEventListener('pointercancel', cancelDrag);
  dragCanvas.style.display = 'none';
  pieceCanvas.classList.remove('lift');
  drag = null;
}

// ---------- placement ----------
function commitPlacement(row, col) {
  const piece = state.piece;
  const res = place(state.board, piece, row, col);
  if (Math.random() < 0.25) {
    const [r, c] = piece.cells[0];
    if (res.board[row + r][col + c]) res.board[row + r][col + c].face = true;
  }
  state.board = res.board;
  state.energy -= state.bet;
  const lines = res.rows.length + res.cols.length;
  state.combo = lines ? state.combo + 1 : 0;
  let gain = Math.round(scoreFor(piece.cells.length, lines, Math.max(0, state.combo - 1)) * state.bet);

  const m = boardMetrics();
  const cx = m.left + (col + pieceSize(piece.cells).cols / 2) * m.cell;
  const cy = m.top + (row + pieceSize(piece.cells).rows / 2) * m.cell;

  if (lines) {
    res.rows.forEach(r => flashes.push({ row: r, t: 1 }));
    res.cols.forEach(c => flashes.push({ col: c, t: 1 }));
    res.cleared.forEach((c, i) => {
      if (i % 2 === 0) burst(m.left + (c.c + 0.5) * m.cell, m.top + (c.r + 0.5) * m.cell, c.color, 4, 4 + lines);
    });
    sfx.clear(lines);
    buzz(lines > 1 ? 40 : 20);
    if (lines >= 2) shake($('#board-wrap'), 4 + lines * 2);

    let boardClear = false;
    if (isEmpty(state.board)) { gain += 5000 * state.bet; boardClear = true; }
    const word = boardClear ? 'BOARD CLEAR!' : state.combo > 1 ? `COMBO x${state.combo}` : ['', 'NICE!', 'GREAT!', 'AMAZING!', 'INCREDIBLE!'][Math.min(lines, 4)] || 'LEGENDARY!';
    showTag(word);

    state.linesTotal += lines;
    state.event.tokens += lines * 10 * (state.bet >= 10 ? 2 : 1);
    state.stars += lines;
    lineListeners.forEach(fn => fn(lines, { x: cx, y: cy }));
    coinFly(cx, cy, Math.min(10, 3 + lines * 2));
    setTimeout(() => { sfx.coin(); $('#hud-coins').classList.remove('bump'); void $('#hud-coins').offsetWidth; $('#hud-coins').classList.add('bump'); }, 600);
  } else {
    sfx.place();
    buzz(10);
  }
  floatText('+' + fmt(gain), cx, cy, lines ? 'gold' : '');
  state.coins += gain;
  state.runScore += gain;
  if (state.runScore > state.bestScore) state.bestScore = state.runScore;

  nextPiece();
}

function showTag(text) {
  const tag = $('#combo-tag');
  tag.hidden = false;
  tag.textContent = text;
  tag.style.animation = 'none';
  void tag.offsetWidth;
  tag.style.animation = '';
}

function nextPiece() {
  state.piece = state.next;
  state.next = randomPiece();
  // Keep the bet affordable.
  while (state.bet > 1 && state.energy < state.bet) state.bet = BETS[BETS.indexOf(state.bet) - 1];
  emit();
  refreshPieces();
  if (!fitsAnywhere(state.board, state.piece.cells)) setTimeout(stuck, 350);
}

// ---------- boosters ----------
function useBoost(kind) {
  if (state.boosters[kind] <= 0) { offerBoost(kind); return; }
  if (kind === 'hammer') {
    hammerArmed = !hammerArmed;
    refreshControls();
    toast(hammerArmed ? 'Tap any block to smash it' : 'Hammer put away');
    return;
  }
  state.boosters[kind]--;
  if (kind === 'rotate') state.piece = { ...state.piece, cells: rotate(state.piece.cells) };
  if (kind === 'single') state.piece = { ...state.piece, cells: [[0, 0]] };
  if (kind === 'trash') { state.piece = state.next; state.next = randomPiece(); sfx.smash(); }
  else sfx.pick();
  buzz(15);
  emit();
  refreshPieces();
  if (!fitsAnywhere(state.board, state.piece.cells)) setTimeout(stuck, 350);
}

function smashAt(e) {
  if (!hammerArmed) return;
  const m = boardMetrics();
  const c = Math.floor((e.clientX - m.left) / m.cell);
  const r = Math.floor((e.clientY - m.top) / m.cell);
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
  const hits = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([rr, cc]) => rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && state.board[rr][cc]);
  if (!hits.length) { toast('Nothing to smash there'); return; }
  for (const [rr, cc] of hits) {
    burst(m.left + (cc + 0.5) * m.cell, m.top + (rr + 0.5) * m.cell, state.board[rr][cc].color, 8, 6);
    state.board[rr][cc] = null;
  }
  state.boosters.hammer--;
  hammerArmed = false;
  sfx.smash();
  buzz(40);
  shake($('#board-wrap'), 10);
  emit();
}

function offerBoost(kind) {
  const price = BOOST_PRICE[kind];
  const mo = openModal({
    title: BOOST_NAME[kind],
    html: `<div class="center"><div style="width:90px;height:90px;margin:0 auto">${icon(kind)}</div>
      <p style="font-size:18px;font-weight:700;margin:6px 0 12px">You're out of ${BOOST_NAME[kind]} boosters.<br>Buy 3 more?</p>
      <button class="btn green big"><span class="ic">${icon('coin')}</span>${fmt(price)}</button></div>`,
  });
  mo.inner.querySelector('.btn').addEventListener('click', () => {
    if (state.coins < price) { toast('Not enough coins'); return; }
    state.coins -= price;
    state.boosters[kind] += 3;
    sfx.coin();
    emit();
    mo.close();
  });
}

// ---------- stuck / energy ----------
function stuck() {
  if (fitsAnywhere(state.board, state.piece.cells)) return;
  sfx.bad();
  const mo = openModal({
    title: 'NO SPACE!',
    closable: false,
    html: `<div class="center" style="font-size:18px;font-weight:700">
      <p style="margin:0 0 4px">This piece doesn't fit anywhere.</p>
      <p style="margin:0 0 12px;color:#b39b86">Board earnings: <b style="color:#2a2290">${fmt(state.runScore)}</b> · Best: <b style="color:#2a2290">${fmt(state.bestScore)}</b></p>
      <div style="display:grid;gap:10px">
        <button class="btn blue" data-a="shield"><span class="ic">${icon('shield')}</span>Shield: clear 3 rows (${state.shields})</button>
        <button class="btn orange" data-a="trash"><span class="ic">${icon('trash')}</span>Trash piece (${state.boosters.trash})</button>
        <button class="btn green big" data-a="new">New Board</button>
      </div></div>`,
  });
  mo.inner.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.a;
    if (a === 'shield') {
      if (state.shields <= 0) { toast('No shields left. They refill daily.'); return; }
      state.shields--;
      const filled = [...Array(SIZE).keys()].sort((x, y) => state.board[y].filter(Boolean).length - state.board[x].filter(Boolean).length).slice(0, 3);
      filled.forEach(r => { state.board[r] = Array(SIZE).fill(null); flashes.push({ row: r, t: 1 }); });
      sfx.clear(3);
    } else if (a === 'trash') {
      if (state.boosters.trash <= 0) { toast('No trash boosters left'); return; }
      state.boosters.trash--;
      state.piece = state.next;
      state.next = randomPiece();
    } else {
      state.board = emptyBoard();
      state.runScore = 0;
      state.combo = 0;
    }
    mo.close();
    emit();
    refreshPieces();
    if (!fitsAnywhere(state.board, state.piece.cells)) setTimeout(stuck, 300);
  }));
}

export function outOfEnergy() {
  sfx.bad();
  const mo = openModal({
    title: 'OUT OF ENERGY',
    html: `<div class="center"><div style="width:90px;height:90px;margin:0 auto">${icon('bolt')}</div>
      <p style="font-size:18px;font-weight:700;margin:6px 0 12px">Energy refills by 1 every 90 seconds.<br>Lower your bet, claim gifts from friends, or get more in the Shop.</p>
      <button class="btn green big" data-go="shop">Go to Shop</button></div>`,
  });
  mo.inner.querySelector('.btn').addEventListener('click', () => mo.close());
}

function cycleBet() {
  const affordable = BETS.filter(b => b <= Math.max(1, state.energy));
  const i = affordable.indexOf(state.bet);
  state.bet = affordable[(i + 1) % affordable.length];
  sfx.tap();
  buzz(8);
  const chip = $('#bet-chip');
  chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
  emit();
}

// Scales the table down on short screens so the board, boosters and event badges all fit.
export function fitTable() {
  const t = $('#table');
  const screen = t.parentElement.getBoundingClientRect();
  if (!screen.height) return;
  t.style.transform = '';
  const side = Math.max(...$$('.side-col').map(c => c.getBoundingClientRect().bottom));
  const top = Math.max(side + 30, screen.top + 104);
  const s = Math.min(1, (screen.bottom - top) / t.offsetHeight);
  t.style.transform = s < 1 ? `scale(${s.toFixed(3)})` : '';
  refreshPieces();
}

export function initGame() {
  $('#launcher').addEventListener('pointerdown', e => {
    if (e.target.closest('#bet-chip')) return;
    startDrag(e);
  });
  boardCanvas.addEventListener('pointerdown', smashAt);
  $('#bet-chip').addEventListener('click', cycleBet);
  $$('.boost').forEach(b => b.addEventListener('click', () => useBoost(b.dataset.boost)));
  addEventListener('resize', fitTable);
  fitTable();
  document.fonts?.ready.then(fitTable);
  requestAnimationFrame(frame);
  if (!fitsAnywhere(state.board, state.piece.cells)) setTimeout(stuck, 500);
}

export function timers() {
  $$('[data-timer]').forEach(el => {
    const k = el.dataset.timer;
    const end = k === 'event' ? state.event.endsAt : k === 'golden' ? state.golden.endsAt : state.trail.endsAt;
    el.textContent = '⏱ ' + timeLeft(end);
  });
}
