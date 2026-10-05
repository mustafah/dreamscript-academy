// Colors: hex literals, friendly names and the nearest-name lookup used in prose.

export const NAMED = {
  black: '#000000', charcoal: '#36454f', slate: '#708090', gray: '#808080', silver: '#c0c0c0',
  ash: '#b2beb5', white: '#ffffff', ivory: '#fffff0', cream: '#fffdd0', beige: '#f5f5dc',
  sand: '#c2b280', tan: '#d2b48c', brown: '#8b4513', chocolate: '#d2691e', rust: '#b7410e',
  maroon: '#800000', burgundy: '#800020', crimson: '#dc143c', red: '#ff0000', scarlet: '#ff2400',
  coral: '#ff7f50', salmon: '#fa8072', peach: '#ffdab9', orange: '#ffa500', tangerine: '#ff8800',
  amber: '#ffbf00', gold: '#ffd700', mustard: '#ffdb58', yellow: '#ffff00', lime: '#32cd32',
  chartreuse: '#7fff00', green: '#008000', emerald: '#50c878', forest: '#228b22', olive: '#808000',
  sage: '#9caf88', mint: '#98ff98', teal: '#008080', turquoise: '#40e0d0', aquamarine: '#7fffd4',
  cyan: '#00ffff', 'sky blue': '#87ceeb', azure: '#007fff', 'steel blue': '#4682b4', blue: '#0000ff',
  cobalt: '#0047ab', navy: '#000080', indigo: '#4b0082', periwinkle: '#ccccff', violet: '#8f00ff',
  purple: '#800080', plum: '#8e4585', lavender: '#e6e6fa', lilac: '#c8a2c8', mauve: '#e0b0ff',
  magenta: '#ff00ff', fuchsia: '#ff1493', pink: '#ffc0cb', 'hot pink': '#ff69b4', rose: '#ff007f',
};
const ALIASES = { grey: 'gray', aqua: 'cyan', 'light blue': 'sky blue', 'dark blue': 'navy' };

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const cache = new Map();

export class Color {
  constructor(r, g, b, a = 1) {
    this.r = Math.round(clamp(r, 0, 255));
    this.g = Math.round(clamp(g, 0, 255));
    this.b = Math.round(clamp(b, 0, 255));
    this.a = clamp(a, 0, 1);
  }

  static fromHex(text) {
    let h = text.replace('#', '');
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return null;
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return new Color(n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1);
  }

  static fromName(name) {
    const key = String(name).toLowerCase().trim().replace(/\s+/g, ' ');
    const hex = NAMED[ALIASES[key] || key];
    return hex ? Color.fromHex(hex) : null;
  }

  static parse(text) {
    const s = String(text).trim();
    return s.startsWith('#') ? Color.fromHex(s) : Color.fromName(s);
  }

  static hsl(h, s, l, a = 1) {
    const hh = (((h % 360) + 360) % 360) / 360;
    const ss = clamp(s, 0, 1);
    const ll = clamp(l, 0, 1);
    if (ss === 0) return new Color(ll * 255, ll * 255, ll * 255, a);
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    const f = (t) => {
      const x = (t + 1) % 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return new Color(f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255, a);
  }

  get hex() {
    const h = (n) => n.toString(16).padStart(2, '0');
    const alpha = this.a < 1 ? h(Math.round(this.a * 255)) : '';
    return `#${h(this.r)}${h(this.g)}${h(this.b)}${alpha}`;
  }

  get name() {
    const key = this.hex;
    if (cache.has(key)) return cache.get(key);
    let best = 'gray';
    let bestD = Infinity;
    for (const [name, hex] of Object.entries(NAMED)) {
      const c = Color.fromHex(hex);
      const d = 2 * (c.r - this.r) ** 2 + 4 * (c.g - this.g) ** 2 + 3 * (c.b - this.b) ** 2;
      if (d < bestD) {
        best = name;
        bestD = d;
      }
    }
    cache.set(key, best);
    return best;
  }

  toHsl() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
  }

  mix(other, t = 0.5) {
    const k = clamp(t, 0, 1);
    const f = (a, b) => a + (b - a) * k;
    return new Color(f(this.r, other.r), f(this.g, other.g), f(this.b, other.b), f(this.a, other.a));
  }

  rotate(deg) {
    const [h, s, l] = this.toHsl();
    return Color.hsl(h + deg, s, l, this.a);
  }

  equals(o) {
    return o instanceof Color && o.hex === this.hex;
  }
}
