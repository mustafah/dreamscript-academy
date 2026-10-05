// Expression evaluator. Everything is a function of (node, scope, ctx).
import { DreamError, didYouMean } from './diag.js';
import { norm } from './names.js';
import { Color } from './color.js';
import { Scope } from './scope.js';
import { Obj, Fn, Choice, isCallable, truthy, equals } from './values.js';
import { asNumber, factorial, add, arith, compare, contains, makeRange, describeKind } from './ops.js';

const H = {};

export function evalNode(n, scope, ctx) {
  ctx.step();
  const h = H[n.t];
  if (!h) throw new DreamError(`I can't evaluate a "${n.t}" here.`, { loc: n.loc });
  return h(n, scope, ctx);
}

const val = (n, scope, ctx) => ctx.force(evalNode(n, scope, ctx));

// ---- literals & names ------------------------------------------------------
H.num = (n) => n.v;
H.bool = (n) => n.v;
H.str = (n) => n.v;
H.null = () => null;
H.color = (n) => Color.fromHex(n.v);
H.tpl = (n, scope, ctx) => renderParts(n.parts, scope, ctx).map((s) => s.s).join('');
H.id = (n, scope, ctx) => {
  const b = scope.lookup(n.name);
  return b ? b.value : unresolved(n, scope, ctx);
};

// Barewords are text unless they name something; typos get a friendly nudge.
function unresolved(n, scope, ctx, strict = false) {
  const key = norm(n.name);
  if (ctx.declaring === key) {
    throw new DreamError(`\`${n.name}\` refers to itself, but nothing with that name exists yet.`, {
      loc: n.loc,
      hint: 'A name may reuse its previous value, so define it earlier first, or choose another name.',
    });
  }
  if (ctx.failed.has(key)) throw new DreamError('');
  const later = ctx.forward.get(key);
  if (later) {
    throw new DreamError(`\`${n.name}\` is used before it is defined (line ${later}).`, {
      loc: n.loc,
      hint: 'Move its definition above this line.',
    });
  }
  if (strict) {
    const close = didYouMean(n.name, scope.allNames());
    throw new DreamError(`\`${n.name}\` isn't defined here.`, {
      loc: n.loc,
      hint: close ? `Did you mean \`${close}\`?` : 'Names made inside a `for` or `if` block only exist inside that block.',
    });
  }
  if (!n.soft && !Color.fromName(n.name)) {
    const limit = n.name.length >= 7 ? 2 : 1;
    const close = didYouMean(n.name, scope.allNames('values'), limit);
    const [head, tail] = n.name.split('-');
    if (tail !== undefined && scope.lookup(head) && (/^\d+$/.test(tail) || scope.lookup(tail))) {
      ctx.warn(`\`${n.name}\` is one word (hyphens stay inside words).`, n.loc, `To subtract, put spaces around the minus: \`${head} - ${tail}\`.`);
    } else if (close) {
      ctx.warn(`\`${n.name}\` isn't defined, so I used it as plain text.`, n.loc, `Did you mean \`${close}\`? Names are matched ignoring case and spaces.`);
    }
  }
  return n.name;
}

// ---- collections -----------------------------------------------------------
H.list = (n, scope, ctx) => {
  const out = [];
  for (const it of n.items) {
    if (!it.spread) {
      out.push(evalNode(it.e, scope, ctx));
      continue;
    }
    const v = val(it.e, scope, ctx);
    if (Array.isArray(v)) out.push(...v);
    else if (v !== null) throw new DreamError(`I can only spread a list here, not ${describeKind(v)}.`, { loc: it.e.loc });
  }
  return out;
};

H.obj = (n, scope, ctx) => {
  const o = new Obj('object');
  for (const p of n.props) {
    if (!p.spread) {
      o.set(p.key, evalNode(p.value, scope, ctx));
      continue;
    }
    const v = val(p.spread, scope, ctx);
    if (v instanceof Obj) for (const [k, x] of v.entries()) o.set(k, x);
    else if (v !== null) throw new DreamError(`I can only spread an object here, not ${describeKind(v)}.`, { loc: p.spread.loc });
  }
  return o;
};

const LIST_PROPS = {
  length: (l) => l.length,
  count: (l) => l.length,
  first: (l) => (l.length ? l[0] : null),
  last: (l) => (l.length ? l[l.length - 1] : null),
};

export function getMember(o, name, node, ctx) {
  const k = norm(name);
  if (o instanceof Obj) {
    const v = o.get(name);
    if (v !== undefined) return v;
    const close = didYouMean(name, o.keys());
    if (!node?.quiet) {
      ctx.warn(
        `There is no \`${name}\` in ${o.name ? `\`${o.name}\`` : `this ${o.kind}`}.`,
        node?.loc,
        close ? `Did you mean \`${close}\`?` : `It has: ${o.keys().slice(0, 8).join(', ') || 'nothing yet'}.`
      );
    }
    return null;
  }
  if (Array.isArray(o) && LIST_PROPS[k]) return LIST_PROPS[k](o);
  if (typeof o === 'string' && k === 'length') return o.length;
  if (o instanceof Color) {
    const [h, s, l] = o.toHsl();
    const props = { hex: o.hex, name: o.name, r: o.r, g: o.g, b: o.b, alpha: o.a, hue: Math.round(h), saturation: +s.toFixed(2), lightness: +l.toFixed(2) };
    if (k in props) return props[k];
  }
  throw new DreamError(`${describeKind(o)} has no \`${name}\`.`, { loc: node?.loc, hint: 'Use a dot only on objects, lists, text and colors.' });
}

// A container (before a dot or [ ]) must be a real name, not a bareword.
function container(n, scope, ctx) {
  if (n.t === 'id' && !n.soft && !scope.lookup(n.name)) return unresolved(n, scope, ctx, true);
  return val(n, scope, ctx);
}

H.member = (n, scope, ctx) => {
  const o = container(n.o, scope, ctx);
  if (o === null) {
    if (n.opt) return null;
    throw new DreamError(`Can't read \`${n.name}\` because the thing before the dot is nothing (null).`, {
      loc: n.loc,
      hint: 'Use `?.` for optional access, e.g. `camera?.fov`, and `??` to give a fallback.',
    });
  }
  try {
    return getMember(o, n.name, n, ctx);
  } catch (err) {
    const hidden = n.o.t === 'id' ? scope.lookupOuter(n.o.name) : null;
    if (err instanceof DreamError && hidden?.value instanceof Obj) {
      err.hint = `A nearer \`${n.o.name}\` hides \`${hidden.name}\` (${hidden.value.kind}). Names ignore case, so use different names.`;
    }
    throw err;
  }
};

function indexInto(o, i, n, ctx) {
  if (Array.isArray(o) || typeof o === 'string') {
    let k = asNumber(i, n.i, 'Positions are whole numbers starting at 0.');
    if (!Number.isInteger(k)) throw new DreamError('A position must be a whole number.', { loc: n.i.loc });
    if (k < 0) k += o.length;
    if ((k < 0 || k >= o.length) && n.quiet) return null;
    if (k < 0 || k >= o.length) {
      ctx.warn(`Position ${i} is outside this ${typeof o === 'string' ? 'text' : 'list'} (length ${o.length}).`, n.loc, 'Positions start at 0; negative positions count from the end.');
      return null;
    }
    return o[k];
  }
  if (o instanceof Obj) {
    const v = o.get(ctx.toText(i));
    if (v === undefined) {
      if (!n.quiet) ctx.warn(`There is no "${ctx.toText(i)}" in this ${o.kind}.`, n.loc, `It has: ${o.keys().slice(0, 8).join(', ')}.`);
      return null;
    }
    return v;
  }
  throw new DreamError(`I can't look inside ${describeKind(o)} with [ ].`, { loc: n.loc });
}

H.index = (n, scope, ctx) => {
  const o = container(n.o, scope, ctx);
  if (o === null) {
    if (n.opt) return null;
    throw new DreamError("Can't look inside nothing (null).", { loc: n.loc, hint: 'Use `?.[...]` for optional access.' });
  }
  return indexInto(o, val(n.i, scope, ctx), n, ctx);
};

// ---- calls -----------------------------------------------------------------
function lookupFn(name, scope, node) {
  const b = scope.lookupCallable(name);
  if (b) return b.value;
  const plain = scope.lookup(name);
  const close = didYouMean(name, scope.allNames('callable'));
  throw new DreamError(
    plain ? `\`${name}\` is ${describeKind(plain.value)}, not a function.` : `I don't know a function called \`${name}\`.`,
    { loc: node.loc, hint: close ? `Did you mean \`${close}\`?` : 'Create one with `~ fn name(args) = ...`.' }
  );
}

function evalArgs(argNodes, scope, ctx) {
  const args = [];
  const named = {};
  for (const a of argNodes) {
    if (a.name) named[a.name] = evalNode(a.e, scope, ctx);
    else if (!a.spread) args.push(evalNode(a.e, scope, ctx));
    else {
      const v = val(a.e, scope, ctx);
      if (Array.isArray(v)) args.push(...v);
      else if (v instanceof Obj) for (const [k, x] of v.entries()) named[k] = x;
      else if (v !== null) throw new DreamError(`I can only spread a list or object here, not ${describeKind(v)}.`, { loc: a.e.loc });
    }
  }
  return { args, named };
}

H.call = (n, scope, ctx) => {
  const f = n.f;
  let fn;
  let receiver;
  let hasReceiver = false;
  if (f.t === 'member') {
    const o = val(f.o, scope, ctx);
    if (o === null && f.opt) return null;
    const prop = o instanceof Obj ? o.get(f.name) : undefined;
    if (isCallable(prop)) fn = prop;
    else {
      fn = lookupFn(f.name, scope, f);
      receiver = o;
      hasReceiver = true;
    }
  } else if (f.t === 'id') fn = lookupFn(f.name, scope, f);
  else {
    fn = val(f, scope, ctx);
    if (!isCallable(fn)) throw new DreamError(`I can't call ${describeKind(fn)} like a function.`, { loc: f.loc });
  }
  const { args, named } = evalArgs(n.args, scope, ctx);
  if (hasReceiver) args.unshift(receiver);
  return ctx.call(fn, args, named, n);
};

H.lambda = (n, scope) => new Fn({ name: 'λ', params: n.params, body: { expr: n.body }, scope, lenient: true });

// ---- operators -------------------------------------------------------------
H.un = (n, scope, ctx) => {
  const v = val(n.e, scope, ctx);
  switch (n.op) {
    case '-': return -asNumber(v, n);
    case '+': return asNumber(v, n);
    case 'not': return !truthy(v);
    default: return factorial(asNumber(v, n), n);
  }
};

H.bin = (n, scope, ctx) => {
  const a = val(n.l, scope, ctx);
  const b = val(n.r, scope, ctx);
  switch (n.op) {
    case '+': return add(a, b, ctx, n);
    case 'in': return contains(b, a, ctx);
    case '==':
    case '!=':
    case '<':
    case '<=':
    case '>':
    case '>=': return compare(n.op, a, b, n);
    default: return arith(n.op, a, b, n);
  }
};

H.logic = (n, scope, ctx) => {
  const a = val(n.l, scope, ctx);
  if (n.op === 'and') return truthy(a) ? evalNode(n.r, scope, ctx) : a;
  if (n.op === 'or') return truthy(a) ? a : evalNode(n.r, scope, ctx);
  return a === null ? evalNode(n.r, scope, ctx) : a;
};

H.if = (n, scope, ctx) => evalNode(truthy(val(n.c, scope, ctx)) ? n.a : n.b, scope, ctx);

H.range = (n, scope, ctx) => {
  const a = asNumber(val(n.a, scope, ctx), n.a);
  const b = asNumber(val(n.b, scope, ctx), n.b);
  const by = n.by ? asNumber(val(n.by, scope, ctx), n.by) : null;
  return makeRange(a, b, n.excl, by, n);
};

// ---- variation, match, comprehension ----------------------------------------
H.vary = (n, scope, ctx) =>
  new Choice(
    n.alts.map((a) => ({ w: a.w, src: a.src, get: () => evalNode(a.e, scope, ctx) })),
    null,
    n.loc
  );

function patternMatches(pat, subject, scope, ctx) {
  if (pat.t === 'wild') return true;
  if (pat.t === 'range') {
    if (typeof subject !== 'number') return false;
    const a = asNumber(val(pat.a, scope, ctx), pat.a);
    const b = asNumber(val(pat.b, scope, ctx), pat.b);
    return subject >= a && (pat.excl ? subject < b : subject <= b);
  }
  return equals(val(pat, scope, ctx), subject);
}

H.match = (n, scope, ctx) => {
  if (!n.arms) throw new DreamError('This `match` has no arms.', { loc: n.loc, hint: 'Add arms like `"dreamy" => 85` on the lines below.' });
  const subject = val(n.subject, scope, ctx);
  for (const arm of n.arms) {
    for (const pat of arm.pats) {
      if (!patternMatches(pat, subject, scope, ctx)) continue;
      const inner = new Scope(scope);
      inner.define('it', subject);
      if (arm.guard && !truthy(val(arm.guard, inner, ctx))) continue;
      return evalNode(arm.body, inner, ctx);
    }
  }
  ctx.warn(`No arm of this \`match\` fits ${ctx.preview(subject)}.`, n.loc, 'Add a catch-all arm: `_ => ...`.');
  return null;
};

// Items to loop over: [value, index] for lists, [key, value] for objects.
export function iterate(v, binders, node) {
  if (v === null) return [];
  if (Array.isArray(v)) return v.map((x, i) => [x, i]);
  if (typeof v === 'string') return [...v].map((c, i) => [c, i]);
  if (v instanceof Obj) {
    return v.entries().map(([k, x]) => (binders >= 2 ? [k, x] : [v.kind === 'enum' ? x : k]));
  }
  throw new DreamError(`I can't loop over ${describeKind(v)}.`, { loc: node?.loc, hint: 'Loop over a list, a range like 1..5, or an object.' });
}

export function bindLoop(inner, binders, vals, counter) {
  binders.forEach((b, i) => inner.define(b, vals[i] === undefined ? null : vals[i]));
  if (!binders.some((b) => norm(b) === 'index')) inner.define('index', counter);
}

H.comp = (n, scope, ctx) => {
  const out = [];
  let counter = 0;
  const walk = (gi, sc) => {
    if (gi === n.gens.length) {
      out.push(evalNode(n.body, sc, ctx));
      if (out.length > 5000) throw new DreamError('That list is getting too big (over 5000 items).', { loc: n.loc });
      return;
    }
    const g = n.gens[gi];
    for (const vals of iterate(val(g.iter, sc, ctx), g.binders.length, g.iter)) {
      const inner = new Scope(sc);
      bindLoop(inner, g.binders, vals, counter);
      if (g.cond && !truthy(val(g.cond, inner, ctx))) continue;
      walk(gi + 1, inner);
      if (gi === n.gens.length - 1) counter++;
    }
  };
  walk(0, scope);
  return out;
};

// ---- templates -------------------------------------------------------------
const shown = (src) => (/^[\p{L}\p{N}_.]+$/u.test(src) ? `~${src}` : `~(${src})`);

function evalPart(p, scope, ctx) {
  if (!p.e) {
    const { err } = p;
    ctx.diag.add(err.severity || 'error', err.message, err.loc || p.loc, err.hint, ctx.file);
    return { t: 'err', s: shown(p.src), msg: err.message };
  }
  try {
    const e = p.e;
    if (e.t === 'id' && !e.soft && !scope.lookup(e.name) && !ctx.forward.has(norm(e.name)) && !ctx.failed.has(norm(e.name))) {
      const close = didYouMean(e.name, scope.allNames());
      ctx.warn(`\`~${e.name}\` isn't defined.`, p.loc, close ? `Did you mean \`${close}\`?` : 'Define it with `~ name = value`, or write `\\~` to keep a literal tilde.');
      return { t: 'err', s: `~${e.name}`, msg: 'not defined' };
    }
    return ctx.display(evalNode(e, scope, ctx), p.src);
  } catch (err) {
    if (!(err instanceof DreamError)) throw err;
    ctx.diag.add(err.severity, err.message, err.loc || p.loc, err.hint, ctx.file);
    return { t: 'err', s: shown(p.src), msg: err.message };
  }
}

export function renderParts(parts, scope, ctx) {
  return parts.map((p) => (p.k === 'text' ? { t: 'text', s: p.s } : evalPart(p, scope, ctx)));
}
