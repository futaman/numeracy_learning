// ゴルトンボードの玉の動き。explore だけで位置が決まるので、スライダーを戻すと玉も戻る。

import { clamp01 } from '../judge.js';

// 1個の玉が落ちるのにかかる explore の幅。最後の玉も explore=1 までに着く
const FALL = 0.2;
const LAST_START = 0.78;

// i 番目の玉の進み具合。
// col：ピンの場所（はじめの位置からの横のずれ。ボードの1列を1とする）、row：何段目まで来たか、
// settle：ピンを抜けてから、たまるまでの進み具合（0〜1）。玉がまだ出ていなければ null
export function ballProgress(ball, i, total, explore, rows) {
  const start = (i / total) * LAST_START;
  if (explore <= start) return null;
  const p = clamp01((explore - start) / FALL) * (rows + 1);
  const r = Math.min(Math.floor(p), rows);
  const frac = p - r;
  let rights = 0;
  for (let j = 0; j < r && j < rows; j++) rights += ball.path[j];
  if (r >= rows) return { col: rights - rows / 2, row: rows, settle: p >= rows + 1 ? 1 : frac };
  const col = rights + frac * ball.path[r] - (r + frac) / 2;
  return { col, row: r + frac, settle: 0 };
}
