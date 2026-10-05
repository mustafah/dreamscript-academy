import test from 'node:test';
import assert from 'node:assert/strict';
import { prompts, run } from './helpers.js';

test('a variation makes one dream per alternative, consistently', () => {
  assert.deepEqual(prompts('~ S = a | b | c\nThe ~S and ~S'), ['The a and a', 'The b and b', 'The c and c']);
});

test('several variations multiply; unused ones do not', () => {
  const r = run('~ A = x | y\n~ B = 1 | 2 | 3\n~ Unused = p | q\n~A~B');
  assert.equal(r.total, 6);
  assert.equal(r.exact, true);
  assert.deepEqual(r.variants.map((v) => v.prompt), ['x1', 'x2', 'x3', 'y1', 'y2', 'y3']);
});

test('plain-line and inline variations', () => {
  assert.deepEqual(prompts('sun | rain'), ['sun', 'rain']);
  assert.deepEqual(prompts('a (red | blue)~ door'), ['a red door', 'a blue door']);
  assert.deepEqual(prompts('~(a | b) and ~(c | d)'), ['a and c', 'a and d', 'b and c', 'b and d']);
});

test('weights set probabilities; open alternatives share the rest', () => {
  const r = run('60% a | 30% b | c');
  assert.deepEqual(r.variants.map((v) => v.prompt), ['a', 'b', 'c']);
  assert.deepEqual(r.variants.map((v) => Math.round(v.probability * 100)), [60, 30, 10]);
});

test('any, weighted and maybe build variations from data', () => {
  assert.deepEqual(prompts('~ xs = red, blue\n~any(xs)'), ['red', 'blue']);
  const w = run('~weighted(["a", "b"], [80, 20])');
  assert.deepEqual(w.variants.map((v) => Math.round(v.probability * 100)), [80, 20]);
  const m = run('a ~maybe("tall ", 0.25)hat');
  assert.deepEqual(m.variants.map((v) => v.prompt), ['a tall hat', 'a hat']);
  assert.deepEqual(m.variants.map((v) => Math.round(v.probability * 100)), [25, 75]);
});

test('<~ emits the chosen value and keeps it consistent', () => {
  assert.deepEqual(prompts('<~ M = calm | wild\nA ~M sea'), ['calm\nA calm sea', 'wild\nA wild sea']);
});

test('each call of a function that varies is an independent choice', () => {
  assert.equal(run('~ fn pick() = "a" | "b"\n~pick() ~pick()').total, 4);
});

test('enumeration is capped and the total is an estimate', () => {
  const src = Array.from({ length: 10 }, (_, i) => `~(a${i} | b${i})`).join(' ');
  const r = run(src, { maxVariants: 24 });
  assert.equal(r.variants.length, 24);
  assert.equal(r.exact, false);
  assert.equal(r.total, 1024);
});

test('sample mode picks one dream, deterministically for a seed', () => {
  const a = run('~(a | b | c | d | e | f)', { mode: 'sample', seed: 7 });
  const b = run('~(a | b | c | d | e | f)', { mode: 'sample', seed: 7 });
  assert.equal(a.variants.length, 1);
  assert.equal(a.variants[0].prompt, b.variants[0].prompt);
  assert.equal(a.total, 6);
});

test('variations record their picks for display', () => {
  const r = run('~ Style = oil | ink\nA ~Style painting');
  const pick = r.variants[1].picks[0];
  assert.equal(pick.label, 'Style');
  assert.deepEqual(pick.options, ['oil', 'ink']);
  assert.equal(pick.index, 1);
  const seg = r.variants[1].items[0].segs[1];
  assert.equal(seg.t, 'pick');
});
