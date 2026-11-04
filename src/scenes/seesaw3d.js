// おこづかいのシーソー（3D）。板の上の位置がおこづかいの額で、支点が平均。
// カメラを引く（explore）と、はるか右に1人だけいるのが見える。
// 右はしの子を動かす（fix：その子のおこづかい）と、支点（平均）だけが動く。

import { THREE, createStage3D, outlineOf, textSprite } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { mean, median } from '../judge.js';
import { plain } from '../text.js';

const LENGTH = 16;
const PLANK_Y = 1.6;
const STACK = 0.64;
const KID_COLORS = ['#f78fb3', '#7ec8e3', '#9be37e', '#ffb347', '#ffd166', '#c9a4ff', '#7ec8e3', '#f78fb3'];

export function createSeesaw3D(container, data, { reducedMotion = false } = {}) {
  const stage = createStage3D(container, { clearColor: '#d9f2d0', fix: data.fix.start, reducedMotion });
  const { scene, toon } = stage;
  const x = (v) => (v / data.plank - 0.5) * LENGTH;
  const others = data.kids.slice(0, -1);
  const mid = median(data.kids);
  const midIndex = (data.kids.length - 1) / 2;

  const ground = new THREE.Mesh(new THREE.BoxGeometry(120, 0.3, 80), toon('#a8d98a'));
  ground.position.y = -0.15;
  scene.add(ground);

  const plank = new THREE.Mesh(new THREE.BoxGeometry(LENGTH + 0.6, 0.24, 1.8), toon('#e0a96d'));
  plank.position.y = PLANK_Y;
  const plankLine = new THREE.Mesh(new THREE.BoxGeometry(LENGTH + 0.72, 0.36, 1.92), new THREE.MeshBasicMaterial({ color: 0x2b2b2b, side: THREE.BackSide }));
  plankLine.position.y = PLANK_Y;
  scene.add(plank, plankLine);

  // 支点（平均の場所）
  const fulcrumGeo = new THREE.ConeGeometry(0.8, PLANK_Y - 0.12, 4);
  fulcrumGeo.rotateY(Math.PI / 4);
  fulcrumGeo.translate(0, (PLANK_Y - 0.12) / 2, 0);
  const fulcrum = new THREE.Group();
  fulcrum.add(new THREE.Mesh(fulcrumGeo, toon('#d62828')), outlineOf(fulcrumGeo, 0.05));
  scene.add(fulcrum);

  function kid(color, extra = {}) {
    const mat = toon(color, extra);
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.23, 0.34, 12);
    bodyGeo.translate(0, 0.17, 0);
    const headGeo = new THREE.SphereGeometry(0.17, 14, 10);
    headGeo.translate(0, 0.46, 0);
    const skin = toon('#ffe0c4');
    const group = new THREE.Group();
    group.add(new THREE.Mesh(bodyGeo, mat), outlineOf(bodyGeo, 0.03), new THREE.Mesh(headGeo, skin), outlineOf(headGeo, 0.03));
    group.userData.mat = mat;
    return group;
  }

  // 左の8人は、たがいに近いので肩車の山になる（下から少ない順）
  const tower = others.map((v, i) => {
    const k = kid(i === midIndex ? '#ffd166' : KID_COLORS[i], i === midIndex ? { emissive: new THREE.Color('#ffaa00'), emissiveIntensity: 0 } : {});
    k.position.set(x(v), PLANK_Y + 0.12 + i * STACK, 0);
    scene.add(k);
    return k;
  });
  const rich = kid('#c9a4ff');
  rich.position.y = PLANK_Y + 0.12;
  scene.add(rich);

  // 板の目盛り（カメラを引くと見える）
  const ticks = [0, 10000, 20000, 30000, 40000].map((v) => {
    const t = textSprite(v === 0 ? '0円' : `${v / 10000}万円`);
    t.userData.setSize(0.72);
    t.position.set(x(v), 0.45, 1.4);
    scene.add(t);
    return t;
  });

  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  banner.userData.setSize(0.62);
  scene.add(banner);

  const midLabel = textSprite(`真ん中の子 ${mid}円`, { color: '#b5651d' });
  midLabel.userData.setSize(0.8);
  scene.add(midLabel);
  const richLabel = textSprite(`${data.kids[data.kids.length - 1]}円`, { color: '#6d3fc0' });
  richLabel.userData.setSize(0.85);
  scene.add(richLabel);

  // 平均の札は、数字が変わったときだけ作り直す
  let avgLabel = null;
  let avgShown = null;
  function showAverage(value, px) {
    const rounded = Math.round(value / 100) * 100;
    if (rounded !== avgShown) {
      if (avgLabel) {
        scene.remove(avgLabel);
        avgLabel.material.map.dispose();
        avgLabel.material.dispose();
      }
      avgLabel = textSprite(`平均 ${rounded}円`, { color: '#d62828' });
      avgLabel.userData.setSize(0.8);
      scene.add(avgLabel);
      avgShown = rounded;
    }
    avgLabel.position.set(px + 2.9, PLANK_Y + 1.05, 0);
  }

  stage.start((state, time) => {
    const t = smooth(0, 1, state.explore);
    const f = smooth(0, 1, (data.fix.start - state.fix) / (data.fix.start - data.fix.target));
    const avg = mean([...others, state.fix]);
    const avgX = x(avg);
    fulcrum.position.x = avgX;
    rich.position.x = x(state.fix);
    // 動かし終えると、右はしの子も山のとなりに来る（重ならないように手前に）
    rich.position.z = lerp(0, 0.6, f);
    showAverage(avg, avgX);

    const c = t * (1 - 0.45 * f);
    const look = new THREE.Vector3(lerp(-5.6, 0, c), lerp(4.3, 3.3, c), 0);
    const d = lerp(12.5, 17.5, c);
    const az = lerp(0.05, 0.1, c);
    const el = lerp(0.12, 0.2, c);
    stage.placeCamera(new THREE.Vector3(look.x + d * Math.sin(az) * Math.cos(el), look.y + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)), look);

    const reveal = smooth(0.45, 0.85, state.explore);
    ticks.forEach((s) => (s.material.opacity = reveal));
    banner.position.set(look.x, look.y + lerp(3.7, 4.8, c), 0);
    banner.userData.setSize(lerp(0.62, 0.9, c));
    banner.material.opacity = 1 - 0.5 * t;

    midLabel.position.set(tower[midIndex].position.x + 4.1, tower[midIndex].position.y + 0.3, 0.3);
    midLabel.material.opacity = reveal;
    richLabel.position.set(rich.position.x, PLANK_Y + 1.25, rich.position.z);
    richLabel.visible = f < 0.02;
    richLabel.material.opacity = reveal;

    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    tower[midIndex].userData.mat.emissiveIntensity = pulse * 0.7;
  });

  return stage.api;
}
