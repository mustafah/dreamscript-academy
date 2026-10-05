import test from 'node:test';
import assert from 'node:assert/strict';
import { prompt, value, run, errors, warnings } from './helpers.js';

test('comma lists, indexing and length', () => {
  const src = '~ xs = 10, 20, 30\n~ first = xs[0]\n~ last = xs[-1]\n~ n = xs.length';
  assert.deepEqual(value(src, 'xs'), [10, 20, 30]);
  assert.equal(value(src, 'first'), 10);
  assert.equal(value(src, 'last'), 30);
  assert.equal(value(src, 'n'), 3);
  assert.equal(prompt('~ c = red, blue, teal\n~c'), 'red, blue, teal');
});

test('quoting keeps a comma inside one item', () => {
  assert.deepEqual(value('~ t = ai, "golden hour, late", sea', 't'), ['ai', 'golden hour, late', 'sea']);
});

test('list literals, ranges and concatenation', () => {
  assert.deepEqual(value('~ a = [1, 2] + [3]', 'a'), [1, 2, 3]);
  assert.deepEqual(value('~ r = 1..4', 'r'), [1, 2, 3, 4]);
  assert.deepEqual(value('~ r = 0..<3', 'r'), [0, 1, 2]);
  assert.deepEqual(value('~ r = 1..10 by 3', 'r'), [1, 4, 7, 10]);
  assert.deepEqual(value('~ r = 3..1', 'r'), [3, 2, 1]);
  assert.deepEqual(value('~ c = [n * n for n in 1..4 if n != 2]', 'c'), [1, 9, 16]);
});

test('indented structs (nested) and member access', () => {
  const src = '~ camera:\n    fov = 60\n    position = 0, 1.6, 3\n    lens:\n        focal = 50\n        aperture = 1.8\n\nf/~camera.lens.aperture at ~camera.lens.focal mm, x ~camera.position[1]';
  assert.equal(prompt(src), 'f/1.8 at 50 mm, x 1.6');
  assert.deepEqual(value(src, 'camera'), { fov: 60, position: [0, 1.6, 3], lens: { focal: 50, aperture: 1.8 } });
});

test('struct children can see earlier siblings and outer names', () => {
  const src = '~ Base = 10\n~ box:\n    w = Base\n    h = w * 2';
  assert.deepEqual(value(src, 'box'), { w: 10, h: 20 });
});

test('inline objects: multi-line, trailing commas, shorthand, spread, colon keys', () => {
  const src = '~ name = "Mira"\n~ p = {\n    name,\n    age = 24,\n    tags = ["a", "b"],\n    "full name" = "Mira K",\n    inner = { x: 1 },\n}\n~ q = { ...p, age = 30 }';
  assert.deepEqual(value(src, 'p'), { name: 'Mira', age: 24, tags: ['a', 'b'], 'full name': 'Mira K', inner: { x: 1 } });
  assert.equal(value(src, 'q').age, 30);
  assert.equal(value(src, 'q').name, 'Mira');
});

test('optional chaining and null coalescing', () => {
  const src = '~ o = { a = { b = 1 } }\n~ x = o?.a?.b\n~ y = o.c ?? "none"\n~ z = nothing ?? 5';
  assert.equal(value(src, 'x'), 1);
  assert.equal(value('~ o = { a = 1 }\n~ y = o?.c ?? "none"', 'y'), 'none');
});

test('looking up a missing key warns and gives null', () => {
  const r = run('~ o = { seed = 1 }\n~ v = o.sead');
  assert.equal(value('~ o = { seed = 1 }\n~ v = o.sead', 'v'), null);
  assert.match(warnings(r)[0], /no `sead`/);
  assert.match(r.diagnostics[0].hint, /Did you mean `seed`/);
});

test('enums: values, docs, qualified access and iteration', () => {
  const src = '~( enum Sizes\n    /// Wide picture.\n    Wide = "landscape_16_9"\n    Square = "square_hd"\n    Auto\n)\n~ w = Sizes.Wide\n~ all = [ s for s in Sizes ]\n~ n = [ k for k, v in Sizes ]';
  const r = run(src);
  assert.deepEqual(errors(r), []);
  const e = r.values.find((v) => v.name === 'Sizes');
  assert.equal(e.kind, 'enum');
  assert.equal(e.value.entries[0][2], 'Wide picture.');
  assert.equal(value(src, 'w'), 'landscape_16_9');
  assert.deepEqual(value(src, 'all'), ['landscape_16_9', 'square_hd', 'Auto']);
  assert.deepEqual(value(src, 'n'), ['Wide', 'Square', 'Auto']);
});

test('objects read naturally inside prose', () => {
  assert.equal(prompt('~ s = { kind = "girl", outfit = { top = "linen" } }\n~s'), 'kind: girl, outfit: (top: linen)');
});

test('colors print as names and expose parts', () => {
  assert.equal(prompt('~ c = #ff0000\n~c ~(c.hex) ~(c.name)'), 'red #ff0000 red');
});
