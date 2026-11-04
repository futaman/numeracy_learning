// おこづかいのシーソーの2D版。カメラを引くと全体が見え、はるか右に1人だけいるのが分かる。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { mean, median } from '../judge.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const PLANK_Y = 190;
const GROUND = 216;
const STACK = 14;

function kid(x, y, fill) {
  return `<rect x="${n(x - 5)}" y="${n(y - 8)}" width="10" height="8" rx="2" fill="${fill}" stroke="#2b2b2b" stroke-width="1.5"/>
    <circle cx="${n(x)}" cy="${n(y - 11)}" r="3.5" fill="#ffe0c4" stroke="#2b2b2b" stroke-width="1.5"/>`;
}

export function createSeesaw2D(container, data, { reducedMotion = false } = {}) {
  const x = (v) => 22 + (v / data.plank) * 356;
  const others = data.kids.slice(0, -1);
  const mid = median(data.kids);
  const midIndex = (data.kids.length - 1) / 2;

  return createStage2D(container, {
    width: W,
    height: H,
    fix: data.fix.start,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const t = smooth(0, 1, state.explore);
      const f = smooth(0, 1, (data.fix.start - state.fix) / (data.fix.start - data.fix.target));
      const avg = mean([...others, state.fix]);
      const reveal = smooth(0.45, 0.85, state.explore);
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;

      // カメラ：はじめは平均の近くだけを大きく見せる
      const k = lerp(1.45, 1, t);
      const tx = lerp(150 - x(mean(data.kids)) * 1.45, 0, t);
      const ty = PLANK_Y * (1 - k) + lerp(14, 0, t);

      let w = `<rect x="-400" y="${GROUND}" width="1600" height="60" fill="#a8d98a"/>`;
      w += `<rect x="${n(x(0) - 6)}" y="${PLANK_Y}" width="${n(x(data.plank) - x(0) + 12)}" height="7" rx="2" fill="#e0a96d" stroke="#2b2b2b" stroke-width="2.5"/>`;
      const fx = x(avg);
      w += `<polygon points="${n(fx)},${PLANK_Y + 7} ${n(fx - 14)},${GROUND} ${n(fx + 14)},${GROUND}" fill="#d62828" stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round"/>`;
      others.forEach((v, i) => {
        const y = PLANK_Y - i * STACK;
        w += kid(x(v), y, i === midIndex ? (pulse > 0.5 ? '#ff9f1c' : '#ffd166') : '#7ec8e3');
      });
      const rx = x(state.fix);
      w += kid(f > 0.9 ? rx + 12 : rx, PLANK_Y, '#c9a4ff');
      for (const v of [0, 10000, 20000, 30000, 40000]) {
        w += `<text x="${n(x(v))}" y="${GROUND + 16}" text-anchor="middle" class="small" opacity="${n(reveal)}">${v === 0 ? '0円' : `${v / 10000}万円`}</text>`;
      }

      let s = `<g transform="translate(${n(tx)} ${n(ty)}) scale(${n(k * 100) / 100})">${w}</g>`;
      s += `<text x="${W / 2}" y="26" text-anchor="middle" class="banner" opacity="${n(1 - 0.5 * t)}">${plain(data.banner)}</text>`;
      // 札は拡大しない。平均の場所の上に出す
      const sx = tx + k * fx;
      s += `<text x="${n(Math.min(sx + 18, 300))}" y="${n(ty + k * (GROUND - 2))}" font-weight="800" style="fill:#d62828" paint-order="stroke" stroke="#fff" stroke-width="3">平均 ${Math.round(avg / 100) * 100}円</text>`;
      if (reveal > 0) {
        const my = ty + k * (PLANK_Y - midIndex * STACK - 6);
        s += `<text x="${n(tx + k * x(mid) + 14)}" y="${n(my)}" font-weight="800" opacity="${n(reveal)}" paint-order="stroke" stroke="#fff" stroke-width="3">真ん中の子 ${mid}円</text>`;
        if (f < 0.02) s += `<text x="${n(tx + k * rx)}" y="${n(ty + k * (PLANK_Y - 22))}" text-anchor="middle" font-weight="800" opacity="${n(reveal)}" paint-order="stroke" stroke="#fff" stroke-width="3">${data.kids[data.kids.length - 1]}円</text>`;
      }
      return s;
    },
  });
}
