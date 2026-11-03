// 事件 1-1 の数字が、本当にそのトリックになっているかを確かめる。

import test from 'node:test';
import assert from 'node:assert/strict';
import { case1_1 as data } from '../src/cases/case1-1.js';
import {
  apparentRatio,
  trueRatio,
  predictionResult,
  clueFound,
  CLUE_PULL,
  isTrickCorrect,
  isFixed,
} from '../src/judge.js';
import { rubyHtml, plain } from '../src/text.js';

test('チラシの見た目では、大きく増えたように見える（5倍以上）', () => {
  assert.ok(apparentRatio(data.values, data.ground) >= 5);
});

test('本当は、ほとんど増えていない（1.1倍未満）', () => {
  assert.ok(trueRatio(data.values) < 1.1);
});

test('地面はどの月の数より下にある（ビルが全部地面から出ている）', () => {
  assert.ok(data.ground < Math.min(...data.values));
  assert.ok(data.ground > 0);
});

test('予想の「6倍くらい」は、見た目の倍率と合っている', () => {
  const shown = Math.round(apparentRatio(data.values, data.ground));
  const label = data.predict.options.find((o) => o.id === data.predict.apparent).label;
  assert.ok(label.startsWith(`${shown}倍`), `見た目は${shown}倍なのに「${label}」になっている`);
});

test('予想の判定：見た目どおり・正解・それ以外', () => {
  assert.equal(predictionResult(data, 'six'), 'fooled');
  assert.equal(predictionResult(data, 'same'), 'correct');
  assert.equal(predictionResult(data, 'two'), 'other');
  for (const o of data.predict.options) assert.ok(data.predict.reactions[predictionResult(data, o.id)]);
});

test('トリックの正解はちょうど1つで、まちがいには全部ポチョの反応がある', () => {
  const correct = data.tricks.filter((t) => t.correct);
  assert.equal(correct.length, 1);
  assert.ok(isTrickCorrect(data, correct[0].id));
  for (const t of data.tricks.filter((t) => !t.correct)) {
    assert.equal(isTrickCorrect(data, t.id), false);
    assert.ok(data.wrongReactions[t.id], `${t.id} の反応がない`);
  }
  assert.equal(isTrickCorrect(data, 'nothing'), false);
});

test('カメラを十分に引くと手がかりが見つかる', () => {
  assert.equal(clueFound(0), false);
  assert.equal(clueFound(CLUE_PULL - 0.01), false);
  assert.equal(clueFound(CLUE_PULL), true);
  assert.equal(clueFound(1), true);
});

test('地面を0まで下げると正しいグラフ', () => {
  assert.equal(isFixed(data.ground), false);
  assert.equal(isFixed(1), false);
  assert.equal(isFixed(0), true);
});

test('ふりがなの書き方：ルビになり、外すと漢字だけ', () => {
  assert.equal(rubyHtml('{探偵|たんてい}だ'), '<ruby>探偵<rt>たんてい</rt></ruby>だ');
  assert.equal(plain('{探偵|たんてい}だ'), '探偵だ');
  assert.equal(rubyHtml('<b>'), '&lt;b&gt;');
});

test('事件の文に、閉じていないふりがなの書き方がない', () => {
  const strings = [];
  const walk = (v) => {
    if (typeof v === 'string') strings.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(data);
  for (const s of strings) assert.equal(plain(s).match(/[{}|]/), null, `「${s}」`);
});
