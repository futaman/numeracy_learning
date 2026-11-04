// 差と比の棒（3Dでも2Dでも、この絵を使う）。
// はじめは値上げの分（差）だけを並べた図。切りかえる（explore）と、もとの値段を同じ長さにそろえた図（比）になる。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { priceChange } from '../judge.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const LEFT = 30;
const DIFF = 110;
const BASE = 150;

export function createRatio2D(container, data, { reducedMotion = false } = {}) {
  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
      const after = smooth(0.55, 0.85, state.explore);
      let s = `<text x="${W / 2}" y="26" text-anchor="middle" class="banner" opacity="${n(1 - 0.5 * t)}">${plain(data.banner)}</text>`;

      data.items.forEach((item, i) => {
        const y = 78 + i * 76;
        const { difference, ratio } = priceChange(item.before, item.after);
        const base = lerp(0, BASE, t);
        const add = lerp(DIFF, BASE * (ratio - 1), t);
        s += `<text x="${LEFT}" y="${y - 8}" font-weight="700">${plain(item.name)}</text>`;
        if (base > 1) {
          s += `<rect x="${LEFT}" y="${y}" width="${n(base)}" height="30" fill="#e8e8e8" stroke="#2b2b2b" stroke-width="2.5" opacity="${n(smooth(0, 0.3, state.explore))}"/>`;
          s += `<text x="${n(LEFT + base / 2)}" y="${y + 20}" text-anchor="middle" class="small" opacity="${n(after)}">もとの${item.before}円</text>`;
        }
        const stroke = pulse > 0.5 ? '#d62828' : '#2b2b2b';
        s += `<rect x="${n(LEFT + base)}" y="${y}" width="${n(Math.max(add, 3))}" height="30" fill="${item.color}" stroke="${stroke}" stroke-width="2.5"/>`;
        const labelX = LEFT + base + Math.max(add, 3) + 8;
        s += `<text x="${n(labelX)}" y="${y + 21}" font-weight="800" opacity="${n(1 - after)}">+${difference}円</text>`;
        s += `<text x="${n(labelX)}" y="${y + 21}" font-weight="800" opacity="${n(after)}" style="fill:#d62828">${ratio}倍</text>`;
      });

      s += `<text x="${LEFT}" y="${H - 14}" class="small" opacity="${n(1 - after)}">差：いくら上がったか（引き算）</text>`;
      s += `<text x="${LEFT}" y="${H - 14}" class="small" opacity="${n(after)}">比：もとの何倍になったか（わり算）</text>`;
      return s;
    },
  });
}
