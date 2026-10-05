// Stage 1 — Drifting Off: the very first lines.
import { dream, lines, source, valueOf, isType, promptOf, noErrors, countMatches } from './helpers.js';

export default [
  {
    id: 'prose',
    title: 'Generate AI art prompts with joyful code',
    emoji: '💭',
    construct: ['prose lines', 'comments'],
    tagline: 'For artists first: turn one creative idea into many image and video prompt variations, with code working quietly behind your creative flow.',
    intro: [
      '<p>A DreamScript file starts life as <strong>plain writing</strong>, but it is also a programmable prompt for AI image and video creation. Every ordinary line you type becomes part of the direction a visual model will read. There is nothing to learn yet: write what you see, hear or want to move.</p>',
      '<p>Think like a visual artist with a programmable prompt studio: describe a subject, atmosphere and camera in prose, then use later lessons to generate controlled variations and renderer jobs. Two helpers keep your notes out of the prompt: <code>//</code> starts a <strong>comment</strong> that runs to the end of the line, and <code>/* … */</code> hides everything between the markers.</p>',
    ],
    syntax: ['A line of plain prose', '// a comment to yourself', '/* a block comment\n   over several lines */'],
    tips: ['Comments never reach the prompt, so use them for shot notes, references or reminders.', 'Emoji are welcome anywhere — they are just characters, and a blank line starts a new paragraph.'],
    files: {
      'main.dream': `// Everything you type on the left becomes the dream on the right.
// Lines that start with // are notes for you; the dreamer ignores them.

A lighthouse on a cliff at dusk
waves folding into silver foam

/* A block comment can
   span many lines. */
gulls drifting through violet clouds
`,
    },
    tasks: [
      {
        id: 'add-line',
        text: 'Add a new line of your own to the dream.',
        hint: 'Click at the end of the last line, press Enter and describe something else you can see.',
        check: (r) => lines(r).length >= 4,
      },
      {
        id: 'comment',
        text: 'Write a comment with <code>//</code> — and notice that it never shows up on the right.',
        hint: 'Type <code>// my note</code> on its own line. It stays in the editor, not in the Dream tab.',
        check: (r, files) => source(files).split('\n').filter((l) => l.trim().startsWith('//')).length >= 3
          && !promptOf(r).includes('//'),
      },
    ],
    solution: {
      'main.dream': `// Everything you type on the left becomes the dream on the right.
// Lines that start with // are notes for you; the dreamer ignores them.
// My own note: add a moon.

A lighthouse on a cliff at dusk
waves folding into silver foam

/* A block comment can
   span many lines. */
gulls drifting through violet clouds
a pale moon rising over the water
`,
    },
    focus: 'dream',
  },

  {
    id: 'names',
    title: 'Names and the tilde',
    emoji: '〰️',
    construct: ['~ name = value', '~name'],
    tagline: 'Give a thing a name once, use it everywhere.',
    intro: [
      '<p>The <strong>tilde</strong> <code>~</code> is how you step out of prose and into code. <code>~ Subject = a lighthouse</code> <em>defines</em> a name; afterwards <code>~Subject</code> inside any sentence is replaced by its value.</p>',
      '<p>Notice what is missing: <strong>no quotes</strong>. Everything after the <code>=</code> is just text until DreamScript sees a reason to think it is a number, a list or math. Names are forgiving too — <code>Subject</code>, <code>subject</code> and <code>SUBJECT</code> are the same name, and names may contain spaces (<code>~ Sky Colour = teal</code>).</p>',
    ],
    syntax: ['~ Name = some text', 'A sentence about ~Name.', '~ Sky Colour = teal   // spaces are fine'],
    tips: ['Open the <strong>Values</strong> tab to see every name you have defined.', 'A typo in a name gets a friendly “did you mean…?” in <strong>Problems</strong>.'],
    files: {
      'main.dream': `~ Subject = a lighthouse on a cliff
~ Mood = stormy

~Subject at dusk, a ~Mood sea below.
`,
    },
    tasks: [
      {
        id: 'change',
        text: 'Change the value of <code>Subject</code> and watch every use of it change.',
        hint: 'Edit the text after <code>~ Subject =</code>. You don’t need quotes.',
        check: (r) => valueOf(r, 'Subject') !== undefined && valueOf(r, 'Subject') !== 'a lighthouse on a cliff' && promptOf(r).includes(valueOf(r, 'Subject')),
      },
      {
        id: 'new-name',
        text: 'Define a third name (for example <code>~ Time = golden hour</code>) and use it in the sentence with <code>~Time</code>.',
        hint: 'Add a line <code>~ Time = golden hour</code> and then write <code>~Time</code> inside the prose line.',
        check: (r) => r.values.filter((v) => v.kind === 'var').length >= 3 && noErrors(r) && !/~/.test(promptOf(r)),
      },
    ],
    solution: {
      'main.dream': `~ Subject = a fishing boat in a storm
~ Mood = stormy
~ Time = golden hour

~Subject at ~Time, a ~Mood sea below.
`,
    },
    focus: 'dream',
  },

  {
    id: 'values',
    title: 'Numbers, yes/no and colors',
    emoji: '🎨',
    construct: ['numbers', 'true / false', 'hex colors'],
    tagline: 'DreamScript notices what kind of thing you typed.',
    intro: [
      '<p>You never declare types — DreamScript reads your value and decides. <code>1234</code> is a <strong>number</strong>. <code>true</code> and <code>false</code> are <strong>booleans</strong>. <code>#ffb347</code> is a <strong>color</strong>. Anything else is <strong>text</strong>.</p>',
      '<p>Colors are special: when you put one into a sentence, DreamScript writes its <em>name</em> (“orange”), because that is what image models understand. The <strong>Values</strong> tab shows each value with its detected type and a swatch for colors.</p>',
    ],
    syntax: ['~ Seed = 1234', '~ IsNight = true', '~ Lantern = #ffb347', '~ Sky = deep blue'],
    tips: ['Short hex colors work too: <code>#fa0</code>.', 'Decimals use a dot: <code>1.8</code>.', 'An empty <code>~ Idea =</code> is a valid placeholder (its value is <em>null</em>) for something you will write later.'],
    files: {
      'main.dream': `~ Seed = 1234
~ IsNight = true
~ Lantern = #ffb347
~ Sky = deep blue

The lantern glows ~Lantern against a ~Sky sky.
`,
    },
    tasks: [
      {
        id: 'recolor',
        text: 'Change <code>Lantern</code> to a different hex color and read how the sentence names it.',
        hint: 'Try <code>#3cb371</code> (green) or <code>#ff3366</code> (pink).',
        check: (r) => isType(r, 'Lantern', 'color') && valueOf(r, 'Lantern') !== '#ffb347',
      },
      {
        id: 'number',
        text: 'Add your own number — for example <code>~ Stars = 42</code> — and see it typed as a <em>number</em> in the Values tab.',
        hint: 'Any line like <code>~ Stars = 42</code> will do.',
        check: (r) => r.values.filter((v) => v.value?.t === 'number').length >= 2,
      },
    ],
    solution: {
      'main.dream': `~ Seed = 1234
~ IsNight = true
~ Lantern = #3cb371
~ Sky = deep blue
~ Stars = 42

The lantern glows ~Lantern against a ~Sky sky with ~Stars stars.
`,
    },
    focus: 'values',
  },

  {
    id: 'tilde',
    title: 'Every shape of the tilde',
    emoji: '🌀',
    construct: ['~name', '~(expr)', '(expr)~', 'name~', '<~', '\\~'],
    tagline: 'One symbol, six small superpowers.',
    intro: [
      '<p>You already know <code>~Name</code>. The tilde has a few more shapes, and each solves a small problem:</p>',
      '<ul><li><code>~(expression)</code> — parentheses allow names with <em>spaces</em> and even math: <code>~(Images Number * 2)</code>.</li><li><code>(expression)~</code> and <code>Name~</code> — the tilde may come <em>after</em>, which can read more naturally.</li><li><code>~Name~</code> — a closing tilde marks where the name ends, for example before a dot that is <em>not</em> a property.</li><li><code>\\~</code> — a backslash keeps the tilde as plain text.</li><li><code>&lt;~ Name = value</code> — defines the name <strong>and</strong> writes the value into the dream on its own line.</li></ul>',
    ],
    syntax: ['~Name   ~(Name)   (Name)~   Name~', '~(Images Number * 2)', '<~ Mood = serene', 'a literal \\~ tilde'],
    tips: ['A name followed by a dot and a space (<code>~Time. Then</code>) is fine; only <code>~Time.Then</code> looks for a property called Then.', 'Unknown names are never silently ignored — they show up in <strong>Problems</strong> with a suggestion.'],
    files: {
      'main.dream': `~ Subject = lighthouse keeper
~ Images Number = 4
~ Time = golden hour

// Four ways to say the same thing:
A ~Subject at ~Time.
A ~(Subject) at ~(Time).
A (Subject)~ at (Time)~.
A Subject~ at Time~.

// Parentheses let you use names with spaces:
~(Images Number) studies of the ~Subject.

// A closing tilde ends a name before a dot that is not a property:
We rested at ~Time~.Then the bell rang.

// <~ defines a name AND writes it into the dream on its own line:
<~ Mood = serene

// A backslash keeps the tilde literal: \\~
Give or take \\~4 more.
`,
    },
    tasks: [
      {
        id: 'math-in-parens',
        text: 'Add a sentence that does math inside <code>~( )</code>, for example <code>~(Images Number * 2) studies</code>.',
        hint: 'Write <code>~(Images Number * 2)</code> in a prose line. The result (8) appears in the dream.',
        check: (r, files) => /~\([^)]*\*[^)]*\)/.test(source(files)) && /\b8\b/.test(promptOf(r)),
      },
      {
        id: 'emit',
        text: 'Write one more <code>&lt;~</code> line of your own — it both defines a name and adds a line to the dream.',
        hint: 'For example <code>&lt;~ Weather = drifting snow</code>.',
        check: (r, files) => countMatches(source(files), /^\s*<~/gm) >= 2 && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Subject = lighthouse keeper
~ Images Number = 4
~ Time = golden hour

A ~Subject at ~Time.
~(Images Number) studies of the ~Subject, ~(Images Number * 2) in total.
We rested at ~Time~.Then the bell rang.

<~ Mood = serene
<~ Weather = drifting snow
Give or take \\~4 more.
`,
    },
    focus: 'dream',
  },

  {
    id: 'math',
    title: 'Expressions and math',
    emoji: '➗',
    construct: ['+ - * / × ÷ % ^ !', 'comparisons', 'and / or / not'],
    tagline: 'Values can be computed, not just typed.',
    intro: [
      '<p>Whatever sits after an <code>=</code> can be an <strong>expression</strong>. The usual operators work — <code>+ - * / %</code> — plus <code>^</code> for powers, <code>×</code> and <code>÷</code> as friendly spellings of <code>*</code> and <code>/</code>, and a postfix <code>!</code> for factorials (<code>5 !</code> is 120).</p>',
      '<p>Comparisons (<code>== != &lt; &lt;= &gt; &gt;=</code>) produce <strong>true</strong> or <strong>false</strong>, and <code>and</code>, <code>or</code>, <code>not</code> combine them. <code>+</code> also <em>joins text</em>. Use parentheses to choose the order: <code>^</code> first, then <code>* / %</code>, then <code>+ -</code>.</p>',
    ],
    syntax: ['~ Double = Seed * 2', '~ Budget = (Steps + 2) × Images', '~ Bigger = Seed > 1000', '~ Label = "Sky #" + Seed'],
    tips: ['Put spaces around <code>-</code> when subtracting: <code>Seed - 1</code>. Without spaces, <code>Seed-1</code> is one (hyphenated) word.', 'Dividing by zero is reported as a friendly error, not a crash.'],
    files: {
      'main.dream': `~ Seed = 1234
~ Steps = 28
~ Images = 4

~ Double = Seed * 2
~ Budget = (Steps + 2) × Images
~ Ratio = 16 / 9
~ Bigger = Seed > 1000
~ Label = "Sky #" + Seed

Seed ~Seed doubles to ~Double. The budget is ~Budget.
The screen ratio is ~(round(Ratio, 2)). Is the seed big? ~Bigger. Label: ~Label.
`,
    },
    tasks: [
      {
        id: 'power',
        text: 'Add a name called <code>Power</code> that uses the power operator — <code>2 ^ 10</code> is 1024.',
        hint: 'A new line: <code>~ Power = 2 ^ 10</code>. Check its type in the Values tab.',
        check: (r, files) => typeof valueOf(r, 'Power') === 'number' && /\^/.test(source(files)),
      },
      {
        id: 'flip',
        text: 'Make <code>Bigger</code> become <em>false</em> by changing the seed or the comparison.',
        hint: 'Lower <code>Seed</code> below 1000, or compare with <code>&lt;</code> instead of <code>&gt;</code>.',
        check: (r) => valueOf(r, 'Bigger') === false,
      },
    ],
    solution: {
      'main.dream': `~ Seed = 900
~ Steps = 28
~ Images = 4

~ Double = Seed * 2
~ Budget = (Steps + 2) × Images
~ Ratio = 16 / 9
~ Bigger = Seed > 1000
~ Label = "Sky #" + Seed
~ Power = 2 ^ 10

Seed ~Seed doubles to ~Double. The budget is ~Budget.
The screen ratio is ~(round(Ratio, 2)). Is the seed big? ~Bigger. Label: ~Label. Power: ~Power.
`,
    },
    focus: 'values',
  },

  {
    id: 'channels',
    title: 'Side channels',
    emoji: '🌙',
    construct: ['≈ translation', '☽ dream note', '◊ concept'],
    tagline: 'Keep translations, notes and concepts beside the prompt.',
    intro: [
      '<p>Not every line belongs in the prompt. Three symbols start <strong>side channels</strong>: <code>≈</code> for a <em>translation</em> of the dream, <code>☽</code> for a <em>dream note</em> (a reminder for humans) and <code>◊</code> for a <em>concept</em> anchor (keywords that capture the idea).</p>',
      '<p>Channel lines show up in their own rows on the Dream tab and are <strong>never</strong> part of the prompt a renderer receives. They understand <code>~</code> interpolation like any other line, and right-to-left text such as Arabic is shown correctly.</p>',
    ],
    syntax: ['≈ a translation of the dream', '☽ a note for humans', '◊ concept, keywords, anchors'],
    tips: ['Use <code>≈</code> for accessibility or multilingual teams, and <code>☽</code> for art-direction notes.'],
    files: {
      'main.dream': `~ Subject = lighthouse keeper

A ~Subject lighting the lamp at dusk

≈ Un gardien de phare allume la lampe au crépuscule
≈ حارس المنارة يضيء المصباح عند الغسق
☽ remember: the lamp should look warm, never white
◊ solitude, duty, one small light in a big dark
`,
    },
    tasks: [
      {
        id: 'concept',
        text: 'Add a second <code>◊</code> concept line that uses <code>~Subject</code>.',
        hint: 'For example <code>◊ the ~Subject as a guardian</code>.',
        check: (r) => dream(r).items.filter((i) => i.ch === 'concept').length >= 2 && noErrors(r),
      },
      {
        id: 'note',
        text: 'Add a second <code>☽</code> note. Notice the prompt itself does not change.',
        hint: 'Any line that starts with <code>☽</code> is a note.',
        check: (r) => dream(r).items.filter((i) => i.ch === 'note').length >= 2 && !promptOf(r).includes('☽'),
      },
    ],
    solution: {
      'main.dream': `~ Subject = lighthouse keeper

A ~Subject lighting the lamp at dusk

≈ Un gardien de phare allume la lampe au crépuscule
≈ حارس المنارة يضيء المصباح عند الغسق
☽ remember: the lamp should look warm, never white
☽ keep the sea dark so the light pops
◊ solitude, duty, one small light in a big dark
◊ the ~Subject as a guardian of the coast
`,
    },
    focus: 'dream',
  },
];
