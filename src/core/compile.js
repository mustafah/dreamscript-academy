// Public entry point: compile(source | { files }, options) -> result
import { Diagnostics, DreamError } from './diag.js';
import { parseProgram } from './program.js';
import { buildPrelude, stdNames } from './stdlib/index.js';
import { Scope } from './scope.js';
import { Obj } from './values.js';
import { Ctx } from './runtime.js';
import { runModule } from './exec.js';
import { explore, SampleOracle } from './oracle.js';
import { describeType } from './types.js';

const baseName = (path) => path.split('/').pop().replace(/\.dream$/i, '');

function resolvePath(fromFile, path) {
  const dir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : '';
  const joined = path.startsWith('./') || path.startsWith('../') ? `${dir}/${path}` : path;
  const out = [];
  for (const part of joined.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') out.pop();
    else out.push(part);
  }
  return out.join('/');
}

function promptText(items) {
  const lines = [];
  for (const it of items) {
    if (it.kind === 'break') lines.push('');
    else if (it.ch === 'prompt') lines.push(it.text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// The prompt a renderer uses unless it is given one explicitly.
function fillPrompts(renders, prompt) {
  return renders.map((r) =>
    'prompt' in r.params
      ? r
      : { ...r, params: { prompt, ...r.params }, origin: { prompt: 'dream', ...r.origin }, promptFromDream: true }
  );
}

function makeLoader(files, parseModule, prelude) {
  const modules = new Map();
  const stack = [];
  return function loadModule(path, loc) {
    const ctx = this;
    const resolved = resolvePath(ctx.file, path);
    const key = [resolved, `${resolved}.dream`].find((k) => k in files);
    if (!key) {
      throw new DreamError(`I can't find "${path}".`, { loc, hint: `Files available: ${Object.keys(files).join(', ')}.` });
    }
    if (modules.has(key)) return modules.get(key);
    if (stack.includes(key)) {
      throw new DreamError(`"${path}" imports itself in a circle (${[...stack, key].join(' → ')}).`, { loc });
    }
    stack.push(key);
    const scope = new Scope(prelude, 'module');
    const saved = { file: ctx.file, out: ctx.out, forward: ctx.forward };
    ctx.file = key;
    ctx.out = [];
    try {
      runModule(parseModule(key), scope, ctx);
    } finally {
      Object.assign(ctx, saved);
      stack.pop();
    }
    const mod = new Obj('module', baseName(key));
    for (const b of scope.own()) if (!b.name.startsWith('_')) mod.set(b.name, b.value);
    modules.set(key, mod);
    return mod;
  };
}

function describeBindings(run) {
  const bindings = run.scope.own().sort((a, b) => (a.meta.line ?? 0) - (b.meta.line ?? 0));
  return bindings.map((b) => {
    const kind = b.meta.kind || 'var';
    return {
      name: b.name,
      kind,
      line: b.meta.line ?? null,
      doc: b.meta.doc ?? null,
      type: b.meta.type && kind !== 'type' ? describeType(b.meta.type) : null,
      detail: kind === 'type' ? describeType(b.meta.type) : run.ctx.preview(b.value),
      value: kind === 'type' ? { t: 'text', v: describeType(b.meta.type) } : run.ctx.describe(b.value),
    };
  });
}

/**
 * @param {string | {files: Record<string,string>, main?: string}} input
 * @param {{ maxVariants?: number, mode?: 'enumerate'|'sample', seed?: number }} options
 */
export function compile(input, options = {}) {
  const started = Date.now();
  const files = typeof input === 'string' ? { 'main.dream': input } : input.files;
  const main = (typeof input === 'object' && input.main) || Object.keys(files)[0] || 'main.dream';
  const diag = new Diagnostics();
  const std = stdNames();
  const prelude = buildPrelude();
  const parsed = new Map();
  const parseModule = (name) => {
    if (!parsed.has(name)) parsed.set(name, parseProgram(files[name], { file: name, diag, std }));
    return parsed.get(name);
  };
  const mainAst = parseModule(main);
  const loader = makeLoader(files, parseModule, prelude);

  const runOnce = (oracle) => {
    const ctx = new Ctx({ oracle, diag, loadModule: loader, file: main });
    const scope = new Scope(prelude, 'module');
    try {
      runModule(mainAst, scope, ctx);
    } catch (err) {
      if (err instanceof DreamError) ctx.report(err, null);
      else diag.add('error', `Internal error: ${err.message}`, { line: 1, col: 1 }, 'This is a bug in the playground, not in your script.', main);
    }
    const prompt = promptText(ctx.out);
    return { items: ctx.out, prompt, renders: fillPrompts(ctx.renders, prompt), tests: ctx.tests, notes: ctx.notes, scope, ctx, aborted: ctx.aborted };
  };

  let explored;
  if (options.mode === 'sample') {
    const oracle = new SampleOracle(options.seed ?? Date.now());
    const r = runOnce(oracle);
    const total = oracle.log.reduce((a, d) => a * (d.weights ? d.weights.filter((w) => w > 0).length : d.n), 1);
    explored = { variants: [{ ...r, decisions: oracle.log, probability: oracle.log.reduce((a, d) => a * d.p, 1) }], total, exact: false };
  } else {
    explored = explore(runOnce, { max: options.maxVariants ?? 36 });
  }

  const first = explored.variants[0];
  const variants = explored.variants.map((v, i) => ({
    id: i + 1,
    items: v.items,
    prompt: v.prompt,
    renders: v.renders,
    tests: v.tests,
    probability: v.probability,
    picks: v.decisions.map((d) => ({ label: d.label, line: d.line, file: d.file, options: d.options, index: d.index, n: d.n, p: d.p })),
  }));
  const bindings = describeBindings(first);
  return {
    ok: !diag.list.some((d) => d.severity === 'error'),
    variants,
    total: explored.total,
    exact: explored.exact,
    diagnostics: diag.list,
    values: bindings,
    notes: [...first.notes].map(([k, text]) => {
      const cut = k.lastIndexOf(':');
      return { file: k.slice(0, cut), line: Number(k.slice(cut + 1)), text };
    }),
    tests: first.tests,
    ast: Object.fromEntries([...parsed].map(([name, p]) => [name, p.body])),
    main,
    stats: { ms: Date.now() - started, variants: variants.length, steps: first.ctx.steps },
  };
}
