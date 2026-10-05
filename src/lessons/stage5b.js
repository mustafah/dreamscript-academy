// Stage 5 (part 2) — Lucid: architecture, safety and putting it all together.
import { dream, source, binding, valueOf, promptOf, noErrors, allRenders } from './helpers.js';

export default [
  {
    id: 'templates',
    title: 'Templates: reusable dreams',
    emoji: '🪞',
    construct: ['~( template name(params) )', '<~ template(…)', '~template(…)'],
    tagline: 'A function whose body is prose.',
    intro: [
      '<p>A <strong>template</strong> is a chunk of dream you can reuse: <code>~( template scene(place, hour = "dusk") … )</code> holds ordinary prose lines (and channel lines, and <code>~</code> code) that may use its parameters. Call it with <code>&lt;~ scene("harbour")</code> to <em>write its lines into the dream</em>, or inside a sentence as <code>~scene("pier")</code> to use its text.</p>',
      '<p>Templates combine beautifully with loops: one template plus a <code>~ for</code> gives you a storyboard — a consistent frame repeated for every place, hour or mood. Parameters can have defaults and be passed by name, exactly like functions.</p>',
    ],
    syntax: ['~( template scene(place, hour = "dusk")\n    A quiet ~place at ~hour.\n)', '<~ scene("harbour")', 'Note: ~scene("pier", hour = "dawn")'],
    tips: ['Use a <em>template</em> when the body is prose, a <em>function</em> when it is a computation.', 'Variations inside a template are decided per use, just like in a function.'],
    files: {
      'main.dream': `~( template scene(place, hour = "dusk")
    A quiet ~place at ~hour, lamps glowing.
    The air smells of ~(if hour == "dusk" then "woodsmoke" else "salt").
)

// A storyboard: one template, several frames.
<~ scene("harbour")
<~ scene("market", hour = "noon")
~ for p in ["pier", "chapel"]:
    <~ scene(p, hour = "dawn")
`,
    },
    tasks: [
      {
        id: 'weather',
        text: 'Give the template a third parameter with a default — say <code>weather = "clear"</code> — and use it in a line.',
        hint: '<code>~( template scene(place, hour = "dusk", weather = "clear")</code> and a line such as <code>The sky is ~weather.</code>',
        check: (r, files) => /template\s+scene\s*\([^)]*weather\s*=/i.test(source(files)) && /~weather/i.test(source(files)) && noErrors(r),
      },
      {
        id: 'inline',
        text: 'Use a template <em>inside a sentence</em> with <code>~scene(…)</code>.',
        hint: 'For example <code>Remember this: ~scene("bridge")</code>.',
        check: (r, files) => /^[^~<\n][^\n]*~scene\(/m.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~( template scene(place, hour = "dusk", weather = "clear")
    A quiet ~place at ~hour, lamps glowing.
    The sky is ~weather and the air smells of ~(if hour == "dusk" then "woodsmoke" else "salt").
)

<~ scene("harbour")
<~ scene("market", hour = "noon", weather = "hazy")
~ for p in ["pier", "chapel"]:
    <~ scene(p, hour = "dawn")
Remember this: ~scene("bridge")
`,
    },
    focus: 'dream',
  },

  {
    id: 'modules',
    title: 'Modules: split your dream into files',
    emoji: '📦',
    construct: ['~ import ./file.dream', 'as alias  /  as *', '_private names'],
    tagline: 'Share names between files — switch tabs above the editor.',
    intro: [
      '<p><code>~ import ./light.dream</code> runs another file and gives you its names under the file\'s name: <code>light.Glow</code>, <code>light.warm("lanterns")</code>. Add <code>as lamp</code> to choose another prefix, or <code>as *</code> to bring every name in <em>without</em> a prefix. Names that start with <code>_</code> stay private to their file.</p>',
      '<p>A module is for <strong>defining</strong> things — names, functions, templates, enums. Its own prose never shows up in your dream. DreamScript also notices missing files and circular imports and tells you exactly which import is at fault. This lesson has two files: use the tabs above the editor.</p>',
    ],
    syntax: ['~ import ./light.dream', '~ import ./light.dream as lamp', '~ import ./light.dream as *', '~ _secret = "private"'],
    tips: ['Paths are relative to the file that imports.', 'Change something in <code>light.dream</code> and watch <code>main.dream</code>\'s dream update.'],
    files: {
      'main.dream': `~ import ./light.dream

A quiet harbour, ~light.Glow light, ~light.warm("lanterns") along the pier.
`,
      'light.dream': `// A module defines things. Its own prose is never part of your dream.
~ Glow = amber
~ fn warm(thing) = "warm " + thing
~ _secret = "names that start with _ stay private"
`,
    },
    tasks: [
      {
        id: 'edit-module',
        text: 'Open <code>light.dream</code> and change <code>Glow</code> — the harbour in <code>main.dream</code> changes with it.',
        hint: 'Pick another color word, e.g. <code>~ Glow = violet</code>.',
        check: (r) => !promptOf(r).includes('amber') && promptOf(r).includes('light') && noErrors(r),
      },
      {
        id: 'star',
        text: 'Import with <code>as *</code> and use <code>Glow</code> and <code>warm(…)</code> <em>without</em> the <code>light.</code> prefix.',
        hint: 'Change the import to <code>~ import ./light.dream as *</code> and write <code>~Glow</code> and <code>~warm("lanterns")</code>.',
        check: (r, files) => /as\s+\*/.test(source(files, 'main.dream')) && promptOf(r).includes('warm ') && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ import ./light.dream as *

A quiet harbour, ~Glow light, ~warm("lanterns") along the pier.
`,
      'light.dream': `// A module defines things. Its own prose is never part of your dream.
~ Glow = violet
~ fn warm(thing) = "warm " + thing
~ _secret = "names that start with _ stay private"
`,
    },
    focus: 'dream',
  },

  {
    id: 'types',
    title: 'Types: promises the compiler keeps',
    emoji: '🛡️',
    construct: ['name: type = value', 'int in 1..8', 'T[]  T?', '~ type', 'typed parameters'],
    tagline: 'Catch a wrong value before a render costs time.',
    intro: [
      '<p>Add a colon and a <strong>type</strong> after a name: <code>~ Seed: int = 1234</code>. The basic types are <code>int</code>, <code>number</code>, <code>text</code>, <code>bool</code>, <code>color</code>, <code>list</code> and <code>object</code>; <code>int[]</code> is a list of ints, <code>text?</code> may also be <code>null</code>, <code>int in 1..50</code> restricts a range, an <strong>enum</strong> name allows only its members, and <code>{ seed: int, tag?: text }</code> describes the shape of an object.</p>',
      '<p><code>~ type Steps = int in 1..50</code> gives a type a name. Functions can type their parameters and result: <code>~ fn cost(n: int, each: number = 0.25): number = …</code>. When a value does not fit, <strong>Problems</strong> points at it and says what was expected — long before a render is wasted.</p>',
    ],
    syntax: ['~ Seed: int = 1234', '~ Quality: int in 1..50 = 28', '~ Tags: text[] = ["fox", "dawn"]', '~ type Job = { seed: int, prompt: text }', '~ fn cost(n: int): number = n * 0.25'],
    tips: ['Try breaking a type on purpose: set <code>Quality = 99</code> and read the error.', 'Types never change a value; they only check it.'],
    files: {
      'main.dream': `~( enum Size
    Wide = "landscape_16_9"
    Tall = "portrait_3_4"
)
~ type Steps = int in 1..50

~ Seed: int = 1234
~ Format: Size = "landscape_16_9"
~ Quality: Steps = 28
~ Tags: text[] = ["fox", "dawn"]
~ Note: text? = null

~ fn cost(n: int, each: number = 0.25): number = n * each

A ~cost(4) credit dream in ~Format at ~Quality steps.
`,
    },
    tasks: [
      {
        id: 'range',
        text: 'Add a typed name <code>Gain</code> that must stay between 0 and 1: <code>~ Gain: number in 0..1 = 0.5</code>.',
        hint: 'Use <code>number in 0..1</code> as the type.',
        check: (r) => /in/.test(binding(r, 'Gain')?.type || '') && noErrors(r),
      },
      {
        id: 'shape',
        text: 'Declare a shape type <code>Job</code> — <code>{ seed: int, prompt: text }</code> — and a value that uses it.',
        hint: '<code>~ type Job = { seed: int, prompt: text }</code> then <code>~ first: Job = { seed = 1, prompt = "x" }</code>',
        check: (r) => r.values.some((v) => v.kind === 'type' && /seed/.test(v.detail)) && r.values.some((v) => v.kind !== 'type' && /Job/.test(v.type || '')) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~( enum Size
    Wide = "landscape_16_9"
    Tall = "portrait_3_4"
)
~ type Steps = int in 1..50
~ type Job = { seed: int, prompt: text }

~ Seed: int = 1234
~ Format: Size = "landscape_16_9"
~ Quality: Steps = 28
~ Tags: text[] = ["fox", "dawn"]
~ Note: text? = null
~ Gain: number in 0..1 = 0.5
~ first: Job = { seed = 1, prompt = "x" }

~ fn cost(n: int, each: number = 0.25): number = n * each

A ~cost(4) credit dream in ~Format at ~Quality steps.
`,
    },
    focus: 'values',
  },

  {
    id: 'tests',
    title: 'Assertions and tests',
    emoji: '✅',
    construct: ['~ assert cond, "message"', '~( test "name" )'],
    tagline: 'Let the script check its own rules.',
    intro: [
      '<p><code>~ assert condition, "message"</code> checks a rule: when it is false, <strong>Problems</strong> reports your message. Group related checks in a <code>~( test "name" … )</code> block — each test passes or fails as a unit and appears under <strong>Problems → Tests</strong>. Tests never add lines to the dream, so they are free documentation of what you expect.</p>',
      '<p>Use them to guard a function (<code>fact(5) == 120</code>), a budget (<em>never more than 4 images</em>) or an invariant (<em>every scene has a place</em>). When you refactor, green tests tell you nothing broke.</p>',
    ],
    syntax: ['~ assert Images > 0, "need an image"', '~( test "budget"\n    ~ assert Images <= MaxImages, "too many"\n)'],
    tips: ['Put the important rule in the message — it is what you will read at 2 a.m.', 'A test that throws an error counts as failed and shows the error.'],
    files: {
      'main.dream': `~ fn fact(n) = if n <= 1 then 1 else n * fact(n - 1)
~ MaxImages = 4
~ Images = 3

~( test "factorials"
    ~ assert fact(0) == 1
    ~ assert fact(5) == 120, "5! should be 120"
)

~( test "budget"
    ~ assert Images <= MaxImages, "too many images"
)

~ assert Images > 0, "need at least one image"

A reliable little dream.
`,
    },
    tasks: [
      {
        id: 'break-fix',
        text: 'Set <code>Images</code> to <strong>6</strong> and watch the budget test fail; then raise <code>MaxImages</code> so everything is green again.',
        hint: 'Change <code>Images = 3</code> to <code>6</code>, read the failure in Problems, then set <code>MaxImages = 6</code>.',
        check: (r) => valueOf(r, 'Images') >= 6 && r.tests.length >= 2 && r.tests.every((t) => t.passed) && noErrors(r),
      },
      {
        id: 'third-test',
        text: 'Add a <em>third</em> test block of your own.',
        hint: '<code>~( test "my rule" … )</code> with at least one <code>~ assert</code> inside, closed with a line that contains only <code>)</code>.',
        check: (r) => r.tests.length >= 3 && r.tests.every((t) => t.passed),
      },
    ],
    solution: {
      'main.dream': `~ fn fact(n) = if n <= 1 then 1 else n * fact(n - 1)
~ MaxImages = 6
~ Images = 6

~( test "factorials"
    ~ assert fact(0) == 1
    ~ assert fact(5) == 120, "5! should be 120"
)

~( test "budget"
    ~ assert Images <= MaxImages, "too many images"
)

~( test "positive"
    ~ assert Images > 0, "need at least one image"
)

~ assert Images > 0, "need at least one image"

A reliable little dream.
`,
    },
    focus: 'problems',
  },

  {
    id: 'capstone',
    title: 'Capstone: the living storyboard',
    emoji: '🌕',
    construct: ['everything, together'],
    tagline: 'Enums, params, functions, templates, loops, variations, renders and tests in one script.',
    intro: [
      '<p>This script uses <strong>every big idea</strong> from the academy: an enum of times of day, a params block, a weighted variation for the hero, a function with <code>let</code>/<code>match</code>, a template, a storyboard loop, a renderer fan-out and a test that guards the plan. Read it top to bottom, then bend it to your will.</p>',
      '<p>Explore with all five output tabs: <strong>Dream</strong> (two dreams — the hero is a fox or a heron), <strong>Values</strong>, <strong>Renders</strong> (one job per frame), <strong>Problems → Tests</strong> and <strong>Under the hood</strong> to see how the compiler reads the line under your cursor. You have reached lucidity — make something beautiful.</p>',
    ],
    syntax: ['enum  ·  params block  ·  ~ fn  ·  template  ·  ~ for  ·  renderer for  ·  test'],
    tips: ['Change <code>Places</code> and watch the frames, the jobs <em>and</em> the test react.', 'Everything here is yours to edit — break it, read the message, fix it.'],
    files: {
      'main.dream': `// ✦ The Living Storyboard ✦  everything you have learned, working together.

~( enum TimeOfDay
    /// Soft and early.
    Dawn = "dawn light"
    /// Long shadows.
    Dusk = "dusk light"
    /// Silver and quiet.
    Night = "moonlight"
)

~( Common
    seed = 2024
    image_size = landscape_16_9
)

~ Places = harbour, market, chapel
~ Hero = 70% a fox | 30% a heron

~ fn caption(place, time):
    let mood = match time
        TimeOfDay.Dawn => "hopeful"
        TimeOfDay.Dusk => "wistful"
        _ => "mysterious"
    return place.title() + ", " + mood

~( template scene(place, time = TimeOfDay.Dusk)
    ~Hero wandering the ~place, ~time.
    ☽ caption: ~caption(place, time)
)

~ for p, i in Places:
    <~ scene(p, time = if i == 0 then TimeOfDay.Dawn else TimeOfDay.Dusk)

~( renderer
    for p, i in Places
        fal-ai/flux/schnell(Common, seed = Common.seed + i, prompt = "~Hero in the ~p, storyboard frame ~(i + 1)")
)

~( test "the storyboard is well formed"
    ~ assert Places.length == 3, "three frames"
)
`,
    },
    tasks: [
      {
        id: 'four-frames',
        text: 'Make it a <strong>four-frame</strong> storyboard: add a place <em>and</em> update the test so everything stays green.',
        hint: 'Add a fourth place to <code>Places</code>, then change the test to <code>Places.length == 4</code>.',
        check: (r) => (valueOf(r, 'Places') || []).length >= 4 && allRenders(r).length >= 4 && r.tests.length >= 1 && r.tests.every((t) => t.passed) && noErrors(r),
      },
      {
        id: 'third-hero',
        text: 'Give the hero a <em>third</em> possibility and count the dreams.',
        hint: 'Add another alternative to <code>Hero</code>, for example <code>| 10% a hare</code> (and lower the others).',
        check: (r) => (binding(r, 'Hero')?.value?.alts?.length ?? 0) >= 3 && r.total >= 3,
      },
      {
        id: 'new-light',
        text: 'Add a new member to the <code>TimeOfDay</code> enum and use it in one scene.',
        hint: 'A member like <code>Noon = "high sun"</code>, then pass <code>time = TimeOfDay.Noon</code>.',
        check: (r, files) => (binding(r, 'TimeOfDay')?.value?.n ?? 0) >= 4 && /TimeOfDay\.(?!Dawn\b|Dusk\b|Night\b)\w+/.test(source(files).replace(/^\s*\/\/.*$/gm, '')) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~( enum TimeOfDay
    /// Soft and early.
    Dawn = "dawn light"
    /// Long shadows.
    Dusk = "dusk light"
    /// Silver and quiet.
    Night = "moonlight"
    /// High and bright.
    Noon = "high sun"
)

~( Common
    seed = 2024
    image_size = landscape_16_9
)

~ Places = harbour, market, chapel, lighthouse
~ Hero = 60% a fox | 30% a heron | 10% a hare

~ fn caption(place, time):
    let mood = match time
        TimeOfDay.Dawn => "hopeful"
        TimeOfDay.Dusk => "wistful"
        _ => "mysterious"
    return place.title() + ", " + mood

~( template scene(place, time = TimeOfDay.Dusk)
    ~Hero wandering the ~place, ~time.
    ☽ caption: ~caption(place, time)
)

~ for p, i in Places:
    <~ scene(p, time = if i == 0 then TimeOfDay.Dawn else if i == 3 then TimeOfDay.Noon else TimeOfDay.Dusk)

~( renderer
    for p, i in Places
        fal-ai/flux/schnell(Common, seed = Common.seed + i, prompt = "~Hero in the ~p, storyboard frame ~(i + 1)")
)

~( test "the storyboard is well formed"
    ~ assert Places.length == 4, "four frames"
)
`,
    },
    focus: 'renders',
  },
];
