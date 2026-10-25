// Piece shapes are lists of [row, col] cells normalised to start at 0,0.
export const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
];

export const COLORS = ['pink', 'orange', 'lime', 'cyan', 'violet', 'gold', 'red'];

export function normalise(cells) {
  const minR = Math.min(...cells.map(c => c[0]));
  const minC = Math.min(...cells.map(c => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

export function rotate(cells) {
  return normalise(cells.map(([r, c]) => [c, -r]));
}

export function size(cells) {
  return {
    rows: Math.max(...cells.map(c => c[0])) + 1,
    cols: Math.max(...cells.map(c => c[1])) + 1,
  };
}

export function randomPiece(rng = Math.random) {
  const cells = SHAPES[Math.floor(rng() * SHAPES.length)];
  return { cells: normalise(cells), color: COLORS[Math.floor(rng() * COLORS.length)] };
}
