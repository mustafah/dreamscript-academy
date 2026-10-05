// Objects.
import { DreamError } from '../diag.js';
import { Obj } from '../values.js';

export function register(def) {
  const asObj = (v, name, node) => {
    if (v instanceof Obj) return v;
    throw new DreamError(`\`${name}\` needs an object, like { seed = 1 }.`, { loc: node?.loc });
  };
  def('keys', 'keys(object)', 'The names inside an object.', ([o], _c, _n, node) => asObj(o, 'keys', node).keys());
  def('values', 'values(object)', 'The values inside an object (or enum).', ([o], _c, _n, node) => asObj(o, 'values', node).values());
  def('entries', 'entries(object)', 'A list of [name, value] pairs.', ([o], _c, _n, node) => asObj(o, 'entries', node).entries().map(([k, v]) => [k, v]));
  def('get', 'get(object, key, fallback?)', 'Read a key, with an optional fallback.', ([o, k, d], ctx, _n, node) => {
    const v = asObj(o, 'get', node).get(ctx.toText(k));
    return v === undefined ? (d === undefined ? null : d) : v;
  });
  def('has', 'has(object, key)', 'Does the object have this key?', ([o, k], ctx, _n, node) => asObj(o, 'has', node).has(ctx.toText(k)));
  def('merge', 'merge(a, b, ...)', 'Combine objects; later ones win.', (args, _c, _n, node) => {
    const out = new Obj('object');
    for (const o of args) if (o !== null) for (const [k, v] of asObj(o, 'merge', node).entries()) out.set(k, v);
    return out;
  });
  def('only', 'only(object, key, ...)', 'Keep just these keys.', ([o, ...keys], ctx, _n, node) => {
    const src = asObj(o, 'only', node);
    const out = new Obj('object');
    for (const k of keys.flat()) if (src.has(ctx.toText(k))) out.set(src.find(ctx.toText(k)), src.get(ctx.toText(k)));
    return out;
  });
  def('without', 'without(object, key, ...)', 'Drop these keys.', ([o, ...keys], ctx, _n, node) => {
    const src = asObj(o, 'without', node);
    const drop = new Set(keys.flat().map((k) => ctx.toText(k).toLowerCase().replace(/[\s_-]+/g, '')));
    const out = new Obj('object');
    for (const [k, v] of src.entries()) if (!drop.has(k.toLowerCase().replace(/[\s_-]+/g, ''))) out.set(k, v);
    return out;
  });
  def('fromEntries', 'fromEntries(pairs)', 'Build an object from [name, value] pairs.', ([pairs], ctx) => {
    const out = new Obj('object');
    for (const p of pairs || []) {
      const [k, v] = ctx.force(p);
      out.set(ctx.toText(k), v);
    }
    return out;
  });
}
