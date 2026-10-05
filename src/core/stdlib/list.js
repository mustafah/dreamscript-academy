// Lists and higher-order helpers.
import { DreamError } from '../diag.js';
import { isCallable, truthy, equals } from '../values.js';
import { asNumber, makeRange } from '../ops.js';

export function register(def) {
  const asList = (v, name, node) => {
    if (Array.isArray(v)) return v;
    if (v === null) return [];
    throw new DreamError(`\`${name}\` needs a list, but got something else.`, { loc: node?.loc, hint: 'Lists look like [1, 2, 3] or red, blue, teal.' });
  };
  const asFn = (f, name, node) => {
    if (!isCallable(f)) throw new DreamError(`\`${name}\` needs a function, such as \`x => x * 2\`.`, { loc: node?.loc });
    return f;
  };
  const test = (ctx, f, x, i) => truthy(ctx.force(ctx.call(f, [x, i])));
  const nums = (args, ctx, name, node) => {
    const items = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    if (!items.length) throw new DreamError(`\`${name}\` needs at least one number.`, { loc: node?.loc });
    return items.map((x) => asNumber(ctx.force(x), node));
  };

  def('map', 'map(list, fn)', 'Transform every item.', ([l, f], ctx, _n, node) =>
    asList(l, 'map', node).map((x, i) => ctx.call(asFn(f, 'map', node), [x, i])));
  def('filter', 'filter(list, fn)', 'Keep the items where fn is true.', ([l, f], ctx, _n, node) =>
    asList(l, 'filter', node).filter((x, i) => test(ctx, asFn(f, 'filter', node), x, i)));
  def('reduce', 'reduce(list, fn, start)', 'Fold the list into one value: fn(total, item).', ([l, f, init], ctx, _n, node) => {
    const items = asList(l, 'reduce', node);
    const fn = asFn(f, 'reduce', node);
    let acc = init;
    let from = 0;
    if (init === undefined) {
      acc = items[0];
      from = 1;
    }
    for (let i = from; i < items.length; i++) acc = ctx.call(fn, [acc, items[i], i]);
    return acc === undefined ? null : acc;
  });
  def('find', 'find(list, fn)', 'The first item where fn is true, or null.', ([l, f], ctx, _n, node) =>
    asList(l, 'find', node).find((x, i) => test(ctx, asFn(f, 'find', node), x, i)) ?? null);
  def('some', 'some(list, fn)', 'Is fn true for at least one item?', ([l, f], ctx, _n, node) =>
    asList(l, 'some', node).some((x, i) => test(ctx, asFn(f, 'some', node), x, i)));
  def('every', 'every(list, fn)', 'Is fn true for every item?', ([l, f], ctx, _n, node) =>
    asList(l, 'every', node).every((x, i) => test(ctx, asFn(f, 'every', node), x, i)));
  def('count', 'count(list, fn?)', 'How many items (that pass fn).', ([l, f], ctx, _n, node) => {
    const items = asList(l, 'count', node);
    return f ? items.filter((x, i) => test(ctx, asFn(f, 'count', node), x, i)).length : items.length;
  });
  def('sum', 'sum(list)', 'Add the numbers.', (args, ctx, _n, node) => nums(args, ctx, 'sum', node).reduce((a, b) => a + b, 0));
  def('avg', 'avg(list)', 'The average of the numbers.', (args, ctx, _n, node) => {
    const v = nums(args, ctx, 'avg', node);
    return v.reduce((a, b) => a + b, 0) / v.length;
  });
  def('min', 'min(list) or min(a, b)', 'The smallest number.', (args, ctx, _n, node) => Math.min(...nums(args, ctx, 'min', node)));
  def('max', 'max(list) or max(a, b)', 'The largest number.', (args, ctx, _n, node) => Math.max(...nums(args, ctx, 'max', node)));
  def('sort', 'sort(list, fn?)', 'Sort numbers or text; give fn(a, b) for a custom order.', ([l, f], ctx, _n, node) => {
    const items = [...asList(l, 'sort', node)];
    if (f) return items.sort((a, b) => asNumber(ctx.force(ctx.call(asFn(f, 'sort', node), [a, b]))));
    return items.sort((a, b) => {
      const x = ctx.force(a);
      const y = ctx.force(b);
      return typeof x === 'number' && typeof y === 'number' ? x - y : ctx.toText(x).localeCompare(ctx.toText(y));
    });
  });
  def('sortBy', 'sortBy(list, fn)', 'Sort by the value fn gives each item.', ([l, f], ctx, _n, node) => {
    const keyed = asList(l, 'sortBy', node).map((x, i) => ({ x, k: ctx.force(ctx.call(asFn(f, 'sortBy', node), [x, i])) }));
    keyed.sort((a, b) => (typeof a.k === 'number' && typeof b.k === 'number' ? a.k - b.k : ctx.toText(a.k).localeCompare(ctx.toText(b.k))));
    return keyed.map((e) => e.x);
  });
  def('reverse', 'reverse(list)', 'Flip the order.', ([l], _c, _n, node) => [...asList(l, 'reverse', node)].reverse());
  def('take', 'take(list, n)', 'The first n items.', ([l, n], _c, _n, node) => asList(l, 'take', node).slice(0, Math.max(0, n)));
  def('drop', 'drop(list, n)', 'Everything after the first n items.', ([l, n], _c, _n, node) => asList(l, 'drop', node).slice(Math.max(0, n)));
  def('slice', 'slice(list, from, to?)', 'A piece of the list.', ([l, a, b], _c, _n, node) => asList(l, 'slice', node).slice(a, b === undefined ? undefined : b));
  def('first', 'first(list)', 'The first item.', ([l], _c, _n, node) => asList(l, 'first', node)[0] ?? null);
  def('last', 'last(list)', 'The last item.', ([l], _c, _n, node) => asList(l, 'last', node).at(-1) ?? null);
  def('append', 'append(list, item)', 'A new list with the item added.', ([l, x], _c, _n, node) => [...asList(l, 'append', node), x]);
  def('indexOf', 'indexOf(list, item)', 'Position of the item, or -1.', ([l, x], ctx, _n, node) =>
    asList(l, 'indexOf', node).findIndex((y) => equals(ctx.force(y), x)));
  def('unique', 'unique(list)', 'Remove duplicates.', ([l], ctx, _n, node) => {
    const out = [];
    for (const x of asList(l, 'unique', node)) if (!out.some((y) => equals(ctx.force(y), ctx.force(x)))) out.push(x);
    return out;
  });
  def('flatten', 'flatten(list)', 'Flatten one level of nesting.', ([l], _c, _n, node) =>
    asList(l, 'flatten', node).flatMap((x) => (Array.isArray(x) ? x : [x])));
  def('zip', 'zip(a, b)', 'Pair items up: [[a1, b1], [a2, b2]].', ([a, b], _c, _n, node) =>
    asList(a, 'zip', node).slice(0, asList(b, 'zip', node).length).map((x, i) => [x, b[i]]));
  def('enumerate', 'enumerate(list)', 'Pairs of [index, item].', ([l], _c, _n, node) => asList(l, 'enumerate', node).map((x, i) => [i, x]));
  def('chunk', 'chunk(list, size)', 'Split into groups of `size`.', ([l, n], _c, _n, node) => {
    const items = asList(l, 'chunk', node);
    const out = [];
    for (let i = 0; i < items.length; i += Math.max(1, n)) out.push(items.slice(i, i + Math.max(1, n)));
    return out;
  });
  def('range', 'range(from, to?, step?)', 'The numbers from..to (to excluded), like range(5) → 0..4.', ([a, b, s], _c, _n, node) =>
    b === undefined ? makeRange(0, asNumber(a), true, null, node) : makeRange(asNumber(a), asNumber(b), true, s === undefined ? null : asNumber(s), node));
}
