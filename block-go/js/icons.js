// Original chunky SVG icons. Each call returns a fresh SVG string with unique gradient ids.
let uid = 0;
const INK = '#1a1046';

function grad(id, a, b, vertical = true) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
}
function radial(id, a, b) {
  return `<radialGradient id="${id}" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
}
const wrap = (defs, body) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${body}</svg>`;
const shine = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" opacity=".55"/>`;

const BUILDERS = {
  coin() {
    const a = 'g' + uid++;
    return wrap(radial(a, '#fff4a8', '#e8a400'),
      `<circle cx="32" cy="33" r="26" fill="#a86b00" stroke="${INK}" stroke-width="3"/>
       <circle cx="32" cy="30" r="25" fill="url(#${a})" stroke="${INK}" stroke-width="3"/>
       <circle cx="32" cy="30" r="17" fill="none" stroke="#c48a00" stroke-width="3"/>
       <path d="M24 22h16v6h-5v13h-6V28h-5z" fill="#c48a00"/>${shine(16, 14, 14, 5)}`);
  },
  star() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#fff09a', '#ff9a1f'),
      `<path d="M32 4l8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 23l19-2z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M26 24h12v5h-4v12h-4V29h-4z" fill="#c46a00"/>${shine(18, 20, 10, 4)}`);
  },
  shield() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#c9a3ff', '#6b35c9'),
      `<path d="M32 5l22 8v16c0 15-10 25-22 30C20 54 10 44 10 29V13z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M26 22h12v5h-4v14h-4V27h-4z" fill="#ffd02a" stroke="${INK}" stroke-width="1.5"/>${shine(17, 15, 10, 4)}`);
  },
  bolt() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#fff09a', '#ffb000'),
      `<path d="M36 3L12 36h16l-6 25 28-36H33z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`);
  },
  cart() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#7fd7ff', '#2e7bff'),
      `<path d="M6 12h9l7 30h28l6-22H18" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
       <path d="M18 18h38l-6 24H22z" fill="url(#${a})" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
       <circle cx="26" cy="52" r="5" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="46" cy="52" r="5" fill="#fff" stroke="${INK}" stroke-width="3"/>
       <path d="M28 26v8M36 26v8M44 26v8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  },
  cards() {
    const a = 'g' + uid++, b = 'g' + uid++;
    return wrap(grad(a, '#7fd7ff', '#2e7bff') + grad(b, '#b9ecff', '#58b4ff'),
      `<rect x="8" y="12" width="30" height="42" rx="5" transform="rotate(-14 23 33)" fill="url(#${a})" stroke="${INK}" stroke-width="3"/>
       <rect x="24" y="8" width="30" height="42" rx="5" transform="rotate(10 39 29)" fill="url(#${b})" stroke="${INK}" stroke-width="3"/>
       <g transform="rotate(10 39 29)"><rect x="32" y="20" width="7" height="7" fill="${INK}"/><rect x="39" y="27" width="7" height="7" fill="${INK}"/><rect x="32" y="27" width="7" height="7" fill="${INK}" opacity=".5"/></g>`);
  },
  play() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#7fe8ff', '#2e9bff'),
      `<path d="M6 16h52v16H40v16H24V32H6z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M24 16v16M40 16v16M24 32h16" stroke="${INK}" stroke-width="2.5" opacity=".6"/>${shine(10, 19, 10, 4)}${shine(28, 19, 8, 4)}`);
  },
  flag() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#ffb3d6', '#ff4fa3'),
      `<path d="M14 6v52" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
       <path d="M16 9c12-6 18 6 34 0v24c-16 6-22-6-34 0z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M30 14l2 5 5 .5-4 3.5 1 5-4-3-4 3 1-5-4-3.5 5-.5z" fill="#ffd02a" stroke="${INK}" stroke-width="1.5"/>`);
  },
  friends() {
    const a = 'g' + uid++, b = 'g' + uid++;
    return wrap(grad(a, '#9fe6ff', '#36a7f5') + grad(b, '#7fd0ff', '#2c86e0'),
      `<rect x="6" y="24" width="28" height="28" rx="7" fill="url(#${b})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="30" y="8" width="28" height="28" rx="7" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <circle cx="15" cy="36" r="2.6" fill="${INK}"/><circle cx="25" cy="36" r="2.6" fill="${INK}"/><path d="M15 43q5 4 10 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
       <circle cx="39" cy="20" r="2.6" fill="${INK}"/><circle cx="49" cy="20" r="2.6" fill="${INK}"/><path d="M39 27q5 4 10 0" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
  },
  people() {
    return wrap('',
      `<g fill="#fff" stroke="${INK}" stroke-width="3"><circle cx="16" cy="22" r="7"/><circle cx="48" cy="22" r="7"/><path d="M4 50c0-10 6-15 12-15s12 5 12 15z"/><path d="M36 50c0-10 6-15 12-15s12 5 12 15z"/>
       <circle cx="32" cy="20" r="9"/><path d="M16 54c0-12 8-18 16-18s16 6 16 18z"/></g>`);
  },
  gift() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#8ff57f', '#2aa61d'),
      `<rect x="8" y="26" width="48" height="32" rx="4" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="5" y="18" width="54" height="12" rx="3" fill="#6af05a" stroke="${INK}" stroke-width="3.5"/>
       <rect x="27" y="18" width="10" height="40" fill="#ffd02a" stroke="${INK}" stroke-width="3"/>
       <path d="M32 18c-6-12-20-10-14-2M32 18c6-12 20-10 14-2" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`);
  },
  giftwhite() {
    return wrap('',
      `<g fill="#fff" stroke="${INK}" stroke-width="3"><rect x="10" y="28" width="44" height="28" rx="3"/><rect x="7" y="19" width="50" height="11" rx="3"/></g>
       <path d="M32 19v37" stroke="${INK}" stroke-width="4"/><path d="M32 19c-6-12-19-9-13-2M32 19c6-12 19-9 13-2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
  },
  horn() {
    return wrap('',
      `<path d="M8 26h10l22-14v40L18 38H8z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M14 38l4 14h7l-3-14" fill="#fff" stroke="${INK}" stroke-width="3"/>
       <path d="M48 22q6 10 0 20M54 16q9 16 0 32" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  },
  cup() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#fff09a', '#e8a400'),
      `<path d="M16 8h32v12c0 12-7 19-16 19S16 32 16 20z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <path d="M16 13H7c0 10 5 14 11 15M48 13h9c0 10-5 14-11 15" fill="none" stroke="${INK}" stroke-width="3.5"/>
       <path d="M28 39h8v8h-8z" fill="#c48a00" stroke="${INK}" stroke-width="3"/><rect x="18" y="47" width="28" height="10" rx="3" fill="#8b5cf6" stroke="${INK}" stroke-width="3.5"/>
       <path d="M26 15h12v5h-4v10h-4V20h-4z" fill="#8b5cf6"/>`);
  },
  cupwhite() {
    return wrap('',
      `<g fill="#fff" stroke="${INK}" stroke-width="3"><path d="M16 8h32v12c0 12-7 19-16 19S16 32 16 20z"/><path d="M28 39h8v8h-8z"/><rect x="18" y="47" width="28" height="9" rx="3"/></g>
       <path d="M16 13H8c0 9 4 13 9 14M48 13h8c0 9-4 13-9 14" fill="none" stroke="#fff" stroke-width="4"/>`);
  },
  hammer() {
    return wrap('',
      `<path d="M30 30l18 22" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M30 30l18 22" stroke="#ffe0b0" stroke-width="5" stroke-linecap="round"/>
       <path d="M10 22l16-14 14 10-6 5 6 7-6 5-7-6-6 5z" fill="#e8f6ff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`);
  },
  rotate() {
    return wrap('',
      `<path d="M47 22a18 18 0 1 0 3 16" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
       <path d="M47 22a18 18 0 1 0 3 16" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
       <path d="M38 8l14 2-3 14z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
  },
  single() {
    return wrap('',
      `<rect x="14" y="14" width="36" height="36" rx="7" fill="#fff4d6" stroke="${INK}" stroke-width="4"/>
       <rect x="22" y="22" width="20" height="20" rx="4" fill="#ffb347"/>`);
  },
  trash() {
    return wrap('',
      `<path d="M14 18h36l-4 38H18z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <rect x="10" y="11" width="44" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5"/><path d="M26 11V6h12v5" fill="none" stroke="${INK}" stroke-width="3.5"/>
       <path d="M25 26v22M32 26v22M39 26v22" stroke="#ff3d4d" stroke-width="3.5" stroke-linecap="round"/>`);
  },
  gear() {
    const a = 'g' + uid++;
    let teeth = '';
    for (let i = 0; i < 8; i++) teeth += `<rect x="27" y="2" width="10" height="14" rx="3" transform="rotate(${i * 45} 32 32)"/>`;
    return wrap(grad(a, '#c39bff', '#7c3aed'),
      `<g fill="url(#${a})" stroke="${INK}" stroke-width="3">${teeth}<circle cx="32" cy="32" r="21"/></g>
       <circle cx="32" cy="32" r="9" fill="#ffd02a" stroke="${INK}" stroke-width="3.5"/>`);
  },
  help() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#ffe680', '#ffb000'),
      `<rect x="6" y="6" width="40" height="30" rx="7" fill="#8b5cf6" stroke="${INK}" stroke-width="3.5"/>
       <circle cx="18" cy="21" r="3" fill="#fff"/><circle cx="26" cy="21" r="3" fill="#fff"/><circle cx="34" cy="21" r="3" fill="#fff"/>
       <path d="M22 26h34v26H38l-8 8v-8h-8z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M34 34q5-5 9 0c0 4-4 4-4 8" fill="none" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round"/><circle cx="39" cy="47" r="2.5" fill="#8b5cf6"/>`);
  },
  pointer() {
    return wrap('',
      `<rect x="6" y="38" width="20" height="18" rx="4" fill="#2e9bff" stroke="${INK}" stroke-width="3.5" transform="rotate(-20 16 47)"/>
       <path d="M20 40l18-26c2-4 8-2 6 3l-6 12h14c4 0 6 4 4 7l-8 14c-2 3-4 4-8 4H26z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`);
  },
  phone() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#fff6dc', '#e8d6b0'),
      `<rect x="14" y="4" width="36" height="56" rx="8" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="19" y="10" width="26" height="38" rx="3" fill="#3b2a9c"/><circle cx="32" cy="54" r="2.5" fill="#8b5cf6"/>
       <g fill="#ffd02a"><circle cx="27" cy="25" r="2"/><circle cx="37" cy="25" r="2"/><rect x="25" y="32" width="14" height="3" rx="1.5"/></g>`);
  },
  horncolor() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#c39bff', '#7c3aed'),
      `<path d="M8 26h10l24-16v42L18 38H8z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M14 38l4 16h7l-3-16" fill="#7c3aed" stroke="${INK}" stroke-width="3"/>
       <path d="M42 22h8a8 8 0 0 1 0 16h-8" fill="#ffb000" stroke="${INK}" stroke-width="3.5"/>`);
  },
  flame() {
    const a = 'g' + uid++;
    return wrap(radial(a, '#fff09a', '#ff3d1f'),
      `<path d="M32 4c4 12 20 18 20 34a20 20 0 0 1-40 0c0-9 5-14 9-18 0 6 3 9 6 9-2-10 0-17 5-25z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M32 30c3 6 10 8 10 15a10 10 0 0 1-20 0c0-5 4-7 6-10 0 3 2 4 4 4-1-3-1-6 0-9z" fill="#fff6b0"/>`);
  },
  pencil() {
    return wrap('',
      `<path d="M14 50l4-14 26-26 10 10-26 26z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M18 36l10 10M38 16l10 10" stroke="${INK}" stroke-width="3"/><path d="M10 56h44" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
  },
  pack() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#ff8cc4', '#c21f78'),
      `<path d="M12 8h40l-3 6 3 6v30l-3 6 3 6H12l3-6-3-6V20l3-6z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M32 22l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffd02a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
       <rect x="12" y="13" width="40" height="5" fill="#fff" opacity=".4"/>`);
  },
  key() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#fff09a', '#e8a400'),
      `<circle cx="20" cy="22" r="13" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/><circle cx="20" cy="22" r="5" fill="#8b5cf6" stroke="${INK}" stroke-width="2.5"/>
       <path d="M29 31l23 23M44 46l6-6M38 40l5-5" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
       <path d="M29 31l23 23M44 46l6-6M38 40l5-5" stroke="#ffd02a" stroke-width="4.5" stroke-linecap="round"/>`);
  },
  lollipop() {
    const a = 'g' + uid++;
    return wrap('',
      `<path d="M34 34l-20 26" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M34 34l-20 26" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
       <circle cx="38" cy="24" r="20" fill="#ff4fa3" stroke="${INK}" stroke-width="3.5"/>
       <path d="M38 24m-14 0a14 14 0 0 1 28 0a10 10 0 0 1-20 0a6 6 0 0 1 12 0" fill="none" stroke="#ffd02a" stroke-width="4"/>
       <path d="M38 24m-17 -5a17 17 0 0 1 9-10" fill="none" stroke="#19c8ff" stroke-width="4" stroke-linecap="round"/>`);
  },
  chest() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#c27a3a', '#7a3f12'),
      `<path d="M8 28c0-14 10-20 24-20s24 6 24 20z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <rect x="8" y="28" width="48" height="28" rx="3" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <path d="M8 28h48M18 10v46M46 10v46" stroke="#ffd02a" stroke-width="4"/><rect x="27" y="24" width="10" height="12" rx="2" fill="#ffd02a" stroke="${INK}" stroke-width="3"/>`);
  },
  ticket() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#7fe8ff', '#2e9bff'),
      `<path d="M6 18h52v9a5 5 0 0 0 0 10v9H6v-9a5 5 0 0 0 0-10z" fill="url(#${a})" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M42 18v28" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M24 25l2.5 5 5.5.6-4 3.8 1 5.6-5-2.8-5 2.8 1-5.6-4-3.8 5.5-.6z" fill="#ffd02a" stroke="${INK}" stroke-width="2"/>`);
  },
  mascot() {
    const a = 'g' + uid++;
    return wrap(grad(a, '#7fe8ff', '#1f8fe0'),
      `<rect x="8" y="8" width="48" height="48" rx="12" fill="url(#${a})" stroke="${INK}" stroke-width="3.5"/>
       <ellipse cx="24" cy="30" rx="6" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/><ellipse cx="40" cy="30" rx="6" ry="7" fill="#fff" stroke="${INK}" stroke-width="2"/>
       <circle cx="25" cy="32" r="3" fill="${INK}"/><circle cx="41" cy="32" r="3" fill="${INK}"/><path d="M24 42q8 7 16 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>${shine(14, 13, 14, 5)}`);
  },
};

export function icon(name) {
  const b = BUILDERS[name];
  return b ? b() : '';
}

// Fills every element with data-icon="name" or the known class hooks.
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const map = [
    ['.pill .icon.coin', 'coin'], ['.pill .icon.star', 'star'], ['.pill .icon.shield', 'shield'],
    ['.di.cart', 'cart'], ['.di.cards', 'cards'], ['.di.play', 'play'], ['.di.flag', 'flag'], ['.di.friends', 'friends'],
    ['.ti.people', 'people'], ['.ti.gift', 'giftwhite'], ['.ti.horn', 'horn'], ['.ti.cup', 'cupwhite'],
    ['.boost.hammer .glyph', 'hammer'], ['.boost.rotate .glyph', 'rotate'], ['.boost.single .glyph', 'single'], ['.boost.trash .glyph', 'trash'],
    ['.ev-icon', 'lollipop'], ['.ev-reward .bolt', 'bolt'], ['#energy-pill .bolt', 'bolt'], ['.gift-orb', 'gift'],
  ];
  for (const [sel, name] of map) root.querySelectorAll(sel).forEach(el => { if (!el.innerHTML) el.innerHTML = icon(name); });
}
