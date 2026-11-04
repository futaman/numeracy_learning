// 第2章の事件の数字が、本当にそのトリックになっているかを確かめる。

import test from 'node:test';
import assert from 'node:assert/strict';
import { case2_1 } from '../src/cases/case2-1.js';
import { case2_2 } from '../src/cases/case2-2.js';
import { case2_3 } from '../src/cases/case2-3.js';
import { case2_4 } from '../src/cases/case2-4.js';
import { case2_5 } from '../src/cases/case2-5.js';
import {
  mean,
  median,
  countAboveMean,
  riskChange,
  priceChange,
  countAtLeast,
  galtonBalls,
  schoolAverages,
  topSchool,
  bottomSchool,
} from '../src/judge.js';
import { ballProgress } from '../src/scenes/galtonBalls.js';

// ---- 2-1 ----

test('2-1：平均は5000円ちょうど、真ん中の子は1000円で、平均より多いのは1人だけ', () => {
  assert.equal(mean(case2_1.kids), 5000);
  assert.equal(median(case2_1.kids), 1000);
  assert.equal(countAboveMean(case2_1.kids), 1);
  assert.ok(case2_1.banner.includes('5000'));
});

test('2-1：右はしの子を動かすと、平均だけが動く。1000円にすると平均も1000円', () => {
  const others = case2_1.kids.slice(0, -1);
  assert.equal(case2_1.fix.start, case2_1.kids[case2_1.kids.length - 1]);
  assert.equal(mean([...others, case2_1.fix.target]), 1000);
  for (let v = case2_1.fix.min; v <= case2_1.fix.max; v += case2_1.fix.step) {
    assert.equal(median([...others, v]), 1000);
  }
  // スライダーの刻みで、はじめの値にも目標の値にもちょうど止まれる
  assert.equal((case2_1.fix.start - case2_1.fix.min) % case2_1.fix.step, 0);
});

test('2-1：シーソーの板に全員が乗り、支点も板の上にある', () => {
  assert.ok(Math.max(...case2_1.kids) <= case2_1.plank);
  assert.ok(mean(case2_1.kids) <= case2_1.plank);
});

// ---- 2-2 ----

test('2-2：本当に2倍で、ふえたのは1万人に1人', () => {
  const r = riskChange(case2_2.before, case2_2.after, case2_2.population);
  assert.equal(r.times, 2);
  assert.equal(r.added, 1);
  assert.equal(r.addedRate, 1 / 10000);
  assert.ok(case2_2.banner.includes('2倍'));
});

// ---- 2-3 ----

test('2-3：差はどちらも100円で、比はパンが2倍、給食費が1.02倍', () => {
  const [bread, lunch] = case2_3.items.map((i) => priceChange(i.before, i.after));
  assert.equal(bread.difference, 100);
  assert.equal(lunch.difference, 100);
  assert.equal(bread.ratio, 2);
  assert.equal(lunch.ratio, 1.02);
});

// ---- 2-4 ----

test('2-4：100人の点の平均は50点で、65点以上は7人。真ん中がいちばん多い山', () => {
  const h = case2_4.histogram;
  const scores = Object.entries(h).flatMap(([s, c]) => Array(c).fill(Number(s)));
  assert.equal(scores.length, 100);
  assert.equal(mean(scores), 50);
  assert.equal(countAtLeast(h, case2_4.myScore), 7);
  const counts = Object.keys(h).map(Number).sort((a, b) => a - b).map((s) => h[s]);
  const peak = counts.indexOf(Math.max(...counts));
  counts.forEach((c, i) => {
    if (i < peak) assert.ok(c < counts[i + 1]);
    if (i > peak) assert.ok(c < counts[i - 1]);
  });
});

test('2-4：平均を75点にずらすと、同じ65点でも7人しか下にいない', () => {
  const shift = case2_4.fix.target - case2_4.fix.start;
  assert.equal(100 - countAtLeast(case2_4.histogram, case2_4.myScore, shift), 7);
});

test('2-4：玉は人数の表どおりの場所に、はじかれた回数どおりに落ちる', () => {
  const balls = galtonBalls(case2_4);
  assert.equal(balls.length, 100);
  const landed = {};
  for (const b of balls) {
    assert.equal(b.path.length, case2_4.rows);
    assert.equal(b.path.reduce((a, c) => a + c, 0), b.rights);
    assert.equal(b.score, case2_4.lowest + b.rights * case2_4.step);
    landed[b.score] = (landed[b.score] ?? 0) + 1;
  }
  assert.deepEqual(landed, case2_4.histogram);
  assert.deepEqual(balls, galtonBalls(case2_4));
});

test('2-4：スライダーの位置で玉の場所が決まり、いちばん右で全部たまる', () => {
  const balls = galtonBalls(case2_4);
  balls.forEach((b, i) => {
    assert.equal(ballProgress(b, i, balls.length, 0, case2_4.rows), null);
    const p = ballProgress(b, i, balls.length, 1, case2_4.rows);
    assert.equal(p.settle, 1);
    assert.equal(p.col, b.rights - case2_4.rows / 2);
  });
});

// ---- 2-5 ----

const averages = schoolAverages({ sizes: case2_5.schools.map((s) => s.size), ...case2_5.simulation });
const rounds = averages[0].map((_, r) => r);
const range = (a) => Math.max(...a) - Math.min(...a);
const count = (pick, s) => rounds.filter((r) => pick(averages, r) === s).length;

test('2-5：1回目は山の分校が1位で、びりも5人の川の分校', () => {
  assert.equal(topSchool(averages, 0), 0);
  assert.equal(bottomSchool(averages, 0), 1);
  assert.equal(case2_5.schools[0].size, 5);
  assert.equal(case2_5.schools[1].size, 5);
});

test('2-5：人数が少ない学校ほど、平均点が大きくぶれる', () => {
  const ranges = averages.map(range);
  assert.ok(ranges[0] > ranges[2]);
  assert.ok(ranges[1] > ranges[2]);
  assert.ok(ranges[2] > ranges[3]);
  assert.ok(ranges[3] < 3);
  assert.ok(ranges[0] > 20);
});

test('2-5：手がかりの文の数字と、シミュレーションの結果が合っている', () => {
  assert.equal(count(topSchool, 0), 6);
  assert.equal(count(bottomSchool, 0), 9);
  assert.ok(case2_5.clue.text.includes('1位が6回'));
  assert.ok(case2_5.clue.text.includes('びりが9回'));
  assert.ok(Math.min(...averages[3]) >= 59 && Math.max(...averages[3]) <= 61);
  // 600人の学校は、20回のうち一度も1位にならない
  assert.equal(count(topSchool, 3), 0);
});
