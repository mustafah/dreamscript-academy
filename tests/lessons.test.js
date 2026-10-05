// Every lesson must compile cleanly, and its solution must satisfy all its tasks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from '../src/core/index.js';
import { LESSONS } from '../src/lessons/index.js';

const run = (files) => compile({ files, main: Object.keys(files)[0] });
const errors = (r) => r.diagnostics.filter((d) => d.severity === 'error');

for (const lesson of LESSONS) {
  test(`lesson ${lesson.number} “${lesson.id}”: starter compiles without errors`, () => {
    const r = run(lesson.files);
    assert.deepEqual(errors(r).map((d) => `${d.file}:${d.line} ${d.message}`), lesson.expectErrors || []);
  });

  test(`lesson ${lesson.number} “${lesson.id}”: solution passes every task`, () => {
    const files = lesson.solution;
    const r = run(files);
    assert.deepEqual(errors(r).map((d) => `${d.file}:${d.line} ${d.message}`), lesson.solutionErrors || []);
    for (const task of lesson.tasks) assert.ok(task.check(r, files), `task "${task.id}" should pass for the solution`);
  });

  test(`lesson ${lesson.number} “${lesson.id}”: starter leaves tasks unfinished`, () => {
    const r = run(lesson.files);
    const done = lesson.tasks.filter((t) => t.check(r, lesson.files)).length;
    assert.ok(done < lesson.tasks.length, 'a fresh lesson should not already be complete');
  });
}
