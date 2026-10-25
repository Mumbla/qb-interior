// Pure board logic, no DOM. A cell is null or { color }.
export const SIZE = 9;

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function canPlace(board, cells, row, col) {
  return cells.every(([r, c]) => {
    const rr = row + r, cc = col + c;
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && !board[rr][cc];
  });
}

export function fitsAnywhere(board, cells) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (canPlace(board, cells, r, c)) return true;
  return false;
}

// Places the piece and clears full rows and columns.
// Returns { board, rows, cols, cleared } where cleared lists the removed cells.
export function place(board, piece, row, col) {
  const next = board.map(r => r.slice());
  for (const [r, c] of piece.cells) next[row + r][col + c] = { color: piece.color };

  const rows = [], cols = [];
  for (let i = 0; i < SIZE; i++) {
    if (next[i].every(Boolean)) rows.push(i);
    if (next.every(r => r[i])) cols.push(i);
  }
  const cleared = [];
  const seen = new Set();
  const take = (r, c) => {
    const k = r * SIZE + c;
    if (seen.has(k)) return;
    seen.add(k);
    cleared.push({ r, c, color: next[r][c].color });
  };
  rows.forEach(r => { for (let c = 0; c < SIZE; c++) take(r, c); });
  cols.forEach(c => { for (let r = 0; r < SIZE; r++) take(r, c); });
  for (const { r, c } of cleared) next[r][c] = null;

  return { board: next, rows, cols, cleared };
}

// Coins earned for one placement, before the bet multiplier.
export function scoreFor(placedCount, lines, combo) {
  const base = placedCount * 10;
  if (!lines) return base;
  const lineBonus = [0, 100, 250, 450, 700, 1000][Math.min(lines, 5)] + Math.max(0, lines - 5) * 350;
  return base + lineBonus * (1 + combo * 0.5);
}

export function isEmpty(board) {
  return board.every(r => r.every(c => !c));
}
