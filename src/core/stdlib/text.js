// Text helpers.
import { DreamError } from '../diag.js';
import { Obj, kindOf, equals } from '../values.js';
import { titleCase } from '../names.js';

export function register(def) {
  const t = (v, ctx) => ctx.toText(v);
  def('upper', 'upper(text)', 'UPPERCASE the text.', ([s], ctx) => t(s, ctx).toUpperCase());
  def('lower', 'lower(text)', 'lowercase the text.', ([s], ctx) => t(s, ctx).toLowerCase());
  def('title', 'title(text)', 'Capitalize Every Word.', ([s], ctx) => titleCase(t(s, ctx)));
  def('capitalize', 'capitalize(text)', 'Capitalize the first letter.', ([s], ctx) => {
    const x = t(s, ctx);
    return x ? x[0].toUpperCase() + x.slice(1) : x;
  });
  def('trim', 'trim(text)', 'Remove spaces around the text.', ([s], ctx) => t(s, ctx).trim());
  def('words', 'words(text)', 'Split text into a list of words.', ([s], ctx) => t(s, ctx).split(/\s+/).filter(Boolean));
  def('split', 'split(text, separator = " ")', 'Split text into a list.', ([s, sep = ' '], ctx) => t(s, ctx).split(t(sep, ctx)));
  def('join', 'join(list, separator = ", ")', 'Join list items into one text.', ([list, sep = ', '], ctx) => {
    if (!Array.isArray(list)) return t(list, ctx);
    return list.map((x) => t(x, ctx)).filter((x) => x !== '').join(t(sep, ctx));
  });
  def('replace', 'replace(text, find, with)', 'Replace every occurrence of `find`.', ([s, a, b], ctx) =>
    t(s, ctx).split(t(a, ctx)).join(t(b, ctx)));
  def('startsWith', 'startsWith(text, prefix)', 'Does the text begin with `prefix`?', ([s, p], ctx) => t(s, ctx).startsWith(t(p, ctx)));
  def('endsWith', 'endsWith(text, suffix)', 'Does the text end with `suffix`?', ([s, p], ctx) => t(s, ctx).endsWith(t(p, ctx)));
  def('repeat', 'repeat(text, times)', 'Repeat the text.', ([s, n], ctx) => {
    if (typeof n !== 'number' || n < 0 || n > 500) throw new DreamError('`repeat` needs a number from 0 to 500.');
    return t(s, ctx).repeat(Math.floor(n));
  });
  def('slug', 'slug(text)', 'Make a file-name friendly version.', ([s], ctx) =>
    t(s, ctx).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, ''));
  def('truncate', 'truncate(text, length)', 'Shorten text, adding … when cut.', ([s, n], ctx) => {
    const x = t(s, ctx);
    return x.length > n ? `${x.slice(0, Math.max(0, n - 1))}…` : x;
  });
  def('text', 'text(value)', 'Turn any value into text.', ([v], ctx) => t(v, ctx));
  def('length', 'length(value)', 'How many characters, items or entries.', ([v], ctx) => {
    if (typeof v === 'string' || Array.isArray(v)) return v.length;
    if (v instanceof Obj) return v.size;
    return t(v, ctx).length;
  });
  def('contains', 'contains(text | list | object, item)', 'Is `item` inside?', ([c, item], ctx) => {
    if (Array.isArray(c)) return c.some((x) => equals(ctx.force(x), item));
    if (c instanceof Obj) return c.has(t(item, ctx));
    return t(c, ctx).toLowerCase().includes(t(item, ctx).toLowerCase());
  });
  def('typeOf', 'typeOf(value)', 'The kind of value: text, number, list, color…', ([v]) => kindOf(v));
}
