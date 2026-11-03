// トマトの箱の絵グラフ（3D）。チラシは正面から見た絵で、右の箱は縦も横も2倍。
// 絵を回す（explore）とななめから見え、奥行きも2倍だと分かる。最後は小さい箱が8個入っているのが見える。
// 箱を並べる（fix: 0〜100）と、大きい箱1個が、同じ大きさの箱2個に変わる。

import { THREE, createStage3D, outlineBox, textSprite } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const SIZE = 1.6;

// 木の箱の前に、トマトの絵をかく
function crateTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#e0a96d';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#2b2b2b';
  g.lineWidth = 5;
  for (const y of [42, 86]) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(128, y);
    g.stroke();
  }
  for (const [x, y] of [[36, 64], [92, 64], [64, 40]]) {
    g.fillStyle = '#e63946';
    g.beginPath();
    g.arc(x, y, 18, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#3f8f3a';
    g.fillRect(x - 5, y - 22, 10, 7);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPictogram3D(container, data, { reducedMotion = false } = {}) {
  const stage = createStage3D(container, { clearColor: '#fff3d6', fix: data.fix.start, reducedMotion });
  const { scene, toon } = stage;
  const map = crateTexture();

  function crate(size, extra = {}) {
    const mat = toon(0xffffff, { map, ...extra });
    const body = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat);
    const line = outlineBox(size, size, size);
    const group = new THREE.Group();
    group.add(body, line);
    group.userData.mat = mat;
    group.userData.line = line;
    return group;
  }

  // 床
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 14), toon('#f2d9a8'));
  floor.position.y = -0.15;
  scene.add(floor);

  // 左：となりの八百屋（1）
  const small = crate(SIZE);
  small.position.set(-3.6, SIZE / 2, 0);
  scene.add(small);

  // 右：ゴマカシ青果（縦・横・奥行き 2倍）。左のはしを x0 にそろえる
  const x0 = -0.4;
  const big = crate(SIZE, { transparent: true });
  scene.add(big);
  const second = crate(SIZE);
  scene.add(second);

  // 大きい箱の中に入る、小さい箱8個
  const inner = new THREE.Group();
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) {
    const b = crate(SIZE * 0.96, { color: '#ffe3b8' });
    b.position.set((dx * SIZE) / 2, (dy * SIZE) / 2, (dz * SIZE) / 2);
    inner.add(b);
  }
  inner.position.set(x0 + SIZE, SIZE, 0);
  scene.add(inner);

  const leftLabel = textSprite(`${data.shops[0].name} ${data.shops[0].value}${data.unit}`);
  leftLabel.userData.setSize(0.5);
  scene.add(leftLabel);
  const rightLabel = textSprite(`${data.shops[1].name} ${data.shops[1].value}${data.unit}`);
  rightLabel.userData.setSize(0.5);
  scene.add(rightLabel);

  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  banner.userData.setSize(0.7);
  banner.position.set(0, 4.3, 0);
  scene.add(banner);

  const look = new THREE.Vector3(-0.6, 1.7, 0);

  stage.start((state, time) => {
    const t = smooth(0, 1, state.explore);
    // 箱を並べる：大きい箱が小さくなり、となりにもう1個あらわれる
    const f = smooth(0, 1, state.fix / 100);

    // 並べ終わるころには、カメラを正面近くにもどして比べやすくする
    const c = t * (1 - 0.7 * f);
    const az = lerp(0, 0.6, c);
    const el = lerp(0.04, 0.5, c);
    const d = lerp(11, 12.5, c);
    stage.placeCamera(
      new THREE.Vector3(look.x + d * Math.sin(az) * Math.cos(el), look.y + d * Math.sin(el), d * Math.cos(az) * Math.cos(el)),
      look,
    );

    const s = lerp(data.scale, 1, f);
    big.scale.setScalar(s);
    big.position.set(x0 + (SIZE * s) / 2, (SIZE * s) / 2, 0);
    second.scale.setScalar(Math.max(f, 0.001));
    second.visible = f > 0.01;
    second.position.set(x0 + SIZE * 1.5 + 0.15 * f, (SIZE * f) / 2, 0);

    // 調べ終わるころ、大きい箱が透けて中の8個が見える
    const reveal = smooth(0.6, 0.95, state.explore) * (1 - f);
    inner.visible = reveal > 0.01;
    inner.scale.setScalar(Math.max(reveal, 0.001));
    big.userData.mat.opacity = lerp(1, 0.22, reveal);
    big.userData.mat.depthWrite = reveal < 0.5;
    big.userData.line.visible = reveal < 0.5;
    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    inner.children.forEach((b) => b.userData.mat.emissive.setRGB(pulse * 0.4, pulse * 0.1, 0));

    leftLabel.position.set(small.position.x, -0.55, 1.2);
    rightLabel.position.set(x0 + SIZE * lerp(data.scale, 2, f) * 0.5, -0.55, 1.2);
    banner.material.opacity = 1 - 0.5 * t;
  });

  return stage.api;
}
