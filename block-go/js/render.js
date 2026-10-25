// Canvas drawing for glossy Block Go cubes.
import { SIZE } from './board.js';
import { size as pieceSize } from './pieces.js';

// [base, highlight, shadow]
export const PALETTE = {
  pink: ['#ff4fa3', '#ffa3d1', '#b8146a'],
  orange: ['#ff8a1f', '#ffc27a', '#c24e00'],
  lime: ['#4ade3a', '#a6f58e', '#1f8f19'],
  cyan: ['#19c8ff', '#93e7ff', '#0a7bb8'],
  violet: ['#a64dff', '#d3a6ff', '#6014b8'],
  gold: ['#ffd02a', '#fff09a', '#c48a00'],
  red: ['#ff4a4a', '#ff9e9e', '#b30f1f'],
};

export function drawBlock(g, x, y, s, color, { alpha = 1, label = '', face = false } = {}) {
  const [base, hi, lo] = PALETTE[color] || PALETTE.cyan;
  const pad = s * 0.04;
  const r = s * 0.18;
  x += pad; y += pad; s -= pad * 2;
  g.save();
  g.globalAlpha = alpha;

  // drop shadow
  g.fillStyle = 'rgba(0,0,0,.28)';
  g.beginPath(); g.roundRect(x, y + s * 0.06, s, s, r); g.fill();

  // body
  const body = g.createLinearGradient(x, y, x, y + s);
  body.addColorStop(0, hi);
  body.addColorStop(0.35, base);
  body.addColorStop(1, lo);
  g.fillStyle = body;
  g.beginPath(); g.roundRect(x, y, s, s, r); g.fill();

  // inner face
  const inset = s * 0.12;
  const face2 = g.createLinearGradient(x, y + inset, x, y + s - inset);
  face2.addColorStop(0, base);
  face2.addColorStop(1, shade(base, -0.12));
  g.fillStyle = face2;
  g.beginPath(); g.roundRect(x + inset, y + inset * 0.8, s - inset * 2, s - inset * 2, r * 0.6); g.fill();

  // gloss
  g.fillStyle = 'rgba(255,255,255,.45)';
  g.beginPath(); g.roundRect(x + inset * 1.1, y + inset * 0.95, s * 0.45, s * 0.12, s * 0.06); g.fill();
  g.fillStyle = 'rgba(255,255,255,.3)';
  g.beginPath(); g.arc(x + s - inset * 1.6, y + inset * 1.5, s * 0.05, 0, Math.PI * 2); g.fill();

  if (face) drawFace(g, x, y, s);
  else if (label) {
    g.fillStyle = 'rgba(0,0,0,.18)';
    g.font = `900 ${s * 0.4}px "Baloo 2", system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, x + s / 2, y + s / 2 + s * 0.04);
  }
  g.restore();
}

function drawFace(g, x, y, s) {
  const ey = y + s * 0.48;
  for (const ex of [x + s * 0.36, x + s * 0.64]) {
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(ex, ey, s * 0.1, s * 0.12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1a1033';
    g.beginPath(); g.arc(ex + s * 0.02, ey + s * 0.02, s * 0.055, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#1a1033';
  g.lineWidth = s * 0.05;
  g.lineCap = 'round';
  g.beginPath(); g.arc(x + s * 0.5, y + s * 0.66, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w: rect.width, h: rect.height };
}

// Draws the 9x9 board plus an optional ghost and highlight of lines about to clear.
export function drawBoard(canvas, board, { ghost = null, betLabel = '', flashes = [], pulse = 0 } = {}) {
  const { g, w } = fitCanvas(canvas);
  const cell = w / SIZE;
  g.clearRect(0, 0, w, w);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const x = c * cell, y = r * cell;
      g.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.06)';
      g.beginPath(); g.roundRect(x + 2, y + 2, cell - 4, cell - 4, cell * 0.14); g.fill();
    }
  }

  const preview = new Set();
  if (ghost?.ok && ghost.lines) for (const k of ghost.lines) preview.add(k);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const b = board[r][c];
      if (!b) continue;
      const lit = preview.has(r * SIZE + c);
      drawBlock(g, c * cell, r * cell, cell, lit ? ghost.color : b.color, { label: betLabel, face: b.face });
      if (lit) {
        g.fillStyle = `rgba(255,255,255,${0.15 + 0.15 * Math.sin(pulse * 8)})`;
        g.beginPath(); g.roundRect(c * cell + 3, r * cell + 3, cell - 6, cell - 6, cell * 0.16); g.fill();
      }
    }
  }

  if (ghost) {
    for (const [r, c] of ghost.cells) {
      const rr = ghost.row + r, cc = ghost.col + c;
      if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
      if (ghost.ok) drawBlock(g, cc * cell, rr * cell, cell, ghost.color, { alpha: 0.45 });
      else {
        g.fillStyle = 'rgba(255,60,90,.35)';
        g.beginPath(); g.roundRect(cc * cell + 3, rr * cell + 3, cell - 6, cell - 6, cell * 0.16); g.fill();
      }
    }
  }

  for (const f of flashes) {
    const a = Math.max(0, f.t);
    g.fillStyle = `rgba(255,255,255,${a * 0.9})`;
    if (f.row != null) { g.beginPath(); g.roundRect(0, f.row * cell, w, cell, cell * 0.2); g.fill(); }
    if (f.col != null) { g.beginPath(); g.roundRect(f.col * cell, 0, cell, w, cell * 0.2); g.fill(); }
  }
  return cell;
}

// Draws a piece centred in a canvas, sized so it fits.
export function drawPiece(canvas, piece, { cell = null, alpha = 1, face = true } = {}) {
  const { g, w, h } = fitCanvas(canvas);
  g.clearRect(0, 0, w, h);
  if (!piece) return;
  const { rows, cols } = pieceSize(piece.cells);
  const s = cell || Math.min(w / (cols + 0.6), h / (rows + 0.6), w / 3.2);
  const ox = (w - cols * s) / 2, oy = (h - rows * s) / 2;
  piece.cells.forEach(([r, c], i) =>
    drawBlock(g, ox + c * s, oy + r * s, s, piece.color, { alpha, face: face && i === 0 }));
}
