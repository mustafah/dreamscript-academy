import test from 'node:test';
import assert from 'node:assert/strict';
import { prompt, run, errors, warnings, files } from './helpers.js';

const hints = (r) => r.diagnostics.map((d) => d.hint || '').join(' | ');

test('optional access (?. and ??) never warns about a missing key', () => {
  const r = run('~ o = { a = 1 }\n~ x = o.b ?? 5\n~ y = o.c?.d ?? 6');
  assert.deepEqual(r.diagnostics, []);
});

test('bare color names are text, not typos', () => {
  assert.deepEqual(run('~ Cool = 1\n~ c = mix(teal, coral)').diagnostics, []);
});

test('typos among barewords suggest user names only', () => {
  assert.match(hints(run('~ Palette = 1\n~ x = Palete + 1')), /Did you mean `Palette`/);
  assert.equal(run('~ x = coral').diagnostics.length, 0);
});

test('a hyphen stays inside a word', () => {
  assert.match(hints(run('~ Seed = 5\n~ x = Seed-1')), /put spaces around the minus/i);
  assert.match(hints(run('~ Seed = 5\n~ x = (Seed-1) * 2')), /put spaces around the minus/i);
});

test('failed definitions do not cascade into more errors', () => {
  const r = run('~ a = 1 / 0\n~ b = a + 1\nValue ~a and ~b');
  assert.equal(errors(r).length, 1);
});

test('a failed import is reported once', () => {
  const r = files({ 'main.dream': '~ import ./nope.dream\nA ~nope.x and ~nope.y' });
  assert.equal(errors(r).length, 1);
});

test('using a name before its definition explains where it is defined', () => {
  assert.match(errors(run('~ a = b + 1\n~ b = 2'))[0], /used before it is defined \(line 2\)/);
});

test('a nearer name hiding an enum gets an explanation', () => {
  const r = run('~( enum Light\n    Dawn = "d"\n)\n~ fn f(light) = Light.Dawn\n~ v = f("x")');
  assert.match(hints(r), /hides/);
});

test('an unterminated bracket does not swallow the rest of the file', () => {
  const r = run('~ o = { a = 1,\nSecond line\nThird line');
  assert.equal(r.variants[0].prompt, 'Second line\nThird line');
  assert.ok(errors(r).length >= 1);
});

test('bodies end at the blank line after them', () => {
  assert.equal(prompt('~ for i in 1..2:\n    row ~i\n\nafter'), 'row 1\nrow 2\n\nafter');
});

test('diagnostics carry 1-based line and column positions', () => {
  const r = run('first\n~ x = nosuchfn(1)');
  const d = r.diagnostics[0];
  assert.equal(d.line, 2);
  assert.ok(d.col >= 5);
  assert.ok(d.endCol > d.col);
});

test('typo in a function name suggests the closest helper', () => {
  assert.match(hints(run('~ s = uper("x")')), /Did you mean `upper`/);
});

test('every diagnostic has a file and a severity', () => {
  const r = files({ 'main.dream': '~ import ./lib.dream\n~ z = lib.bad(', 'lib.dream': '~ x = 1 /' });
  for (const d of r.diagnostics) {
    assert.ok(['error', 'warning', 'info'].includes(d.severity));
    assert.ok(d.file);
  }
});
