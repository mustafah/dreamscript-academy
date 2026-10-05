// Making variations from data, plus small debugging helpers.
import { DreamError } from '../diag.js';
import { Choice } from '../values.js';

export function register(def) {
  const choice = (items, weights, ctx, node) =>
    new Choice(
      items.map((x, i) => ({ w: weights ? weights[i] : null, src: ctx.preview(x), get: () => x })),
      null,
      node?.loc
    );
  def('any', 'any(list) or any(a, b, c)', 'A variation over the items: one dream per item.', (args, ctx, _n, node) => {
    const items = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    if (!items.length) throw new DreamError('`any` needs at least one option.', { loc: node?.loc });
    return choice(items, null, ctx, node);
  });
  def('weighted', 'weighted(list, weights)', 'Like `any`, but some options are likelier: weighted(["a","b"], [80, 20]).', ([items, weights], ctx, _n, node) => {
    if (!Array.isArray(items) || !Array.isArray(weights) || items.length !== weights.length) {
      throw new DreamError('`weighted` needs a list and an equally long list of weights.', { loc: node?.loc });
    }
    return choice(items, weights.map((w) => Number(ctx.force(w))), ctx, node);
  });
  def('maybe', 'maybe(text, chance = 0.5)', 'Sometimes the text, sometimes nothing.', ([x, p = 0.5], ctx, _n, node) =>
    choice([x, ''], [p * 100, (1 - p) * 100], ctx, node));
  def('error', 'error(message)', 'Stop with your own error message.', ([m], ctx, _n, node) => {
    throw new DreamError(ctx.toText(m), { loc: node?.loc });
  });
  def('debug', 'debug(value, label)', 'Show a value in Problems while you work; returns it unchanged.', ([v, label], ctx, _n, node) => {
    ctx.diag.add('info', `${label ? `${ctx.toText(label)} = ` : ''}${ctx.preview(v)}`, node?.loc, null, ctx.file);
    return v;
  });
}
