// 事件の流れ：依頼 → 予想 → 調べる → 見破る →（直す）→ 解説 → 合言葉
// どの事件も同じ流れで、中身は src/cases/、場面は src/scenes/ から取ってくる。

import { CHAPTERS, CASES } from './cases/index.js';
import { predictionResult, clueFound, isTrickCorrect, isFixed, isUnlocked } from './judge.js';
import { rubyHtml } from './text.js';
import { portrait, NAMES } from './characters.js';
import { createScene } from './scenes/index.js';
import { figureFor } from './figures.js';

const $ = (sel) => document.querySelector(sel);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const force2d = params.has('2d');
// ?all で全部の事件を選べる（開発・確認用）
const openAll = params.has('all');

// ---- 保存（使えない環境でも遊べるように、失敗は無視する） ----
const SAVE_KEY = 'sujitantei';
function load() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) ?? {};
  } catch {
    return {};
  }
}
function store() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {}
}
const save = { name: '', ruby: true, passwords: [], solved: {}, ...load() };
const clues = [];

// ---- ふりがな ----
function applyRuby() {
  document.body.classList.toggle('no-ruby', !save.ruby);
  $('#ruby-toggle').setAttribute('aria-pressed', String(save.ruby));
}
$('#ruby-toggle').addEventListener('click', () => {
  save.ruby = !save.ruby;
  store();
  applyRuby();
});
applyRuby();

// ---- 遊んでいる事件 ----
// 事件を始め直したり一覧に戻ったりしたら、前の事件の待ち（ボタンやスライダー）を全部はずす
let run = new AbortController();
let scene = null;
let data = null;

// ---- 会話 ----
const fill = (text) => text.replaceAll('%NAME%', save.name || '見習い');

function show({ who, text, mood }) {
  $('#talk-portrait').innerHTML = portrait(who, mood);
  $('#talk-name').textContent = NAMES[who];
  $('#talk-text').innerHTML = rubyHtml(fill(text));
  $('#talk-actions').innerHTML = '';
  $('#talk-actions').classList.remove('choices');
}

function addButton(label, className = '') {
  const b = document.createElement('button');
  b.innerHTML = rubyHtml(label);
  b.className = className;
  $('#talk-actions').append(b);
  return b;
}

const clicked = (button) =>
  new Promise((resolve) => button.addEventListener('click', resolve, { once: true, signal: run.signal }));

async function say(lines) {
  for (const line of lines) {
    show(line);
    await clicked(addButton('つぎへ ▶', 'next'));
  }
}

// 正解がいつも同じ場所にならないように、選択肢の順番をまぜる
function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ask(line, options) {
  show(line);
  $('#talk-actions').classList.add('choices');
  return new Promise((resolve) => {
    for (const o of options) addButton(o.label, 'choice').addEventListener('click', () => resolve(o.id), { signal: run.signal });
  });
}

// ---- 操作パネル ----
function showControl(id) {
  for (const el of document.querySelectorAll('.control')) el.hidden = el.id !== id;
}

// ---- 手帳 ----
function renderNotebook() {
  $('#notebook-count').textContent = String(clues.length + save.passwords.length);
  const clueItems = clues.map((c) => `<li>${rubyHtml(c)}</li>`).join('') || '<li class="empty">まだない</li>';
  const pwItems = save.passwords.map((p) => `<li class="password">${rubyHtml(p)}</li>`).join('') || '<li class="empty">まだない</li>';
  $('#notebook-body').innerHTML = `<h3>手がかり</h3><ul>${clueItems}</ul><h3>合言葉カード</h3><ul>${pwItems}</ul>`;
}
$('#notebook-open').addEventListener('click', () => $('#notebook').showModal());
$('#notebook-close').addEventListener('click', () => $('#notebook').close());

// ---- 紙吹雪 ----
function confetti() {
  if (reducedMotion) return;
  const colors = ['#ffb347', '#7ec8e3', '#f78fb3', '#9be37e', '#ffd166'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('span');
    p.className = 'confetti';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 0.6}s`;
    p.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    document.body.append(p);
    setTimeout(() => p.remove(), 4000);
  }
}

// ---- 調べる・直す ----
// 「調べる」：スライダーと、場面の上のドラッグ・ホイールのどちらでも
function waitForClue() {
  const slider = $('#explore');
  return new Promise((resolve) => {
    const check = (p) => {
      if (clueFound(data, p)) resolve();
    };
    slider.addEventListener(
      'input',
      () => {
        const p = slider.valueAsNumber / 100;
        scene.setExplore(p);
        check(p);
      },
      { signal: run.signal },
    );
    scene.onExplore((p) => {
      slider.value = String(Math.round(p * 100));
      check(p);
    });
  });
}

function fixText(v) {
  return data.fix.unit ? `${v}${data.fix.unit}` : '';
}

function waitForFix() {
  const slider = $('#fix');
  return new Promise((resolve) => {
    slider.addEventListener(
      'input',
      () => {
        const v = slider.valueAsNumber;
        $('#fix-value').textContent = fixText(v);
        scene.setFix(v);
        if (isFixed(data, v)) resolve();
      },
      { signal: run.signal },
    );
  });
}

let hintIndex = 0;
$('#hint-button').addEventListener('click', () => {
  const text = data.hints[Math.min(hintIndex, data.hints.length - 1)];
  hintIndex++;
  $('#hint').innerHTML = `<b>ヒント${Math.min(hintIndex, data.hints.length)}</b> ${rubyHtml(text)}`;
  $('#hint').hidden = false;
});

// ---- 事件の一覧 ----
function openSelect() {
  run.abort();
  showControl(null);
  const chapter = CHAPTERS[0];
  $('#select-title').textContent = `${chapter.title}（${chapter.place}）`;
  const list = $('#case-list');
  list.innerHTML = '';
  chapter.cases.forEach((c) => {
    const index = CASES.indexOf(c);
    const open = openAll || isUnlocked(CASES, save.solved, index);
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = `case-button${save.solved[c.id] ? ' solved' : ''}${c.boss ? ' boss' : ''}`;
    b.disabled = !open;
    b.innerHTML = `<span class="case-id">${c.id}</span><span class="case-name">${open ? rubyHtml(c.title) : '？？？'}</span><span class="case-mark">${save.solved[c.id] ? '解決' : open ? '' : 'カギ'}</span>`;
    b.addEventListener('click', () => startCase(c));
    li.append(b);
    list.append(li);
  });
  $('#select').hidden = false;
}
$('#files-open').addEventListener('click', openSelect);

function startCase(c) {
  run.abort();
  run = new AbortController();
  $('#select').hidden = true;
  $('#card').hidden = true;
  data = c;
  scene?.dispose();
  scene = createScene($('#stage'), data, { reducedMotion, force2d });
  $('#stage').dataset.kind = scene.kind;
  $('#case-title').innerHTML = rubyHtml(`事件 ${data.id}　${data.title}`);
  playCase().catch((e) => console.error(e));
}

// ---- 事件の流れ ----
async function playCase() {
  clues.length = 0;
  hintIndex = 0;
  renderNotebook();
  $('#figure').hidden = true;
  $('#hint').hidden = true;
  scene.setHighlight(false);
  scene.enableInput(false);
  $('#explore').value = '0';
  $('#explore-label').innerHTML = rubyHtml(data.explore.label);
  if (data.fix) {
    const f = $('#fix');
    f.min = String(data.fix.min);
    f.max = String(data.fix.max);
    f.value = String(data.fix.start);
    $('#fix-label').innerHTML = rubyHtml(data.fix.label);
    $('#fix-value').textContent = fixText(data.fix.start);
  }
  showControl(null);

  // 依頼
  await say(data.intro);

  // 予想
  const guess = await ask({ who: 'chief', text: data.predict.question }, data.predict.options);
  await say([data.predict.reactions[predictionResult(data, guess)]]);

  // 調べる
  await say(data.investigate);
  show({ who: 'chief', text: data.explore.prompt });
  showControl('explore-control');
  scene.enableInput(true);
  await waitForClue();
  scene.enableInput(false);
  scene.setExplore(1);
  $('#explore').value = '100';
  scene.setHighlight(true);
  $('#hint').hidden = true;
  showControl(null);
  clues.push(data.clue.text);
  renderNotebook();
  $('#notebook-open').classList.add('glow');
  await say(data.clue.lines);
  $('#notebook-open').classList.remove('glow');

  // 見破る
  show(data.deduce);
  await clicked(addButton('見破る！', 'next big'));
  for (;;) {
    const trick = await ask(data.deduce, shuffled(data.tricks));
    if (isTrickCorrect(data, trick)) break;
    await say([{ who: 'pocho', mood: 'sad', text: data.wrongReactions[trick] }]);
  }
  scene.setHighlight(false);

  // 直す（グラフの事件だけ）
  if (data.fix) {
    show({ who: 'chief', text: data.fix.text });
    showControl('fix-control');
    await waitForFix();
    showControl(null);
    await say([data.fix.done]);
  } else {
    await say([{ who: 'chief', text: 'そのとおり！ 見事に{見破|みやぶ}ったね。' }]);
  }

  // 解説
  $('#figure').innerHTML = figureFor(data);
  $('#figure').hidden = false;
  await say(data.explain);
  const guessLabel = data.predict.options.find((o) => o.id === guess).label;
  await say([{ who: 'chief', text: `%NAME%{探偵|たんてい}の最初の予想は「${guessLabel}」だったね。${data.recall}` }]);
  $('#figure').hidden = true;

  // 合言葉
  if (!save.passwords.includes(data.password)) save.passwords.push(data.password);
  save.solved[data.id] = true;
  store();
  renderNotebook();
  $('#card-password').innerHTML = rubyHtml(data.password);
  $('#card-note').innerHTML = rubyHtml(data.passwordNote);
  $('#card').hidden = false;
  confetti();
  await clicked($('#card-close'));
  $('#card').hidden = true;

  await say(data.ending.slice(0, -1));
  show(data.ending[data.ending.length - 1]);
  const next = CASES[CASES.indexOf(data) + 1];
  const again = addButton('もう一度遊ぶ', 'next');
  const files = addButton('事件ファイルへ', 'next');
  const go = next ? addButton(`次の事件 ${next.id} へ ▶`, 'next big') : null;
  const choice = await Promise.race([clicked(again).then(() => 'again'), clicked(files).then(() => 'files'), go ? clicked(go).then(() => 'next') : new Promise(() => {})]);
  if (choice === 'again') startCase(data);
  else if (choice === 'next') startCase(next);
  else openSelect();
}

// ---- はじめの画面 ----
$('#name').value = save.name;
$('#start').addEventListener('click', () => {
  save.name = $('#name').value.trim().slice(0, 10);
  store();
  $('#title').hidden = true;
  openSelect();
});
renderNotebook();
