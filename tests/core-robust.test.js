// Random, often invalid scripts must never crash the compiler.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../src/core/index.js';
import { mulberry32 } from '../src/core/oracle.js';

const PIECES = [
  '~', '<~', '~(', ')', '(', '[', ']', '{', '}', '=', ':', ',', '|', '|>', '=>', '..', '..<', '...', '?.', '??', '!', '+', '-', '*', '/', '^', '%',
  '"', "'", '\\', '~x', '~(x)', '(x)~', 'x~', 'x', 'Seed', 'a b', '12', '1.5', '#ff8800', '#zzz', 'true', 'null', 'if', 'then', 'else', 'match',
  'for', 'in', 'by', 'fn', 'let', 'return', 'import', 'assert', 'type', 'renderer', 'enum', 'template', 'images', 'test', 'when', '_',
  'fal-ai/flux/schnell(', '60%', '≈', '☽', '◊', '👩‍🎨', '\n', '\n', '\n    ', '\n        ', ' ', ' ', ' ', '// c', '/*', '*/', '///',
];

function script(rng) {
  const n = 3 + Math.floor(rng() * 40);
  let out = '';
  for (let i = 0; i < n; i++) out += PIECES[Math.floor(rng() * PIECES.length)] + (rng() < 0.5 ? ' ' : '');
  return out;
}

test('fuzz: 4000 random scripts never throw or crash internally', () => {
  const rng = mulberry32(20240607);
  for (let i = 0; i < 4000; i++) {
    const src = script(rng);
    let r;
    try {
      r = compile(src, { maxVariants: 6 });
    } catch (err) {
      assert.fail(`compile threw for ${JSON.stringify(src)}: ${err.stack}`);
    }
    const internal = r.diagnostics.find((d) => /^Internal error/.test(d.message));
    assert.equal(internal, undefined, `internal error for ${JSON.stringify(src)}: ${internal?.message}`);
    assert.ok(r.variants.length >= 1);
  }
});
