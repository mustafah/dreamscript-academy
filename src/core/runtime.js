// The runtime context: one per run. Forces variations, formats values,
// calls functions and collects diagnostics.
import { DreamError } from './diag.js';
import { norm } from './names.js';
import { Scope } from './scope.js';
import { Color } from './color.js';
import { Obj, Fn, Native, Template, Choice, Fragment, kindOf, formatNumber, isCallable } from './values.js';
import { evalNode } from './interp.js';
import { runBlock, runTemplate } from './exec.js';
import { checkType, describeType } from './types.js';
import { describeKind } from './ops.js';

const MAX_STEPS = 200000;
const MAX_DEPTH = 100;

// Weights: explicit percentages; open alternatives share whatever is left.
function altWeights(alts) {
  if (alts.every((a) => a.w == null)) return null;
  const explicit = alts.reduce((s, a) => s + (a.w ?? 0), 0);
  const open = alts.filter((a) => a.w == null).length;
  const share = open ? Math.max(0, 100 - explicit) / open : 0;
  const weights = alts.map((a) => a.w ?? share);
  return weights.some((w) => w > 0) ? weights : null;
}

export class Ctx {
  constructor({ oracle, diag, loadModule, file = 'main.dream' }) {
    this.oracle = oracle;
    this.diag = diag;
    this.file = file;
    this.loadModule = loadModule;
    this.out = [];
    this.renders = [];
    this.tests = [];
    this.notes = new Map();
    this.forward = new Map();
    this.failed = new Set();
    this.picks = null;
    this.declaring = null;
    this.currentTest = null;
    this.steps = 0;
    this.depth = 0;
    this.aborted = false;
  }

  // ---- diagnostics ------------------------------------------------------
  step() {
    if (++this.steps > MAX_STEPS) {
      this.aborted = true;
      throw new DreamError('This dream is taking too long to work out.', {
        hint: 'Look for a function that calls itself forever, or a loop that is far too big.',
      });
    }
  }

  warn(message, loc, hint) {
    this.diag.add('warning', message, loc, hint, this.file);
  }

  report(err, node) {
    this.diag.add(err.severity, err.message, err.loc || node?.loc, err.hint, this.file);
  }

  note(line, value) {
    this.notes.set(`${this.file}:${line}`, this.preview(value));
  }

  // ---- variations ---------------------------------------------------------
  force(v) {
    let x = v;
    while (x instanceof Choice) {
      if (!x.done) this.decide(x);
      x = x.value;
    }
    return x;
  }

  decide(ch) {
    const weights = altWeights(ch.alts);
    const idx = this.oracle.choose(ch.alts.length, weights, {
      label: ch.label,
      line: ch.loc?.line ?? null,
      file: this.file,
      options: ch.alts.map((a) => a.src),
    });
    ch.index = idx;
    ch.done = true;
    ch.value = ch.alts[idx].get();
    if (this.picks) this.picks.push({ label: ch.label, alts: ch.alts.map((a) => a.src), idx });
    if (ch.check) ch.check(this.force(ch.value));
  }

  // ---- values -> text -------------------------------------------------------
  toText(v) {
    const x = this.force(v);
    switch (kindOf(x)) {
      case 'null': return '';
      case 'text': return x;
      case 'number': return formatNumber(x);
      case 'bool': return String(x);
      case 'color': return x.name;
      case 'list': return x.map((i) => this.toText(i)).filter((s) => s !== '').join(', ');
      case 'fragment': return x.items.filter((i) => i.kind === 'line' && i.ch === 'prompt').map((i) => i.text).join(' ');
      case 'function': return `ƒ ${x.name}`;
      default: return this.objectText(x);
    }
  }

  // Objects read naturally in prose: "kind: girl, outfit: (top: linen)".
  objectText(o) {
    const parts = o.entries().map(([k, x]) => {
      const t = this.toText(x);
      return `${k}: ${this.force(x) instanceof Obj ? `(${t})` : t}`;
    });
    return parts.join(', ');
  }

  // A display segment for prose: text plus enough detail for chips and swatches.
  display(v, src) {
    const saved = this.picks;
    this.picks = [];
    const s = this.toText(v);
    const picks = this.picks;
    this.picks = saved;
    if (saved) saved.push(...picks);
    const f = this.force(v);
    const seg = { t: picks.length ? 'pick' : 'val', s, src, vt: kindOf(f) };
    if (f instanceof Color) seg.color = f.hex;
    else if (Array.isArray(f)) {
      const colors = f.map((x) => this.force(x)).filter((x) => x instanceof Color).map((x) => x.hex);
      if (colors.length) seg.colors = colors;
    }
    if (picks.length) seg.picks = picks;
    return seg;
  }

  toJS(v) {
    const x = this.force(v);
    if (Array.isArray(x)) return x.map((i) => this.toJS(i));
    if (x instanceof Color) return x.hex;
    if (x instanceof Obj) return Object.fromEntries(x.entries().map(([k, i]) => [k, this.toJS(i)]));
    if (x instanceof Fragment) return this.toText(x);
    if (isCallable(x)) return `ƒ ${x.name}`;
    return x === undefined ? null : x;
  }

  // Short, non-forcing description for inline hints.
  preview(v, depth = 0) {
    if (v instanceof Choice) return v.done ? this.preview(v.value, depth) : v.alts.map((a) => a.src).join(' | ');
    const clip = (s) => (s.length > 44 ? `${s.slice(0, 43)}…` : s);
    switch (kindOf(v)) {
      case 'null': return 'null';
      case 'text': return clip(JSON.stringify(v));
      case 'number': return formatNumber(v);
      case 'bool': return String(v);
      case 'color': return `${v.hex} (${v.name})`;
      case 'list': return depth > 1 ? '[…]' : clip(`[${v.slice(0, 6).map((x) => this.preview(x, depth + 1)).join(', ')}${v.length > 6 ? ', …' : ''}]`);
      case 'function': return `ƒ ${v.name}(${(v.params || []).map((p) => p.name).join(', ')})`;
      case 'fragment': return clip(`“${this.toText(v)}”`);
      default: {
        if (depth > 1) return '{…}';
        const parts = v.entries().slice(0, 4).map(([k, x]) => `${k}: ${this.preview(x, depth + 1)}`);
        return clip(`{ ${parts.join(', ')}${v.size > 4 ? ', …' : ''} }`);
      }
    }
  }

  // Structured description for the Values panel.
  describe(v, depth = 0) {
    if (v instanceof Choice) {
      return { t: 'choice', label: v.label, alts: v.alts.map((a) => a.src), done: v.done, index: v.index, value: v.done ? this.describe(v.value, depth + 1) : null };
    }
    const k = kindOf(v);
    switch (k) {
      case 'null': return { t: 'null' };
      case 'bool':
      case 'number':
      case 'text': return { t: k, v };
      case 'color': return { t: 'color', hex: v.hex, name: v.name };
      case 'function': return { t: 'fn', sig: this.preview(v), doc: v.doc || v.sig || null };
      case 'fragment': return { t: 'text', v: this.toText(v) };
      case 'list': return { t: 'list', n: v.length, items: depth > 5 ? [] : v.slice(0, 60).map((x) => this.describe(x, depth + 1)) };
      default:
        return {
          t: 'obj', kind: v.kind, name: v.name, n: v.size,
          entries: depth > 5 ? [] : v.entries().map(([key, x]) => [key, this.describe(x, depth + 1), v.docs?.get(key) || null]),
        };
    }
  }

  // ---- types ---------------------------------------------------------------------
  typeEnv(scope) {
    return {
      force: (v) => this.force(v),
      lookupType: (name) => {
        const b = scope.lookup(name);
        if (!b) return null;
        if (b.meta.kind === 'type') return { alias: b.meta.type };
        if (b.value instanceof Obj && b.value.kind === 'enum') {
          return { values: b.value.values().map((x) => this.force(x)), names: b.value.keys() };
        }
        return null;
      },
    };
  }

  // ---- calling --------------------------------------------------------------------
  call(fn, args, named = {}, node = null) {
    this.step();
    if (fn instanceof Native) {
      const a = fn.lazy ? args : args.map((x) => this.force(x));
      try {
        return fn.impl(a, this, named, node);
      } catch (err) {
        if (err instanceof DreamError && !err.loc) err.loc = node?.loc;
        throw err;
      }
    }
    if (!(fn instanceof Fn || fn instanceof Template)) {
      throw new DreamError(`I can't call ${describeKind(fn)} like a function.`, { loc: node?.loc });
    }
    if (++this.depth > MAX_DEPTH) {
      this.depth--;
      throw new DreamError(`\`${fn.name}\` called itself too many times.`, { loc: node?.loc, hint: 'Give the function a way to stop (an `if` that returns without calling itself).' });
    }
    try {
      const scope = new Scope(fn.scope, 'call');
      this.bindParams(fn, scope, args, named, node);
      if (fn instanceof Template) return runTemplate(fn, scope, this);
      const result = fn.body.expr ? evalNode(fn.body.expr, scope, this) : runBlock(fn.body.stmts, scope, this);
      if (fn.ret) this.checkValue(fn.ret, result, scope, `\`${fn.name}\` gave back`, node);
      return result;
    } finally {
      this.depth--;
    }
  }

  checkValue(type, value, scope, prefix, node) {
    const problem = checkType(type, value, this.typeEnv(scope));
    if (problem) this.warn(`${prefix} the wrong type: ${problem}.`, node?.loc, `Expected ${describeType(type)}.`);
  }

  bindParams(fn, scope, args, named, node) {
    const { params } = fn;
    const extra = Object.keys(named).filter((k) => !params.some((p) => norm(p.name) === norm(k)));
    if (extra.length && !fn.lenient) {
      throw new DreamError(`\`${fn.name}\` has no parameter called \`${extra[0]}\`.`, { loc: node?.loc, hint: `Its parameters: ${params.map((p) => p.name).join(', ') || '(none)'}.` });
    }
    if (args.length > params.length && !fn.lenient) {
      throw new DreamError(`\`${fn.name}\` takes ${params.length} value${params.length === 1 ? '' : 's'}, but got ${args.length}.`, { loc: node?.loc });
    }
    params.forEach((p, i) => {
      const key = Object.keys(named).find((k) => norm(k) === norm(p.name));
      let v;
      if (i < args.length) v = args[i];
      else if (key !== undefined) v = named[key];
      else if (p.def) v = evalNode(p.def, scope, this);
      else throw new DreamError(`\`${fn.name}\` needs a value for \`${p.name}\`.`, { loc: node?.loc, hint: `Call it like ${fn.name}(${params.map((q) => q.name).join(', ')}).` });
      if (p.type) this.checkValue(p.type, v, fn.scope, `\`${p.name}\` of \`${fn.name}\` has`, node);
      scope.define(p.name, v, { kind: 'param' });
    });
  }
}
