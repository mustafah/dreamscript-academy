// Statement executor: runs parsed statements, collecting prose and renders.
import { DreamError } from './diag.js';
import { norm } from './names.js';
import { Scope } from './scope.js';
import { Obj, Fn, Template, Choice, Fragment, truthy } from './values.js';
import { evalNode, renderParts, iterate, bindLoop } from './interp.js';
import { execJob } from './render.js';
import { checkType } from './types.js';
import { describeKind } from './ops.js';

export class ReturnSignal {
  constructor(value) {
    this.value = value;
  }
}

const S = {};
const MAX_LOOP = 2000;

export function execStmt(st, scope, ctx) {
  ctx.step();
  const h = S[st.t];
  if (!h) throw new DreamError(`I can't run a "${st.t}" statement here.`);
  return h(st, scope, ctx);
}

// Statement lists report errors and keep going (one bad line never hides the rest).
export function execSeq(stmts, scope, ctx) {
  for (const st of stmts) {
    try {
      execStmt(st, scope, ctx);
    } catch (err) {
      if (!(err instanceof DreamError)) throw err;
      ctx.report(err, st);
      if (st.t === 'decl' || st.t === 'struct') ctx.failed.add(norm(st.name));
    }
  }
}

// Function bodies stop at the first error and produce the last value.
function execCodeSeq(stmts, scope, ctx) {
  let last;
  for (const st of stmts) last = execStmt(st, scope, ctx);
  return last;
}

export function runBlock(stmts, scope, ctx) {
  try {
    return execCodeSeq(stmts, scope, ctx);
  } catch (e) {
    if (e instanceof ReturnSignal) return e.value;
    throw e;
  }
}

export function runTemplate(tpl, scope, ctx) {
  const saved = ctx.out;
  ctx.out = [];
  try {
    execSeq(tpl.body, scope, ctx);
    return new Fragment(ctx.out);
  } finally {
    ctx.out = saved;
  }
}

export function runModule(ast, scope, ctx) {
  const prev = ctx.forward;
  ctx.forward = new Map();
  for (const st of ast.body) {
    if (['decl', 'struct', 'enum', 'import'].includes(st.t) && st.name) ctx.forward.set(norm(st.name), st.line);
    if (st.t === 'fn' || st.t === 'template') S[st.t](st, scope, ctx);
  }
  execSeq(ast.body, scope, ctx);
  ctx.forward = prev;
}

// ---- output ----------------------------------------------------------------
// Tidy spacing: squeeze runs of spaces in plain text and trim the line's ends.
function tidy(segs) {
  const out = segs.map((s) => (s.t === 'text' ? { ...s, s: s.s.replace(/[ \t]+/g, ' ') } : s));
  if (out.length && out[0].t === 'text') out[0] = { ...out[0], s: out[0].s.trimStart() };
  const last = out.length - 1;
  if (last >= 0 && out[last].t === 'text') out[last] = { ...out[last], s: out[last].s.trimEnd() };
  return out.filter((s) => s.t !== 'text' || s.s !== '');
}

export function emitLine(ctx, ch, rawSegs, line, extra = {}) {
  const segs = tidy(rawSegs);
  const text = segs.map((s) => s.s).join('');
  if (text.trim() === '' && ch === 'prompt') return;
  ctx.out.push({ kind: 'line', ch, segs, text, line, file: ctx.file, ...extra });
}

function emitValue(v, st, ctx, src) {
  const f = ctx.force(v);
  if (f instanceof Fragment) ctx.out.push(...f.items);
  else emitLine(ctx, 'prompt', [ctx.display(v, src)], st.line);
}

S.break = (st, scope, ctx) => {
  const o = ctx.out;
  if (o.length && o[o.length - 1].kind !== 'break') o.push({ kind: 'break' });
};

S.prose = (st, scope, ctx) => {
  if (st.alts.length === 1) return emitLine(ctx, 'prompt', renderParts(st.alts[0].parts, scope, ctx), st.line);
  const choice = new Choice(st.alts.map((a) => ({ w: a.w, src: a.src, get: () => a })), null, st.loc);
  const alt = ctx.force(choice);
  const inner = renderParts(alt.parts, scope, ctx);
  const s = inner.map((x) => x.s).join('');
  return emitLine(ctx, 'prompt', [{ t: 'pick', s, inner, alts: st.alts.map((a) => a.src), idx: choice.index }], st.line);
};

S.channel = (st, scope, ctx) =>
  emitLine(ctx, st.ch, renderParts(st.tpl.parts, scope, ctx), st.line, { symbol: st.symbol });

S.emit = (st, scope, ctx) => emitValue(evalNode(st.e, scope, ctx), st, ctx, '');

S.expr = (st, scope, ctx) => ctx.force(evalNode(st.e, scope, ctx));

// ---- names ----------------------------------------------------------------
function checkDeclared(st, value, scope, ctx) {
  const run = (v) => {
    const problem = checkType(st.type, v, ctx.typeEnv(scope));
    if (problem) ctx.diag.add('error', `\`${st.name}\` has the wrong type: ${problem}.`, st.loc, 'Change the value, or the type after the colon.', ctx.file);
  };
  if (value instanceof Choice) value.check = run;
  else run(value);
}

function declare(st, scope, ctx) {
  const prev = ctx.declaring;
  ctx.declaring = norm(st.name);
  let value;
  try {
    value = evalNode(st.value, scope, ctx);
  } finally {
    ctx.declaring = prev;
  }
  if (value instanceof Choice && !value.label) value.label = st.name;
  if (st.type) checkDeclared(st, value, scope, ctx);
  scope.define(st.name, value, { line: st.line, doc: st.doc, file: ctx.file, type: st.type, kind: 'var' });
  ctx.note(st.line, value);
  return value;
}

S.decl = (st, scope, ctx) => {
  const value = declare(st, scope, ctx);
  if (st.emit) emitValue(value, st, ctx, st.name);
};

S.let = (st, scope, ctx) => {
  declare(st, scope, ctx);
};

export function buildStruct(entries, scope, ctx) {
  const obj = new Obj('object');
  const inner = new Scope(scope);
  for (const e of entries) {
    try {
      if (e.spread) {
        const v = ctx.force(evalNode(e.spread, inner, ctx));
        if (v instanceof Obj) for (const [k, x] of v.entries()) obj.set(k, x);
        else if (v !== null) throw new DreamError(`I can only spread an object here, not ${describeKind(v)}.`, { loc: e.spread.loc });
        continue;
      }
      const v = e.entries ? buildStruct(e.entries, inner, ctx) : evalNode(e.value, inner, ctx);
      obj.set(e.key, v);
      inner.define(e.key, v);
    } catch (err) {
      if (!(err instanceof DreamError)) throw err;
      ctx.report(err, e);
    }
  }
  return obj;
}

S.struct = (st, scope, ctx) => {
  const obj = buildStruct(st.entries, scope, ctx);
  obj.name = st.name;
  if (st.params) obj.kind = 'params';
  scope.define(st.name, obj, { line: st.line, doc: st.doc, file: ctx.file, kind: st.params ? 'params' : 'var' });
  ctx.note(st.line, obj);
};

S.images = (st, scope, ctx) => {
  const o = new Obj('object', 'images');
  for (const e of st.entries) {
    if (!e.value) continue;
    const v = evalNode(e.value, scope, ctx);
    if (!o.has(e.key)) o.set(e.key, v);
    else {
      const cur = o.get(e.key);
      o.set(e.key, Array.isArray(cur) ? [...cur, v] : [cur, v]);
    }
  }
  scope.define('images', o, { line: st.line, file: ctx.file, kind: 'images' });
};

S.enum = (st, scope, ctx) => {
  const o = new Obj('enum', st.name);
  o.docs = new Map();
  for (const m of st.members) {
    if (o.has(m.name)) ctx.warn(`\`${m.name}\` appears twice in \`${st.name}\`.`, st.loc);
    o.set(m.name, m.value ? ctx.force(evalNode(m.value, scope, ctx)) : m.name);
    if (m.doc) o.docs.set(m.name, m.doc);
  }
  scope.define(st.name, o, { line: st.line, doc: st.doc, file: ctx.file, kind: 'enum' });
};

S.type = (st, scope, ctx) => {
  scope.define(st.name, null, { line: st.line, file: ctx.file, kind: 'type', type: st.type });
};

S.fn = (st, scope, ctx) => {
  const fn = new Fn({ name: st.name, params: st.params, body: st.body, scope, ret: st.ret, doc: st.doc, line: st.line });
  scope.define(st.name, fn, { line: st.line, doc: st.doc, file: ctx.file, kind: 'fn' });
};

S.template = (st, scope, ctx) => {
  const t = new Template({ name: st.name, params: st.params, body: st.body, scope, doc: st.doc, line: st.line });
  scope.define(st.name, t, { line: st.line, doc: st.doc, file: ctx.file, kind: 'template' });
};

const baseName = (path) => path.split('/').pop().replace(/\.dream$/i, '');

S.import = (st, scope, ctx) => {
  for (const item of st.items) {
    try {
      const mod = ctx.loadModule(item.path, item.loc);
      const alias = item.alias || baseName(item.path);
      if (alias === '*') for (const [k, v] of mod.entries()) scope.define(k, v, { kind: 'imported', file: ctx.file });
      else scope.define(alias, mod, { line: st.line, file: ctx.file, kind: 'module' });
    } catch (err) {
      if (!(err instanceof DreamError)) throw err;
      ctx.report(err, { loc: item.loc });
      ctx.failed.add(norm(item.alias || baseName(item.path)));
    }
  }
};

// ---- control flow -----------------------------------------------------------
S.for = (st, scope, ctx) => {
  let counter = 0;
  const walk = (gi, sc) => {
    if (gi === st.gens.length) return execSeq(st.body, sc, ctx);
    const g = st.gens[gi];
    for (const vals of iterate(ctx.force(evalNode(g.iter, sc, ctx)), g.binders.length, g.iter)) {
      if (counter > MAX_LOOP) throw new DreamError(`That loop would run more than ${MAX_LOOP} times.`, { loc: st.loc });
      const inner = new Scope(sc);
      bindLoop(inner, g.binders, vals, counter);
      if (g.cond && !truthy(ctx.force(evalNode(g.cond, inner, ctx)))) continue;
      walk(gi + 1, inner);
      if (gi === st.gens.length - 1) counter++;
    }
    return undefined;
  };
  walk(0, scope);
};

const runBody = (st, body, scope, ctx) => {
  const inner = new Scope(scope);
  return st.mode === 'code' ? execCodeSeq(body, inner, ctx) : execSeq(body, inner, ctx);
};

S.if = (st, scope, ctx) => {
  for (const b of st.branches) {
    if (truthy(ctx.force(evalNode(b.cond, scope, ctx)))) return runBody(st, b.body, scope, ctx);
  }
  return st.else ? runBody(st, st.else, scope, ctx) : undefined;
};

S.return = (st, scope, ctx) => {
  throw new ReturnSignal(st.e ? evalNode(st.e, scope, ctx) : null);
};

// ---- checks ------------------------------------------------------------------
S.assert = (st, scope, ctx) => {
  const ok = truthy(ctx.force(evalNode(st.e, scope, ctx)));
  if (ok) return;
  const message = st.msg ? ctx.toText(evalNode(st.msg, scope, ctx)) : `Expected ${st.text}`;
  if (ctx.currentTest) {
    ctx.currentTest.passed = false;
    ctx.currentTest.failures.push({ message, line: st.line });
  } else {
    ctx.diag.add('error', `Assertion failed: ${message}`, st.loc, 'The condition after `assert` was false.', ctx.file);
  }
};

S.test = (st, scope, ctx) => {
  const t = { name: st.name, line: st.line, file: ctx.file, passed: true, failures: [] };
  const saved = { out: ctx.out, test: ctx.currentTest };
  ctx.out = [];
  ctx.currentTest = t;
  try {
    execSeq(st.body, new Scope(scope), ctx);
  } catch (err) {
    if (!(err instanceof DreamError)) throw err;
    t.passed = false;
    t.failures.push({ message: err.message, line: st.line });
  } finally {
    ctx.out = saved.out;
    ctx.currentTest = saved.test;
  }
  ctx.tests.push(t);
};

// ---- rendering ---------------------------------------------------------------
S.renderer = (st, scope, ctx) => execSeq(st.body, new Scope(scope), ctx);
S.job = (st, scope, ctx) => execJob(st, scope, ctx);
