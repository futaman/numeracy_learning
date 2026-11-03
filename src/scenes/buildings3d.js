// ビルの棒グラフ（3D）。ビルは0から建っていて、地面より下は土に埋まっている。
// カメラを引く（explore: 0→1）と土が透けて、埋まっていた部分が見える。
// 地面の高さ（fix）を下げると、正しいグラフに直る。

import { THREE, createStage3D, outlineBox, textSprite } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const COLORS = ['#ffb347', '#7ec8e3', '#f78fb3', '#9be37e'];
const SPACING = 2.2;
const WIDTH = 1.4;

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

export function createBuildings3D(container, data, { reducedMotion = false } = {}) {
  const startGround = data.ground;
  const top = Math.max(...data.values);
  const xs = data.values.map((_, i) => (i - (data.values.length - 1) / 2) * SPACING);
  const axisX = xs[0] - WIDTH / 2 - 1.2;

  const stage = createStage3D(container, { fix: startGround, reducedMotion });
  const { scene, toon } = stage;

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

  stage.start((state, time) => {
    const pull = state.explore;
    const t = smooth(0, 1, pull);
    stage.placeCamera(near.pos.clone().lerp(far.pos, t), near.look.clone().lerp(far.look, t));

    const spread = lerp(1, 7, t);
    chart.scale.x = spread;
    axis.position.x = axisX * (spread - 1);

    const g = Math.max(0, state.fix);
    slabGroup.position.y = g - 0.15;
    // 土の上の面は地面の板の下に置く（重なってちらつかないように）
    soil.visible = g > 0.35;
    soil.scale.y = Math.max(g - 0.3, 0.001);
    soilMat.opacity = lerp(1, 0.5, smooth(0.25, 0.8, pull));

    const nearAlpha = 1 - smooth(0.2, 0.55, pull);
    nearTicks.visible = nearAlpha > 0.01;
    nearLabels.forEach((s) => (s.material.opacity = nearAlpha));
    const farAlpha = smooth(0.5, 0.9, pull);
    farTicks.visible = farAlpha > 0.01;
    farLabels.forEach((s) => (s.material.opacity = farAlpha));
    roofLabels.forEach(({ label, x, v }) => {
      label.material.opacity = smooth(0.75, 1, pull);
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
  });

  return stage.api;
}
