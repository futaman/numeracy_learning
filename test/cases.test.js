// どの事件にも共通の決まりを確かめる。

import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/cases/index.js';
import { predictionResult, clueFound, DEFAULT_CLUE, isTrickCorrect, isFixed, isUnlocked } from '../src/judge.js';
import { NAMES } from '../src/characters.js';
import { rubyHtml, plain } from '../src/text.js';

const SCENES = ['buildings', 'pictogram', 'pie', 'logaxis', 'dualaxis'];

for (const data of CASES) {
  test(`${data.id}：予想は「見た目どおり」「正解」がちがう選択肢で、どれにも反応がある`, () => {
    const ids = data.predict.options.map((o) => o.id);
    assert.ok(ids.includes(data.predict.apparent));
    assert.ok(ids.includes(data.predict.answer));
    assert.notEqual(data.predict.apparent, data.predict.answer);
    assert.equal(predictionResult(data, data.predict.apparent), 'fooled');
    assert.equal(predictionResult(data, data.predict.answer), 'correct');
    for (const o of data.predict.options) assert.ok(data.predict.reactions[predictionResult(data, o.id)]);
  });

  test(`${data.id}：トリックの正解はちょうど1つで、まちがいには全部ポチョの反応がある`, () => {
    const correct = data.tricks.filter((t) => t.correct);
    assert.equal(correct.length, 1);
    assert.ok(isTrickCorrect(data, correct[0].id));
    for (const t of data.tricks.filter((t) => !t.correct)) {
      assert.equal(isTrickCorrect(data, t.id), false);
      assert.ok(data.wrongReactions[t.id], `${t.id} の反応がない`);
    }
    assert.equal(isTrickCorrect(data, 'nothing'), false);
  });

  test(`${data.id}：調べる操作を十分に進めると手がかりが見つかる`, () => {
    const at = data.explore.threshold ?? DEFAULT_CLUE;
    assert.equal(clueFound(data, 0), false);
    assert.equal(clueFound(data, at - 0.01), false);
    assert.equal(clueFound(data, at), true);
    assert.equal(clueFound(data, 1), true);
  });

  if (data.fix) {
    test(`${data.id}：直す操作は、はじめは直っていなくて、目標まで動かすと直る`, () => {
      assert.ok(data.fix.min <= Math.min(data.fix.start, data.fix.target));
      assert.ok(data.fix.max >= Math.max(data.fix.start, data.fix.target));
      assert.equal(isFixed(data, data.fix.start), false);
      assert.equal(isFixed(data, data.fix.target), true);
    });
  }

  test(`${data.id}：場面・人物・ヒント・合言葉がそろっている`, () => {
    assert.ok(SCENES.includes(data.scene), data.scene);
    assert.equal(data.hints.length, 3);
    assert.ok(data.password && data.passwordNote && data.recall);
    assert.ok(data.ending.length >= 1);
    const lines = [...data.intro, ...data.investigate, ...data.clue.lines, ...data.explain, ...data.ending, data.deduce];
    if (data.fix) lines.push(data.fix.done);
    for (const l of lines) assert.ok(NAMES[l.who], `話す人「${l.who}」の名前がない`);
  });

  test(`${data.id}：文の中に、閉じていないふりがなの書き方がない`, () => {
    const strings = [];
    const walk = (v) => {
      if (typeof v === 'string') strings.push(v);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(data);
    for (const s of strings) assert.equal(plain(s).match(/[{}|]/), null, `「${s}」`);
  });
}

test('事件の番号が重ならず、合言葉もすべてちがう', () => {
  assert.equal(new Set(CASES.map((c) => c.id)).size, CASES.length);
  assert.equal(new Set(CASES.map((c) => c.password)).size, CASES.length);
});

test('前の事件を解くと、次の事件が開く', () => {
  assert.equal(isUnlocked(CASES, {}, 0), true);
  assert.equal(isUnlocked(CASES, {}, 1), false);
  assert.equal(isUnlocked(CASES, { [CASES[0].id]: true }, 1), true);
  assert.equal(isUnlocked(CASES, { [CASES[0].id]: true }, 2), false);
});

test('ふりがなの書き方：ルビになり、外すと漢字だけ', () => {
  assert.equal(rubyHtml('{探偵|たんてい}だ'), '<ruby>探偵<rt>たんてい</rt></ruby>だ');
  assert.equal(plain('{探偵|たんてい}だ'), '探偵だ');
  assert.equal(rubyHtml('<b>'), '&lt;b&gt;');
});
