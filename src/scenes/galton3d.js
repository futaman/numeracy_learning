// ゴルトンボード（3D）。玉を落とす（explore）と、100人分のつりがね型の山ができる。
// テストの平均点（fix）を動かすと、山だけが動き、65点の旗はそのまま。

import { THREE, createStage3D, outlineOf, textSprite } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { galtonBalls, countAtLeast, clamp01 } from '../judge.js';
import { ballProgress } from './galtonBalls.js';
import { plain } from '../text.js';

const BIN = 0.72;
const ROW = 0.32;
const TOP = 7.9;
const RADIUS = 0.15;
const FLOOR = 0.17;
const LAYER = 0.3;

export function createGalton3D(container, data, { reducedMotion = false } = {}) {
  const stage = createStage3D(container, { clearColor: '#fdf1d0', fix: data.fix.start, reducedMotion });
  const { scene, toon } = stage;
  const X = (score) => ((score - 60) / data.step) * BIN;
  const center = 50;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 8), toon('#e0a96d'));
  floor.position.y = -0.15;
  scene.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 0.2), toon('#fff8e6'));
  back.position.set(0, 14.9, -0.5);
  scene.add(back);

  // 仕切りと点数の目盛り（動かない）
  for (let score = 25; score <= 100; score += data.step) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.7, 0.5), toon('#8a6a42'));
    wall.position.set(X(score) - BIN / 2, 1.85, 0);
    scene.add(wall);
  }
  for (let score = 30; score <= 90; score += 10) {
    const t = textSprite(`${score}`);
    t.userData.setSize(0.55);
    t.position.set(X(score), -0.36, 0.6);
    scene.add(t);
  }
  const unit = textSprite('点');
  unit.userData.setSize(0.55);
  unit.position.set(X(100), -0.36, 0.6);
  scene.add(unit);

  // ボードと玉は、平均点を動かすといっしょに動く
  const machine = new THREE.Group();
  scene.add(machine);
  const apex = X(center);
  const pinGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
  pinGeo.rotateX(Math.PI / 2);
  const pinMat = toon('#7a4fd6');
  for (let r = 0; r < data.rows; r++) {
    for (let j = 0; j <= r; j++) {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(apex + (j - r / 2) * BIN, TOP - r * ROW, 0);
      machine.add(pin);
    }
  }

  const balls = galtonBalls(data);
  const ballGeo = new THREE.SphereGeometry(RADIUS, 12, 8);
  const cool = toon('#7ec8e3');
  const hot = toon('#ff7a45', { emissive: new THREE.Color('#ff4400'), emissiveIntensity: 0 });
  const meshes = balls.map((b) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(ballGeo, cool);
    g.add(body, outlineOf(ballGeo, 0.025));
    g.userData.body = body;
    g.userData.stackX = apex + (b.rights - data.rows / 2) * BIN + (b.slot % 2 ? 0.16 : -0.16);
    g.userData.stackY = FLOOR + Math.floor(b.slot / 2) * LAYER;
    machine.add(g);
    return g;
  });

  // ミナさんの65点の旗（動かない）
  const flagHeight = 5.2;
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.09, flagHeight, 0.09), new THREE.MeshBasicMaterial({ color: '#d62828' }));
  pole.position.set(X(data.myScore), flagHeight / 2, 0.45);
  scene.add(pole);
  const flag = textSprite(`ミナさん ${data.myScore}点`, { color: '#d62828', bg: '#fff' });
  flag.userData.setSize(0.5);
  flag.position.set(X(data.myScore) + 1.75, flagHeight - 0.1, 0.5);
  scene.add(flag);

  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  banner.userData.setSize(0.62);
  banner.position.set(0.2, TOP + 0.85, 0);
  scene.add(banner);

  // 数字の札は、変わったときだけ作り直す
  let info = null;
  let infoShown = null;
  function showInfo(mean, count, alpha) {
    const text = `平均 ${mean}点　65点以上 ${count}人`;
    if (text !== infoShown) {
      if (info) {
        scene.remove(info);
        info.material.map.dispose();
        info.material.dispose();
      }
      info = textSprite(text, { color: '#2b2b2b', bg: '#ffffff' });
      info.userData.setSize(0.52);
      info.position.set(3.9, 7.1, 0.4);
      scene.add(info);
      infoShown = text;
    }
    info.material.opacity = alpha;
  }

  stage.start((state, time) => {
    const t = smooth(0, 1, state.explore);
    const az = lerp(0, 0.1, t);
    const d = lerp(13.6, 14.2, t);
    const look = new THREE.Vector3(0.4, 4.2, 0);
    stage.placeCamera(new THREE.Vector3(look.x + d * Math.sin(az), look.y + 0.5, d * Math.cos(az)), look);

    const shift = state.fix - data.fix.start;
    machine.position.x = (shift / data.step) * BIN;
    const landed = state.explore >= data.explore.threshold;
    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    hot.emissiveIntensity = pulse * 0.5;

    balls.forEach((b, i) => {
      const m = meshes[i];
      const p = ballProgress(b, i, balls.length, state.explore, data.rows);
      m.visible = p !== null;
      if (!p) return;
      const exitY = TOP - (data.rows - 1) * ROW - 0.2;
      if (p.settle > 0 || p.row >= data.rows) {
        const f = clamp01(p.settle);
        m.position.set(lerp(apex + p.col * BIN, m.userData.stackX, f), lerp(exitY, m.userData.stackY, f * f), 0);
      } else {
        // ピンのすき間を、はねながら落ちる
        const y = TOP - p.row * ROW + 0.22 + Math.abs(Math.sin(p.row * Math.PI)) * 0.06;
        m.position.set(apex + p.col * BIN, y, 0);
      }
      const roundedShift = Math.round(shift / data.step) * data.step;
      m.userData.body.material = landed && b.score + roundedShift >= data.myScore ? hot : cool;
    });

    const roundedShift = Math.round(shift / data.step) * data.step;
    showInfo(50 + roundedShift, countAtLeast(data.histogram, data.myScore, roundedShift), smooth(0.85, 1, state.explore));
    banner.material.opacity = 1 - 0.5 * smooth(0.6, 1, state.explore);
  });

  return stage.api;
}
