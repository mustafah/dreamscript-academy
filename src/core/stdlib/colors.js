// Colors. Names like teal and hex like #ff8800 both work everywhere.
import { DreamError } from '../diag.js';
import { Color } from '../color.js';
import { asNumber } from '../ops.js';

const THEMES = {
  autumn: ['#b7410e', '#ffa500', '#ffbf00', '#8b4513', '#800020', '#d2b48c'],
  ocean: ['#000080', '#007fff', '#40e0d0', '#87ceeb', '#008080', '#e6e6fa'],
  sunset: ['#ff2400', '#ff7f50', '#ffbf00', '#ff69b4', '#8e4585', '#4b0082'],
  forest: ['#228b22', '#50c878', '#9caf88', '#808000', '#8b4513', '#98ff98'],
  pastel: ['#ffc0cb', '#e6e6fa', '#98ff98', '#ffdab9', '#87ceeb', '#fffdd0'],
  neon: ['#ff00ff', '#00ffff', '#7fff00', '#ff1493', '#ffff00', '#8f00ff'],
};
const WARM = ['#ff2400', '#ff7f50', '#ffa500', '#ffbf00', '#ffd700', '#dc143c', '#ff69b4', '#b7410e'];
const COOL = ['#0047ab', '#007fff', '#40e0d0', '#008080', '#4b0082', '#87ceeb', '#50c878', '#8f00ff'];

export function toColor(v, node) {
  if (v instanceof Color) return v;
  const c = typeof v === 'string' ? Color.parse(v) : null;
  if (c) return c;
  throw new DreamError(`\`${typeof v === 'string' ? v : 'that'}\` isn't a color I know.`, {
    loc: node?.loc,
    hint: 'Use a hex like #ff8800 or a color name such as teal, coral or midnight… (try: red, teal, gold, lavender).',
  });
}

export function register(def) {
  const col = (v, node) => toColor(v, node);
  const amount = (v, d) => (v === undefined ? d : asNumber(v));
  const fromHexes = (list) => list.map((h) => Color.fromHex(h));

  def('mix', 'mix(a, b, amount = 0.5)', 'Blend two colors.', ([a, b, t], _c, _n, node) => col(a, node).mix(col(b, node), amount(t, 0.5)));
  const lighten = ([c, t], _c, _n, node) => col(c, node).mix(Color.fromHex('#ffffff'), amount(t, 0.25));
  const darken = ([c, t], _c, _n, node) => col(c, node).mix(Color.fromHex('#000000'), amount(t, 0.25));
  def('lighten', 'lighten(color, amount = 0.25)', 'Mix with white.', lighten);
  def('tint', 'tint(color, amount = 0.25)', 'Mix with white (same as lighten).', lighten);
  def('lighter', 'lighter(color)', 'A lighter version.', lighten);
  def('darken', 'darken(color, amount = 0.25)', 'Mix with black.', darken);
  def('shade', 'shade(color, amount = 0.25)', 'Mix with black (same as darken).', darken);
  def('darker', 'darker(color)', 'A darker version.', darken);
  def('complement', 'complement(color)', 'The opposite color on the wheel.', ([c], _c, _n, node) => col(c, node).rotate(180));
  def('hues', 'hues(color, count = 5)', 'Colors rotated around the wheel.', ([c, n], _c, _n, node) => {
    const count = Math.max(1, Math.min(12, amount(n, 5)));
    return Array.from({ length: count }, (_, i) => col(c, node).rotate((360 / count) * i));
  });
  def('shades', 'shades(color, count = 4)', 'From the color down to near black.', ([c, n], _c, _n, node) => {
    const count = Math.max(1, Math.min(12, amount(n, 4)));
    return Array.from({ length: count }, (_, i) => col(c, node).mix(Color.fromHex('#000000'), (i / count) * 0.8));
  });
  def('tints', 'tints(color, count = 4)', 'From the color up to near white.', ([c, n], _c, _n, node) => {
    const count = Math.max(1, Math.min(12, amount(n, 4)));
    return Array.from({ length: count }, (_, i) => col(c, node).mix(Color.fromHex('#ffffff'), (i / count) * 0.8));
  });
  def('palette', 'palette(theme, count?)', 'A ready-made palette: autumn, ocean, sunset, forest, pastel, neon.', ([theme, n], ctx) => {
    const list = THEMES[ctx.toText(theme).toLowerCase()];
    if (!list) throw new DreamError(`I don't have a "${ctx.toText(theme)}" palette.`, { hint: `Try: ${Object.keys(THEMES).join(', ')}.` });
    return fromHexes(list).slice(0, n === undefined ? list.length : Math.max(1, n));
  });
  def('warm', 'warm(count = 5)', 'Warm colors.', ([n]) => fromHexes(WARM).slice(0, amount(n, 5)));
  def('cool', 'cool(count = 5)', 'Cool colors.', ([n]) => fromHexes(COOL).slice(0, amount(n, 5)));
  def('hex', 'hex(color)', 'The #rrggbb code.', ([c], _c, _n, node) => col(c, node).hex);
  def('colorName', 'colorName(color)', 'The closest friendly name.', ([c], _c, _n, node) => col(c, node).name);
  def('rgb', 'rgb(r, g, b)', 'A color from red, green, blue (0–255).', ([r, g, b]) => new Color(asNumber(r), asNumber(g), asNumber(b)));
  def('hsl', 'hsl(hue, saturation, lightness)', 'A color from hue (0–360), saturation and lightness (0–1).', ([h, s, l]) =>
    Color.hsl(asNumber(h), asNumber(s), asNumber(l)));
}
