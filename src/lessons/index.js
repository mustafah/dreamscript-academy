// The curriculum: five stages from a first line of prose to lucid programs.
import stage1 from './stage1.js';
import stage2 from './stage2.js';
import stage3 from './stage3.js';
import stage4 from './stage4.js';
import stage5 from './stage5.js';
import stage5b from './stage5b.js';

const STAGE_INFO = [
  { id: 1, name: 'Drifting Off', moon: '🌒', blurb: 'Plain words, names and values.', lessons: stage1 },
  { id: 2, name: 'Light Sleep', moon: '🌓', blurb: 'Lists, groups, objects and enums.', lessons: stage2 },
  { id: 3, name: 'Deep Sleep', moon: '🌔', blurb: 'Variations, odds and combinations.', lessons: stage3 },
  { id: 4, name: 'REM', moon: '🌖', blurb: 'Logic, functions and loops.', lessons: stage4 },
  { id: 5, name: 'Lucid', moon: '🌕', blurb: 'Rendering, reuse, safety and mastery.', lessons: [...stage5, ...stage5b] },
];

// Lessons are numbered 1..N across the whole curriculum; `index` is the position inside a stage.
let counter = 0;
export const STAGES = STAGE_INFO.map((s) => ({
  ...s,
  lessons: s.lessons.map((l, i) => ({ ...l, stage: s.id, stageName: s.name, index: i + 1, number: ++counter })),
}));

export const LESSONS = STAGES.flatMap((s) => s.lessons);
export const lessonById = (id) => LESSONS.find((l) => l.id === id);
