// ゴルトンボードの2D版。動きは3D版と同じ（galtonBalls.js）。

import { createStage2D, n } from './svg2d.js';
import { smooth, lerp } from './common.js';
import { galtonBalls, countAtLeast, clamp01 } from '../judge.js';
import { ballProgress } from './galtonBalls.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const BIN = 26;
const ROW = 9;
const TOP = 42;
const FLOOR = 226;
const LAYER = 7.6;
const PER_LAYER = 3;

export function createGalton2D(container, data, { reducedMotion = false } = {}) {
  const X = (score) => 200 + ((score - 60) / data.step) * BIN;
  const apex = X(50);
  const balls = galtonBalls(data);
  const stack = (b) => ({
    x: apex + (b.rights - data.rows / 2) * BIN + ((b.slot % PER_LAYER) - 1) * 7.6,
    y: FLOOR - 4.5 - Math.floor(b.slot / PER_LAYER) * LAYER,
  });

  return createStage2D(container, {
    width: W,
    height: H,
    fix: data.fix.start,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const shift = state.fix - data.fix.start;
      const off = (shift / data.step) * BIN;
      const rounded = Math.round(shift / data.step) * data.step;
      const landed = state.explore >= data.explore.threshold;
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
      let s = `<text x="${W / 2}" y="24" text-anchor="middle" class="banner" opacity="${n(1 - 0.5 * smooth(0.6, 1, state.explore))}">${plain(data.banner)}</text>`;

      // 仕切りと目盛り
      for (let score = 25; score <= 100; score += data.step) {
        const x = X(score) + BIN / 2;
        s += `<line x1="${n(x)}" x2="${n(x)}" y1="${FLOOR - 70}" y2="${FLOOR}" stroke="#cdbb9c" stroke-width="1.5"/>`;
      }
      s += `<line x1="${n(X(25))}" x2="${n(X(100))}" y1="${FLOOR}" y2="${FLOOR}" stroke="#2b2b2b" stroke-width="3"/>`;
      for (let score = 30; score <= 90; score += 10) s += `<text x="${n(X(score))}" y="${FLOOR + 17}" text-anchor="middle" class="small">${score}</text>`;
      s += `<text x="${n(X(100))}" y="${FLOOR + 17}" text-anchor="end" class="small">点</text>`;

      // ピン
      for (let r = 0; r < data.rows; r++) {
        for (let j = 0; j <= r; j++) s += `<circle cx="${n(apex + off + (j - r / 2) * BIN)}" cy="${TOP + r * ROW}" r="1.8" fill="#7a4fd6"/>`;
      }
      // 玉
      const exitY = TOP + (data.rows - 1) * ROW + 4;
      balls.forEach((b, i) => {
        const p = ballProgress(b, i, balls.length, state.explore, data.rows);
        if (!p) return;
        const end = stack(b);
        let x;
        let y;
        if (p.settle > 0 || p.row >= data.rows) {
          const f = clamp01(p.settle);
          x = lerp(apex + p.col * BIN, end.x, f);
          y = lerp(exitY, end.y, f * f);
        } else {
          x = apex + p.col * BIN;
          y = TOP + p.row * ROW - 4;
        }
        const hot = landed && b.score + rounded >= data.myScore;
        const fill = hot ? (pulse > 0.5 ? '#ff4400' : '#ff7a45') : '#7ec8e3';
        s += `<circle cx="${n(x + off)}" cy="${n(y)}" r="3.7" fill="${fill}" stroke="#2b2b2b" stroke-width="1.3"/>`;
      });

      // 65点の旗（動かない）
      const fx = X(data.myScore);
      s += `<line x1="${n(fx)}" x2="${n(fx)}" y1="150" y2="${FLOOR + 3}" stroke="#d62828" stroke-width="3"/>`;
      s += `<text x="${n(fx + 6)}" y="160" font-weight="800" style="fill:#d62828" paint-order="stroke" stroke="#fff" stroke-width="3">ミナさん ${data.myScore}点</text>`;
      const alpha = smooth(0.85, 1, state.explore);
      s += `<g opacity="${n(alpha)}"><text x="${W - 8}" y="60" text-anchor="end" font-weight="800">平均 ${50 + rounded}点</text>
        <text x="${W - 8}" y="80" text-anchor="end" font-weight="800">${data.myScore}点以上 ${countAtLeast(data.histogram, data.myScore, rounded)}人</text></g>`;
      return s;
    },
  });
}
