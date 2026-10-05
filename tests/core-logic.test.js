import test from 'node:test';
import assert from 'node:assert/strict';
import { prompt, value, run, errors, warnings } from './helpers.js';

test('functions: expression bodies, defaults, named arguments, recursion', () => {
  const src = '~ fn area(w, h = 2) = w * h\n~ fn fact(n) = if n <= 1 then 1 else n * fact(n - 1)\n~ a = area(3)\n~ b = area(3, h = 5)\n~ c = area(h = 4, w = 2)\n~ d = fact(6)';
  assert.deepEqual(['a', 'b', 'c', 'd'].map((n) => value(src, n)), [6, 15, 8, 720]);
});

test('block functions: let, return, if/else and closures', () => {
  const src = '~ fn label(n):\n    let big = n > 10\n    if big:\n        return "big"\n    return "small"\n~ fn adder(k) = x => x + k\n~ add5 = adder(5)\n~ r = add5(1)\n~ s = label(3) + label(30)';
  assert.equal(value(src, 'r'), 6);
  assert.equal(value(src, 's'), 'smallbig');
});

test('functions coexist with variables of the same name', () => {
  assert.equal(value('~ Count = 4\n~ n = count([1, 2, 3])', 'n'), 3);
  assert.equal(value('~ double = 2\n~ fn double(x) = x * 2\n~ v = double(21)', 'v'), 42);
});

test('lambdas, higher-order helpers and pipelines', () => {
  const src = '~ xs = 1, 2, 3, 4\n~ a = xs |> map(x => x * 10) |> filter(x => x > 15) |> sum\n~ b = xs.map(x => x + 1).join("-")\n~ c = reduce(xs, (t, x) => t + x, 0)\n~ d = sort([3, 1, 2]) |> reverse\n~ e = xs |> count(x => x % 2 == 0)';
  assert.equal(value(src, 'a'), 90);
  assert.equal(value(src, 'b'), '2-3-4-5');
  assert.equal(value(src, 'c'), 10);
  assert.deepEqual(value(src, 'd'), [3, 2, 1]);
  assert.equal(value(src, 'e'), 2);
});

test('method-call syntax works on any value', () => {
  assert.equal(value('~ s = "dream"\n~ t = s.upper().repeat(2)', 't'), 'DREAMDREAM');
  assert.equal(value('~ c = red.mix(blue).hex', 'c'), '#800080');
});

test('if/then/else is an expression', () => {
  assert.equal(value('~ n = 3\n~ s = if n > 2 then "big" else "small"', 's'), 'big');
  assert.equal(value('~ n = 0\n~ s = if n > 2 then "big" else if n > 0 then "mid" else "none"', 's'), 'none');
});

test('match: literals, alternatives, ranges, guards, catch-all, both layouts', () => {
  const block = (n) => `~ n = ${n}\n~ label = match n\n    1 | 2 => "few"\n    3..9 => "some"\n    _ when it > 100 => "lots"\n    _ => "many"`;
  assert.deepEqual([1, 5, 500, 50].map((n) => value(block(n), 'label')), ['few', 'some', 'lots', 'many']);
  assert.equal(value('~ m = "dreamy"\n~ l = match m { dreamy => 85, gritty => 24, _ => 50 }', 'l'), 85);
});

test('a match with no fitting arm warns', () => {
  const r = run('~ x = match 5 { 1 => "a" }');
  assert.match(warnings(r)[0], /No arm/);
});

test('for and if statements generate prose', () => {
  const src = '~ colors = red, blue\n~ for c, i in colors:\n    Wall ~i is ~c.\n~ if colors.length > 5:\n    many\n~ else if colors.length > 1:\n    some\n~ else:\n    few';
  assert.equal(prompt(src), 'Wall 0 is red.\nWall 1 is blue.\nsome');
});

test('nested for loops and filters', () => {
  const src = '~ for a in 1..2, b in 1..2 if a != b:\n    ~a~b';
  assert.equal(prompt(src), '12\n21');
});

test('templates are reusable chunks of prose', () => {
  const src = '~( template scene(place, hour = "dusk")\n    A quiet ~place at ~hour.\n)\n<~ scene("harbor")\n<~ scene("market", hour = "noon")\nNote: ~scene("pier")';
  assert.equal(prompt(src), 'A quiet harbor at dusk.\nA quiet market at noon.\nNote: A quiet pier at dusk.');
});

test('types: annotations, enums, ranges, lists, nullable, shapes, aliases', () => {
  const bad = (src) => errors(run(src)).length;
  assert.equal(bad('~ a: int = 5\n~ b: text = "x"\n~ c: bool = true\n~ d: color = #fff\n~ e: int[] = [1, 2]\n~ f: text? = null\n~ g: int in 1..8 = 8'), 0);
  assert.equal(bad('~ a: int = "5"'), 1);
  assert.equal(bad('~ g: int in 1..8 = 9'), 1);
  assert.equal(bad('~ e: int[] = [1, "x"]'), 1);
  assert.equal(bad('~( enum E\n    A = "a"\n)\n~ v: E = "a"\n~ w: E = "z"'), 1);
  assert.equal(bad('~ type Size = int in 1..3\n~ s: Size = 2\n~ t: Size = 7'), 1);
  assert.equal(bad('~ o: { seed: int, tag?: text } = { seed = 1 }\n~ p: { seed: int } = { seed = "x" }'), 1);
});

test('function parameter and return types are checked', () => {
  const r = run('~ fn twice(n: int): int = n * 2\n~ a = twice("x")');
  assert.ok(warnings(r).length + errors(r).length >= 1);
});

test('assert and test blocks', () => {
  const r = run('~ Seed = 4\n~( test "good"\n    ~ assert Seed == 4\n)\n~( test "bad"\n    ~ assert Seed == 5, "five!"\n)\n~ assert Seed > 100, "too small"');
  assert.deepEqual(r.tests.map((t) => [t.name, t.passed]), [['good', true], ['bad', false]]);
  assert.equal(r.tests[1].failures[0].message, 'five!');
  assert.match(errors(r)[0], /too small/);
});

test('runaway recursion is stopped with a message', () => {
  const r = run('~ fn f(n) = f(n + 1)\n~ x = f(1)');
  assert.match(errors(r)[0], /too many times|too long/);
});

test('one bad line does not hide the rest', () => {
  const r = run('first\n~ x = nosuchfn(1)\nsecond');
  assert.equal(r.variants[0].prompt, 'first\nsecond');
  assert.equal(errors(r).length, 1);
});

test('syntax errors are reported with a position', () => {
  const r = run('~ fn broken(\nfine');
  assert.ok(r.diagnostics.length >= 1);
  assert.equal(r.variants[0].prompt.includes('fine'), true);
});
