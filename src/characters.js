// キャラの顔（太い線のトゥーン調のSVG）。mood で表情を変える。

export const NAMES = {
  pocho: 'ポチョ',
  chief: 'ルーペ所長',
  baker: 'パン屋さん',
  yaoya: '八百屋さん',
  shop: '携帯ショップの店長',
  pharmacist: '薬局の先生',
  nobiru: 'ゴマカシ社のノビール',
};

const S = 'stroke="#2b2b2b" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

function pocho(mood) {
  const pupils =
    mood === 'surprised'
      ? '<circle cx="39" cy="54" r="2.5" fill="#2b2b2b"/><circle cx="61" cy="54" r="2.5" fill="#2b2b2b"/>'
      : '<circle cx="40" cy="56" r="5" fill="#2b2b2b"/><circle cx="60" cy="56" r="5" fill="#2b2b2b"/>';
  const mouth = {
    surprised: `<ellipse cx="50" cy="74" rx="5" ry="6" fill="#7a2e2e" ${S}/>`,
    sad: `<path d="M41 77 Q50 69 59 77" fill="none" ${S}/>`,
    happy: `<path d="M38 70 Q50 84 62 70 Z" fill="#7a2e2e" ${S}/>`,
  }[mood] ?? `<path d="M42 72 Q50 78 58 72" fill="none" ${S}/>`;
  const brows = mood === 'sad' ? `<path d="M31 43 L45 47 M69 43 L55 47" fill="none" ${S}/>` : '';
  return `
    <line x1="50" y1="30" x2="50" y2="12" ${S}/>
    <circle cx="50" cy="10" r="6" fill="#ffd166" ${S}/>
    <ellipse cx="50" cy="62" rx="34" ry="30" fill="#8fe08a" ${S}/>
    <ellipse cx="40" cy="55" rx="9" ry="11" fill="#fff" ${S}/>
    <ellipse cx="60" cy="55" rx="9" ry="11" fill="#fff" ${S}/>
    ${pupils}${brows}${mouth}
    <circle cx="28" cy="70" r="4" fill="#ff9fb2"/><circle cx="72" cy="70" r="4" fill="#ff9fb2"/>`;
}

function chief() {
  return `
    <circle cx="46" cy="58" r="26" fill="#f6d7b0" ${S}/>
    <path d="M18 46 Q46 12 74 46 Z" fill="#a0703c" ${S}/>
    <path d="M14 46 H78" fill="none" ${S}/>
    <circle cx="37" cy="56" r="3" fill="#2b2b2b"/><circle cx="55" cy="56" r="3" fill="#2b2b2b"/>
    <path d="M30 70 Q38 63 46 68 Q54 63 62 70 Q54 76 46 71 Q38 76 30 70 Z" fill="#fff" ${S}/>
    <line x1="80" y1="80" x2="93" y2="95" ${S}/>
    <circle cx="74" cy="72" r="11" fill="#cdeefe" ${S}/>`;
}

function baker() {
  return `
    <circle cx="50" cy="62" r="26" fill="#ffd9b8" ${S}/>
    <path d="M28 44 Q18 22 36 22 Q40 8 52 14 Q64 6 68 22 Q84 22 72 44 Z" fill="#fff" ${S}/>
    <path d="M30 44 H70" fill="none" ${S}/>
    <circle cx="41" cy="60" r="3" fill="#2b2b2b"/><circle cx="59" cy="60" r="3" fill="#2b2b2b"/>
    <path d="M42 72 Q50 66 58 72" fill="none" ${S}/>
    <circle cx="34" cy="69" r="4" fill="#ff9fb2"/><circle cx="66" cy="69" r="4" fill="#ff9fb2"/>`;
}

// 八百屋さん：ねじりはちまき
function yaoya() {
  return `
    <circle cx="50" cy="60" r="27" fill="#f3c89b" ${S}/>
    <path d="M23 44 Q50 30 77 44 L77 52 Q50 40 23 52 Z" fill="#fff" ${S}/>
    <path d="M74 46 L88 40 M74 50 L86 54" fill="none" ${S}/>
    <circle cx="41" cy="61" r="3" fill="#2b2b2b"/><circle cx="59" cy="61" r="3" fill="#2b2b2b"/>
    <path d="M40 72 Q50 79 60 72" fill="none" ${S}/>
    <circle cx="33" cy="70" r="4" fill="#ff9fb2"/><circle cx="67" cy="70" r="4" fill="#ff9fb2"/>`;
}

// 携帯ショップの店長：ぼうしと、耳にかけたマイク
function shop() {
  return `
    <circle cx="50" cy="62" r="26" fill="#ffd9b8" ${S}/>
    <path d="M24 48 Q24 24 50 24 Q76 24 76 48 Z" fill="#7ec8e3" ${S}/>
    <path d="M24 48 H86" fill="none" ${S}/>
    <circle cx="41" cy="61" r="3" fill="#2b2b2b"/><circle cx="59" cy="61" r="3" fill="#2b2b2b"/>
    <path d="M42 73 Q50 68 58 73" fill="none" ${S}/>
    <path d="M25 62 Q22 78 36 80" fill="none" ${S}/><circle cx="38" cy="80" r="3" fill="#2b2b2b"/>`;
}

// 薬局の先生：白いぼうしとめがね
function pharmacist() {
  return `
    <circle cx="50" cy="62" r="26" fill="#ffe0c4" ${S}/>
    <path d="M28 44 L32 26 H68 L72 44 Z" fill="#fff" ${S}/>
    <path d="M47 30 H53 V34 H57 V40 H53 V44 H47 V40 H43 V34 H47 Z" fill="#7ec88a" stroke="none"/>
    <circle cx="40" cy="61" r="7" fill="#fff" ${S}/><circle cx="60" cy="61" r="7" fill="#fff" ${S}/>
    <line x1="47" y1="61" x2="53" y2="61" ${S}/>
    <circle cx="40" cy="61" r="2.5" fill="#2b2b2b"/><circle cx="60" cy="61" r="2.5" fill="#2b2b2b"/>
    <path d="M43 75 Q50 70 57 75" fill="none" ${S}/>`;
}

// ゴマカシ社の幹部ノビール：のびる顔と、くるんとしたひげ。smug（得意）・angry（くやしい）
function nobiru(mood) {
  const eyes =
    mood === 'angry'
      ? `<path d="M34 48 L46 54 M66 48 L54 54" fill="none" ${S}/><circle cx="41" cy="58" r="3" fill="#2b2b2b"/><circle cx="59" cy="58" r="3" fill="#2b2b2b"/>`
      : `<path d="M35 56 Q41 51 47 56 M53 56 Q59 51 65 56" fill="none" ${S}/>`;
  const mouth = mood === 'angry' ? `<path d="M40 82 Q50 74 60 82" fill="none" ${S}/>` : `<path d="M40 78 Q50 86 60 78" fill="none" ${S}/>`;
  return `
    <ellipse cx="50" cy="62" rx="22" ry="32" fill="#d9c2f0" ${S}/>
    <rect x="34" y="6" width="32" height="22" rx="3" fill="#2b2b2b"/>
    <rect x="26" y="26" width="48" height="6" rx="3" fill="#2b2b2b"/>
    <rect x="34" y="20" width="32" height="5" fill="#ff7a45"/>
    ${eyes}
    <path d="M50 66 Q38 66 34 72 Q30 64 38 62 M50 66 Q62 66 66 72 Q70 64 62 62" fill="none" ${S}/>
    ${mouth}`;
}

export function portrait(who, mood) {
  const body = { pocho, chief, baker, yaoya, shop, pharmacist, nobiru }[who](mood);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}
