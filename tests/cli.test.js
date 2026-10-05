import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cli = path.resolve('bin/dream.js');
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
const temp = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dream-cli-'));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
};

test('run prints the dream and follows imports', () => {
  const dir = temp({ 'main.dream': '~ import ./lib.dream\nA ~lib.Glow sky | B ~lib.Glow sea', 'lib.dream': '~ Glow = amber' });
  const one = run('run', path.join(dir, 'main.dream'));
  assert.equal(one.status, 0);
  assert.match(one.stdout, /A amber sky/);
  const all = run('run', path.join(dir, 'main.dream'), '--all');
  assert.match(all.stdout, /B amber sea/);
});

test('check reports diagnostics with a non-zero exit code', () => {
  const dir = temp({ 'bad.dream': '~ x = nosuchfn(1)\n' });
  const r = run('check', path.join(dir, 'bad.dream'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /bad\.dream:1:\d+ error: I don't know a function/);
});

test('check succeeds on a clean file and counts tests', () => {
  const dir = temp({ 'ok.dream': '~ a = 1\n~( test "t"\n    ~ assert a == 1\n)\nfine' });
  const r = run('check', path.join(dir, 'ok.dream'));
  assert.equal(r.status, 0);
  assert.match(r.stderr, /ok — 1 dream\(s\), 1 test\(s\)/);
});

test('--json emits the structured result', () => {
  const dir = temp({ 'j.dream': 'hello' });
  const r = run('run', path.join(dir, 'j.dream'), '--json');
  assert.equal(JSON.parse(r.stdout).variants[0].prompt, 'hello');
});

test('usage is printed for unknown commands', () => {
  const r = run('nope');
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Usage/);
});
