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
