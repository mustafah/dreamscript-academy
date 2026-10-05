// Stage 5 (part 1) — Lucid: rendering.
import { valueOf, noErrors, allRenders } from './helpers.js';

export default [
  {
    id: 'renderer',
    title: 'Renderer blocks: make the pictures',
    emoji: '🎬',
    construct: ['~( renderer )', 'vendor/model(params)', 'the Renders tab'],
    tagline: 'The dream is the prompt; the renderer says who paints it.',
    intro: [
      '<p>Everything you have written so far is the <strong>prompt</strong>. A <code>~( renderer … )</code> block says which image <strong>models</strong> should paint it. Each line calls one model — <code>vendor/model(param = value, …)</code> — and the dream text is passed in as <code>prompt</code> automatically (give a <code>prompt =</code> of your own to override it).</p>',
      '<p>The compiler <strong>checks your parameters against the model</strong>: misspell <code>seeed</code>, ask for nine images where four is the maximum, or pick an unknown <code>image_size</code> and the <strong>Problems</strong> tab explains. Open the <strong>Renders</strong> tab to see each call, where every value came from, and a simulated preview — nothing is sent anywhere in this playground.</p>',
    ],
    syntax: ['~( renderer\n    fal-ai/flux/schnell(seed = 1234, num_images = 2)\n    fal-ai/flux/dev(guidance_scale = 7.5)\n)'],
    tips: ['Barewords like <code>landscape_16_9</code> are plain text, so you rarely need quotes for model settings.', 'The block closes with a line that contains only <code>)</code>.'],
    files: {
      'main.dream': `A lighthouse on a cliff at dusk, waves folding into silver foam

// The dream above is the prompt. This block says who should paint it.
~( renderer
    fal-ai/flux/schnell(seed = 1234, num_images = 2, image_size = landscape_16_9)
)
`,
    },
    tasks: [
      {
        id: 'four',
        text: 'Ask the first call for <strong>4</strong> images.',
        hint: 'Change <code>num_images = 2</code> to <code>num_images = 4</code> and look at the Renders tab.',
        check: (r) => allRenders(r)[0]?.count === 4,
      },
      {
        id: 'second-model',
        text: 'Add a second call — <code>fal-ai/flux/dev</code> — with <code>guidance_scale = 7.5</code>.',
        hint: 'A new line inside the block: <code>fal-ai/flux/dev(guidance_scale = 7.5)</code>.',
        check: (r) => allRenders(r).length >= 2 && allRenders(r).some((j) => j.params.guidance_scale === 7.5) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `A lighthouse on a cliff at dusk, waves folding into silver foam

~( renderer
    fal-ai/flux/schnell(seed = 1234, num_images = 4, image_size = landscape_16_9)
    fal-ai/flux/dev(guidance_scale = 7.5)
)
`,
    },
    focus: 'renders',
  },

  {
    id: 'params',
    title: 'Params blocks, spread and layering',
    emoji: '🧬',
    construct: ['~( Params )', 'passing a block', '...spread', 'reusing a name'],
    tagline: 'Write your settings once; layer variations on top.',
    intro: [
      '<p>Settings you repeat belong in a <strong>params block</strong>: <code>~( Common … )</code> is a named group of <code>key = value</code> lines. Pass it as the <em>first argument</em> of a model call and add named arguments after it — the named ones <strong>win</strong>. Objects and structs work the same way, and <code>...spread</code> builds a new one from an old one.</p>',
      '<p>A name may also be <strong>redefined using its previous value</strong>: <code>~ hq = { ...hq, seed = hq.seed + 1 }</code>. Each line layers a change on top of the last, which is perfect for “the same settings, one step further”. The Renders tab labels every parameter with where it came from: <em>named</em>, <em>Common</em>, <em>dream</em>…</p>',
    ],
    syntax: ['~( Common\n    seed = 1234\n    num_images = 2\n)', 'fal-ai/flux/dev(Common, seed = 9)', '~ hq = { ...hq, seed = hq.seed + 1 }'],
    tips: ['<code>title = "…"</code> is yours: it labels a call in the Renders tab and is not sent to the model.', 'Referring to a name that does not exist yet (even its own) is an error — the message tells you.'],
    files: {
      'main.dream': `~( Common
    seed = 1234
    image_size = landscape_4_3
    num_images = 2
)

~ hq = { ...Common, num_inference_steps = 50, num_images = 1 }

Moonlit harbour, tall ships at anchor

~( renderer
    fal-ai/flux/schnell(Common, title = "draft")
    fal-ai/flux/dev(hq, guidance_scale = 7.5, title = "final")
)
`,
    },
    tasks: [
      {
        id: 'layer',
        text: 'Layer a change on <code>hq</code> by redefining it from its <em>previous</em> value: <code>~ hq = { ...hq, seed = hq.seed + 1 }</code>.',
        hint: 'Put that line right after the first <code>~ hq = …</code> line.',
        check: (r) => valueOf(r, 'hq')?.seed === 1235 && noErrors(r),
      },
      {
        id: 'third',
        text: 'Add a <em>third</em> call that reuses <code>Common</code> but with a different <code>seed</code>.',
        hint: '<code>fal-ai/flux/schnell(Common, seed = 99, title = "variation")</code>',
        check: (r) => allRenders(r).length >= 3 && allRenders(r).some((j) => j.params.seed !== 1234 && j.origin?.image_size === 'Common'),
      },
    ],
    solution: {
      'main.dream': `~( Common
    seed = 1234
    image_size = landscape_4_3
    num_images = 2
)

~ hq = { ...Common, num_inference_steps = 50, num_images = 1 }
~ hq = { ...hq, seed = hq.seed + 1 }

Moonlit harbour, tall ships at anchor

~( renderer
    fal-ai/flux/schnell(Common, title = "draft")
    fal-ai/flux/dev(hq, guidance_scale = 7.5, title = "final")
    fal-ai/flux/schnell(Common, seed = 99, title = "variation")
)
`,
    },
    focus: 'renders',
  },

  {
    id: 'fanout',
    title: 'Fan-out: loops and choices in renderers',
    emoji: '🎆',
    construct: ['for … in … (jobs)', 'if (jobs)', 'a | b between models', 'index'],
    tagline: 'One block, a whole contact sheet.',
    intro: [
      '<p>Inside a renderer block you can <strong>loop</strong>: <code>for c in Palette, mm in Lenses</code> produces one job per color and lens — a 3 × 3 grid of nine renders from three lines. Put the job on an indented line below the <code>for</code>. <code>index</code> counts the iterations (0, 1, 2…), so <code>seed = 100 + index</code> gives every job its own seed.</p>',
      '<p><code>if</code> lines skip jobs you do not want, and a <code>|</code> <em>between two calls</em> is a variation over <strong>models</strong>: <code>fal-ai/flux/schnell(…) | fal-ai/flux/dev(…)</code> compiles to one dream per model. Sweeps like this are how you explore seeds, palettes and lenses without copy-pasting.</p>',
    ],
    syntax: ['for c in Palette, mm in Lenses\n    fal-ai/flux/schnell(seed = 100 + index)', 'if mm != 50\n    fal-ai/flux/dev(…)', 'modelA(…) | modelB(…)'],
    tips: ['You can filter while looping: <code>for c in Palette, mm in Lenses if mm != 50</code>.', 'Jobs run in the order they are generated; the Renders tab lists them all.'],
    files: {
      'main.dream': `~ Palette = coral, teal, gold
~ Lenses = 24, 50, 85

Portrait of a lighthouse keeper

~( renderer
    for c in Palette, mm in Lenses
        fal-ai/flux/schnell(seed = 100 + index, prompt = "keeper, ~c light, ~mm mm lens")
)
`,
    },
    tasks: [
      {
        id: 'skip',
        text: 'Skip the <strong>50 mm</strong> lens so only six jobs remain.',
        hint: 'Filter while looping: <code>for c in Palette, mm in Lenses if mm != 50</code>.',
        check: (r) => allRenders(r).filter((j) => /^keeper/.test(j.params.prompt)).length === 6 && noErrors(r),
      },
      {
        id: 'two-models',
        text: 'Offer <em>two models</em> with <code>|</code> between calls and see the dream count change.',
        hint: 'Write two calls on one line separated by <code>|</code>, e.g. <code>fal-ai/flux/schnell(seed = 1) | fal-ai/flux/dev(seed = 1)</code>.',
        check: (r) => r.total >= 2 && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~ Palette = coral, teal, gold
~ Lenses = 24, 50, 85

Portrait of a lighthouse keeper

~( renderer
    for c in Palette, mm in Lenses if mm != 50
        fal-ai/flux/schnell(seed = 100 + index, prompt = "keeper, ~c light, ~mm mm lens")
    fal-ai/flux/schnell(seed = 7) | fal-ai/flux/dev(seed = 7)
)
`,
    },
    focus: 'renders',
  },

  {
    id: 'pipelines',
    title: 'Named jobs and pipelines',
    emoji: '⛓️',
    construct: ['name = model(…)', 'result.images[0].url', 'chained steps'],
    tagline: 'Generate, upscale, refine — each step feeds the next.',
    intro: [
      '<p>Give a job a <strong>name</strong> — <code>base = fal-ai/flux/schnell(…)</code> — and later jobs in the same block can use its <strong>result</strong>: <code>base.images[0].url</code> is the first picture, <code>base.seed</code> the seed, <code>base.count</code> how many there are. Chain a few and you have a pipeline: generate, upscale, refine.</p>',
      '<p>Results here are <em>simulated</em> (a stable fake URL per call) so you can practice the wiring: the compiler checks that <code>base</code> exists, that <code>images[1]</code> is in range, and that the parameters suit the next model. Order matters — a job can only use results from jobs above it.</p>',
    ],
    syntax: ['base = fal-ai/flux/schnell(num_images = 2)', 'fal-ai/esrgan(image_url = base.images[0].url)', 'base.seed   base.count'],
    tips: ['A named job is visible only inside its renderer block (and inside the loop that made it).', 'Open the Renders tab: the <code>image_url</code> value is exactly the URL of the earlier result.'],
    files: {
      'main.dream': `A misty harbour at first light

~( renderer
    base = fal-ai/flux/schnell(seed = 7, num_images = 2)
    big = fal-ai/esrgan(image_url = base.images[0].url, scale = 2)
    fal-ai/flux/dev(image_url = big.images[0].url, strength = 0.35, guidance_scale = 6)
)
`,
    },
    tasks: [
      {
        id: 'second-image',
        text: 'Make the upscaler use the <em>second</em> base picture (position <code>[1]</code>).',
        hint: 'Change <code>base.images[0].url</code> to <code>base.images[1].url</code>.',
        check: (r) => String(allRenders(r)[1]?.params.image_url || '').endsWith('-2.png'),
      },
      {
        id: 'refined',
        text: 'Name the last job <code>refined</code> and add a <em>fourth</em> step that upscales it again.',
        hint: 'Write <code>refined = fal-ai/flux/dev(…)</code>, then <code>fal-ai/esrgan(image_url = refined.images[0].url, scale = 4)</code>.',
        check: (r) => allRenders(r).length >= 4 && allRenders(r).some((j) => j.name === 'refined') && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `A misty harbour at first light

~( renderer
    base = fal-ai/flux/schnell(seed = 7, num_images = 2)
    big = fal-ai/esrgan(image_url = base.images[1].url, scale = 2)
    refined = fal-ai/flux/dev(image_url = big.images[0].url, strength = 0.35, guidance_scale = 6)
    fal-ai/esrgan(image_url = refined.images[0].url, scale = 4)
)
`,
    },
    focus: 'renders',
  },

  {
    id: 'images',
    title: 'Images: reference pictures',
    emoji: '🖼️',
    construct: ['~( images )', 'repeated keys → lists', 'images.name'],
    tagline: 'Name your reference pictures once and pass them to any model.',
    intro: [
      '<p>An <code>~( images … )</code> block names the <strong>reference pictures</strong> a dream relies on: <code>hero = /assets/lighthouse.png</code>. The names live in a single object called <code>images</code>, so <code>images.hero</code> is the path. Repeat a key — <code>reference = …</code> twice — and the values are collected into a <strong>list</strong>: <code>images.reference[0]</code>, <code>images.reference.length</code>.</p>',
      '<p>Pass them to models that accept pictures (for example <code>image_url</code> with a <code>strength</code> for image-to-image) — exactly like any other value. Paths are plain text, so no quotes are needed.</p>',
    ],
    syntax: ['~( images\n    hero = /assets/hero.png\n    reference = /assets/ref-01.jpg\n    reference = /assets/ref-02.jpg\n)', 'fal-ai/flux/dev(image_url = images.hero, strength = 0.4)'],
    tips: ['In the Values tab, <code>images</code> shows each name with its path or list of paths.', 'Combine with fan-out: <code>for ref in images.reference</code> makes one job per reference.'],
    files: {
      'main.dream': `~( images
    hero = /assets/lighthouse-hero.png
    reference = /assets/ref-01.jpg
    reference = /assets/ref-02.jpg
)

A lighthouse in the style of the reference pictures

~( renderer
    fal-ai/flux/dev(image_url = images.hero, strength = 0.4, title = "from hero")
)
`,
    },
    tasks: [
      {
        id: 'third-reference',
        text: 'Add a <em>third</em> <code>reference</code> picture.',
        hint: 'Repeat the line: <code>reference = /assets/ref-03.jpg</code> inside the block.',
        check: (r) => Array.isArray(valueOf(r, 'images')?.reference) && valueOf(r, 'images').reference.length >= 3,
      },
      {
        id: 'use-reference',
        text: 'Add a second model call that uses the <em>first reference</em> as its <code>image_url</code>.',
        hint: '<code>fal-ai/flux/dev(image_url = images.reference[0], strength = 0.6)</code>',
        check: (r) => allRenders(r).length >= 2 && allRenders(r).some((j) => String(j.params.image_url || '').includes('ref-01')) && noErrors(r),
      },
    ],
    solution: {
      'main.dream': `~( images
    hero = /assets/lighthouse-hero.png
    reference = /assets/ref-01.jpg
    reference = /assets/ref-02.jpg
    reference = /assets/ref-03.jpg
)

A lighthouse in the style of the reference pictures

~( renderer
    fal-ai/flux/dev(image_url = images.hero, strength = 0.4, title = "from hero")
    fal-ai/flux/dev(image_url = images.reference[0], strength = 0.6, title = "from reference")
)
`,
    },
    focus: 'renders',
  },
];
