// Stage 3 — Deep Sleep: variation, chance and combinations.
import { dream, source, promptOf, noErrors, countMatches } from './helpers.js';

export default [
  {
    id: 'variations',
    title: 'Variations: one script, many dreams',
    emoji: '🎭',
    construct: ['a | b | c', 'the dream pager', 'named variations'],
    tagline: 'The pipe offers alternatives — DreamScript builds every dream.',
    intro: [
      '<p>The pipe <code>|</code> is DreamScript\'s signature move. Write <code>a | b | c</code> and you have not written one dream but <strong>three</strong>: the compiler walks through every alternative and builds a complete dream for each. Use the pager above the dream on the right (◀ 1 / 3 ▶) to flip between them — or press <strong>🎲 Roll</strong> for a random one.</p>',
      '<p>A whole prose line with <code>|</code> in it is a variation of that line. You can also put alternatives in a <em>name</em> — <code>~ Weather = clear | misty</code> — and use it like any other value. The <strong>Choices</strong> strip under the dream shows what each variation picked.</p>',
    ],
    syntax: ['sun-drenched | rain-soaked | fog-wrapped', '~ Weather = clear | misty', '(red | blue)~'],
    tips: ['Alternatives are not limited to words: they can be whole sentences, numbers, lists…', 'Variations inside a sentence: <code>a (red | blue)~ door</code> or <code>~(red | blue)</code>.'],
    files: {
      'main.dream': `// The pipe | offers alternatives. DreamScript builds one dream for each.
A lighthouse at dawn | A lighthouse at dusk | A lighthouse at midnight

// Flip through them with the pager on the right.
waves folding into silver foam
`,
    },
    tasks: [
      {
        id: 'fourth',
        text: 'Add a <em>fourth</em> alternative to the first line and watch the pager grow to four dreams.',
        hint: 'Add another <code>| A lighthouse at …</code> at the end of the line.',
        check: (r) => r.total >= 4,
      },
      {
        id: 'named',
        text: 'Create a <strong>named</strong> variation with two alternatives (for example <code>~ Weather = clear | misty</code>) and use it in a sentence.',
        hint: 'Define it with <code>~ Weather = clear | misty</code>, then write <code>Weather: ~Weather</code> on a line.',
        check: (r) => r.values.some((v) => v.value?.t === 'choice' && v.value.done),
      },
    ],
    solution: {
      'main.dream': `A lighthouse at dawn | A lighthouse at dusk | A lighthouse at midnight | A lighthouse in a storm

~ Weather = clear | misty
waves folding into silver foam, ~Weather sky
`,
    },
    focus: 'dream',
  },

  {
    id: 'weights',
    title: 'Weights: likelier dreams',
    emoji: '🎲',
    construct: ['60% a | 40% b', 'any()', 'weighted()', 'maybe()'],
    tagline: 'Not every alternative deserves equal odds.',
    intro: [
      '<p>Put a percentage in front of an alternative: <code>70% golden hour | 20% blue hour | 10% eclipse</code>. Alternatives without a percentage <strong>share what is left</strong>, and each dream now knows its <strong>probability</strong> — the Choices strip shows it.</p>',
      '<p>Three helpers build variations from data: <code>any(list)</code> turns a list into a variation, <code>weighted(list, [80, 20])</code> adds odds, and <code>maybe("with a crow", 0.25)</code> produces the text a quarter of the time and <em>nothing</em> otherwise.</p>',
    ],
    syntax: ['~ Light = 70% golden hour | 20% blue hour | eclipse', '~ Mood = any(Extras)', '~maybe(" with a crow", 0.25)', 'weighted(["a", "b"], [80, 20])'],
    tips: ['Weights are relative to 100 — they do not have to add up; open alternatives get the remainder.', 'The dreams on the pager are listed in order, not by probability — check the percentage next to each one.'],
    files: {
      'main.dream': `~ Lighting = 70% golden hour | 20% blue hour | 10% total eclipse
~ Extras = moonlit, misty, windswept
~ Mood = any(Extras)

A cliffside chapel, ~Lighting, ~Mood~maybe(" with a crow", 0.25).
`,
    },
    tasks: [
      {
        id: 'ninety',
        text: 'Give <em>golden hour</em> a <strong>90%</strong> chance (and lower the others) so the first dream is very likely.',
        hint: 'For example <code>90% golden hour | 5% blue hour | 5% total eclipse</code>.',
        check: (r) => (dream(r).picks.find((p) => p.label === 'Lighting')?.p ?? 0) >= 0.85,
      },
      {
        id: 'coin',
        text: 'Make the crow appear <em>half</em> the time.',
        hint: 'Change <code>0.25</code> to <code>0.5</code> in <code>maybe(…)</code>.',
        check: (r, files) => /maybe\([^)]*,\s*0?\.5\s*\)/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Lighting = 90% golden hour | 5% blue hour | 5% total eclipse
~ Extras = moonlit, misty, windswept
~ Mood = any(Extras)

A cliffside chapel, ~Lighting, ~Mood~maybe(" with a crow", 0.5).
`,
    },
    focus: 'dream',
  },

  {
    id: 'consistency',
    title: 'Names hold one choice',
    emoji: '🔗',
    construct: ['variation in a name', 'fresh choice per call', '<~ with variations'],
    tagline: 'Same name, same answer — unless you ask for a fresh draw.',
    intro: [
      '<p>A name that holds a variation <strong>decides once per dream</strong>. That is why “the ~Hero sleeps, then the ~Hero wakes” never turns a fox into a heron halfway through: both uses agree in every dream.</p>',
      '<p>Sometimes you want <em>independent</em> draws. A <strong>function</strong> that returns a variation makes a fresh choice on every call — <code>~anyBeast() … ~anyBeast()</code> can be two different creatures. And <code>&lt;~ Weather = mist | rain</code> defines the name and writes the chosen value out in one step.</p>',
    ],
    syntax: ['~ Hero = fox | heron   // decided once per dream', '~ fn anyBeast() = hare | wolf   // fresh each call', '<~ Weather = mist | rain'],
    tips: ['A variation you never use creates no extra dreams.', 'Count the dreams: 2 choices for Hero × (2 × 2) for two calls × 2 for Weather = 16.'],
    files: {
      'main.dream': `// A name decides once per dream, so every ~Hero agrees.
~ Hero = fox | heron
The ~Hero sleeps. Later, the ~Hero wakes.

// A function makes a fresh choice every time it is called.
~ fn anyBeast() = hare | wolf
Two strangers meet: a ~anyBeast() and a ~anyBeast().

// <~ defines a name AND writes it out, in one go.
<~ Weather = mist | rain
`,
    },
    tasks: [
      {
        id: 'third-hero',
        text: 'Use <code>~Hero</code> a <em>third</em> time — every dream still agrees about who the hero is.',
        hint: 'Add a sentence such as <code>At last the ~Hero rests.</code>',
        check: (r, files) => countMatches(source(files), /~Hero\b/gi) >= 3 && noErrors(r),
      },
      {
        id: 'third-call',
        text: 'Add a <em>third</em> <code>~anyBeast()</code> and watch the number of dreams double.',
        hint: 'Change the sentence to “a ~anyBeast(), a ~anyBeast() and a ~anyBeast()”.',
        check: (r) => r.total >= 32,
      },
    ],
    solution: {
      'main.dream': `~ Hero = fox | heron
The ~Hero sleeps. Later, the ~Hero wakes. At last the ~Hero rests.

~ fn anyBeast() = hare | wolf
Three strangers meet: a ~anyBeast(), a ~anyBeast() and a ~anyBeast().

<~ Weather = mist | rain
`,
    },
    focus: 'dream',
  },

  {
    id: 'combinations',
    title: 'Combinations, and keeping them in check',
    emoji: '🧮',
    construct: ['cross product', 'dream count', 'unused variations'],
    tagline: 'Three styles × two subjects × four lights = twenty-four dreams.',
    intro: [
      '<p>Independent variations <strong>multiply</strong>. With 3 styles, 2 subjects and 4 lights there are 3 × 2 × 4 = <strong>24</strong> dreams, and the header of the Dream tab says so. The pager keeps up to 36 dreams; beyond that it reports an estimate (<em>≈ 432 dreams</em>) so huge scripts stay fast.</p>',
      '<p>Ways to tame the count: decide something <em>once</em> by giving it a name, use weights so the likely dreams matter most, and remember that a variation you <strong>define but never use</strong> adds nothing — the compiler only counts what the dream actually touches.</p>',
    ],
    syntax: ['3 × 2 × 4 = 24 dreams', 'the pager: ◀ 7 / 24 ▶', '≈ 432 dreams · showing 36'],
    tips: ['Open <strong>All dreams</strong> under the dream to scan every combination at once.', 'The count is an <em>estimate</em> when it says “≈”.'],
    files: {
      'main.dream': `// Every independent variation multiplies the number of dreams.
~ Style = oil | ink | watercolour
~ Subject = a fox | a heron
~ Light = dawn | dusk | night | noon

~Subject in ~Style, at ~Light.
`,
    },
    tasks: [
      {
        id: 'twelve',
        text: 'Change the script so there are exactly <strong>12</strong> dreams.',
        hint: 'Remove one <code>Style</code> (3 → 2) and one <code>Light</code> (4 → …) — or pick any combination that multiplies to 12.',
        check: (r) => r.total === 12 && r.exact,
      },
      {
        id: 'unused',
        text: 'Define a variation you <em>never use</em> and check that the count does not change.',
        hint: 'For example <code>~ Spare = x | y | z</code> — do not mention <code>~Spare</code> in any sentence.',
        check: (r) => r.values.some((v) => v.value?.t === 'choice' && !v.value.done),
      },
    ],
    solution: {
      'main.dream': `~ Style = oil | ink
~ Subject = a fox | a heron
~ Light = dawn | dusk | night
~ Spare = x | y | z

~Subject in ~Style, at ~Light.
`,
    },
    focus: 'dream',
  },
];
