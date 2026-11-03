// 立体の円グラフの2D版。だ円につぶして厚みを付けた絵が、カメラを上へ動かすと真上から見た円になる。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const CX = 200;
const CY = 150;
const R = 100;

function darker(hex) {
  const v = parseInt(hex.slice(1), 16);
  const c = (s) => Math.round(((v >> s) & 255) * 0.72);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// だ円の扇形。角度は +x から時計回り（下が手前）
function sector(cx, cy, r, sy, a0, a1, fill, stroke = 'stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"') {
  const p = (a) => `${n(cx + r * Math.cos(a))},${n(cy + r * sy * Math.sin(a))}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `<path d="M${n(cx)},${n(cy)} L${p(a0)} A${n(r)},${n(r * sy)} 0 ${large} 1 ${p(a1)} Z" fill="${fill}" ${stroke}/>`;
}

export function createPie2D(container, data, { reducedMotion = false } = {}) {
  const total = data.slices.reduce((a, s) => a + s.share, 0);
  const best = data.slices.reduce((bi, s, i, all) => (s.share > all[bi].share ? i : bi), 0);

  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const el = (lerp(data.flyerElevation, 90, t) * Math.PI) / 180;
      const sy = Math.sin(el);
      const depth = 30 * Math.cos(el);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;

      let angle = Math.PI / 2 - ((data.slices[0].share / total) * Math.PI * 2) / 2;
      const parts = data.slices.map((s, i) => {
        const span = (s.share / total) * Math.PI * 2;
        const part = { ...s, a0: angle, a1: angle + span, mid: angle + span / 2, pop: i === 0 ? 14 : 0, i };
        angle += span;
        return part;
      });

      let out = `<text x="${W / 2}" y="26" text-anchor="middle" class="banner">${plain(data.banner)}</text>`;
      // 厚み：下の段から順に重ねる
      for (let k = depth; k > 0; k -= 2) {
        for (const p of parts) {
          const ox = Math.cos(p.mid) * p.pop;
          const oy = Math.sin(p.mid) * p.pop * sy;
          out += sector(CX + ox, CY + oy + k, R, sy, p.a0, p.a1, darker(p.color), 'stroke="none"');
        }
      }
      for (const p of parts) {
        const ox = Math.cos(p.mid) * p.pop;
        const oy = Math.sin(p.mid) * p.pop * sy;
        const fill = p.i === best && pulse ? '#ffffff' : p.color;
        out += sector(CX + ox, CY + oy, R, sy, p.a0, p.a1, fill);
        const lx = CX + ox + Math.cos(p.mid) * R * 0.6;
        const ly = CY + oy + Math.sin(p.mid) * R * 0.6 * sy;
        out += `<text x="${n(lx)}" y="${n(ly)}" text-anchor="middle" class="small" font-weight="700">${p.name}</text>`;
        if (state.explore > 0.7) out += `<text x="${n(lx)}" y="${n(ly + 16)}" text-anchor="middle" class="small" fill="#d62828" font-weight="700">${p.share}%</text>`;
      }
      return out;
    },
  });
}
