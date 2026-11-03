// 解説の1枚の絵。左にゴマカシ社の見せ方、右に正しい見せ方を並べる。

import { apparentRatio, trueRatio, logHeight, axisHeight } from './judge.js';

const INK = 'stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"';
const wrap = (label, body) => `<svg viewBox="0 0 360 194" role="img" aria-label="${label}">${body}</svg>`;
const title = (x, text) => `<text x="${x}" y="18" text-anchor="middle" font-weight="700">${text}</text>`;
const note = (x, text) => `<text x="${x}" y="188" text-anchor="middle" font-weight="700" fill="#d62828">${text}</text>`;

function buildings(data) {
  const max = Math.max(...data.values);
  const chart = (x, head, from, foot) => {
    const bars = data.values
      .map((v, i) => {
        const h = ((v - from) / (max - from)) * 100;
        return `<rect x="${x + 14 + i * 36}" y="${130 - h}" width="24" height="${h}" fill="#ffb347" ${INK}/>`;
      })
      .join('');
    return `${title(x + 80, head)}${bars}
      <line x1="${x + 6}" x2="${x + 160}" y1="130" y2="130" stroke="#3f8f3a" stroke-width="4"/>
      <text x="${x + 80}" y="154" text-anchor="middle">地面 ${from}${data.unit}</text>${note(x + 80, foot)}`;
  };
  const shown = Math.round(apparentRatio(data.values, data.ground));
  const real = trueRatio(data.values).toFixed(2);
  return wrap('チラシと正しいグラフの比べ', chart(10, 'チラシ', data.ground, `${shown}倍に見える`) + chart(190, '正しいグラフ', 0, `本当は${real}倍`));
}

// ななめから見た立方体
function cube(x, y, w, fill = '#e0a96d') {
  const k = w * 0.45;
  return `<polygon points="${x},${y} ${x + k},${y - k} ${x + w + k},${y - k} ${x + w},${y}" fill="${fill}" ${INK}/>
    <polygon points="${x + w},${y} ${x + w + k},${y - k} ${x + w + k},${y + w - k} ${x + w},${y + w}" fill="#c48a4f" ${INK}/>
    <rect x="${x}" y="${y}" width="${w}" height="${w}" fill="${fill}" ${INK}/>`;
}

function pictogram() {
  const u = 22;
  const panel = (x, head, body, foot) => `${title(x, head)}${body}${note(x, foot)}`;
  // 高さ：1個と2個を積む／広さ：2×2／大きさ：2×2×2
  const tall = `<rect x="34" y="${140 - u}" width="${u}" height="${u}" fill="#e0a96d" ${INK}/>
    <rect x="70" y="${140 - u * 2}" width="${u}" height="${u}" fill="#e0a96d" ${INK}/><rect x="70" y="${140 - u}" width="${u}" height="${u}" fill="#e0a96d" ${INK}/>`;
  let flat = '';
  for (const i of [0, 1]) for (const j of [0, 1]) flat += `<rect x="${150 + i * u}" y="${140 - u * 2 + j * u}" width="${u}" height="${u}" fill="#e0a96d" ${INK}/>`;
  let solid = '';
  for (const back of [1, 0]) for (const j of [0, 1]) for (const i of [0, 1]) solid += cube(262 + i * u + back * u * 0.45, 140 - u * 2 + j * u - back * u * 0.45, u);
  return wrap(
    '2倍の絵が、広さで4倍、大きさで8倍に見える',
    panel(62, '高さだけ2倍', tall, '2倍') + panel(172, '縦も横も2倍', flat, '4倍に見える') + panel(300, '奥行きも2倍', solid, '8倍に見える') +
      `<text x="180" y="42" text-anchor="middle" font-size="12">（売れた数は、どれも2倍）</text>`,
  );
}

function pie(data) {
  const total = data.slices.reduce((a, s) => a + s.share, 0);
  const draw = (cx, cy, r, sy, withPct) => {
    let a = Math.PI / 2 - (data.slices[0].share / total) * Math.PI;
    return data.slices
      .map((s, i) => {
        const span = (s.share / total) * Math.PI * 2;
        const p = (t) => `${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * sy * Math.sin(t)).toFixed(1)}`;
        const mid = a + span / 2;
        const path = `<path d="M${cx},${cy} L${p(a)} A${r},${r * sy} 0 ${span > Math.PI ? 1 : 0} 1 ${p(a + span)} Z" fill="${s.color}" ${INK}/>`;
        const label = withPct
          ? `<text x="${(cx + r * 0.6 * Math.cos(mid)).toFixed(1)}" y="${(cy + r * 0.6 * sy * Math.sin(mid) + 5).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700">${s.share}%</text>`
          : '';
        a += span;
        return path + label;
      })
      .join('');
  };
  // ななめ：厚みをつけて下に重ねる
  let tilted = '';
  for (let k = 16; k > 0; k -= 2) tilted += `<ellipse cx="90" cy="${100 + k}" rx="70" ry="22" fill="#9a9a9a"/>`;
  tilted += draw(90, 100, 70, 0.32, false);
  return wrap('ななめから見た円グラフと、真上から見た円グラフ', `${title(90, 'チラシ（ななめ）')}${tilted}${note(90, '手前が大きく見える')}${title(270, '真上から')}${draw(270, 96, 62, 1, true)}${note(270, 'いちばんは35%')}`);
}

function logaxis(data) {
  const [lo, hi] = data.logAxis;
  const max = data.values[data.values.length - 1];
  const chart = (x, head, y, ticks, foot) => {
    const pts = data.values.map((v, i) => `${x + 20 + i * 32},${y(v).toFixed(1)}`).join(' ');
    return `${title(x + 80, head)}
      <line x1="${x + 14}" x2="${x + 14}" y1="30" y2="150" stroke="#2b2b2b" stroke-width="3"/>
      <line x1="${x + 14}" x2="${x + 160}" y1="150" y2="150" stroke="#2b2b2b" stroke-width="3"/>
      ${ticks}<polyline points="${pts}" fill="none" stroke="#7a4fd6" stroke-width="4" stroke-linejoin="round"/>${note(x + 80, foot)}`;
  };
  const yLog = (v) => 150 - logHeight(v, lo, hi) * 120;
  const yLin = (v) => 150 - (v / max) * 120;
  let logTicks = '';
  for (let v = lo; v <= hi; v *= 10) logTicks += `<line x1="${8}" x2="${16}" y1="${yLog(v)}" y2="${yLog(v)}" stroke="#2b2b2b" stroke-width="2"/>`;
  return wrap(
    '対数軸とふつうの軸',
    chart(4, 'ポスター（10倍ずつ）', yLog, logTicks + `<text x="84" y="166" text-anchor="middle" font-size="12">目盛り1つで10倍</text>`, 'なだらかに見える') +
      chart(190, 'ふつうの目盛り', yLin, `<text x="270" y="166" text-anchor="middle" font-size="12">1目盛り＝同じ数</text>`, '本当は1万倍'),
  );
}

function dualaxis(data) {
  const { left, right } = data;
  const chart = (x, head, axis, foot) => {
    const yL = (v) => 150 - axisHeight(v, ...left.axis) * 110;
    const yR = (v) => 150 - axisHeight(v, ...axis) * 110;
    const line = (vals, y, color) => `<polyline points="${vals.map((v, i) => `${x + 20 + i * 38},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>`;
    return `${title(x + 82, head)}
      <line x1="${x + 10}" x2="${x + 146}" y1="150" y2="150" stroke="#2b2b2b" stroke-width="3"/>
      <line x1="${x + 146}" x2="${x + 146}" y1="40" y2="150" stroke="#ff7a45" stroke-width="3"/>
      <text x="${x + 150}" y="44" font-size="11" fill="#ff7a45">${axis[1]}</text><text x="${x + 150}" y="154" font-size="11" fill="#ff7a45">${axis[0]}</text>
      ${line(left.values, yL, '#3a86c8')}${line(right.values, yR, '#ff7a45')}${note(x + 82, foot)}`;
  };
  return wrap('右の目盛りをせまくしたグラフと、0点からのグラフ', chart(0, 'チラシ', right.flyerAxis, 'ぴったり重なる') + chart(180, '0点から100点', right.fairAxis, '1.5点しか上がらない'));
}

const FIGURES = { buildings, pictogram, pie, logaxis, dualaxis };

export function figureFor(data) {
  return FIGURES[data.scene](data);
}
