// どの場面（3Dでも2Dでも）にも共通の、状態と操作。
// explore（0→1）は「調べる」操作（カメラを引く・回すなど）、fix は「直す」操作の値。
// 画面の上をドラッグしたりホイールを回したりしても explore が動く。

import { clamp01 } from '../judge.js';

export const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;

export function sceneState(explore = 0, fix = 0) {
  return { explore, exploreTarget: explore, fix, fixTarget: fix, highlight: false };
}

// 目標の値に向かって少しずつ近づける（動きを減らす設定ならすぐに）
export function ease(state, reducedMotion) {
  const k = reducedMotion ? 1 : 0.12;
  state.explore += (state.exploreTarget - state.explore) * k;
  state.fix += (state.fixTarget - state.fix) * k;
  if (Math.abs(state.exploreTarget - state.explore) < 1e-3) state.explore = state.exploreTarget;
  if (Math.abs(state.fixTarget - state.fix) < 1e-2) state.fix = state.fixTarget;
}

export function sceneApi(kind, el, state, onDispose) {
  let enabled = false;
  let notify = () => {};
  let dragX = null;

  function setExplore(p, instant = false) {
    state.exploreTarget = clamp01(p);
    if (instant) state.explore = state.exploreTarget;
  }
  function nudge(d) {
    setExplore(state.exploreTarget + d);
    notify(state.exploreTarget);
  }

  const onWheel = (e) => {
    if (!enabled) return;
    e.preventDefault();
    nudge(Math.sign(e.deltaY) * 0.06);
  };
  const onDown = (e) => {
    if (!enabled) return;
    dragX = e.clientX;
    el.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (dragX === null) return;
    nudge(((e.clientX - dragX) / (el.clientWidth || 1)) * 1.5);
    dragX = e.clientX;
  };
  const onUp = () => {
    dragX = null;
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);

  return {
    kind,
    setExplore,
    setFix(v, instant = false) {
      state.fixTarget = v;
      if (instant) state.fix = v;
    },
    setHighlight(on) {
      state.highlight = on;
    },
    // 調べている間だけ、ドラッグとホイールで動かせる（それ以外はページをふつうにスクロールできる）
    enableInput(on) {
      enabled = on;
      dragX = null;
      el.style.touchAction = on ? 'none' : '';
      el.style.cursor = on ? 'ew-resize' : '';
    },
    onExplore(cb) {
      notify = cb;
    },
    dispose() {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      onDispose();
    },
  };
}
