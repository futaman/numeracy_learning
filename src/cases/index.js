// 事件の一覧。この順に遊ぶ（前の事件を解くと次が開く）。

import { case1_1 } from './case1-1.js';
import { case1_2 } from './case1-2.js';
import { case1_3 } from './case1-3.js';
import { case1_4 } from './case1-4.js';
import { case1_5 } from './case1-5.js';

export const CHAPTERS = [{ id: 1, title: '第1章 グラフのワナ', place: '商店街', cases: [case1_1, case1_2, case1_3, case1_4, case1_5] }];

export const CASES = CHAPTERS.flatMap((c) => c.cases);
