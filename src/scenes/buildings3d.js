// ビルの棒グラフ（3D）。ビルは0から建っていて、地面より下は土に埋まっている。
// カメラを引く（pull: 0→1）と土が透けて、埋まっていた部分が見える。
// 地面の高さ（ground）を下げると、正しいグラフに直る。

import * as THREE from '../../vendor/three.module.js';
import { clamp01 } from '../judge.js';
import { plain } from '../text.js';

const INK = 0x2b2b2b;
const COLORS = ['#ffb347', '#7ec8e3', '#f78fb3', '#9be37e'];
const SPACING = 2.2;
const WIDTH = 1.4;
const OUTLINE = 0.16;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// トゥーン調の3段階の陰
function toonGradient() {
  const tex = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

function windowTexture(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#4d6f99';
  g.strokeStyle = '#2b2b2b';
  g.lineWidth = 4;
  g.fillRect(18, 16, 28, 30);
  g.strokeRect(18, 16, 28, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 太い線の輪郭（裏返した一回り大きい箱）
function outlineBox(w, h, d) {
  const geo = new THREE.BoxGeometry(w + OUTLINE, h + OUTLINE, d + OUTLINE);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
}

function textSprite(text, { color = '#2b2b2b', stroke = '#ffffff', bg = null } = {}) {
  const font = 'bold 96px "BIZ UDPGothic", "Hiragino Maru Gothic ProN", Meiryo, sans-serif';
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 48;
  c.width = w;
  c.height = 132;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (bg) {
    g.fillStyle = bg;
    g.strokeStyle = '#2b2b2b';
    g.lineWidth = 10;
    g.beginPath();
    g.roundRect(5, 5, w - 10, 122, 30);
    g.fill();
    g.stroke();
  } else {
    g.lineWidth = 18;
    g.strokeStyle = stroke;
    g.lineJoin = 'round';
    g.strokeText(text, w / 2, 70);
  }
  g.fillStyle = color;
  g.fillText(text, w / 2, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 10;
  sprite.userData.aspect = w / 132;
  sprite.userData.setSize = (h) => sprite.scale.set(h * sprite.userData.aspect, h, 1);
  return sprite;
}

export function createBuildings3D(container, data, { reducedMotion = false } = {}) {
  const startGround = data.ground;
  const top = Math.max(...data.values);
  const xs = data.values.map((_, i) => (i - (data.values.length - 1) / 2) * SPACING);
  const axisX = xs[0] - WIDTH / 2 - 1.2;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor('#bfe6ff');
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8a8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 10, 8);
  scene.add(sun);

  const gradientMap = toonGradient();
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });

  // ビル（0から建っている）。本当の比率のままだと遠くから見たとき細い線になるので、
  // カメラを引くにつれてグラフを横にも広げる（chart.scale.x）。
  const chart = new THREE.Group();
  scene.add(chart);
  const roofLabels = [];
  data.values.forEach((v, i) => {
    const map = windowTexture(COLORS[i % COLORS.length]);
    map.repeat.set(2, v / 2.5);
    const geo = new THREE.BoxGeometry(WIDTH, v, WIDTH);
    geo.translate(0, v / 2, 0);
    const body = new THREE.Mesh(geo, toon(0xffffff, { map }));
    const line = outlineBox(WIDTH, v, WIDTH);
    line.position.y = v / 2;
    const group = new THREE.Group();
    group.add(body, line);
    group.position.x = xs[i];
    chart.add(group);

    const label = textSprite(`${v}${data.unit}`);
    roofLabels.push({ label, x: xs[i], v });
    scene.add(label);
  });

  // 地面（上の薄い板）と土（地面の下）
  const groundMat = toon('#7cc36a', { emissive: new THREE.Color('#ff3b3b'), emissiveIntensity: 0 });
  // 横に広くして、遠くから見ても「地面の断面」に見えるようにする
  const slab = new THREE.Mesh(new THREE.BoxGeometry(600, 0.3, 12), groundMat);
  const slabLine = outlineBox(600, 0.3, 12);
  const slabGroup = new THREE.Group();
  slabGroup.add(slab, slabLine);
  scene.add(slabGroup);

  const soilGeo = new THREE.BoxGeometry(600, 1, 12);
  soilGeo.translate(0, 0.5, 0);
  const soilMat = toon('#b07a4a', { transparent: true, depthWrite: false });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  scene.add(soil);

  // 0の高さ（本当のいちばん下）
  const zero = new THREE.Mesh(new THREE.BoxGeometry(600, 0.8, 12), toon('#5a3d22'));
  zero.position.y = -0.4;
  scene.add(zero);

  // 縦軸の柱と目盛り（グラフを横に広げても、いちばん左に付いていく）
  const axis = new THREE.Group();
  scene.add(axis);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.25, top + 2, 0.25), toon('#555555'));
  pole.position.set(axisX, (top + 2) / 2, 0);
  axis.add(pole);

  // 近くで見る目盛り（1個ごと）と、遠くで見る目盛り（20個ごと）
  const nearTicks = new THREE.Group();
  const nearLabels = [];
  for (let v = startGround; v <= top; v += 1) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.1), toon('#2b2b2b'));
    mark.position.set(axisX, v, 0.2);
    const label = textSprite(String(v));
    label.position.set(axisX - 1.0, v, 0.3);
    label.userData.setSize(0.7);
    nearTicks.add(mark, label);
    nearLabels.push(label);
  }
  const farTicks = new THREE.Group();
  const farLabels = [];
  for (let v = 0; v <= top; v += 20) {
    const mark = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.1), toon('#2b2b2b'));
    mark.position.set(axisX, v, 0.2);
    const label = textSprite(String(v));
    label.position.set(axisX - 7, v, 0.3);
    label.userData.setSize(6.5);
    farTicks.add(mark, label);
    farLabels.push(label);
  }
  axis.add(nearTicks, farTicks);

  const monthLabels = data.months.map((m, i) => {
    const label = textSprite(m);
    scene.add(label);
    return { label, x: xs[i] };
  });

  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  banner.position.set(0, top + 1.6, 0);
  banner.userData.setSize(1.1);
  scene.add(banner);

  // カメラの2つの位置：チラシの見え方（近い）と、全体が見える位置（遠い）
  const near = { pos: new THREE.Vector3(1.6, startGround + 5, 12.5), look: new THREE.Vector3(0, startGround + 3.8, 0) };
  const far = { pos: new THREE.Vector3(14, top * 0.55, top * 1.62), look: new THREE.Vector3(0, top * 0.5, 0) };

  const state = { pull: 0, pullTarget: 0, ground: startGround, groundTarget: startGround, highlight: false };
  let onPull = () => {};
  let wheelEnabled = false;

  function layout() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 縦長の画面では、横がはみ出さないように少し離れる
    camera.userData.widen = Math.max(1, 1.5 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(layout);
  ro.observe(container);
  layout();

  function apply(time) {
    const t = smooth(0, 1, state.pull);
    const pos = near.pos.clone().lerp(far.pos, t);
    const look = near.look.clone().lerp(far.look, t);
    pos.sub(look).multiplyScalar(camera.userData.widen).add(look);
    camera.position.copy(pos);
    camera.lookAt(look);

    const spread = lerp(1, 7, t);
    chart.scale.x = spread;
    axis.position.x = axisX * (spread - 1);

    const g = state.ground;
    slabGroup.position.y = g - 0.15;
    // 土の上の面は地面の板の下に置く（重なってちらつかないように）
    soil.visible = g > 0.35;
    soil.scale.y = Math.max(g - 0.3, 0.001);
    soilMat.opacity = lerp(1, 0.5, smooth(0.25, 0.8, state.pull));

    const nearAlpha = 1 - smooth(0.2, 0.55, state.pull);
    nearTicks.visible = nearAlpha > 0.01;
    nearLabels.forEach((s) => (s.material.opacity = nearAlpha));
    const farAlpha = smooth(0.5, 0.9, state.pull);
    farTicks.visible = farAlpha > 0.01;
    farLabels.forEach((s) => (s.material.opacity = farAlpha));
    roofLabels.forEach(({ label, x, v }) => {
      label.material.opacity = smooth(0.75, 1, state.pull);
      label.userData.setSize(4.5);
      label.position.set(x * spread, v + 4, 0);
    });
    // 月の名前：近くではビルの前の地面に、遠くでは地面の線の下に
    const monthSize = lerp(0.6, 5, t);
    monthLabels.forEach(({ label, x }) => {
      label.userData.setSize(monthSize);
      label.position.set(x * spread, lerp(g + 0.45, g - 4.5, t), lerp(1.6, 6.4, t));
    });
    banner.material.opacity = 1 - 0.6 * t;

    groundMat.emissiveIntensity = state.highlight ? 0.35 + 0.35 * Math.sin(time / 180) : 0;
  }

  let raf = 0;
  function frame(time) {
    const k = reducedMotion ? 1 : 0.12;
    state.pull += (state.pullTarget - state.pull) * k;
    state.ground += (state.groundTarget - state.ground) * k;
    if (Math.abs(state.pullTarget - state.pull) < 1e-3) state.pull = state.pullTarget;
    if (Math.abs(state.groundTarget - state.ground) < 1e-2) state.ground = state.groundTarget;
    apply(time);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function onWheel(e) {
    if (!wheelEnabled) return;
    e.preventDefault();
    api.setPull(state.pullTarget + Math.sign(e.deltaY) * 0.06);
    onPull(state.pullTarget);
  }
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  const api = {
    kind: '3d',
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
    enableWheel(on) {
      wheelEnabled = on;
    },
    onPull(cb) {
      onPull = cb;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return api;
}
