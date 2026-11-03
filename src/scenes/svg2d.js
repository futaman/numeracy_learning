// SVG で描く場面の土台。draw(state, time) が返す SVG の中身を毎フレーム描き直す。

import { sceneState, ease, sceneApi } from './common.js';

export function createStage2D(container, { width, height, label, explore = 0, fix = 0, reducedMotion = false, draw }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'chart2d');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  container.append(svg);

  const state = sceneState(explore, fix);
  let raf = 0;
  function frame(time) {
    ease(state, reducedMotion);
    svg.innerHTML = draw(state, time);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return sceneApi('2d', svg, state, () => {
    cancelAnimationFrame(raf);
    svg.remove();
  });
}

// 小数を短く（SVG の文字を軽くするため）
export const n = (x) => Math.round(x * 10) / 10;
