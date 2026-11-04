// 町の人たちの2D版。1万人を点の模様で描き、カメラを引くと光る3人が小さくなっていく。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const CX = W / 2;
const CY = 150;
const SIDE = 100;
const GAP = 8;
// 光る人の場所（模様の1マスを1とした座標。0,0 は2つの塊のあいだ）
const LIT = [[-GAP / 2 - 0.5, 0.5, 0], [GAP / 2 + 0.5, 0.5, 1], [GAP / 2 + 2.5, -2.5, 1]];

export function createCrowd2D(container, data, { reducedMotion = false } = {}) {
  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const k = Math.exp(lerp(Math.log(20), Math.log(1.72), t));
      const crowd = smooth(0.05, 0.7, state.explore);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
      const end = smooth(0.5, 0.85, state.explore);

      let s = `<defs><pattern id="people" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#eef6e8"/><circle cx="0.5" cy="0.5" r="0.34" fill="#6fa8c7"/></pattern></defs>`;
      s += `<g transform="translate(${CX} ${CY}) scale(${n(k * 100) / 100})" opacity="${n(crowd)}">
        <rect x="${-GAP / 2 - SIDE}" y="${-SIDE / 2}" width="${SIDE}" height="${SIDE}" fill="url(#people)"/>
        <rect x="${GAP / 2}" y="${-SIDE / 2}" width="${SIDE}" height="${SIDE}" fill="url(#people)"/></g>`;

      for (const [x, y] of LIT) {
        const sx = CX + x * k;
        const sy = CY + y * k;
        const r = lerp(14, 4, t);
        s += `<circle cx="${n(sx)}" cy="${n(sy)}" r="${n(r + 6 + 5 * pulse)}" fill="none" stroke="#ff5a1f" stroke-width="3"/>`;
        s += `<circle cx="${n(sx)}" cy="${n(sy)}" r="${n(r)}" fill="#ffd166" stroke="#2b2b2b" stroke-width="${n(lerp(3, 1.5, t))}"/>`;
      }

      const labelAlpha = 1 - end;
      s += `<text x="${n(CX + LIT[0][0] * k - 28)}" y="${n(CY + 44)}" text-anchor="end" font-weight="800" opacity="${n(labelAlpha)}">ゲームをしない${data.before}人</text>`;
      s += `<text x="${n(CX + LIT[1][0] * k + 28)}" y="${n(CY + 44)}" font-weight="800" opacity="${n(labelAlpha)}">ゲームをする${data.after}人</text>`;
      s += `<text x="${n(CX - (GAP / 2 + SIDE / 2) * k)}" y="${H - 8}" text-anchor="middle" font-weight="800" opacity="${n(end)}" style="fill:#d62828">1万人に1人</text>`;
      s += `<text x="${n(CX + (GAP / 2 + SIDE / 2) * k)}" y="${H - 8}" text-anchor="middle" font-weight="800" opacity="${n(end)}" style="fill:#d62828">1万人に2人</text>`;
      s += `<text x="${W / 2}" y="26" text-anchor="middle" class="banner" opacity="${n(1 - 0.4 * t)}">${plain(data.banner)}</text>`;
      return s;
    },
  });
}
