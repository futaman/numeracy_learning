// Three.js で描く場面の土台：トゥーン調の材質、太い輪郭線、文字の看板、描画のくり返し。

import * as THREE from '../../vendor/three.module.js';
import { sceneState, ease, sceneApi } from './common.js';

export { THREE };
export const INK = 0x2b2b2b;
export const OUTLINE = 0.16;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

// トゥーン調の3段階の陰
function toonGradient() {
  const tex = new THREE.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

// 太い線の輪郭（裏返した一回り大きい箱）
export function outlineBox(w, h, d) {
  const geo = new THREE.BoxGeometry(w + OUTLINE, h + OUTLINE, d + OUTLINE);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
}

// 箱以外の形の輪郭：頂点を面の向きに押し出した、裏返しの黒い形
export function outlineOf(geometry, thickness = 0.06) {
  const mat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed = position + normal * ${thickness.toFixed(3)};`,
    );
  };
  mat.customProgramCacheKey = () => `outline${thickness}`;
  return new THREE.Mesh(geometry, mat);
}

export function textSprite(text, { color = '#2b2b2b', stroke = '#ffffff', bg = null } = {}) {
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

// 場面を1つ用意する。物を足し終えたら start(update) で描き始める。
export function createStage3D(container, { clearColor = '#bfe6ff', explore = 0, fix = 0, reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(clearColor);
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8a8, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 10, 8);
  scene.add(sun);

  const gradientMap = toonGradient();
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });

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

  const state = sceneState(explore, fix);
  let raf = 0;
  const api = sceneApi('3d', renderer.domElement, state, () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    renderer.dispose();
    renderer.domElement.remove();
  });

  // カメラを置く。縦長の画面ではそのぶん離れる
  function placeCamera(pos, look) {
    camera.position.copy(pos.clone().sub(look).multiplyScalar(camera.userData.widen).add(look));
    camera.lookAt(look);
  }

  return {
    scene,
    camera,
    toon,
    state,
    api,
    placeCamera,
    start(update) {
      const frame = (time) => {
        ease(state, reducedMotion);
        update(state, time);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    },
  };
}
