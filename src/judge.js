// 正解判定と、事件の数字の計算。画面には触らない（テストから呼べるように）。

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

// 予想の答えが、見た目どおりか、本当か
export function predictionResult(caseData, optionId) {
  if (optionId === caseData.predict.answer) return 'correct';
  if (optionId === caseData.predict.apparent) return 'fooled';
  return 'other';
}

// カメラをここまで引くと、埋まった部分が見えて手がかりになる
export const CLUE_PULL = 0.85;

export function clueFound(pull) {
  return pull >= CLUE_PULL;
}

export function isTrickCorrect(caseData, trickId) {
  const trick = caseData.tricks.find((t) => t.id === trickId);
  return Boolean(trick && trick.correct);
}

// 地面を0まで下げたら、正しいグラフ
export function isFixed(ground) {
  return ground <= 0;
}

// 0〜1 の数を、決まった範囲に収める
export function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
