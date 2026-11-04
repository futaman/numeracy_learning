// 事件の一覧。この順に遊ぶ（前の事件を解くと次が開く）。

import { case1_1 } from './case1-1.js';
import { case1_2 } from './case1-2.js';
import { case1_3 } from './case1-3.js';
import { case1_4 } from './case1-4.js';
import { case1_5 } from './case1-5.js';
import { case2_1 } from './case2-1.js';
import { case2_2 } from './case2-2.js';
import { case2_3 } from './case2-3.js';
import { case2_4 } from './case2-4.js';
import { case2_5 } from './case2-5.js';

export const CHAPTERS = [
  { id: 1, title: '第1章 グラフのワナ', place: '商店街', cases: [case1_1, case1_2, case1_3, case1_4, case1_5] },
  { id: 2, title: '第2章 平均・中央値・差と比', place: '学校', cases: [case2_1, case2_2, case2_3, case2_4, case2_5] },
];

export const CASES = CHAPTERS.flatMap((c) => c.cases);
