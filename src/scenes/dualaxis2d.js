// 縦軸が2本の折れ線グラフ（3Dでも2Dでも、この絵を使う）。
// 右の軸のつまみ（explore）を動かすと、右の目盛りがせまい範囲から0〜100点に広がる。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { axisHeight } from '../judge.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const L = 58;
const R = 336;
const T = 66;
const B = 214;
const ICE = '#3a86c8';
const SCORE = '#ff7a45';

// 目盛りの間かく（6本くらいになるように）
function stepFor(range) {
  return [0.5, 1, 2, 5, 10, 20, 25, 50].find((s) => range / s <= 6) ?? 50;
}

export function createDualAxis2D(container, data, { reducedMotion = false } = {}) {
  const { left, right } = data;
  const x = (i) => L + 24 + (i / (data.months.length - 1)) * (R - L - 48);

  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const lo = lerp(right.flyerAxis[0], right.fairAxis[0], t);
      const hi = lerp(right.flyerAxis[1], right.fairAxis[1], t);
      const yL = (v) => B - axisHeight(v, ...left.axis) * (B - T);
      const yR = (v) => B - axisHeight(v, lo, hi) * (B - T);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;

      let s = `<text x="${W / 2}" y="24" text-anchor="middle" class="banner">${plain(data.banner)}</text>`;
      s += `<line x1="${L}" x2="${L + 18}" y1="44" y2="44" stroke="${ICE}" stroke-width="5"/><text x="${L + 24}" y="49" class="small">${left.name}（左）</text>`;
      s += `<line x1="${L + 170}" x2="${L + 188}" y1="44" y2="44" stroke="${SCORE}" stroke-width="5"/><text x="${L + 194}" y="49" class="small">${right.name}（右）</text>`;

      // 左の目盛り
      for (let v = left.axis[0]; v <= left.axis[1]; v += 100) {
        s += `<line x1="${L}" x2="${R}" y1="${n(yL(v))}" y2="${n(yL(v))}" stroke="#e2e2e2" stroke-width="1"/>`;
        s += `<text x="${L - 8}" y="${n(yL(v) + 5)}" text-anchor="end" class="small" fill="${ICE}">${v}</text>`;
      }
      // 右の目盛り（つまみで広がる）
      const step = stepFor(hi - lo);
      const axisColor = pulse ? '#d62828' : SCORE;
      for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) {
        s += `<line x1="${R}" x2="${R + 6}" y1="${n(yR(v))}" y2="${n(yR(v))}" stroke="${axisColor}" stroke-width="2"/>`;
        s += `<text x="${R + 9}" y="${n(yR(v) + 5)}" class="small" fill="${axisColor}" font-weight="${pulse ? 800 : 400}">${Number(v.toFixed(1))}</text>`;
      }
      s += `<line x1="${L}" x2="${L}" y1="${T}" y2="${B}" stroke="${ICE}" stroke-width="3"/>`;
      s += `<line x1="${R}" x2="${R}" y1="${T}" y2="${B}" stroke="${axisColor}" stroke-width="${3 + 2 * pulse}"/>`;
      s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="#2b2b2b" stroke-width="3"/>`;
      // つまみ
      s += `<circle cx="${R}" cy="${T - 4}" r="7" fill="#fff" stroke="${axisColor}" stroke-width="3"/>`;

      const line = (values, y, color) =>
        `<polyline points="${values.map((v, i) => `${n(x(i))},${n(y(v))}`).join(' ')}" fill="none" stroke="${color}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>` +
        values.map((v, i) => `<circle cx="${n(x(i))}" cy="${n(y(v))}" r="5" fill="${color}" stroke="#2b2b2b" stroke-width="2"/>`).join('');
      s += line(left.values, yL, ICE);
      s += line(right.values, yR, SCORE);
      if (state.explore > 0.75) {
        right.values.forEach((v, i) => {
          if (i === 0 || i === right.values.length - 1) s += `<text x="${n(x(i))}" y="${n(yR(v) - 10)}" text-anchor="middle" class="small" fill="${SCORE}" font-weight="700">${v}${right.unit}</text>`;
        });
      }
      data.months.forEach((m, i) => (s += `<text x="${n(x(i))}" y="${B + 20}" text-anchor="middle" class="small">${m}</text>`));
      return s;
    },
  });
}
