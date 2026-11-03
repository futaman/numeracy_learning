// 対数軸の折れ線グラフ（3Dでも2Dでも、この絵を使う）。
// 軸を切りかえる（explore）と、10倍ずつの目盛りから、ふつうの目盛りに変わっていく。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { logHeight } from '../judge.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const L = 78;
const R = 368;
const T = 48;
const B = 214;

// 1万、10万 のように読みやすく
function jp(v) {
  if (v >= 1e8) return `${v / 1e8}億`;
  if (v >= 1e4) return `${v / 1e4}万`;
  return String(v);
}

export function createLogAxis2D(container, data, { reducedMotion = false } = {}) {
  const [lo, hi] = data.logAxis;
  const maxHour = data.hours[data.hours.length - 1];
  const max = data.values[data.values.length - 1];
  const x = (h) => L + (h / maxHour) * (R - L);
  // 菌の数（2時間で10倍）を、なめらかな線にするための途中の値
  const at = (h) => data.values[0] * 10 ** (h / (data.hours[1] - data.hours[0]));

  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const logY = (v) => B - logHeight(v, lo, hi) * (B - T);
      const linY = (v) => B - (v / max) * (B - T);
      const y = (v) => lerp(logY(v), linY(Math.max(v, 0)), t);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
      let s = `<text x="${W / 2}" y="26" text-anchor="middle" class="banner">${plain(data.banner)}</text>`;

      // 10倍ずつの目盛り（ポスター）と、ふつうの目盛り
      const logAlpha = 1 - smooth(0.2, 0.6, state.explore);
      const linAlpha = smooth(0.5, 0.9, state.explore);
      const tickColor = pulse ? '#d62828' : '#2b2b2b';
      for (let v = lo; v <= hi; v *= 10) {
        s += `<g opacity="${n(logAlpha)}"><line x1="${L - 6}" x2="${R}" y1="${n(logY(v))}" y2="${n(logY(v))}" stroke="#d8d8d8" stroke-width="1"/>
          <text x="${L - 10}" y="${n(logY(v) + 5)}" text-anchor="end" class="small" fill="${tickColor}" font-weight="${pulse ? 800 : 400}">${jp(v)}</text></g>`;
      }
      for (let v = 0; v <= max; v += max / 5) {
        s += `<g opacity="${n(linAlpha)}"><line x1="${L - 6}" x2="${R}" y1="${n(linY(v))}" y2="${n(linY(v))}" stroke="#d8d8d8" stroke-width="1"/>
          <text x="${L - 10}" y="${n(linY(v) + 5)}" text-anchor="end" class="small">${jp(v)}</text></g>`;
      }
      s += `<line x1="${L}" x2="${L}" y1="${T - 6}" y2="${B}" stroke="#2b2b2b" stroke-width="3"/>`;
      s += `<line x1="${L}" x2="${R}" y1="${B}" y2="${B}" stroke="#2b2b2b" stroke-width="3"/>`;
      s += `<text x="${L + 8}" y="${T + 4}" class="small">（個）</text>`;

      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const h = (i / 64) * maxHour;
        pts.push(`${n(x(h))},${n(y(at(h)))}`);
      }
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#7a4fd6" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
      data.hours.forEach((h, i) => {
        const v = data.values[i];
        s += `<circle cx="${n(x(h))}" cy="${n(y(v))}" r="6" fill="#b89cff" stroke="#2b2b2b" stroke-width="3"/>`;
        s += `<text x="${n(x(h))}" y="${B + 20}" text-anchor="middle" class="small">${h}時間</text>`;
        if (state.explore > 0.75 && i >= 3) s += `<text x="${n(x(h) - 10)}" y="${n(y(v) + 4)}" text-anchor="end" class="small" font-weight="700">${jp(v)}個</text>`;
      });
      return s;
    },
  });
}
