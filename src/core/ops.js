// Operators: arithmetic, comparison, ranges.
import { DreamError } from './diag.js';
import { Color } from './color.js';
import { Obj, kindOf, equals } from './values.js';

const NUMERIC = /^\s*-?\d+(?:\.\d+)?\s*$/;

export function describeKind(v) {
  const k = kindOf(v);
  if (k === 'text') return `the text "${String(v).slice(0, 24)}"`;
  if (k === 'null') return 'nothing (null)';
  if (k === 'number' || k === 'bool') return `the ${k} ${v}`;
  return `a ${k}`;
}

export function asNumber(v, node, hint) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && NUMERIC.test(v)) return Number(v);
  throw new DreamError(`I can't use ${describeKind(v)} as a number here.`, {
    loc: node?.loc,
    hint: hint || 'Math needs numbers. To join text, use + with quoted text.',
  });
}

export function factorial(n, node) {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new DreamError(`Factorial (${n}!) only works for whole numbers from 0 to 170.`, { loc: node?.loc });
  }
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function add(a, b, ctx, node) {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) || Array.isArray(b)) {
    return [...(Array.isArray(a) ? a : [a]), ...(Array.isArray(b) ? b : [b])];
  }
  if (a instanceof Obj && b instanceof Obj) {
    const o = a.clone();
    o.kind = 'object';
    for (const [k, v] of b.entries()) o.set(k, v);
    return o;
  }
  const textual = (x) => typeof x === 'string' || x instanceof Color || x === null || typeof x === 'boolean';
  if (textual(a) && textual(b) && (typeof a === 'string' || typeof b === 'string' || a === null || b === null)) {
    return ctx.toText(a) + ctx.toText(b);
  }
  if (typeof a === 'string' || typeof b === 'string') return ctx.toText(a) + ctx.toText(b);
  throw new DreamError(`I can't add ${describeKind(a)} and ${describeKind(b)}.`, { loc: node?.loc });
}

export function arith(op, a, b, node) {
  if (op === '*' && typeof a === 'string' && !NUMERIC.test(a) && typeof b === 'number') {
    if (b < 0 || b > 500) throw new DreamError('Repeat between 0 and 500 times.', { loc: node?.loc });
    return a.repeat(Math.floor(b));
  }
  const x = asNumber(a, node);
  const y = asNumber(b, node);
  switch (op) {
    case '-': return x - y;
    case '*': return x * y;
    case '/':
    case '%':
      if (y === 0) throw new DreamError('You can\'t divide by zero.', { loc: node?.loc, hint: 'Check the number on the right of the `/`.' });
      return op === '/' ? x / y : x % y;
    case '^': {
      const r = x ** y;
      if (!Number.isFinite(r)) throw new DreamError(`${x} ^ ${y} is not a usable number.`, { loc: node?.loc });
      return r;
    }
    default: throw new DreamError(`Unknown operator ${op}`, { loc: node?.loc });
  }
}

export function compare(op, a, b, node) {
  if (op === '==') return equals(a, b);
  if (op === '!=') return !equals(a, b);
  let d;
  if (typeof a === 'string' && typeof b === 'string' && !(NUMERIC.test(a) && NUMERIC.test(b))) d = a.localeCompare(b);
  else d = asNumber(a, node, 'Compare numbers with numbers, or text with text.') - asNumber(b, node, 'Compare numbers with numbers, or text with text.');
  return { '<': d < 0, '<=': d <= 0, '>': d > 0, '>=': d >= 0 }[op];
}

export function contains(container, item, ctx) {
  if (Array.isArray(container)) return container.some((x) => equals(ctx.force(x), item));
  if (typeof container === 'string') return container.toLowerCase().includes(ctx.toText(item).toLowerCase());
  if (container instanceof Obj) return container.has(ctx.toText(item));
  return false;
}

export function makeRange(a, b, excl, by, node) {
  const step = by === null ? (a <= b ? 1 : -1) : by;
  if (step === 0) throw new DreamError('A range can\'t step by 0.', { loc: node?.loc });
  const out = [];
  const up = step > 0;
  for (let x = a; up ? (excl ? x < b : x <= b) : (excl ? x > b : x >= b); x += step) {
    out.push(Math.round(x * 1e9) / 1e9);
    if (out.length > 5000) throw new DreamError('That range is too big (over 5000 items).', { loc: node?.loc });
  }
  return out;
}
