// 事件 1-1 の試作：依頼 → 予想 → 調べる → 見破る → 直す → 解説 → 合言葉

import { case1_1 as data } from './cases/case1-1.js';
import { apparentRatio, trueRatio, predictionResult, clueFound, isTrickCorrect, isFixed } from './judge.js';
import { rubyHtml } from './text.js';
import { portrait, NAMES } from './characters.js';
import { createBuildings3D, webglAvailable } from './scenes/buildings3d.js';
import { createBuildings2D } from './scenes/buildings2d.js';

const $ = (sel) => document.querySelector(sel);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const clicked = (button) => new Promise((resolve) => button.addEventListener('click', resolve, { once: true }));

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
    for (const o of options) addButton(o.label, 'choice').addEventListener('click', () => resolve(o.id));
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

// ---- 解説の絵：チラシの見え方と、正しい見え方を並べる ----
function compareFigure() {
  const max = Math.max(...data.values);
  const chart = (x, title, from, note) => {
    const bars = data.values
      .map((v, i) => {
        const h = ((v - from) / (max - from)) * 100;
        return `<rect x="${x + 14 + i * 36}" y="${130 - h}" width="24" height="${h}" fill="#ffb347" stroke="#2b2b2b" stroke-width="3"/>`;
      })
      .join('');
    return `<text x="${x + 80}" y="18" text-anchor="middle" font-weight="700">${title}</text>
      ${bars}
      <line x1="${x + 6}" x2="${x + 160}" y1="130" y2="130" stroke="#3f8f3a" stroke-width="4"/>
      <text x="${x + 80}" y="154" text-anchor="middle">地面 ${from}${data.unit}</text>
      <text x="${x + 80}" y="178" text-anchor="middle" font-weight="700" fill="#d62828">${note}</text>`;
  };
  const shown = Math.round(apparentRatio(data.values, data.ground));
  const real = trueRatio(data.values).toFixed(2);
  return `<svg viewBox="0 0 360 190" role="img" aria-label="チラシと正しいグラフの比べ">
    ${chart(10, 'チラシ', data.ground, `${shown}倍に見える`)}
    ${chart(190, '正しいグラフ', 0, `本当は${real}倍`)}
  </svg>`;
}

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

// ---- 場面 ----
const force2d = new URLSearchParams(location.search).has('2d');
let scene = null;
function makeScene() {
  const stage = $('#stage');
  if (!force2d && webglAvailable()) {
    try {
      return createBuildings3D(stage, data, { reducedMotion });
    } catch (e) {
      console.warn('3Dを使えないので2Dで表示します', e);
    }
  }
  return createBuildings2D(stage, data, { reducedMotion });
}

// 「カメラを引く」：スライダーとホイールのどちらでも
function waitForClue() {
  const slider = $('#pull');
  return new Promise((resolve) => {
    const check = (p) => {
      if (clueFound(p)) {
        slider.removeEventListener('input', onInput);
        resolve();
      }
    };
    const onInput = () => {
      const p = slider.valueAsNumber / 100;
      scene.setPull(p);
      check(p);
    };
    slider.addEventListener('input', onInput);
    scene.onPull((p) => {
      slider.value = String(Math.round(p * 100));
      check(p);
    });
  });
}

function waitForFix() {
  const slider = $('#ground');
  const out = $('#ground-value');
  return new Promise((resolve) => {
    const onInput = () => {
      const g = slider.valueAsNumber;
      out.textContent = `${g}${data.unit}`;
      scene.setGround(g);
      if (isFixed(g)) {
        slider.removeEventListener('input', onInput);
        resolve();
      }
    };
    slider.addEventListener('input', onInput);
  });
}

let hintIndex = 0;
$('#hint-button').addEventListener('click', () => {
  const text = data.hints[Math.min(hintIndex, data.hints.length - 1)];
  hintIndex++;
  $('#hint').innerHTML = `<b>ヒント${Math.min(hintIndex, data.hints.length)}</b> ${rubyHtml(text)}`;
  $('#hint').hidden = false;
});

// ---- 事件の流れ ----
async function playCase() {
  clues.length = 0;
  hintIndex = 0;
  renderNotebook();
  $('#figure').hidden = true;
  $('#hint').hidden = true;
  scene.setPull(0, true);
  scene.setGround(data.ground, true);
  scene.setHighlight(false);
  scene.enableWheel(false);
  $('#pull').value = '0';
  $('#ground').value = String(data.ground);
  $('#ground-value').textContent = `${data.ground}${data.unit}`;
  showControl(null);

  // 依頼
  await say(data.intro);

  // 予想
  const guess = await ask({ who: 'chief', text: data.predict.question }, data.predict.options);
  await say([data.predict.reactions[predictionResult(data, guess)]]);

  // 調べる
  await say(data.investigate);
  show({ who: 'chief', text: 'カメラを引いて、ビルを遠くから見てみよう。' });
  showControl('pull-control');
  scene.enableWheel(true);
  await waitForClue();
  scene.enableWheel(false);
  scene.setPull(1);
  $('#pull').value = '100';
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

  // 直す
  show({ who: 'chief', text: data.fix.text });
  showControl('ground-control');
  await waitForFix();
  showControl(null);
  await say([data.fix.done]);

  // 解説
  $('#figure').innerHTML = compareFigure();
  $('#figure').hidden = false;
  await say(data.explain);
  const guessLabel = data.predict.options.find((o) => o.id === guess).label;
  await say([{ who: 'chief', text: `%NAME%探偵の最初の予想は「${guessLabel}」だったね。見た目にまどわされないこと。それが探偵の第一歩だ。` }]);
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

  show({ who: 'pocho', mood: 'happy', text: '事件解決ポチョ！ ゴマカシ社のチラシ、もうこわくないポチョ！' });
  await clicked(addButton('もう一度遊ぶ', 'next'));
  playCase();
}

// ---- はじめの画面 ----
$('#name').value = save.name;
$('#start').addEventListener('click', () => {
  save.name = $('#name').value.trim().slice(0, 10);
  store();
  $('#title').hidden = true;
  scene = scene ?? makeScene();
  $('#stage').dataset.kind = scene.kind;
  playCase();
});
$('#case-title').innerHTML = rubyHtml(`事件 ${data.id}　${data.title}`);
renderNotebook();
