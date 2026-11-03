// 事件の scene の名前から、場面を作る。3Dが使えないときは2D版を使う。

import { webglAvailable } from './toon3d.js';
import { createBuildings3D } from './buildings3d.js';
import { createBuildings2D } from './buildings2d.js';
import { createPictogram3D } from './pictogram3d.js';
import { createPictogram2D } from './pictogram2d.js';
import { createPie3D } from './pie3d.js';
import { createPie2D } from './pie2d.js';
import { createLogAxis2D } from './logaxis2d.js';
import { createDualAxis2D } from './dualaxis2d.js';

// [3D版, 2D版]。グラフそのものを読む事件は、3Dにせず2Dの絵だけを使う
const SCENES = {
  buildings: [createBuildings3D, createBuildings2D],
  pictogram: [createPictogram3D, createPictogram2D],
  pie: [createPie3D, createPie2D],
  logaxis: [null, createLogAxis2D],
  dualaxis: [null, createDualAxis2D],
};

export function createScene(container, data, { reducedMotion = false, force2d = false } = {}) {
  const [make3d, make2d] = SCENES[data.scene];
  if (make3d && !force2d && webglAvailable()) {
    try {
      return make3d(container, data, { reducedMotion });
    } catch (e) {
      console.warn('3Dを使えないので2Dで表示します', e);
    }
  }
  return make2d(container, data, { reducedMotion });
}
