// Stage 4 — REM: logic, functions and loops.
import { source, valueOf, promptOf, noErrors, countMatches, binding } from './helpers.js';

export default [
  {
    id: 'conditions',
    title: 'If this, then that',
    emoji: '🔀',
    construct: ['if … then … else', 'and / or / not', 'comparisons'],
    tagline: 'Let the dream change its mind.',
    intro: [
      '<p><code>if condition then a else b</code> is an <strong>expression</strong>: it produces a value, so you can use it anywhere a value fits — after an <code>=</code>, inside <code>~( )</code>, as an argument. Chain them with <code>else if</code>.</p>',
      '<p>Conditions come from comparisons (<code>== != &lt; &lt;= &gt; &gt;=</code>) joined with <code>and</code>, <code>or</code> and <code>not</code>. “Empty” things — <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code> and empty lists — count as <em>false</em>; everything else is true. <code>a ?? b</code> falls back to <code>b</code> when <code>a</code> is null.</p>',
    ],
    syntax: ['~ Sky = if IsNight then "indigo" else "pale blue"', '~ Crowd = if a then x else if b then y else z', 'IsNight = Hour >= 18 or Hour < 6'],
    tips: ['Only the chosen branch is evaluated.', 'Indented <code>~ if</code> / <code>~ else</code> <em>statements</em> (for whole lines of prose) come in the loops lesson.'],
    files: {
      'main.dream': `~ Hour = 19

~ IsNight = Hour >= 18 or Hour < 6
~ Sky = if IsNight then "indigo" else "pale blue"
~ Lamp = if IsNight and not (Hour == 23) then "lit" else "dark"
~ Crowd = if Hour > 8 and Hour < 17 then "busy" else if Hour < 22 then "quiet" else "empty"

At ~Hour:00 the sky is ~Sky, the lamp is ~Lamp and the street is ~Crowd.
`,
    },
    tasks: [
      {
        id: 'midday',
        text: 'Set <code>Hour</code> to a time around midday and watch everything flip.',
        hint: 'Try <code>~ Hour = 12</code> — the sky becomes pale blue, the lamp dark.',
        check: (r) => valueOf(r, 'Hour') >= 6 && valueOf(r, 'Hour') <= 17 && valueOf(r, 'Sky') === 'pale blue',
      },
      {
        id: 'weather',
        text: 'Add a <code>Weather</code> name with <em>three</em> outcomes using <code>if … else if … else</code>, and mention it in the sentence.',
        hint: '<code>~ Weather = if Hour &lt; 10 then "mist" else if Hour &lt; 18 then "sun" else "rain"</code>',
        check: (r, files) =>
          valueOf(r, 'Weather') !== undefined && countMatches(source(files), /else\s+if/g) >= 2 && noErrors(r) && promptOf(r).includes(String(valueOf(r, 'Weather'))),
      },
    ],
    solution: {
      'main.dream': `~ Hour = 12

~ IsNight = Hour >= 18 or Hour < 6
~ Sky = if IsNight then "indigo" else "pale blue"
~ Lamp = if IsNight and not (Hour == 23) then "lit" else "dark"
~ Crowd = if Hour > 8 and Hour < 17 then "busy" else if Hour < 22 then "quiet" else "empty"
~ Weather = if Hour < 10 then "mist" else if Hour < 18 then "sun" else "rain"

At ~Hour:00 the sky is ~Sky, the lamp is ~Lamp and the street is ~Crowd, under ~Weather.
`,
    },
    focus: 'dream',
  },

  {
    id: 'match',
    title: 'match: choose by pattern',
    emoji: '🧩',
    construct: ['match', 'patterns =>', '_ wildcard', 'when guards'],
    tagline: 'Compare a value against patterns, top to bottom.',
    intro: [
      '<p><code>match value</code> tries each <strong>arm</strong> from the top: <code>pattern => result</code>. A pattern can be a literal (<code>"dreamy"</code>, <code>42</code>), several alternatives (<code>1 | 2</code>), a <strong>range</strong> (<code>13..19</code>) or the wildcard <code>_</code> that matches anything. The first arm that fits wins.</p>',
      '<p>Add a <code>when</code> <strong>guard</strong> for extra conditions; inside it (and in the result) <code>it</code> names the value being matched: <code>_ when it % 2 == 0 => "even"</code>. Arms go on indented lines, or on one line inside braces. If nothing fits you get a gentle warning — end with <code>_ =></code> to be safe.</p>',
    ],
    syntax: ['~ Stage = match Age\n    0..12 => "child"\n    _ => "adult"', '~ Lens = match Stage { child => 24, _ => 50 }', '_ when it > 100 => "lots"'],
    tips: ['Unquoted words in patterns are plain text, so <code>child =></code> matches the text “child”.', 'Put specific arms first and the catch-all <code>_</code> last.'],
    files: {
      'main.dream': `~ Age = 34

~ Stage = match Age
    0..12 => "child"
    13..19 => "teen"
    20..64 => "adult"
    _ => "elder"

~ Lens = match Stage { child => 24, teen => 35, adult => 50, _ => 85 }

~ Mood = match Age
    _ when it % 2 == 0 => "even-tempered"
    _ => "odd-ball"

Portrait: ~Stage, shot on a ~Lens mm lens, feeling ~Mood.
`,
    },
    tasks: [
      {
        id: 'teen',
        text: 'Change <code>Age</code> so the stage becomes <strong>teen</strong> and watch the lens follow.',
        hint: 'Any age from 13 to 19 works.',
        check: (r) => valueOf(r, 'Stage') === 'teen' && valueOf(r, 'Lens') === 35,
      },
      {
        id: 'ancient',
        text: 'Add an <code>ancient</code> arm for ages of 100 or more — above the catch-all <code>_ =></code>.',
        hint: 'For example <code>100..999 => "ancient"</code> (or <code>_ when it &gt;= 100 => "ancient"</code>) before <code>_ => "elder"</code>.',
        check: (r, files) => /ancient/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Age = 15

~ Stage = match Age
    0..12 => "child"
    13..19 => "teen"
    20..64 => "adult"
    100..999 => "ancient"
    _ => "elder"

~ Lens = match Stage { child => 24, teen => 35, adult => 50, _ => 85 }

~ Mood = match Age
    _ when it % 2 == 0 => "even-tempered"
    _ => "odd-ball"

Portrait: ~Stage, shot on a ~Lens mm lens, feeling ~Mood.
`,
    },
    focus: 'values',
  },

  {
    id: 'functions',
    title: 'Functions: your own helpers',
    emoji: '🔧',
    construct: ['~ fn name(args) = expr', 'default values', 'named arguments'],
    tagline: 'Name a recipe once; cook it anywhere.',
    intro: [
      '<p><code>~ fn name(a, b = 2) = expression</code> defines a <strong>function</strong>. Parameters may have <strong>defaults</strong>, and when you call it you can pass arguments by position or by <strong>name</strong>: <code>frame("a harbour", style = "charcoal sketch")</code>. A function can call other functions — even itself (<em>recursion</em>), as in the factorial below.</p>',
      '<p>Functions are values too, and they see the names around them. You can define a function <em>after</em> the line that uses it, and a function may share its name with a variable (<code>~ Count</code> vs <code>count(…)</code>) without clashing.</p>',
    ],
    syntax: ['~ fn shout(text) = upper(text) + "!"', '~ fn frame(subject, style = "oil painting") = style + " of " + subject', 'frame("a harbour", style = "charcoal")'],
    tips: ['Start a line with <code>~shout(…)</code> (no space) and it is prose that calls the function.', 'A runaway recursion is stopped with a friendly message instead of hanging.'],
    files: {
      'main.dream': `~ fn shout(text) = upper(text) + "!"
~ fn frame(subject, style = "oil painting") = style + " of " + subject
~ fn fact(n) = if n <= 1 then 1 else n * fact(n - 1)

~shout("the moon is up")
~frame("a lighthouse")
~frame("a harbour", style = "charcoal sketch")
Five factorial is ~fact(5).
`,
    },
    tasks: [
      {
        id: 'wrap',
        text: 'Write your own function <code>wrap(text, left = "«", right = "»")</code> that surrounds text, and use it in a sentence.',
        hint: '<code>~ fn wrap(text, left = "«", right = "»") = left + text + right</code>, then <code>~wrap("hello")</code>.',
        check: (r) => binding(r, 'wrap')?.kind === 'fn' && promptOf(r).includes('«') && noErrors(r),
      },
      {
        id: 'named',
        text: 'Call <code>wrap</code> once with a <em>named</em> argument, such as <code>left = "["</code>.',
        hint: '<code>~wrap("hi", left = "[", right = "]")</code>',
        check: (r, files) => /wrap\([^)]*\b(left|right)\s*=/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ fn shout(text) = upper(text) + "!"
~ fn frame(subject, style = "oil painting") = style + " of " + subject
~ fn fact(n) = if n <= 1 then 1 else n * fact(n - 1)
~ fn wrap(text, left = "«", right = "»") = left + text + right

~shout("the moon is up")
~frame("a lighthouse")
~frame("a harbour", style = "charcoal sketch")
Five factorial is ~fact(5).
~wrap("quiet") and ~wrap("loud", left = "[", right = "]")
`,
    },
    focus: 'dream',
  },

  {
    id: 'block-functions',
    title: 'Longer functions: let and return',
    emoji: '🏗️',
    construct: ['~ fn name(args):', 'let', 'return', 'if / else inside'],
    tagline: 'When one expression is not enough, indent a body.',
    intro: [
      '<p>End the header with a <strong>colon</strong> instead of <code>=</code> and indent the body. Inside, <code>let x = …</code> gives a step a name (it disappears when the function ends), <code>if … :</code> / <code>else :</code> branch, and <code>return</code> hands back the answer early. The last expression also counts as the result.</p>',
      '<p>Bodies can use everything you have learned: <code>match</code>, lists, other functions. They stop at the first error — and DreamScript tells you which line.</p>',
    ],
    syntax: ['~ fn describe(age):\n    let stage = match age\n        0..12 => "child"\n        _ => "adult"\n    if age >= 65:\n        return "a wise elder"\n    return stage', 'let total = a + b'],
    tips: ['Indent with 4 spaces; the body ends where the indentation returns.', 'Anything defined with <code>let</code> is private to the call.'],
    files: {
      'main.dream': `~ fn describe(age):
    let stage = match age
        0..12 => "child"
        _ => "adult"
    if age >= 65:
        return "a wise elder"
    return stage + " in a linen coat"

Portraits: ~describe(9), ~describe(30), ~describe(80).
`,
    },
    tasks: [
      {
        id: 'infant',
        text: 'Add an early <code>return</code> for babies — <code>if age &lt; 2</code> should give <em>an infant</em> — and call <code>~describe(1)</code>.',
        hint: 'Put <code>if age &lt; 2:</code> and an indented <code>return "an infant"</code> before the last line, then add <code>~describe(1)</code> to a sentence.',
        check: (r) => promptOf(r).includes('an infant') && noErrors(r),
      },
      {
        id: 'second-let',
        text: 'Use <code>let</code> once more to name another step in the function.',
        hint: 'For example <code>let coat = "linen"</code> and then use <code>coat</code> in the final string.',
        check: (r, files) => countMatches(source(files), /^\s*let\s/gm) >= 2 && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ fn describe(age):
    let stage = match age
        0..12 => "child"
        _ => "adult"
    let coat = "linen"
    if age < 2:
        return "an infant"
    if age >= 65:
        return "a wise elder"
    return stage + " in a " + coat + " coat"

Portraits: ~describe(1), ~describe(9), ~describe(30), ~describe(80).
`,
    },
    focus: 'dream',
  },

  {
    id: 'lambdas',
    title: 'Lambdas and pipelines',
    emoji: '🚰',
    construct: ['x => expr', 'map / filter / reduce', 'a |> f(b)'],
    tagline: 'Tiny unnamed functions, chained left to right.',
    intro: [
      '<p>A <strong>lambda</strong> is a function without a name: <code>c => upper(c)</code> or <code>(a, b) => a + b</code>. You pass lambdas to helpers like <code>map</code> (transform every item), <code>filter</code> (keep some), <code>reduce</code> (fold into one value), <code>sort</code>, <code>find</code>, <code>count</code>, <code>some</code> and <code>every</code>.</p>',
      '<p>The <strong>pipeline</strong> operator <code>|></code> feeds the value on its left into the function on its right as the <em>first argument</em>: <code>Palette |> map(…) |> join(" / ")</code> reads like a recipe, top to bottom. Dot-calls chain just as well — pick the style you like.</p>',
    ],
    syntax: ['Palette |> map(c => upper(c)) |> join(" / ")', 'Palette |> filter(c => c.length <= 4)', 'reduce(list, (a, b) => a + b)'],
    tips: ['Lambdas see the names around them (they are <em>closures</em>).', 'A lambda may take the item and its index: <code>(c, i) => …</code>.'],
    files: {
      'main.dream': `~ Palette = coral, teal, gold, violet, sage

// A lambda is a tiny function without a name.
~ Shouted = Palette |> map(c => upper(c)) |> join(" / ")
~ Short = Palette |> filter(c => c.length <= 4)
~ Big = Palette |> count(c => c.length > 4)
~ Longest = Palette |> reduce((a, b) => if b.length > a.length then b else a)

Loud: ~Shouted
Short names: ~Short (~Short.length of ~Palette.length); long ones: ~Big.
Longest: ~Longest
`,
    },
    tasks: [
      {
        id: 'bang',
        text: 'Change the <code>map</code> in <code>Shouted</code> so every item also ends with an exclamation mark.',
        hint: '<code>c => upper(c) + "!"</code>',
        check: (r) => String(valueOf(r, 'Shouted') ?? '').includes('!') && noErrors(r),
      },
      {
        id: 'sorted',
        text: 'Add a name <code>Sorted</code>: a pipeline that <em>filters</em> the long colors and then <em>sorts</em> them.',
        hint: '<code>~ Sorted = Palette |> filter(c => c.length > 4) |> sort</code>',
        check: (r, files) =>
          Array.isArray(valueOf(r, 'Sorted')) && valueOf(r, 'Sorted').length >= 2 && /filter/.test(source(files)) && /sort/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Palette = coral, teal, gold, violet, sage

~ Shouted = Palette |> map(c => upper(c) + "!") |> join(" / ")
~ Short = Palette |> filter(c => c.length <= 4)
~ Big = Palette |> count(c => c.length > 4)
~ Longest = Palette |> reduce((a, b) => if b.length > a.length then b else a)
~ Sorted = Palette |> filter(c => c.length > 4) |> sort

Loud: ~Shouted
Short names: ~Short (~Short.length of ~Palette.length); long ones: ~Big.
Longest: ~Longest. Sorted: ~Sorted
`,
    },
    focus: 'values',
  },

  {
    id: 'loops',
    title: 'Ranges, comprehensions and loops',
    emoji: '🔁',
    construct: ['1..5  0..<5  by', '[ x for x in xs if … ]', '~ for … in …:', '~ if / ~ else'],
    tagline: 'Repeat yourself without repeating yourself.',
    intro: [
      '<p><code>1..5</code> is a <strong>range</strong> (both ends included), <code>0..&lt;5</code> leaves the end out, and <code>1..10 by 3</code> steps. A <strong>comprehension</strong> builds a list from another: <code>[ n * n for n in 1..6 if n % 2 == 0 ]</code> — “the squares of the even numbers”.</p>',
      '<p>To repeat whole <em>lines</em>, start a statement with <code>~ for x in list:</code> and indent the body. <code>index</code> counts from 0 (or name your own: <code>for c, i in list</code>). Two sources give a grid: <code>for a in xs, b in ys</code>. <code>~ if</code> / <code>~ else</code> choose which lines appear. The <code>~</code> matters: without it, “for a moment…” would be ordinary prose!</p>',
    ],
    syntax: ['~ Squares = [ n * n for n in 1..6 if n % 2 == 0 ]', '~ for c, i in Colours:\n    Panel ~(i + 1) is ~c.', '~ if Colours.length > 2:\n    busy\n~ else:\n    calm'],
    tips: ['Loops never run away: a loop over a huge range stops with a message.', '<code>~ for … if cond:</code> filters while it loops.'],
    files: {
      'main.dream': `~ Colours = coral, teal, gold

~ Squares = [ n * n for n in 1..6 if n % 2 == 0 ]
Even squares: ~Squares

~ for c, i in Colours:
    Panel ~(i + 1) is painted ~c.

~ if Colours.length > 2:
    The room feels busy.
~ else:
    The room feels calm.

~ for a in Colours, b in 1..2:
    Swatch ~a-~b
`,
    },
    tasks: [
      {
        id: 'fourth',
        text: 'Add a <em>fourth</em> color and find <strong>Panel 4</strong> in the dream.',
        hint: 'Add a comma and another color to the <code>Colours</code> line.',
        check: (r) => Array.isArray(valueOf(r, 'Colours')) && valueOf(r, 'Colours').length >= 4 && promptOf(r).includes('Panel 4'),
      },
      {
        id: 'calm',
        text: 'Change the condition so the <em>calm</em> branch is the one that appears.',
        hint: 'Compare with a bigger number: <code>Colours.length > 5</code>.',
        check: (r) => promptOf(r).includes('feels calm') && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Colours = coral, teal, gold, sage

~ Squares = [ n * n for n in 1..6 if n % 2 == 0 ]
Even squares: ~Squares

~ for c, i in Colours:
    Panel ~(i + 1) is painted ~c.

~ if Colours.length > 5:
    The room feels busy.
~ else:
    The room feels calm.

~ for a in Colours, b in 1..2:
    Swatch ~a-~b
`,
    },
    focus: 'dream',
  },
];
