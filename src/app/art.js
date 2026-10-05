import { el } from './dom.js';

const hash = (text) => [...text].reduce((n, ch) => ((n * 31) + ch.charCodeAt(0)) >>> 0, 2166136261);
const pick = (arr, n) => arr[n % arr.length] || '#b362ff';

export function paletteFromVariant(variant) {
  const colors = [];
  for (const item of variant?.items || []) for (const seg of item.segs || []) {
    if (seg.color) colors.push(seg.color);
    if (seg.colors) colors.push(...seg.colors);
  }
  return colors.length ? colors : ['#b362ff', '#5eead4', '#ff6b9d'];
}

export function artNode(image, palette) {
  const n = hash(image.url || String(image.seed || 0));
  const a = pick(palette, n);
  const b = pick(palette, n >> 5);
  const c = pick(palette, n >> 10);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="320" cy="62" r="34" fill="${c}" fill-opacity=".7"/><path d="M0 220C80 180 160 250 230 210s120-5 170-36v126H0Z" fill="#14112b" fill-opacity=".42"/><path d="M0 240C95 200 170 290 250 232s120-10 150-26v94H0Z" fill="#ffffff" fill-opacity=".15"/></svg>`;
  const node = el('div', { class: 'art-card', style: { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: 'cover' } });
  return node;
}
