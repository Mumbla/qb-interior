import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyBoard, canPlace, place, fitsAnywhere, scoreFor, SIZE } from '../js/board.js';
import { rotate, SHAPES, normalise } from '../js/pieces.js';

test('clears a full row and column together', () => {
  let b = emptyBoard();
  for (let c = 0; c < SIZE; c++) if (c !== 4) b[4][c] = { color: 'pink' };
  for (let r = 0; r < SIZE; r++) if (r !== 4) b[r][4] = { color: 'cyan' };
  const res = place(b, { cells: [[0, 0]], color: 'gold' }, 4, 4);
  assert.deepEqual(res.rows, [4]);
  assert.deepEqual(res.cols, [4]);
  assert.equal(res.cleared.length, 17);
  assert.ok(res.board.every(r => r.every(c => !c)));
});

test('rejects overlap and out of bounds', () => {
  const b = emptyBoard();
  b[0][1] = { color: 'red' };
  assert.equal(canPlace(b, [[0, 0], [0, 1]], 0, 0), false);
  assert.equal(canPlace(b, [[0, 0], [0, 1]], 8, 8), false);
  assert.equal(canPlace(b, [[0, 0], [0, 1]], 1, 0), true);
});

test('fitsAnywhere detects a full board', () => {
  const b = emptyBoard().map(r => r.map(() => ({ color: 'red' })));
  assert.equal(fitsAnywhere(b, [[0, 0]]), false);
  b[3][3] = null;
  assert.equal(fitsAnywhere(b, [[0, 0]]), true);
});

test('four rotations return the original shape', () => {
  for (const s of SHAPES) {
    const n = normalise(s);
    assert.deepEqual(rotate(rotate(rotate(rotate(n)))), n);
  }
});

test('multi-line clears pay more than single', () => {
  assert.ok(scoreFor(3, 2, 0) > scoreFor(3, 1, 0) * 2);
  assert.ok(scoreFor(3, 1, 2) > scoreFor(3, 1, 0));
});
