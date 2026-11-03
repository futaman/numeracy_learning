// トマトの箱の絵グラフの2D版。絵を回すと箱に奥行きが付き、大きい箱に小さい箱8個分の線が見える。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const FLOOR = 214;
const UNIT = 56;

// ななめから見た箱（前の面・上の面・右の面）。d は奥行きの見え方
function box(x, y, w, d, { fill = '#e0a96d', stroke = '#2b2b2b', width = 3, dash = '' } = {}) {
  const k = d * 0.5;
  const sw = `stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}`;
  return `
    <polygon points="${n(x)},${n(y)} ${n(x + k)},${n(y - k)} ${n(x + w + k)},${n(y - k)} ${n(x + w)},${n(y)}" fill="${fill}" ${sw}/>
    <polygon points="${n(x + w)},${n(y)} ${n(x + w + k)},${n(y - k)} ${n(x + w + k)},${n(y + w - k)} ${n(x + w)},${n(y + w)}" fill="#c48a4f" ${sw}/>
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(w)}" fill="${fill}" ${sw}/>`;
}

function tomatoes(x, y, w) {
  return [[0.28, 0.55], [0.72, 0.55], [0.5, 0.33]]
    .map(([a, b]) => `<circle cx="${n(x + a * w)}" cy="${n(y + b * w)}" r="${n(w * 0.15)}" fill="#e63946" stroke="#2b2b2b" stroke-width="2"/>`)
    .join('');
}

export function createPictogram2D(container, data, { reducedMotion = false } = {}) {
  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    fix: data.fix.start,
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const f = smooth(0, 1, state.fix / 100);
      const reveal = smooth(0.6, 0.95, state.explore) * (1 - f);
      let s = `<text x="${W / 2}" y="26" text-anchor="middle" class="banner">${plain(data.banner)}</text>`;
      s += `<line x1="20" x2="${W - 20}" y1="${FLOOR}" y2="${FLOOR}" stroke="#2b2b2b" stroke-width="3"/>`;

      // 左の箱
      const sx = 70;
      s += box(sx, FLOOR - UNIT, UNIT, UNIT * t);
      s += tomatoes(sx, FLOOR - UNIT, UNIT);
      s += `<text x="${sx + UNIT / 2}" y="${FLOOR + 22}" text-anchor="middle" class="small">${data.shops[0].name} ${data.shops[0].value}${data.unit}</text>`;

      // 右の箱：大きい1個 →（並べる）→ 同じ大きさの2個
      const bx = 200;
      const size = UNIT * lerp(data.scale, 1, f);
      s += box(bx, FLOOR - size, size, size * t, { fill: reveal > 0.5 ? '#fff3e0' : '#e0a96d' });
      if (reveal < 0.5) s += tomatoes(bx, FLOOR - size, size);
      if (f > 0.01) {
        const w2 = UNIT * f;
        s += box(bx + UNIT + 8, FLOOR - w2, w2, w2 * t);
        s += tomatoes(bx + UNIT + 8, FLOOR - w2, w2);
      }
      // 小さい箱8個分の線（前の4個と、奥の4個）
      if (reveal > 0.01) {
        const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
        const stroke = pulse ? '#d62828' : '#2b2b2b';
        const k = UNIT * t * 0.5;
        for (const back of [1, 0]) for (const i of [0, 1]) for (const j of [0, 1]) {
          const x = bx + i * UNIT + back * k;
          const y = FLOOR - size + j * UNIT - back * k;
          s += `<g opacity="${n(reveal)}">${box(x, y, UNIT, UNIT * t, { fill: back ? '#ffe3b8' : 'none', stroke, width: 2, dash: back ? '4 3' : '' })}</g>`;
        }
      }
      s += `<text x="${bx + UNIT * lerp(data.scale, 2, f) * 0.5}" y="${FLOOR + 22}" text-anchor="middle" class="small">${data.shops[1].name} ${data.shops[1].value}${data.unit}</text>`;
      return s;
    },
  });
}
