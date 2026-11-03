// 3Dが使えない端末のための、同じ事件の2D版。buildings3d.js と同じ操作（setPull・setGround）で動く。
// カメラを引くと縦軸の下の端が0まで広がり、地面の下に埋まっていた部分が見える。

import { clamp01 } from '../judge.js';
import { plain } from '../text.js';

const COLORS = ['#ffb347', '#7ec8e3', '#f78fb3', '#9be37e'];
const W = 400;
const H = 260;
const L = 56;
const R = 388;
const T = 44;
const B = 222;

export function createBuildings2D(container, data, { reducedMotion = false } = {}) {
  const startGround = data.ground;
  const top = Math.max(...data.values) + 1;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'chart2d');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', plain(data.banner));
  container.append(svg);

  const state = { pull: 0, pullTarget: 0, ground: startGround, groundTarget: startGround, highlight: false };

  function draw(time) {
    const t = state.pull * state.pull * (3 - 2 * state.pull);
    const min = startGround * (1 - t);
    const y = (v) => B - ((v - min) / (top - min)) * (B - T);
    const g = state.ground;
    const step = top - min < 15 ? 1 : 20;
    const slot = (R - L) / data.values.length;
    let s = '';
    s += `<text x="${W / 2}" y="26" text-anchor="middle" class="banner">${plain(data.banner)}</text>`;
    // 地面の下（土）
    if (g > min) s += `<rect x="${L}" y="${y(g)}" width="${R - L}" height="${B - y(g)}" fill="#b07a4a" opacity="0.35"/>`;
    data.values.forEach((v, i) => {
      const x = L + slot * i + slot * 0.2;
      const w = slot * 0.6;
      const base = Math.max(min, 0);
      const split = Math.min(Math.max(g, base), v);
      if (split > base) s += `<rect x="${x}" y="${y(split)}" width="${w}" height="${y(base) - y(split)}" fill="${COLORS[i]}" opacity="0.35" stroke="#2b2b2b" stroke-dasharray="4 3"/>`;
      s += `<rect x="${x}" y="${y(v)}" width="${w}" height="${y(split) - y(v)}" fill="${COLORS[i]}" stroke="#2b2b2b" stroke-width="3"/>`;
      s += `<text x="${x + w / 2}" y="${B + 20}" text-anchor="middle">${data.months[i]}</text>`;
      if (state.pull > 0.75) s += `<text x="${x + w / 2}" y="${y(v) - 6}" text-anchor="middle" class="small">${v}${data.unit}</text>`;
    });
    const first = Math.ceil(min / step) * step;
    for (let v = first; v <= top; v += step) {
      s += `<line x1="${L - 6}" x2="${L}" y1="${y(v)}" y2="${y(v)}" stroke="#2b2b2b" stroke-width="2"/>`;
      s += `<text x="${L - 10}" y="${y(v) + 5}" text-anchor="end" class="small">${v}</text>`;
    }
    s += `<line x1="${L}" x2="${L}" y1="${T}" y2="${B}" stroke="#2b2b2b" stroke-width="3"/>`;
    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    s += `<line x1="${L}" x2="${R}" y1="${y(g)}" y2="${y(g)}" stroke="${pulse ? '#ff3b3b' : '#3f8f3a'}" stroke-width="${4 + 3 * pulse}"/>`;
    s += `<text x="${L + 4}" y="${y(g) + 15}" class="small">地面</text>`;
    svg.innerHTML = s;
  }

  let raf = 0;
  function frame(time) {
    const k = reducedMotion ? 1 : 0.15;
    state.pull += (state.pullTarget - state.pull) * k;
    state.ground += (state.groundTarget - state.ground) * k;
    if (Math.abs(state.pullTarget - state.pull) < 1e-3) state.pull = state.pullTarget;
    if (Math.abs(state.groundTarget - state.ground) < 1e-2) state.ground = state.groundTarget;
    draw(time);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    kind: '2d',
    setPull(p, instant = false) {
      state.pullTarget = clamp01(p);
      if (instant) state.pull = state.pullTarget;
    },
    setGround(g, instant = false) {
      state.groundTarget = Math.max(0, g);
      if (instant) state.ground = state.groundTarget;
    },
    setHighlight(on) {
      state.highlight = on;
    },
    enableWheel() {},
    onPull() {},
    dispose() {
      cancelAnimationFrame(raf);
      svg.remove();
    },
  };
}
