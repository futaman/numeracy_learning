// 立体の円グラフ（3D）。チラシはななめ下から近くで見た絵で、手前の切れが大きく見える。
// カメラを上へ（explore）動かすと、真上から見た本当の大きさになる。

import { THREE, createStage3D, outlineBox, textSprite, INK } from './toon3d.js';
import { smooth, lerp } from './common.js';
import { plain } from '../text.js';

const RADIUS = 3;
const HEIGHT = 0.6;

// 切れの形（扇形を厚く押し出したもの）。真上から見て、角度 a は +x から時計回り（+z が手前）
function wedge(a0, a1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, RADIUS, a0, a1, false);
  shape.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: HEIGHT, bevelEnabled: false, curveSegments: 48 });
  // shape の y を +z に向ける（押し出しは下向きになるので、そのぶん持ち上げる）
  geo.rotateX(Math.PI / 2);
  geo.translate(0, HEIGHT, 0);
  return geo;
}

// 凸な形の輪郭：中心のまわりに少し大きくした、裏返しの黒い形
function outlineScaled(geo, k = 1.05) {
  geo.computeBoundingBox();
  const c = geo.boundingBox.getCenter(new THREE.Vector3());
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  mesh.scale.setScalar(k);
  mesh.position.copy(c).multiplyScalar(1 - k);
  return mesh;
}

export function createPie3D(container, data, { reducedMotion = false } = {}) {
  const stage = createStage3D(container, { clearColor: '#e8f4ff', reducedMotion });
  const { scene, toon } = stage;
  const total = data.slices.reduce((a, s) => a + s.share, 0);

  // 机
  const table = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 30), toon('#f2d9a8'));
  table.position.y = -0.16;
  scene.add(table);
  const tableLine = outlineBox(30, 0.3, 30);
  tableLine.position.y = -0.16;
  scene.add(tableLine);

  // 1つ目の切れ（ゴマカシ携帯）がちょうど手前（+z、角度90度）に来るように並べる
  let angle = Math.PI / 2 - ((data.slices[0].share / total) * Math.PI * 2) / 2;
  const slices = data.slices.map((s, i) => {
    const span = (s.share / total) * Math.PI * 2;
    const mid = angle + span / 2;
    const geo = wedge(angle, angle + span);
    angle += span;
    const mat = toon(s.color, { emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 });
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat), outlineScaled(geo));
    // チラシでは、ゴマカシ携帯の切れだけ手前に少し飛び出している
    const pop = i === 0 ? 0.35 : 0;
    group.position.set(Math.cos(mid) * pop, 0, Math.sin(mid) * pop);
    scene.add(group);

    const name = textSprite(s.name);
    name.userData.setSize(0.42);
    scene.add(name);
    const pct = textSprite(`${s.share}%`, { color: '#d62828' });
    pct.userData.setSize(0.6);
    scene.add(pct);
    return { mat, mid, pop, name, pct, index: i };
  });
  const best = data.slices.reduce((bi, s, i, all) => (s.share > all[bi].share ? i : bi), 0);

  const banner = textSprite(plain(data.banner), { color: '#d62828', bg: '#fff3b0' });
  scene.add(banner);

  stage.start((state, time) => {
    const t = smooth(0, 1, state.explore);
    // 仰角：チラシの角度 → 真上（ちょうど90度だと向きが決まらないので少し手前）
    const el = ((lerp(data.flyerElevation, 89.5, t) * Math.PI) / 180);
    const d = lerp(8.4, 10.5, t);
    const look = new THREE.Vector3(0, 0, lerp(0.4, 0, t));
    stage.placeCamera(new THREE.Vector3(0, d * Math.sin(el), look.z + d * Math.cos(el)), look);

    const pulse = state.highlight ? 0.5 + 0.5 * Math.sin(time / 180) : 0;
    slices.forEach(({ mat, mid, pop, name, pct, index }) => {
      const r = RADIUS * 0.6 + pop;
      const x = Math.cos(mid) * r;
      const z = Math.sin(mid) * r;
      name.position.set(x, HEIGHT + 0.35, z - lerp(0, 0.3, t));
      pct.position.set(x, HEIGHT + 0.35, z + lerp(0.5, 0.35, t));
      pct.material.opacity = smooth(0.7, 1, state.explore);
      mat.emissiveIntensity = index === best ? pulse * 0.35 : 0;
    });
    // 真上から見るころには、チラシの文字は消す（画面の外にはみ出すので）
    banner.userData.setSize(0.55);
    banner.position.set(0, 2.2, -1.4);
    banner.material.opacity = 1 - smooth(0.3, 0.7, state.explore);
  });

  return stage.api;
}
