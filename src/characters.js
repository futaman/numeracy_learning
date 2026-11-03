// キャラの顔（太い線のトゥーン調のSVG）。mood で表情を変える。

export const NAMES = {
  pocho: 'ポチョ',
  chief: 'ルーペ所長',
  baker: 'パン屋さん',
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

export function portrait(who, mood) {
  const body = { pocho, chief, baker }[who](mood);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}
