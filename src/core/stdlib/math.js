// Numbers.
import { DreamError } from '../diag.js';
import { asNumber } from '../ops.js';

export function register(def) {
  const n = (v) => asNumber(v);
  def('round', 'round(x, digits = 0)', 'Round to a number of decimals.', ([x, d = 0]) => {
    const k = 10 ** n(d);
    return Math.round(n(x) * k) / k;
  });
  def('floor', 'floor(x)', 'Round down.', ([x]) => Math.floor(n(x)));
  def('ceil', 'ceil(x)', 'Round up.', ([x]) => Math.ceil(n(x)));
  def('abs', 'abs(x)', 'Remove the minus sign.', ([x]) => Math.abs(n(x)));
  def('sign', 'sign(x)', '-1, 0 or 1.', ([x]) => Math.sign(n(x)));
  def('sqrt', 'sqrt(x)', 'Square root.', ([x]) => {
    if (n(x) < 0) throw new DreamError('`sqrt` needs a number of 0 or more.');
    return Math.sqrt(n(x));
  });
  def('pow', 'pow(x, y)', 'x to the power y.', ([x, y]) => n(x) ** n(y));
  def('sin', 'sin(radians)', 'Sine.', ([x]) => Math.sin(n(x)));
  def('cos', 'cos(radians)', 'Cosine.', ([x]) => Math.cos(n(x)));
  def('pi', 'pi()', 'The number π.', () => Math.PI);
  def('clamp', 'clamp(x, low, high)', 'Keep x between low and high.', ([x, lo, hi]) => Math.min(n(hi), Math.max(n(lo), n(x))));
  def('lerp', 'lerp(a, b, t)', 'Blend from a to b; t is 0..1.', ([a, b, t]) => n(a) + (n(b) - n(a)) * n(t));
  def('int', 'int(value)', 'Whole number part of a number or text.', ([v]) => Math.trunc(n(v)));
  def('number', 'number(value)', 'Turn text such as "12" into a number.', ([v]) => n(v));
}
