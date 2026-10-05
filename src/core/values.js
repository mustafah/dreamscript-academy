// Runtime value kinds. Everything else is a plain JS value:
// null, boolean, number, string (text) and Array (list).
import { norm } from './names.js';
import { Color } from './color.js';

// Objects keep insertion order and original key spelling; lookups ignore case/separators.
export class Obj {
  constructor(kind = 'object', name = null) {
    this.kind = kind; // object | enum | module | params
    this.name = name;
    this.map = new Map();
    this.docs = null;
  }

  static of(entries, kind = 'object') {
    const o = new Obj(kind);
    for (const [k, v] of entries) o.set(k, v);
    return o;
  }

  get size() {
    return this.map.size;
  }

  keys() {
    return [...this.map.keys()];
  }

  values() {
    return [...this.map.values()];
  }

  entries() {
    return [...this.map.entries()];
  }

  find(name) {
    if (this.map.has(name)) return name;
    const n = norm(name);
    for (const k of this.map.keys()) if (norm(k) === n) return k;
    return undefined;
  }

  has(name) {
    return this.find(name) !== undefined;
  }

  get(name) {
    const k = this.find(name);
    return k === undefined ? undefined : this.map.get(k);
  }

  set(key, value) {
    const old = this.find(key);
    if (old === undefined || old === key) {
      this.map.set(key, value);
      return this;
    }
    // Same name, new spelling: keep the position, use the newest spelling.
    const entries = [...this.map.entries()].map(([k, v]) => (k === old ? [key, value] : [k, v]));
    this.map = new Map(entries);
    return this;
  }

  clone() {
    const o = new Obj(this.kind, this.name);
    o.map = new Map(this.map);
    o.docs = this.docs;
    return o;
  }
}

export class Fn {
  constructor({ name, params, body, scope, ret = null, doc = null, line = null, lenient = false }) {
    this.name = name;
    this.params = params;
    this.body = body; // { expr } or { stmts }
    this.scope = scope;
    this.ret = ret;
    this.doc = doc;
    this.line = line;
    this.lenient = lenient; // lambdas ignore extra arguments
  }
}

// A reusable chunk of prose: ~( template name(params) ... )
export class Template {
  constructor({ name, params, body, scope, doc = null, line = null }) {
    this.name = name;
    this.params = params;
    this.body = body;
    this.scope = scope;
    this.doc = doc;
    this.line = line;
  }
}

export class Native {
  constructor(name, impl, info = {}) {
    this.name = name;
    this.impl = impl;
    this.sig = info.sig || `${name}(...)`;
    this.doc = info.doc || '';
    this.lazy = !!info.lazy;
    this.group = info.group || 'misc';
  }
}

// A variation waiting to be decided. The decision is made (and remembered)
// the first time the value is needed, which is what keeps `~Style` consistent
// inside one dream while still producing a different dream per alternative.
export class Choice {
  constructor(alts, label = null, loc = null) {
    this.alts = alts; // [{ w, src, get }]
    this.label = label;
    this.loc = loc;
    this.done = false;
    this.value = undefined;
    this.index = -1;
  }
}

export class Fragment {
  constructor(items) {
    this.items = items;
  }
}

export const isCallable = (v) => v instanceof Fn || v instanceof Native || v instanceof Template;

export function kindOf(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'string') return 'text';
  if (Array.isArray(v)) return 'list';
  if (v instanceof Color) return 'color';
  if (v instanceof Obj) return v.kind === 'object' || v.kind === 'params' ? 'object' : v.kind;
  if (v instanceof Choice) return 'choice';
  if (v instanceof Fragment) return 'fragment';
  if (isCallable(v)) return 'function';
  return 'text';
}

export function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toFixed(6)));
}

export function truthy(v) {
  if (v === null || v === undefined || v === false || v === 0 || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Deep equality over already-resolved values.
export function equals(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => equals(x, b[i]));
  }
  if (a instanceof Color && b instanceof Color) return a.equals(b);
  if (a instanceof Obj && b instanceof Obj) {
    if (a.size !== b.size) return false;
    return a.entries().every(([k, v]) => b.has(k) && equals(v, b.get(k)));
  }
  if (a instanceof Color && typeof b === 'string') return a.equals(Color.parse(b));
  if (b instanceof Color && typeof a === 'string') return b.equals(Color.parse(a));
  return false;
}
