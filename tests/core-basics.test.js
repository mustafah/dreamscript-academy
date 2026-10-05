import test from 'node:test';
import assert from 'node:assert/strict';
import { prompt, value, run, errors, warnings } from './helpers.js';

test('plain prose passes through; comments are removed', () => {
  assert.equal(prompt('A quiet lake\n// hidden\nsecond line /* inline */ here\n/* multi\nline */ third'), 'A quiet lake\nsecond line here\nthird');
});

test('blank lines become paragraph breaks (collapsed)', () => {
  assert.equal(prompt('one\n\n\n\ntwo'), 'one\n\ntwo');
});

test('names: loose values are typed automatically', () => {
  const src = '~ Title = Ethereal Field Walk\n~ Seed = 555\n~ Aperture = 1.8\n~ Night = true\n~ Accent = #ff8800\n~ Empty =';
  assert.equal(value(src, 'Title'), 'Ethereal Field Walk');
  assert.equal(value(src, 'Seed'), 555);
  assert.equal(value(src, 'Aperture'), 1.8);
  assert.equal(value(src, 'Night'), true);
  assert.equal(value(src, 'Accent'), '#ff8800');
  assert.equal(value(src, 'Empty'), null);
});

test('names ignore case, spaces and underscores', () => {
  assert.equal(prompt('~ Images Number = 4\n~(images_number) ~IMAGESNUMBER ~(Images Number)'), '4 4 4');
  assert.equal(prompt('~ Seed = 7\n~seed ~SEED'), '7 7');
});

test('interpolation forms', () => {
  assert.equal(prompt('~ T = hello\n~T~, ~T~. (T)~s T~s ~(T)!'), 'hello, hello. hellos hellos hello!');
  assert.equal(prompt('~ a = 2\nsum ~(a + 3) and ~a.'), 'sum 5 and 2.');
  assert.equal(prompt('price \\~5 and ~~'), 'price ~5 and ~~');
  assert.equal(prompt('(golden hour)~ light'), 'golden hour light');
});

test('<~ defines and emits', () => {
  const r = run('<~ Mood = calm\nA ~Mood sea');
  assert.equal(r.variants[0].prompt, 'calm\nA calm sea');
});

test('an unknown ~name warns and keeps the text', () => {
  const r = run('~ Subject = owl\nA ~Subjct here');
  assert.equal(r.variants[0].prompt, 'A ~Subjct here');
  assert.match(warnings(r)[0], /isn't defined/);
  assert.match(r.diagnostics[0].hint, /Did you mean `Subject`/);
});

test('math: precedence, symbols and text joining', () => {
  const src = [
    '~ a = 2 + 3 * 4', '~ b = (2 + 3) * 4', '~ c = 2 ^ 3 ^ 2', '~ d = -2 ^ 2', '~ e = 7 % 3', '~ f = 5 !',
    '~ g = 16 / 4 × 2', '~ h = 10 / 4', '~ i = "a" + "b" + 1', '~ j = 3 > 2 and not (1 == 2)', '~ k = 6 ÷ 3',
  ].join('\n');
  const out = Object.fromEntries('abcdefghijk'.split('').map((n) => [n, value(src, n)]));
  assert.deepEqual(out, { a: 14, b: 20, c: 512, d: -4, e: 1, f: 120, g: 8, h: 2.5, i: 'ab1', j: true, k: 2 });
});

test('math errors are friendly', () => {
  const r = run('~ x = 1 / 0\n~ y = "a" - 1');
  assert.equal(errors(r).length, 2);
  assert.match(errors(r)[0], /divide by zero/);
});

test('unfinished expressions fall back to text with a warning', () => {
  const r = run('~ bad = 5 +');
  assert.match(warnings(r)[0], /couldn't read/);
});

test('a name can reuse its previous value, but not itself from nothing', () => {
  assert.equal(value('~ n = 1\n~ n = n + 1\n~ n = n * 10', 'n'), 20);
  assert.match(errors(run('~ n = n + 1'))[0], /refers to itself/);
});

test('typos in expressions suggest the closest name', () => {
  const r = run('~ Seed = 5\n~ x = Sead * 2');
  assert.match(r.diagnostics[0].hint, /Did you mean `Seed`/);
});
