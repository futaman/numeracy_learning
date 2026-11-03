// 第1章の事件の数字が、本当にそのトリックになっているかを確かめる。

import test from 'node:test';
import assert from 'node:assert/strict';
import { case1_1 } from '../src/cases/case1-1.js';
import { case1_2 } from '../src/cases/case1-2.js';
import { case1_3 } from '../src/cases/case1-3.js';
import { case1_4 } from '../src/cases/case1-4.js';
import { case1_5 } from '../src/cases/case1-5.js';
import { apparentRatio, trueRatio, pictureGrowth, pieVisibleAreas, logHeight, lineGap } from '../src/judge.js';

// ---- 1-1 ----

test('1-1：チラシの見た目では大きく増えたように見え（5倍以上）、本当はほとんど増えていない（1.1倍未満）', () => {
  assert.ok(apparentRatio(case1_1.values, case1_1.ground) >= 5);
  assert.ok(trueRatio(case1_1.values) < 1.1);
});

test('1-1：地面はどの月の数より下にあり、直す操作は地面から始まる', () => {
  assert.ok(case1_1.ground < Math.min(...case1_1.values));
  assert.ok(case1_1.ground > 0);
  assert.equal(case1_1.fix.start, case1_1.ground);
});

test('1-1：予想の「6倍くらい」は、見た目の倍率と合っている', () => {
  const shown = Math.round(apparentRatio(case1_1.values, case1_1.ground));
  const label = case1_1.predict.options.find((o) => o.id === case1_1.predict.apparent).label;
  assert.ok(label.startsWith(`${shown}倍`), `見た目は${shown}倍なのに「${label}」になっている`);
});

// ---- 1-2 ----

test('1-2：売れた数は絵の倍率と同じ2倍', () => {
  const [a, b] = case1_2.shops;
  assert.equal(b.value / a.value, case1_2.scale);
});

test('1-2：縦・横・奥行きを2倍にすると、広さは4倍、大きさは8倍', () => {
  const g = pictureGrowth(case1_2.scale);
  assert.deepEqual(g, { height: 2, area: 4, volume: 8 });
  const answer = case1_2.predict.options.find((o) => o.id === case1_2.predict.answer).label;
  assert.ok(answer.startsWith(`${g.volume}個`));
});

// ---- 1-3 ----

const shares = case1_3.slices.map((s) => s.share);
// pie3d.js と同じく、1つ目の切れの真ん中が手前（0度）に来るように並べる
const startAngle = -((shares[0] / 100) * 360) / 2;

test('1-3：割合は合わせて100%で、本当にいちばん大きいのはゴマカシ携帯ではない', () => {
  assert.equal(shares.reduce((a, b) => a + b, 0), 100);
  const best = case1_3.slices.reduce((a, b) => (b.share > a.share ? b : a));
  assert.notEqual(best.name, case1_3.slices[0].name);
  const answer = case1_3.predict.options.find((o) => o.id === case1_3.predict.answer).label;
  assert.ok(answer.startsWith(best.name));
});

test('1-3：チラシの角度ではゴマカシ携帯がいちばん大きく見え、真上からは本当の順になる', () => {
  const tilted = pieVisibleAreas(shares, { elevation: case1_3.flyerElevation, startAngle });
  const top = pieVisibleAreas(shares, { elevation: 90, startAngle });
  const biggest = (areas) => areas.indexOf(Math.max(...areas));
  assert.equal(biggest(tilted), 0);
  assert.equal(biggest(top), shares.indexOf(Math.max(...shares)));
});

// ---- 1-4 ----

test('1-4：菌は2時間ごとに10倍、8時間で1万倍', () => {
  const v = case1_4.values;
  for (let i = 1; i < v.length; i++) assert.equal(v[i] / v[i - 1], 10);
  assert.equal(trueRatio(v), 10000);
});

test('1-4：対数軸の高さで比べると5倍に見え、予想の「5倍くらい」と合っている', () => {
  const [lo, hi] = case1_4.logAxis;
  const v = case1_4.values;
  const shown = logHeight(v[v.length - 1], lo, hi) / logHeight(v[0], lo, hi);
  assert.ok(Math.abs(shown - 5) < 1e-9);
  const label = case1_4.predict.options.find((o) => o.id === case1_4.predict.apparent).label;
  assert.ok(label.startsWith(`${Math.round(shown)}倍`));
  // 対数軸の目盛りは等間隔に並ぶ（1つ上がるごとに同じ高さ）
  const step = logHeight(lo * 10, lo, hi) - logHeight(lo, lo, hi);
  assert.ok(Math.abs(logHeight(lo * 1000, lo, hi) - logHeight(lo * 100, lo, hi) - step) < 1e-9);
});

// ---- 1-5 ----

test('1-5：チラシの目盛りでは2本の線がぴったり重なり、0〜100点では大きくはなれる', () => {
  const { left, right } = case1_5;
  assert.ok(lineGap(left.values, left.axis, right.values, right.flyerAxis) < 0.01);
  assert.ok(lineGap(left.values, left.axis, right.values, right.fairAxis) > 0.3);
});

test('1-5：平均点は2点も上がっていないのに、アイスは4倍売れた', () => {
  const s = case1_5.right.values;
  assert.ok(s[s.length - 1] - s[0] < 2);
  assert.equal(trueRatio(case1_5.left.values), 4);
});

test('1-5：チラシの右の軸は、点数がぜんぶ入る、せまい範囲', () => {
  const [lo, hi] = case1_5.right.flyerAxis;
  for (const v of case1_5.right.values) assert.ok(v >= lo && v <= hi);
  assert.ok(hi - lo <= 5);
});
