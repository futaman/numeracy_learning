// 学校ごとの平均点（3Dでも2Dでも、この絵を使う）。
// テストをやり直す（explore）と、1回ごとの平均点が点になって残り、小さい学校ほど左右にぶれる。

import { createStage2D, n } from './svg2d.js';
import { smooth } from './common.js';
import { schoolAverages, topSchool, bottomSchool } from '../judge.js';
import { plain } from '../text.js';

const W = 400;
const H = 260;
const LEFT = 104;
const RIGHT = 388;
const LOW = 30;
const HIGH = 90;

export function createSchools2D(container, data, { reducedMotion = false } = {}) {
  const { rounds } = data.simulation;
  const averages = schoolAverages({ sizes: data.schools.map((s) => s.size), ...data.simulation });
  const X = (v) => LEFT + ((v - LOW) / (HIGH - LOW)) * (RIGHT - LEFT);
  const y = (i) => 70 + i * 42;

  return createStage2D(container, {
    width: W,
    height: H,
    label: plain(data.banner),
    reducedMotion,
    draw(state, time) {
      const done = Math.min(rounds, 1 + Math.floor(state.explore * rounds));
      const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
      const end = smooth(0.8, 1, state.explore);
      let s = `<text x="${W / 2}" y="24" text-anchor="middle" class="banner" opacity="${n(1 - 0.5 * smooth(0, 0.4, state.explore))}">${plain(data.banner)}</text>`;
      s += `<text x="${LEFT}" y="44" font-weight="800">テスト ${done}回目</text>`;

      for (let v = LOW; v <= HIGH; v += 10) {
        s += `<line x1="${n(X(v))}" x2="${n(X(v))}" y1="52" y2="${H - 30}" stroke="${v === 60 ? '#999' : '#e6e6e6'}" stroke-width="${v === 60 ? 2 : 1}"/>`;
        s += `<text x="${n(X(v))}" y="${H - 14}" text-anchor="middle" class="small">${v}${v === HIGH ? '点' : ''}</text>`;
      }

      // 今回の1位とびり
      const top = topSchool(averages, done - 1);
      const bottom = bottomSchool(averages, done - 1);
      const tops = data.schools.map((_, i) => averages[0].slice(0, done).filter((_, r) => topSchool(averages, r) === i).length);
      const bottoms = data.schools.map((_, i) => averages[0].slice(0, done).filter((_, r) => bottomSchool(averages, r) === i).length);

      data.schools.forEach((school, i) => {
        const rowY = y(i);
        s += `<text x="4" y="${rowY - 2}" font-weight="700" class="small">${school.name}</text>`;
        s += `<text x="4" y="${rowY + 13}" class="small">${school.size}人</text>`;
        const a = averages[i].slice(0, done);
        // ぶれた幅
        const lo = Math.min(...a);
        const hi = Math.max(...a);
        s += `<line x1="${n(X(lo))}" x2="${n(X(hi))}" y1="${rowY}" y2="${rowY}" stroke="${school.color}" stroke-width="${n(6 + 3 * pulse)}" stroke-linecap="round" opacity="0.35"/>`;
        a.forEach((v, r) => {
          const latest = r === done - 1;
          s += `<circle cx="${n(X(v))}" cy="${rowY}" r="${latest ? 7 : 3.5}" fill="${school.color}" stroke="#2b2b2b" stroke-width="${latest ? 2.5 : 1}"/>`;
        });
        const now = a[a.length - 1];
        const rank = i === top ? '1位' : i === bottom ? 'びり' : '';
        s += `<text x="${n(X(now))}" y="${rowY - 12}" text-anchor="middle" class="small" font-weight="800" paint-order="stroke" stroke="#fff" stroke-width="3">${now}点${rank ? ` ${rank}` : ''}</text>`;
        if (done > 1 && end > 0 && i === 0) {
          s += `<text x="4" y="${rowY - 16}" class="small" font-weight="800" opacity="${n(end)}" style="fill:#d62828">1位${tops[i]}回 びり${bottoms[i]}回</text>`;
        }
      });
      return s;
    },
  });
}
