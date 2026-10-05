// Lexical scopes. Lookups ignore case and separators (see names.js).
// Functions live beside variables, so `~ Count = 3` never hides `count(...)`.
import { norm } from './names.js';
import { isCallable } from './values.js';

const FN_KINDS = new Set(['fn', 'template', 'native']);

export class Scope {
  constructor(parent = null, kind = 'block') {
    this.parent = parent;
    this.kind = kind; // prelude | module | block | call
    this.vars = new Map();
    this.fns = new Map();
  }

  define(name, value, meta = {}) {
    const binding = { name, value, meta };
    (FN_KINDS.has(meta.kind) ? this.fns : this.vars).set(norm(name), binding);
  }

  // A value lookup: variables first, then functions (so `map(xs, upper)` works).
  lookup(name) {
    const k = norm(name);
    for (let s = this; s; s = s.parent) {
      const b = s.vars.get(k) || s.fns.get(k);
      if (b) return b;
    }
    return undefined;
  }

  // A call lookup: functions first, then variables that hold functions (lambdas).
  lookupCallable(name) {
    const k = norm(name);
    for (let s = this; s; s = s.parent) {
      const b = s.fns.get(k) || s.vars.get(k);
      if (b && isCallable(b.value)) return b;
    }
    return undefined;
  }

  // A binding with this name in an outer scope that a nearer one hides.
  lookupOuter(name) {
    const k = norm(name);
    let seen = false;
    for (let s = this; s; s = s.parent) {
      const b = s.vars.get(k) || s.fns.get(k);
      if (b && seen) return b;
      if (b) seen = true;
    }
    return undefined;
  }

  own() {
    return [...this.vars.values(), ...this.fns.values()];
  }

  // A copy that keeps today's bindings.
  fork() {
    const s = new Scope(this.parent, this.kind);
    s.vars = new Map(this.vars);
    s.fns = new Map(this.fns);
    return s;
  }

  // Display names in scope: 'all', 'callable' (functions) or 'values' (everything else).
  allNames(filter = 'all') {
    const out = new Set();
    for (let s = this; s; s = s.parent) {
      for (const b of s.own()) {
        const fn = isCallable(b.value);
        if (filter === 'all' || (filter === 'callable') === fn) out.add(b.name);
      }
    }
    return [...out];
  }
}
