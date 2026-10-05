// Stage 2 — Light Sleep: collections and structure.
import { dream, source, binding, valueOf, promptOf, noErrors } from './helpers.js';

export default [
  {
    id: 'lists',
    title: 'Lists: commas make collections',
    emoji: '📚',
    construct: ['comma lists', 'indexing [ ]', '.length', '1..5 ranges'],
    tagline: 'Put commas between things and you have a list.',
    intro: [
      '<p>At the top level of a value, <strong>commas make a list</strong> — no brackets needed. <code>~ Palette = coral, teal, gold</code> is a list of three colors. Quote an item when it must contain a comma itself: <code>"golden hour, late"</code>.</p>',
      '<p>Reach into a list with <code>[ ]</code>: <code>Palette[0]</code> is the <em>first</em> item (counting starts at 0) and <code>Palette[-1]</code> is the last. <code>.length</code> counts the items, and <code>1..5</code> is a <strong>range</strong> — a ready-made list of numbers. Dropping a whole list into a sentence joins it with commas.</p>',
    ],
    syntax: ['~ Palette = coral, teal, gold', '~Palette[0]   ~Palette[-1]   ~Palette.length', '~ Tags = ai, "golden hour, late"', '~(1..5)'],
    tips: ['Each item keeps its own type: <code>#ffd700</code> stays a color while <code>coral</code> is text.', '<code>+</code> joins lists: <code>[1, 2] + [3]</code>.'],
    files: {
      'main.dream': `~ Palette = coral, teal, #ffd700, deep violet
~ Tags = ai, "golden hour, late", cinematic
~ Seeds = 42, 555, 1024

First colour: ~Palette[0]. Last: ~Palette[-1].
The palette has ~Palette.length colours: ~Palette
Tag list: ~Tags
Counting: ~(1..5)
`,
    },
    tasks: [
      {
        id: 'fifth',
        text: 'Add a fifth color to <code>Palette</code> and watch the count change.',
        hint: 'Add another comma and a color at the end of the <code>Palette</code> line.',
        check: (r) => Array.isArray(valueOf(r, 'Palette')) && valueOf(r, 'Palette').length >= 5,
      },
      {
        id: 'index',
        text: 'Print the <em>third</em> color with an index. Remember: counting starts at 0.',
        hint: 'Write <code>~Palette[2]</code> in a sentence.',
        check: (r, files) => /Palette\s*\[\s*2\s*\]/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Palette = coral, teal, #ffd700, deep violet, sage
~ Tags = ai, "golden hour, late", cinematic
~ Seeds = 42, 555, 1024

First colour: ~Palette[0]. Last: ~Palette[-1]. Third: ~Palette[2].
The palette has ~Palette.length colours: ~Palette
Tag list: ~Tags
Counting: ~(1..5)
`,
    },
    focus: 'values',
  },

  {
    id: 'structs',
    title: 'Structs: indentation groups things',
    emoji: '🗂️',
    construct: ['~ name:', 'indented children', 'a.b.c'],
    tagline: 'A trailing colon opens a group; indentation fills it.',
    intro: [
      '<p>When several values belong together, end the name with a <strong>colon</strong> and indent the children below it. Each child is an ordinary <code>key = value</code> line, and a child that ends in a colon opens a <em>nested</em> group. Reach inside with dots: <code>camera.lens.focal</code>.</p>',
      '<p>Children can use names defined earlier — even their own earlier siblings. Open the <strong>Values</strong> tab to see the structure as a tree. The block ends when the indentation returns to the left.</p>',
    ],
    syntax: ['~ camera:\n    fov = 60\n    lens:\n        focal = 50', '~camera.lens.focal'],
    tips: ['Use 4 spaces per level (the editor does this when you press Tab).', 'A struct is just an object — everything in the next lesson works on it too.'],
    files: {
      'main.dream': `~ camera:
    fov = 60
    position = 0, 1.6, 3
    lens:
        focal = 50
        aperture = 1.8

~ scene:
    time = golden hour
    weather = clear, misty
    lighting:
        key = warm
        rim = #ffd700

Shot on a ~camera.lens.focal mm lens at f/~camera.lens.aperture, ~scene.time, ~scene.weather.
The key light is ~scene.lighting.key with a ~scene.lighting.rim rim.
`,
    },
    tasks: [
      {
        id: 'coating',
        text: 'Add a <code>coating</code> child inside <code>lens</code> (for example <code>coating = anti-reflective</code>).',
        hint: 'Indent the new line to line up with <code>focal</code> and <code>aperture</code>.',
        check: (r) => {
          const lens = valueOf(r, 'camera')?.lens;
          return !!lens && 'coating' in lens;
        },
      },
      {
        id: 'subject',
        text: 'Add a third struct with at least two children — say <code>~ subject:</code> — and use one of its values in a sentence.',
        hint: 'Try <code>~ subject:</code> with <code>kind = lighthouse keeper</code> and <code>age = 60</code>, then write <code>~subject.kind</code>.',
        check: (r) => r.values.some((v) => v.value?.t === 'obj' && v.value.n >= 2 && !['camera', 'scene'].includes(v.name.toLowerCase())) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ camera:
    fov = 60
    position = 0, 1.6, 3
    lens:
        focal = 50
        aperture = 1.8
        coating = anti-reflective

~ scene:
    time = golden hour
    weather = clear, misty
    lighting:
        key = warm
        rim = #ffd700

~ subject:
    kind = lighthouse keeper
    age = 60

Shot on a ~camera.lens.focal mm lens at f/~camera.lens.aperture, ~scene.time, ~scene.weather.
The key light is ~scene.lighting.key with a ~scene.lighting.rim rim.
A ~subject.kind, ~subject.age years old.
`,
    },
    focus: 'values',
  },

  {
    id: 'objects',
    title: 'Objects: { } on one line',
    emoji: '🧳',
    construct: ['{ key = value }', '...spread', '?.  and  ??'],
    tagline: 'Compact, strict and JSON-friendly.',
    intro: [
      '<p>An <strong>object</strong> packs named values into braces: <code>{ seed = 7, size = "wide" }</code>. Inside braces DreamScript is strict so nothing is ambiguous: <strong>text needs quotes</strong>, lists use <code>[ ]</code>, entries are separated by commas (a trailing comma is fine) and the object may span many lines. <code>key: value</code> is accepted too, so JSON-style habits work.</p>',
      '<p>Three handy tricks: the <strong>shorthand</strong> <code>{ Name }</code> means <code>{ Name = Name }</code>; <strong>spread</strong> <code>...other</code> copies every entry (later entries win); and <code>a?.b ?? "fallback"</code> reads a value that might be missing and supplies a default.</p>',
    ],
    syntax: ['~ hero = { Name, age = 24, tags = ["a", "b"] }', '~ older = { ...hero, age = 71 }', '~(hero.shoes ?? "barefoot")', 'hero.scarf?.colour'],
    tips: ['Asking for a key that does not exist gives a warning with a “did you mean…?” — unless you wrote <code>??</code> or <code>?.</code>, which says “missing is fine”.'],
    files: {
      'main.dream': `~ Name = "Mira"
~ hero = {
    Name,
    age = 24,
    outfit = { top = "linen", bottom = "wool skirt" },
    colours = ["sage", "ivory"],
}

// Spread copies every entry; later entries win.
~ older = { ...hero, age = 71 }

~Name is ~hero.age, in a ~hero.outfit.top top. Later, ~older.age.
Shoes? ~(hero.shoes ?? "barefoot")
Scarf colour: ~(hero.scarf?.colour ?? "none")
`,
    },
    tasks: [
      {
        id: 'mood',
        text: 'Add a <code>mood = "calm"</code> entry to <code>hero</code> and mention it with <code>~hero.mood</code>.',
        hint: 'Remember the comma after the previous entry, and quotes around the text.',
        check: (r) => !!valueOf(r, 'hero')?.mood && /calm|\w/.test(promptOf(r)) && promptOf(r).includes(valueOf(r, 'hero').mood),
      },
      {
        id: 'sidekick',
        text: 'Create <code>sidekick</code> by spreading <code>hero</code> and overriding <code>Name</code> and <code>age</code>.',
        hint: '<code>~ sidekick = { ...hero, Name = "Orrin", age = 9 }</code>',
        check: (r) => {
          const s = valueOf(r, 'sidekick');
          const h = valueOf(r, 'hero');
          return !!s && !!h && s.Name !== h.Name && s.outfit?.top === h.outfit?.top;
        },
      },
    ],
    solution: {
      'main.dream': `~ Name = "Mira"
~ hero = {
    Name,
    age = 24,
    mood = "calm",
    outfit = { top = "linen", bottom = "wool skirt" },
    colours = ["sage", "ivory"],
}

~ older = { ...hero, age = 71 }
~ sidekick = { ...hero, Name = "Orrin", age = 9 }

~Name is ~hero.age, in a ~hero.outfit.top top, feeling ~hero.mood. Later, ~older.age.
Shoes? ~(hero.shoes ?? "barefoot")
Scarf colour: ~(hero.scarf?.colour ?? "none")
Beside her walks ~sidekick.Name, aged ~sidekick.age.
`,
    },
    focus: 'values',
  },

  {
    id: 'enums',
    title: 'Enums: a menu of allowed values',
    emoji: '🧭',
    construct: ['~( enum Name )', '/// doc comments', 'Name.Member'],
    tagline: 'Name the choices once; get docs and safety everywhere.',
    intro: [
      '<p>An <strong>enum</strong> is a named menu of values: <code>~( enum ImageSizes … )</code> with a closing <code>)</code> line. Each member is <code>Member = "value"</code>; leave off the <code>= value</code> and the member\'s value is its own name. Use one as <code>ImageSizes.Landscape_4_3</code>.</p>',
      '<p>Comments that start with <code>///</code> are <strong>doc comments</strong>: they attach to the next member and appear in the Values tab and on hover. You can loop over an enum (<code>~ for s in ImageSizes:</code>) and — in a later lesson — use it as a <em>type</em> so nothing outside the menu sneaks in.</p>',
    ],
    syntax: ['~( enum Sizes\n    /// Wide picture.\n    Wide = "landscape_16_9"\n)', '~ Chosen = Sizes.Wide', '~ for s in Sizes:'],
    tips: ['Names are forgiving: <code>sizes.wide</code> works too — which also means a variable called <code>size</code> would clash with an enum called <code>Size</code>.', 'Doc comments make great tooltips for teammates.'],
    files: {
      'main.dream': `~( enum ImageSizes
    /// Balanced landscape composition.
    Landscape_4_3 = "landscape_4_3"

    /// Wide cinematic composition.
    Landscape_16_9 = "landscape_16_9"

    /// Square composition for icons and avatars.
    Square = "square_hd"

    /// Vertical portrait composition.
    Portrait_3_4 = "portrait_3_4"
)

~ Chosen = ImageSizes.Landscape_16_9
Rendering at ~Chosen.

~ for s in ImageSizes:
    Available: ~s
`,
    },
    tasks: [
      {
        id: 'member',
        text: 'Add a fifth member with its own <code>///</code> doc comment and see it in the loop.',
        hint: 'Copy a member: a <code>///</code> line, then <code>Name = "value"</code>, inside the parentheses.',
        check: (r) => {
          const e = binding(r, 'ImageSizes')?.value;
          return e?.t === 'obj' && e.n >= 5 && e.entries.filter((x) => x[2]).length >= 5;
        },
      },
      {
        id: 'choose',
        text: 'Pick a different member for <code>Chosen</code>.',
        hint: 'Change <code>ImageSizes.Landscape_16_9</code> to another member, e.g. <code>ImageSizes.Square</code>.',
        check: (r) => valueOf(r, 'Chosen') !== undefined && valueOf(r, 'Chosen') !== 'landscape_16_9' && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~( enum ImageSizes
    /// Balanced landscape composition.
    Landscape_4_3 = "landscape_4_3"

    /// Wide cinematic composition.
    Landscape_16_9 = "landscape_16_9"

    /// Square composition for icons and avatars.
    Square = "square_hd"

    /// Vertical portrait composition.
    Portrait_3_4 = "portrait_3_4"

    /// Tall phone wallpaper.
    Portrait_16_9 = "portrait_16_9"
)

~ Chosen = ImageSizes.Square
Rendering at ~Chosen.

~ for s in ImageSizes:
    Available: ~s
`,
    },
    focus: 'values',
  },

  {
    id: 'helpers',
    title: 'Built-in helpers and dot-calls',
    emoji: '🧰',
    construct: ['function calls', 'x.method()', 'text / list / math / color helpers'],
    tagline: 'About ninety ready-made tools — call them two ways.',
    intro: [
      '<p>DreamScript ships with helper functions for text (<code>upper</code>, <code>title</code>, <code>join</code>…), lists (<code>sort</code>, <code>take</code>, <code>unique</code>…), numbers (<code>round</code>, <code>max</code>, <code>clamp</code>…) and colors (<code>mix</code>, <code>shade</code>, <code>complement</code>, <code>palette</code>…). Call them the classic way, <code>upper(Title)</code>…</p>',
      '<p>…or with a <strong>dot-call</strong>: <code>Title.upper()</code>. <code>a.f(b)</code> is simply <code>f(a, b)</code>, so helpers chain left to right: <code>Seeds.sort().reverse()</code>. Hover a helper in the editor, or start typing one, to see its signature.</p>',
    ],
    syntax: ['upper(Title)   Title.upper()', 'Palette.join(" → ")', 'Seeds.sort().reverse()', 'mix(teal, coral)   shade(teal, 0.4)'],
    tips: ['Colors go in by name (<code>teal</code>) or hex (<code>#008080</code>) and come out as color values.', 'A typo such as <code>uper()</code> suggests <code>upper</code> in Problems.'],
    files: {
      'main.dream': `~ Title = moonlit harbour
~ Palette = teal, coral, gold
~ Seeds = 7, 21, 13, 3

Title case: ~Title.title()
Shouting: ~upper(Title)
Joined with arrows: ~Palette.join(" → ")
Sorted seeds: ~Seeds.sort(), biggest ~max(Seeds), average ~round(avg(Seeds), 1)
A darker teal: ~shade(teal, 0.4)
Teal mixed with coral: ~mix(teal, coral)
`,
    },
    tasks: [
      {
        id: 'descending',
        text: 'Print the seeds sorted from <em>largest to smallest</em> by chaining a second helper.',
        hint: 'After <code>Seeds.sort()</code> add <code>.reverse()</code>.',
        check: (r) => promptOf(r).includes('21, 13, 7, 3'),
      },
      {
        id: 'new-helper',
        text: 'Use one helper you have not seen yet — try <code>complement</code>, <code>lower</code>, <code>repeat</code>, <code>take</code>, <code>unique</code> or <code>words</code>.',
        hint: 'Start typing a name after a dot in the editor and pick from the suggestions.',
        check: (r, files) =>
          /\b(complement|lower|repeat|take|unique|words|slug|capitalize|lighten|darken|tint|first|last|drop|flatten|zip|clamp|lerp)\s*\(|\.(complement|lower|repeat|take|unique|words|slug|capitalize|lighten|darken|tint|first|last|drop|flatten|zip|clamp|lerp)\s*\(/.test(source(files)) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Title = moonlit harbour
~ Palette = teal, coral, gold
~ Seeds = 7, 21, 13, 3

Title case: ~Title.title()
Shouting: ~upper(Title)
Joined with arrows: ~Palette.join(" → ")
Sorted seeds: ~Seeds.sort().reverse(), biggest ~max(Seeds), average ~round(avg(Seeds), 1)
A darker teal: ~shade(teal, 0.4)
Teal mixed with coral: ~mix(teal, coral)
The opposite of teal: ~complement(teal)
`,
    },
    focus: 'dream',
  },
];
