// 町の人たち（3D）。チラシに出ているのは光る3人だけ。
// カメラを引く（explore）と、1万人ずつの人があふれ、3人はその中のほんの少しだと分かる。

import { THREE, createStage3D, outlineOf, textSprite } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { clamp01, seededRandom } from '../judge.js';
import { plain } from '../text.js';

const SIZE = 100;
const SPACING = 0.5;
const GAP = 6;
const COLORS = ['#7ec8e3', '#f78fb3', '#9be37e', '#ffb347', '#c9a4ff', '#f2d9a8'];
// 光る人のマス（左の塊の右はしと、右の塊の左はしに近いところ）
const LIT_LEFT = [[99, 50]];
const LIT_RIGHT = [[0, 50], [2, 47]];

export function createCrowd3D(container, data, { reducedMotion = false } = {}) {
  const stage = createStage3D(container, { clearColor: '#dff3ff', reducedMotion });
  const { scene, toon } = stage;
  const side = SIZE * SPACING;
  const cellX = (block, col) => (block === 0 ? -GAP / 2 - side : GAP / 2) + (col + 0.5) * SPACING;
  const cellZ = (row) => (row - SIZE / 2 + 0.5) * SPACING;

  const ground = new THREE.Mesh(new THREE.BoxGeometry(400, 0.3, 300), toon('#cfe8c0'));
  ground.position.y = -0.15;
  scene.add(ground);

  // 2万人：1人ずつ作ると重いので、まとめて描く
  const geo = new THREE.IcosahedronGeometry(0.19, 0);
  geo.scale(1, 1.6, 1);
  geo.translate(0, 0.3, 0);
  const crowd = new THREE.InstancedMesh(geo, toon(0xffffff), SIZE * SIZE * 2);
  const litCells = new Set([...LIT_LEFT.map(([c, r]) => `0:${c}:${r}`), ...LIT_RIGHT.map(([c, r]) => `1:${c}:${r}`)]);
  const random = seededRandom(11);
  const people = [];
  const color = new THREE.Color();
  for (let block = 0; block < 2; block++) {
    for (let col = 0; col < SIZE; col++) {
      for (let row = 0; row < SIZE; row++) {
        const lit = litCells.has(`${block}:${col}:${row}`);
        const px = cellX(block, col);
        const pz = cellZ(row);
        people.push({ x: px, z: pz, dist: Math.hypot(px, pz), lit });
        crowd.setColorAt(people.length - 1, color.set(COLORS[Math.floor(random() * COLORS.length)]));
      }
    }
  }
  crowd.frustumCulled = false;
  scene.add(crowd);

  // 人の波：真ん中から外へ向かって人があらわれる
  const REACH = Math.hypot(GAP / 2 + side, side / 2) + 4;
  let shown = -1;
  function updateCrowd(reveal) {
    if (Math.abs(reveal - shown) < 0.002) return;
    shown = reveal;
    const radius = reveal * REACH;
    const m = crowd.instanceMatrix.array;
    people.forEach((p, i) => {
      const s = p.lit ? 0 : clamp01((radius - p.dist) / 4);
      const o = i * 16;
      m[o] = s;
      m[o + 5] = s;
      m[o + 10] = s;
      m[o + 12] = p.x;
      m[o + 14] = p.z;
      m[o + 15] = 1;
    });
    crowd.instanceMatrix.needsUpdate = true;
  }

  // 光る人：目印の柱と輪をつける
  const pillarMat = new THREE.MeshBasicMaterial({ color: '#ffb000', transparent: true, opacity: 0.55, depthWrite: false });
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ff5a1f', side: THREE.DoubleSide });
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.34, 4, 12);
  bodyGeo.translate(0, 0.4, 0);
  const headGeo = new THREE.SphereGeometry(0.2, 14, 10);
  headGeo.translate(0, 0.95, 0);
  function litPerson(px, pz) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bodyGeo, toon('#ffd166')), outlineOf(bodyGeo, 0.04), new THREE.Mesh(headGeo, toon('#ffe0c4')), outlineOf(headGeo, 0.04));
    g.position.set(px, 0, pz);
    scene.add(g);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), pillarMat);
    pillar.position.set(px, 0, pz);
    scene.add(pillar);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(px, 0.05, pz);
    scene.add(ring);
    return { g, pillar, ring };
  }
  const lit = [
    ...LIT_LEFT.map(([c, r]) => litPerson(cellX(0, c), cellZ(r))),
    ...LIT_RIGHT.map(([c, r]) => litPerson(cellX(1, c), cellZ(r))),
  ];

  const leftBlock = textSprite(`ゲームをしない${data.before}人`);
  const rightBlock = textSprite(`ゲームをする${data.after}人`);
  scene.add(leftBlock, rightBlock);
  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  scene.add(banner);
  const leftCount = textSprite('1万人に1人', { color: '#d62828' });
  const rightCount = textSprite('1万人に2人', { color: '#d62828' });
  scene.add(leftCount, rightCount);

  stage.start((state, time) => {
    const t = smooth(0, 1, state.explore);
    updateCrowd(smooth(0.02, 0.8, state.explore));

    // 遠くまで同じ速さに感じるように、距離は倍々で変える
    const d = Math.exp(lerp(Math.log(8.5), Math.log(112), t));
    const el = lerp(0.24, 1.0, t);
    const look = new THREE.Vector3(0, lerp(0.8, 0, t), lerp(-0.3, 0, t));
    stage.placeCamera(new THREE.Vector3(look.x, look.y + d * Math.sin(el), look.z + d * Math.cos(el)), look);

    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    const big = d / 8.5;
    lit.forEach(({ g, pillar, ring }) => {
      g.scale.setScalar(lerp(1, 3.6, t));
      const h = lerp(0.001, 22, smooth(0.25, 1, state.explore));
      pillar.scale.set(lerp(0.1, 0.55, t), h, lerp(0.1, 0.55, t));
      pillar.position.y = h / 2;
      pillar.material.opacity = 0.45 + 0.3 * pulse;
      ring.scale.setScalar(lerp(0.7, 3.2 + pulse, t));
    });

    const blockAlpha = smooth(0.5, 0.85, state.explore);
    const labelSize = 0.42 * big ** 0.85;
    leftBlock.userData.setSize(labelSize);
    rightBlock.userData.setSize(labelSize);
    const ly = lerp(1.9, 1, t);
    leftBlock.position.set(lit[0].g.position.x - lerp(0.4, 0, t), ly, lit[0].g.position.z);
    rightBlock.position.set((lit[1].g.position.x + lit[2].g.position.x) / 2 + lerp(0.4, 0, t), ly, lit[1].g.position.z);
    leftBlock.material.opacity = 1 - blockAlpha;
    rightBlock.material.opacity = 1 - blockAlpha;

    leftCount.userData.setSize(5);
    rightCount.userData.setSize(5);
    leftCount.position.set(-GAP / 2 - side / 2, 1, side / 2 + 7);
    rightCount.position.set(GAP / 2 + side / 2, 1, side / 2 + 7);
    leftCount.material.opacity = blockAlpha;
    rightCount.material.opacity = blockAlpha;

    banner.userData.setSize(lerp(0.52, 5.2, t) * lerp(1, 1, t));
    banner.position.set(0, lerp(3.4, 1, t), lerp(-1.5, -side / 2 - 8, t));
    banner.material.opacity = 1 - 0.4 * t;
  });

  return stage.api;
}
