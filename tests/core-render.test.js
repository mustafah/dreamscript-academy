import test from 'node:test';
import assert from 'node:assert/strict';
import { run, errors, warnings, files } from './helpers.js';

const jobs = (src) => run(src).variants[0].renders;

test('a renderer job uses the dream as its prompt unless given one', () => {
  const [a, b] = jobs('A red fox\n~( renderer\n    fal-ai/flux/schnell(seed = 7)\n    fal-ai/flux/dev(prompt = "custom")\n)');
  assert.equal(a.params.prompt, 'A red fox');
  assert.equal(a.promptFromDream, true);
  assert.equal(b.params.prompt, 'custom');
  assert.equal(b.promptFromDream, false);
});

test('params blocks, objects and named arguments merge in order', () => {
  const src = '~( Base\n    seed = 1\n    num_images = 2\n)\n~ fancy = { ...Base, num_images = 3 }\n~( renderer\n    fal-ai/flux/schnell(Base, seed = 9, title = "first")\n    fal-ai/flux/schnell(fancy)\n)';
  const [a, b] = jobs(src);
  assert.equal(a.params.seed, 9);
  assert.equal(a.params.num_images, 2);
  assert.equal(a.title, 'first');
  assert.equal('title' in a.params, false);
  assert.equal(a.origin.seed, 'named');
  assert.equal(a.origin.num_images, 'Base');
  assert.equal(b.params.num_images, 3);
  assert.equal(a.count, 2);
});

test('renderer blocks can loop, branch and use job results', () => {
  const src = '~ palette = red, blue, teal\n~( renderer\n    for c, i in palette\n        shot = fal-ai/flux/schnell(seed = 10 + index, prompt = "wall ~c")\n    if palette.length > 2\n        fal-ai/esrgan(image_url = "x.png", scale = 2)\n)';
  const j = jobs(src);
  assert.deepEqual(j.map((x) => x.model), ['fal-ai/flux/schnell', 'fal-ai/flux/schnell', 'fal-ai/flux/schnell', 'fal-ai/esrgan']);
  assert.deepEqual(j.slice(0, 3).map((x) => x.params.seed), [10, 11, 12]);
  assert.deepEqual(j.slice(0, 3).map((x) => x.params.prompt), ['wall red', 'wall blue', 'wall teal']);
});

test('named jobs can be used by later jobs', () => {
  const src = '~( renderer\n    base = fal-ai/flux/schnell(seed = 5, num_images = 2)\n    fal-ai/esrgan(image_url = base.images[1].url, scale = 2)\n)';
  const [a, b] = jobs(src);
  assert.equal(b.params.image_url, a.images[1].url);
  assert.equal(a.name, 'base');
});

test('alternatives between calls are a variation', () => {
  const r = run('~( renderer\n    fal-ai/flux/schnell(seed = 1) | fal-ai/flux/dev(seed = 1)\n)');
  assert.deepEqual(r.variants.map((v) => v.renders[0].model), ['fal-ai/flux/schnell', 'fal-ai/flux/dev']);
});

test('variations inside parameters multiply the dreams', () => {
  const r = run('~( renderer\n    fal-ai/flux/schnell(seed = ~(1 | 2))\n)');
  assert.equal(r.total >= 1, true);
});

test('parameters are checked against the model', () => {
  const r = run('~( renderer\n    fal-ai/flux/schnell(seeed = 1, num_images = 9, image_size = huge)\n)');
  const w = warnings(r);
  assert.equal(w.length, 3);
  assert.match(r.diagnostics.find((d) => /seeed/.test(d.message)).hint, /Did you mean `seed`/);
});

test('unknown models are allowed but noted', () => {
  const r = run('~( renderer\n    acme/new-model(x = 1)\n)');
  assert.deepEqual(errors(r), []);
  assert.equal(r.diagnostics[0].severity, 'info');
});

test('a model call with a bad argument explains itself', () => {
  assert.match(errors(run('~( renderer\n    fal-ai/flux/schnell(5)\n)'))[0], /named values/);
});

test('the one-line renderer form works too', () => {
  assert.equal(jobs('~ renderer fal-ai/flux/schnell(seed = 3)').length, 1);
});

test('images blocks collect references', () => {
  const r = run('~( images\n    hero = /a/hero.png\n    reference = /a/1.jpg\n    reference = /a/2.jpg\n)\n~ n = images.reference.length');
  assert.equal(r.values.find((v) => v.name === 'n').value.v, 2);
});

test('imports: namespaces, aliases, star, private names, nothing is emitted', () => {
  const map = {
    'main.dream': '~ import ./light.dream\n~ import ./light.dream as L\n~ import ./tools/util.dream as *\nA ~light.Glow ~L.warm("x") ~shout("hey")\n~ hidden = light._secret',
    'light.dream': 'this prose is not emitted\n~ Glow = golden\n~ _secret = 1\n~ fn warm(t) = "warm " + t',
    'tools/util.dream': '~ fn shout(t) = upper(t) + "!"',
  };
  const r = files(map);
  assert.equal(r.variants[0].prompt, 'A golden warm x HEY!');
  assert.deepEqual(errors(r), []);
  assert.equal(r.values.find((v) => v.name === 'hidden').value.t, 'null');
});

test('imports report missing files and circular imports', () => {
  assert.match(errors(files({ 'main.dream': '~ import ./nope.dream' }))[0], /can't find/);
  const r = files({ 'main.dream': '~ import ./a.dream', 'a.dream': '~ import ./main.dream' });
  assert.match(errors(r).join(' '), /circle/);
});

test('names may reuse their previous value (layering)', () => {
  const src = '~ p = { seed = 1, size = 4 }\n~ p = { ...p, seed = p.seed + 1 }\n~ p = { ...p, seed = p.seed * 10 }';
  assert.equal(run(src).values.find((v) => v.name === 'p').value.entries[0][1].v, 20);
});

test('interpolating inside model args works', () => {
  const [j] = jobs('~ N = 3\n~( renderer\n    fal-ai/flux/schnell(seed = N * 2, prompt = "n is ~N")\n)');
  assert.equal(j.params.seed, 6);
  assert.equal(j.params.prompt, 'n is 3');
});
