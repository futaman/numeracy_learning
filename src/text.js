// {漢字|かんじ} を <ruby> にする。ふりがなを消す設定は CSS（body.no-ruby）で切りかえる。

const RUBY = /\{([^|{}]+)\|([^{}]+)\}/g;

export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function rubyHtml(text) {
  return escapeHtml(text).replace(RUBY, (_, base, reading) => `<ruby>${base}<rt>${reading}</rt></ruby>`);
}

// ふりがなを外した、ただの文字（3Dの看板など、ルビを付けられない所で使う）
export function plain(text) {
  return text.replace(RUBY, (_, base) => base);
}
