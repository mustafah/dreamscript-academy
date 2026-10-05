// Type annotations: `int`, `text[]`, `int in 1..8`, `ImageSizes`, `{ seed: int }`, `a | b`, `T?`
import { Color } from './color.js';
import { Obj, kindOf, equals } from './values.js';
import { makeParser } from './expr.js';

const PRIMS = {
  int: 'int', integer: 'int', number: 'number', float: 'number', num: 'number',
  text: 'text', string: 'text', str: 'text', bool: 'bool', boolean: 'bool',
  color: 'color', colour: 'color', list: 'list', array: 'list', object: 'object',
  any: 'any', null: 'null',
};

// ---- parsing (operates on an ExprParser token stream) -----------------------
export function parseType(p) {
  p.expect(':');
  return parseTypeExpr(p);
}

// Parse a complete type written in `text` (the whole text must be a type).
export function parseTypeText(text, ctx, base = 0) {
  const p = makeParser(text, ctx, base);
  const t = parseTypeExpr(p);
  p.expectEnd();
  return t;
}

export function parseTypeExpr(p) {
  const first = parsePostfix(p);
  if (!p.is('|')) return first;
  const alts = [first];
  while (p.is('|')) {
    p.next();
    alts.push(parsePostfix(p));
  }
  return { k: 'union', alts };
}

function parsePostfix(p) {
  let t = parsePrimary(p);
  for (;;) {
    if (p.is('[') && p.is(']', 1)) {
      p.next();
      p.next();
      t = { k: 'list', of: t };
    } else if (p.is('?')) {
      p.next();
      t = { k: 'opt', of: t };
    } else return t;
  }
}

function parsePrimary(p) {
  const tok = p.next();
  if (tok.k === 'str' || tok.k === 'num') return { k: 'lit', v: tok.v };
  if (tok.k === 'op' && tok.v === '(') {
    const t = parseTypeExpr(p);
    p.expect(')');
    return t;
  }
  if (tok.k === 'op' && tok.v === '{') return parseShape(p);
  if (tok.k !== 'word') p.fail('Expected a type such as int, text, bool or a list like text[].', tok);
  const prim = PRIMS[tok.v.toLowerCase()];
  let t = prim ? { k: 'prim', name: prim } : { k: 'named', name: tok.v, loc: p.loc(tok) };
  if (p.isWord('in') && prim && (prim === 'int' || prim === 'number')) {
    p.next();
    const r = p.parseBinary(8);
    if (r.t !== 'range') p.fail('Expected a range such as `1..8` after `in`.');
    t = { k: 'range', base: prim, lo: constNum(r.a), hi: constNum(r.b), excl: r.excl };
  }
  return t;
}

function parseShape(p) {
  const fields = [];
  while (!p.is('}')) {
    const k = p.next();
    if (k.k !== 'word') p.fail('Expected a field name.', k);
    let optional = false;
    if (p.is('?')) {
      p.next();
      optional = true;
    }
    p.expect(':');
    fields.push({ key: k.v, type: parseTypeExpr(p), optional });
    if (p.is(',')) p.next();
    else if (!p.is('}') && !p.peek().nl) p.fail('Expected `,` or `}` here.');
    if (p.atEnd()) break;
  }
  p.expect('}');
  return { k: 'shape', fields };
}

function constNum(n) {
  if (n.t === 'num') return n.v;
  if (n.t === 'un' && n.op === '-' && n.e.t === 'num') return -n.e.v;
  return null;
}

// ---- describing -------------------------------------------------------------
export function describeType(t) {
  switch (t.k) {
    case 'prim': return t.name;
    case 'named': return t.name;
    case 'lit': return JSON.stringify(t.v);
    case 'list': return `${describeType(t.of)}[]`;
    case 'opt': return `${describeType(t.of)}?`;
    case 'range': return `${t.base} in ${t.lo}${t.excl ? '..<' : '..'}${t.hi}`;
    case 'union': return t.alts.map(describeType).join(' | ');
    case 'shape': return `{ ${t.fields.map((f) => `${f.key}${f.optional ? '?' : ''}: ${describeType(f.type)}`).join(', ')} }`;
    default: return 'any';
  }
}

// ---- checking ---------------------------------------------------------------
const label = (v) => {
  const k = kindOf(v);
  if (k === 'text') return `text "${String(v).slice(0, 24)}"`;
  if (k === 'number' || k === 'bool') return `${k} ${v}`;
  return k === 'null' ? 'nothing (null)' : `a ${k}`;
};

function checkPrim(name, v) {
  const ok = {
    any: () => true,
    int: () => typeof v === 'number' && Number.isInteger(v),
    number: () => typeof v === 'number',
    text: () => typeof v === 'string',
    bool: () => typeof v === 'boolean',
    null: () => v === null,
    list: () => Array.isArray(v),
    object: () => v instanceof Obj && (v.kind === 'object' || v.kind === 'params'),
    color: () => v instanceof Color || (typeof v === 'string' && !!Color.parse(v)),
  }[name]();
  return ok ? null : `expected ${name}, got ${label(v)}`;
}

function checkNamed(t, v, env, depth) {
  const def = env.lookupType(t.name);
  if (!def) return `unknown type "${t.name}"`;
  if (def.alias) return depth > 12 ? `the type "${t.name}" refers to itself` : checkType(def.alias, v, env, depth + 1);
  const ok = def.values.some((x) => equals(x, v)) || def.names.includes(String(v));
  return ok ? null : `expected one of ${t.name}: ${def.names.slice(0, 6).join(', ')}${def.names.length > 6 ? ', …' : ''} (got ${label(v)})`;
}

export function checkType(t, value, env, depth = 0) {
  const v = env.force(value);
  switch (t.k) {
    case 'prim': return checkPrim(t.name, v);
    case 'lit': return equals(v, t.v) ? null : `expected ${JSON.stringify(t.v)}, got ${label(v)}`;
    case 'opt': return v === null ? null : checkType(t.of, v, env, depth);
    case 'named': return checkNamed(t, v, env, depth);
    case 'list': {
      if (!Array.isArray(v)) return `expected a list, got ${label(v)}`;
      for (let i = 0; i < v.length; i++) {
        const r = checkType(t.of, v[i], env, depth);
        if (r) return `item ${i + 1}: ${r}`;
      }
      return null;
    }
    case 'range': {
      const base = checkPrim(t.base, v);
      if (base) return base;
      const over = t.excl ? v >= t.hi : v > t.hi;
      return v < t.lo || over ? `expected ${describeType(t)}, got ${v}` : null;
    }
    case 'union': {
      const fails = t.alts.map((a) => checkType(a, v, env, depth));
      return fails.some((f) => f === null) ? null : `expected ${describeType(t)}, got ${label(v)}`;
    }
    case 'shape': {
      if (!(v instanceof Obj)) return `expected an object, got ${label(v)}`;
      for (const f of t.fields) {
        if (!v.has(f.key)) {
          if (!f.optional) return `missing "${f.key}"`;
          continue;
        }
        const r = checkType(f.type, v.get(f.key), env, depth);
        if (r) return `${f.key}: ${r}`;
      }
      return null;
    }
    default: return null;
  }
}
