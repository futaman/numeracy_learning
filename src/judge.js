// 正解判定と、事件の数字の計算。画面には触らない（テストから呼べるように）。

// 0〜1 の数を、決まった範囲に収める
export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// ---- どの事件にも使う判定 ----

// 予想の答えが、見た目どおりか、本当か
export function predictionResult(caseData, optionId) {
  if (optionId === caseData.predict.answer) return 'correct';
  if (optionId === caseData.predict.apparent) return 'fooled';
  return 'other';
}

// 「調べる」操作をここまで進めると、手がかりが見える
export const DEFAULT_CLUE = 0.85;

export function clueFound(caseData, explore) {
  return explore >= (caseData.explore.threshold ?? DEFAULT_CLUE);
}

export function isTrickCorrect(caseData, trickId) {
  const trick = caseData.tricks.find((t) => t.id === trickId);
  return Boolean(trick && trick.correct);
}

// 「直す」操作が目標の値まで来たら、正しい見せ方
export function isFixed(caseData, value) {
  return Math.abs(value - caseData.fix.target) <= (caseData.fix.tolerance ?? 0);
}

// 前の事件を解くと、次の事件が開く
export function isUnlocked(cases, solved, index) {
  return index === 0 || Boolean(solved[cases[index - 1].id]);
}

// ---- 1-1 棒グラフ ----

// 地面（縦軸のいちばん下）から上に見えている高さで比べたときの倍率
export function apparentRatio(values, ground) {
  const first = values[0] - ground;
  const last = values[values.length - 1] - ground;
  return last / first;
}

// 0から比べた、本当の倍率
export function trueRatio(values) {
  return values[values.length - 1] / values[0];
}

// ---- 1-2 絵グラフ ----

// 絵を縦・横・奥行きぜんぶ scale 倍にしたときの、見た目の大きさ
export function pictureGrowth(scale) {
  return { height: scale, area: scale ** 2, volume: scale ** 3 };
}

// ---- 1-3 立体の円グラフ ----

// 円グラフを elevation（度。90で真上）から見たときの、各切れの見える面積。
// 上の面は sin(仰角) で縮み、手前を向いた側面（厚み depth）は cos(仰角) で見える。
// 切れは front（度）を手前として、shares の順に時計回りに並ぶ。
export function pieVisibleAreas(shares, { elevation, depth = 0.25, radius = 1, front = 0, startAngle }) {
  const total = shares.reduce((a, b) => a + b, 0);
  const sinE = Math.sin((elevation * Math.PI) / 180);
  const cosE = Math.cos((elevation * Math.PI) / 180);
  let angle = startAngle ?? 0;
  return shares.map((share) => {
    const span = (share / total) * 360;
    const from = angle;
    angle += span;
    const top = Math.PI * radius * radius * (share / total) * sinE;
    // 側面：手前を向いている部分の、横から見た幅を足し合わせる
    let wall = 0;
    const steps = 360;
    for (let i = 0; i < steps; i++) {
      const a = ((from + ((i + 0.5) / steps) * span - front) * Math.PI) / 180;
      const facing = Math.cos(a);
      if (facing > 0) wall += facing * ((span * Math.PI) / 180 / steps) * radius;
    }
    return top + wall * depth * cosE;
  });
}

// ---- 1-4 対数軸 ----

// 対数軸で、いちばん下の目盛り lo から見た高さ（0〜1）
export function logHeight(v, lo, hi) {
  return (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
}

// ---- 1-5 2本の縦軸 ----

// 軸の範囲 lo〜hi の中で、v がどの高さにあるか（0〜1）
export function axisHeight(v, lo, hi) {
  return (v - lo) / (hi - lo);
}

// 2本の線が、それぞれの軸で見たときにどれだけずれているか（いちばん大きいずれ）
export function lineGap(a, aAxis, b, bAxis) {
  return Math.max(...a.map((v, i) => Math.abs(axisHeight(v, ...aAxis) - axisHeight(b[i], ...bAxis))));
}

// ---- 第2章 平均・中央値・差と比 ----

export function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// 少ない順に並べたときの真ん中の値
export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// 平均より多い人の数
export function countAboveMean(values) {
  const m = mean(values);
  return values.filter((v) => v > m).length;
}

// 同じ人数の中で、何倍か（比）と何人ふえたか（差）
export function riskChange(before, after, population) {
  return { times: after / before, added: after - before, addedRate: (after - before) / population };
}

// 値上げの差（いくら上がったか）と比（何倍になったか）
export function priceChange(before, after) {
  return { difference: after - before, ratio: after / before };
}

// ---- 2-4 点数の山 ----

// { 点数: 人数 } の表で、score 点以上の人数。shift だけ全員の点をずらして数える
export function countAtLeast(histogram, score, shift = 0) {
  return Object.entries(histogram).reduce((sum, [s, count]) => sum + (Number(s) + shift >= score ? count : 0), 0);
}

// 種（seed）が同じなら、いつも同じ乱数の列になる
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// ゴルトンボードの玉。人数の表どおりの場所に落ちるように、右に曲がる回数を決めてから道順をまぜる。
// path はピンの段ごとの向き（0=左、1=右）。slot は同じ場所の玉の中で何個目か。
export function galtonBalls({ histogram, rows, lowest, step, seed }) {
  const random = seededRandom(seed);
  const balls = [];
  for (const [score, count] of Object.entries(histogram)) {
    const rights = (Number(score) - lowest) / step;
    for (let i = 0; i < count; i++) {
      const path = Array.from({ length: rows }, (_, r) => (r < rights ? 1 : 0));
      balls.push({ score: Number(score), rights, path: shuffle(path, random) });
    }
  }
  shuffle(balls, random);
  const used = {};
  for (const b of balls) {
    b.slot = used[b.score] ?? 0;
    used[b.score] = b.slot + 1;
  }
  return balls;
}

// ---- 2-5 小さい学校の平均 ----

// ふつうの散らばりの乱数（ボックス・ミュラー法）
function normal(random) {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

// 同じ力の生徒たちがテストを何度も受けたときの、学校ごとの平均点。
// 返り値は学校ごとの配列で、1回目から順に平均点が並ぶ。
export function schoolAverages({ sizes, rounds, seed, score, spread }) {
  const random = seededRandom(seed);
  return sizes.map((size) =>
    Array.from({ length: rounds }, () => {
      let sum = 0;
      for (let i = 0; i < size; i++) sum += Math.min(100, Math.max(0, score + spread * normal(random)));
      return Math.round((sum / size) * 10) / 10;
    }),
  );
}

// i 回目のテストで、平均点がいちばん高い学校（いちばん低い学校）の番号
export function topSchool(averages, i) {
  return averages.reduce((best, a, s) => (a[i] > averages[best][i] ? s : best), 0);
}
export function bottomSchool(averages, i) {
  return averages.reduce((best, a, s) => (a[i] < averages[best][i] ? s : best), 0);
}
