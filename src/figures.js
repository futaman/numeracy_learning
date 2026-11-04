// 解説の1枚の絵。左にゴマカシ社の見せ方、右に正しい見せ方を並べる。

import { apparentRatio, trueRatio, logHeight, axisHeight, mean, median, countAtLeast, schoolAverages } from './judge.js';
import { plain } from './text.js';

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

// 9人を少ない順に並べた棒。真ん中の子は金色、平均は点線
function seesaw(data) {
  const avg = mean(data.kids);
  const mid = median(data.kids);
  const top = Math.max(...data.kids);
  const y = (v) => 150 - (v / top) * 118;
  const midIndex = (data.kids.length - 1) / 2;
  const bars = data.kids
    .map((v, i) => `<rect x="${44 + i * 32}" y="${y(v).toFixed(1)}" width="20" height="${(150 - y(v)).toFixed(1)}" fill="${i === midIndex ? '#ffd166' : '#7ec8e3'}" stroke="#2b2b2b" stroke-width="1.5"/>`)
    .join('');
  const midX = 54 + midIndex * 32;
  return wrap(
    '9人を少ない順に並べると、平均より多いのは1人だけで、真ん中の子は1000円',
    `${title(180, '9人を少ない順に並べると')}${bars}
    <line x1="30" x2="330" y1="150" y2="150" stroke="#2b2b2b" stroke-width="3"/>
    <line x1="30" x2="330" y1="${y(avg).toFixed(1)}" y2="${y(avg).toFixed(1)}" stroke="#d62828" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="34" y="${(y(avg) - 6).toFixed(1)}" font-size="13" font-weight="700" fill="#d62828">平均 ${avg}円</text>
    <text x="${midX}" y="168" text-anchor="middle" font-size="13" font-weight="700">真ん中の子 ${mid}円</text>
    <text x="${54 + 8 * 32 - 14}" y="44" text-anchor="end" font-size="13">${top}円</text>
    ${note(180, `平均より多いのは ${data.kids.filter((v) => v > avg).length}人だけ`)}`,
  );
}

function crowd(data) {
  const bar = (x, v, label) => `<rect x="${x}" y="${150 - v * 50}" width="36" height="${v * 50}" fill="#ffd166" ${INK}/><text x="${x + 18}" y="168" text-anchor="middle" font-size="12">${label}</text><text x="${x + 18}" y="${143 - v * 50}" text-anchor="middle" font-weight="700">${v}人</text>`;
  // 1万人を100×100のマスとして、光る人を1マスで描く
  const grid = (x, y, count, label) => {
    const cells = [[30, 40], [68, 62]].slice(0, count).map(([c, r]) => `<rect x="${x + c * 0.72}" y="${y + r * 0.72}" width="3" height="3" fill="#d62828"/>`).join('');
    return `<rect x="${x}" y="${y}" width="72" height="72" fill="#dfeaf3" stroke="#2b2b2b" stroke-width="2"/>${cells}<text x="${x + 36}" y="${y + 90}" text-anchor="middle" font-size="12">${label}</text>`;
  };
  return wrap(
    '棒で比べると2倍に見えるが、1万人の中では1人と2人',
    `${title(84, 'チラシ')}${bar(40, data.before, 'しない人')}${bar(92, data.after, 'する人')}${note(84, '2倍に見える')}
    ${title(268, '1万人の中で')}${grid(186, 52, data.before, '1万人に1人')}${grid(278, 52, data.after, '1万人に2人')}${note(268, 'ふえたのは1人')}`,
  );
}

function ratio(data) {
  const row = (x, y, scale, item, foot) => {
    const add = item.after - item.before;
    const before = item.before * scale.before;
    return `<text x="${x}" y="${y - 6}" font-size="12">${plain(item.name)}</text>
      <rect x="${x}" y="${y}" width="${before.toFixed(1)}" height="20" fill="#e8e8e8" stroke="#2b2b2b" stroke-width="2"/>
      <rect x="${(x + before).toFixed(1)}" y="${y}" width="${Math.max(add * scale.add, 1.5).toFixed(1)}" height="20" fill="${item.color}" stroke="#2b2b2b" stroke-width="2"/>
      <text x="${(x + before + add * scale.add + 5).toFixed(1)}" y="${y + 15}" font-size="12" font-weight="700">${foot}</text>`;
  };
  const [a, b] = data.items;
  const diff = { before: 0, add: 0.8 };
  const rate = (i) => ({ before: 60 / i.before, add: 60 / i.before });
  return wrap(
    '差で並べると同じに見え、比で並べるとパンは2倍、給食費は1.02倍',
    `${title(88, '差で並べる')}${row(14, 62, diff, a, '+100円')}${row(14, 118, diff, b, '+100円')}${note(88, '同じに見える')}
    ${title(268, '比で並べる')}${row(190, 62, rate(a), a, `${a.after / a.before}倍`)}${row(190, 118, rate(b), b, `${b.after / b.before}倍`)}${note(268, 'パンだけ2倍')}`,
  );
}

function galton(data) {
  const hill = (x, shift, foot) => {
    const X = (s) => x + 4 + ((s - 30) / 5) * 11.5;
    const bars = Object.entries(data.histogram)
      .map(([s, c]) => {
        const score = Number(s) + shift;
        return `<rect x="${X(score).toFixed(1)}" y="${130 - c * 3.6}" width="10" height="${c * 3.6}" fill="${score >= data.myScore ? '#ff7a45' : '#7ec8e3'}" stroke="#2b2b2b" stroke-width="1.5"/>`;
      })
      .join('');
    const count = countAtLeast(data.histogram, data.myScore, shift);
    const flag = X(data.myScore) + 5;
    return `${title(x + 82, `平均${50 + shift}点のテスト`)}${bars}
      <line x1="${x + 2}" x2="${x + 164}" y1="130" y2="130" stroke="#2b2b2b" stroke-width="3"/>
      <line x1="${flag}" x2="${flag}" y1="30" y2="134" stroke="#d62828" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="${flag}" y="148" text-anchor="middle" font-size="12" font-weight="700">65点</text>
      <text x="${x + 82}" y="167" text-anchor="middle" font-size="12">65点以上は${count}人</text>${note(x + 82, foot)}`;
  };
  return wrap('同じ65点でも、点の山のどこにいるかで意味が変わる', hill(4, 0, '上のほう') + hill(186, data.fix.target - 50, '下のほう'));
}

function schools(data) {
  const averages = schoolAverages({ sizes: data.schools.map((s) => s.size), ...data.simulation });
  const X = (v) => 104 + ((v - 30) / 60) * 240;
  const rows = data.schools
    .map((s, i) => {
      const a = averages[i];
      const lo = Math.min(...a);
      const hi = Math.max(...a);
      const y = 44 + i * 32;
      return `<text x="6" y="${y + 5}" font-size="12">${s.name} ${s.size}人</text>
        <line x1="${X(lo).toFixed(1)}" x2="${X(hi).toFixed(1)}" y1="${y}" y2="${y}" stroke="${s.color}" stroke-width="8" stroke-linecap="round"/>`;
    })
    .join('');
  return wrap(
    '人数が少ない学校ほど、平均点の動く幅が大きい',
    `${title(180, '20回のテストの平均点が動いた幅')}${rows}
    <line x1="${X(60)}" x2="${X(60)}" y1="30" y2="152" stroke="#2b2b2b" stroke-width="2" stroke-dasharray="4 3"/>
    <text x="${X(60)}" y="168" text-anchor="middle" font-size="12">60点</text>${note(180, '人数が少ないほど、大きくぶれる')}`,
  );
}

const FIGURES = { buildings, pictogram, pie, logaxis, dualaxis, seesaw, crowd, ratio, galton, schools };

export function figureFor(data) {
  return FIGURES[data.scene](data);
}
