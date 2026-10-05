#!/usr/bin/env node
// DreamScript CLI: the same compiler the academy runs in the browser.
//   dream run   file.dream [--all] [--variant N] [--max N] [--seed N] [--json]
//   dream check file.dream
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '../src/core/index.js';

const USAGE = `Usage:
  dream run   <file.dream> [--all] [--variant N] [--max N] [--seed N] [--json]
  dream check <file.dream>

  run     compile and print the dream (the first one, or --variant N, or --all of them)
  check   print diagnostics and test results only; exit code 1 when something is wrong
  --seed  pick one random dream (reproducible) instead of enumerating them`;

// Virtual file keys are absolute POSIX paths without the leading slash, so `~ import ../x.dream` resolves naturally.
const toKey = (file) => path.resolve(file).split(path.sep).join('/').replace(/^\/+/, '');
const readKey = (key) => fs.readFileSync(`/${key}`, 'utf8');

function importsOf(key, text) {
  const dir = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
  const found = [];
  for (const m of text.matchAll(/^\s*~\s*import\s+(.+)$/gm)) {
    for (const item of m[1].split(',')) {
      const raw = item.trim().split(/\s+as\s+/i)[0].replace(/^"|"$/g, '');
      if (raw) found.push(path.posix.normalize(path.posix.join(dir, raw)));
    }
  }
  return found;
}

function collectFiles(mainKey) {
  const files = {};
  const queue = [mainKey];
  while (queue.length) {
    const key = queue.shift();
    if (key in files) continue;
    const real = [key, `${key}.dream`].find((k) => fs.existsSync(`/${k}`));
    if (!real) continue;
    files[real] = readKey(real);
    queue.push(...importsOf(real, files[real]));
  }
  return files;
}

function parseArgs(argv) {
  const opts = { flags: new Set(), values: {}, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (['--all', '--json'].includes(a)) opts.flags.add(a.slice(2));
    else if (['--variant', '--max', '--seed'].includes(a)) opts.values[a.slice(2)] = Number(argv[++i]);
    else opts.rest.push(a);
  }
  return opts;
}

const relative = (key) => path.relative(process.cwd(), `/${key}`) || key;
const show = (d) => `${relative(d.file)}:${d.line}:${d.col} ${d.severity}: ${d.message}${d.hint ? `\n    hint: ${d.hint}` : ''}`;

function printRun(result, opts) {
  const all = opts.flags.has('all');
  const chosen = all ? result.variants : [result.variants[Math.max(0, (opts.values.variant || 1) - 1)] || result.variants[0]];
  for (const v of chosen) {
    if (all || result.variants.length > 1) console.log(`── dream ${v.id} of ${result.total}${result.exact ? '' : ' (≈)'} ──`);
    console.log(v.prompt);
    for (const job of v.renders) {
      console.log(`\n▶ ${job.model}${job.title ? ` “${job.title}”` : ''} ${JSON.stringify({ ...job.params, prompt: undefined })}`);
    }
    console.log('');
  }
}

function main() {
  const [command, ...argv] = process.argv.slice(2);
  const opts = parseArgs(argv);
  const file = opts.rest[0];
  if (!['run', 'check'].includes(command) || !file) {
    console.error(USAGE);
    process.exit(command ? 2 : 0);
  }
  if (!fs.existsSync(file)) {
    console.error(`dream: cannot find ${file}`);
    process.exit(2);
  }
  const mainKey = toKey(file);
  const result = compile(
    { files: collectFiles(mainKey), main: mainKey },
    opts.values.seed !== undefined ? { mode: 'sample', seed: opts.values.seed } : { maxVariants: opts.values.max || 36 }
  );
  if (opts.flags.has('json')) {
    console.log(JSON.stringify({ ...result, ast: undefined }, null, 2));
  } else {
    if (command === 'run') printRun(result, opts);
    for (const t of result.tests) console.error(`${t.passed ? '✓' : '✗'} test “${t.name}”${t.failures.map((f) => `\n    ${f.message}`).join('')}`);
  }
  for (const d of result.diagnostics.filter((x) => x.severity !== 'info' || command === 'check')) console.error(show(d));
  const failed = result.diagnostics.some((d) => d.severity === 'error') || result.tests.some((t) => !t.passed);
  if (command === 'check' && !failed) console.error(`ok — ${result.total}${result.exact ? '' : '+'} dream(s), ${result.tests.length} test(s)`);
  process.exit(failed ? 1 : 0);
}

main();
