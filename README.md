# DreamScript Academy

An interactive, zero-build web app that teaches DreamScript — from a first line of prose to lucid,
programmable AI prompts for image and video creation. Edit code on the left, watch it **execute live** on the right,
and explore every variation before committing to a render.

```bash
cd dreamscript-academy
npm start            # http://localhost:5177/dreamscript-academy/
npm run share        # protected HTTPS URL, stays up until Ctrl+C
npm test             # language, lesson and robustness tests (node:test, no dependencies)
npm run test:ui      # browser smoke test (uses the repository's Playwright install)
```

The same compiler also runs standalone from the command line:

```bash
node bin/dream.js run   story.dream --all        # print every dream the script can produce
node bin/dream.js run   story.dream --seed 7     # one random (reproducible) dream
node bin/dream.js check story.dream              # diagnostics + tests, exit code 1 on errors
```

`npm start` serves the *repository root* so the editor can load Monaco from
`../dreamscript-extension/node_modules/monaco-editor` (falls back to a CDN, then to a plain textarea).

## Permanent online preview

The Academy is also deployed by GitHub Actions to a stable, public Pages URL:

`https://mustafah.github.io/dreamscript-academy/#/prose`

This hosted version is mobile-friendly and does not depend on your computer
running a tunnel. It is intentionally public and is not password-protected.
Use `npm run share` when you need a protected preview of local changes instead.

## Temporary sharing

Run `npm run share` when you want to show the mobile-friendly Academy to someone
outside your machine. The command:

* starts the Academy on loopback only;
* creates a fresh, high-entropy access token;
* exposes it through a temporary HTTPS tunnel; and
* prints a `/dreamscript-academy/#/prose` URL that stays available until you
  press `Ctrl+C`.

The token is enforced by the local server, so the tunnel origin without its
access token cannot open the preview. The printed URL contains that token;
treat it like a temporary password and only send it to people you trust. Anyone
with the complete URL can use it until the temporary server is stopped or the
token expires. By default there is no automatic expiry; press `Ctrl+C` to close
both processes.

The share command uses an installed `cloudflared` Quick Tunnel when available.
Otherwise it uses `npx` to download and run the Cloudflare client on demand, so
no permanent tunnel account or dependency is required. To choose explicitly,
set `ACADEMY_TUNNEL=cloudflared` or `ACADEMY_TUNNEL=localtunnel`. The
localtunnel option is kept as a fallback, but Cloudflare is preferred because
it does not add a browser warning page. The default share lasts until you stop
it; use `ACADEMY_SHARE_MINUTES=120 npm run share` when you want an automatic
expiry instead.

## Localization

The Academy language selector supports English, Modern Standard Arabic,
Egyptian Arabic, Saudi Arabic, French, Spanish, Korean, German, Brazilian
Portuguese, Japanese, Simplified Chinese, and Hindi. The selected locale is
remembered in the browser, updates the document language and direction, and
keeps DreamScript code and executable examples unchanged. Arabic locales use a
right-to-left layout; `ar-EG` and `ar-SA` provide regional interface and lesson
wording, while `ar` remains Modern Standard Arabic.

Every lesson has localized intro, tip, task, and hint presentation text. Detailed
translations take precedence where available, while a dependency-free,
lesson-aware fallback keeps the remaining technical lessons localized. DreamScript
code, examples, solutions, and task checks stay unchanged.

## What you get

* **31 lessons in 5 stages** (🌒 Drifting Off → 🌕 Lucid). Every language construct has its own lesson with an
  explanation, a syntax card, tips, an editable starter, hands-on tasks that check themselves, hints and a solution.
* **Live output tabs:** *Dream* (every variation enumerated, with a pager, choices and probabilities),
  *Values* (typed value tree), *Renders* (model calls, parameter provenance, simulated previews),
  *Problems* (friendly diagnostics and test results) and *Under the hood* (the parse tree of the line under the cursor).

## The artist workflow

The Academy puts artists first: generate AI image and video prompts through joyful programming, with the expressive control of prose, the freedom of artistic play, and code working quietly behind the creative flow:

1. **Describe** a scene, mood, camera or movement in ordinary prose. That text becomes the prompt.
2. **Explore** alternatives with `|`, named choices, weights and loops. DreamScript enumerates the resulting
   prompt variations so you can compare directions instead of rewriting them by hand.
3. **Render** the direction through a renderer block. The playground simulates image jobs locally; the same
   prompt structure can be adapted for video models and motion studies when you connect a provider.

Open `#/prose` to see this path, then use the call-to-action buttons to jump straight to the variations
and renderer lessons.

## The language (what the academy teaches)

DreamScript keeps its original idea — *prose is the program* — and grows into a full language:

| Stage | Constructs |
| --- | --- |
| Drifting Off | prose, `//` and `/* */` comments, `~ name = value`, typed literals (numbers, booleans, `#colors`), every shape of `~`, `<~`, math and comparisons, side channels `≈ ☽ ◊` |
| Light Sleep | comma lists, indexing and ranges, indented structs, `{ }` objects (spread, shorthand, `?.`, `??`), enums with `///` docs, ~90 built-in helpers with dot-calls |
| Deep Sleep | `a \| b` variations (every dream is enumerated), weights (`60% a`), `any` / `weighted` / `maybe`, one-choice-per-name semantics, combinations |
| REM | `if … then … else`, `match`, `fn` (expression and block bodies), lambdas and `\|>` pipelines, ranges, comprehensions, `~ for` / `~ if` |
| Lucid | `~( renderer )` with schema-checked parameters, params blocks and layering, fan-out loops, named jobs and pipelines, templates, modules (`~ import`), types, `assert` and `~( test )` |

Two principles carried over from the original language:

* **Forgiving names** — case, spaces and `_` are ignored (`Images Number` = `images_number`); unquoted text is text.
* **Variation is a dimension** — `a | b | c` does not pick one, it multiplies the space of dreams; the compiler replays the
  script once per combination.

## Layout

```
dreamscript-academy/
├─ index.html, src/styles/        UI shell
├─ src/app/                       editor adapter, language service, output panels, lesson pane, progress
├─ src/lessons/                   the curriculum (data) + helpers used by task checks
├─ bin/dream.js                   command-line front end (run / check)
├─ src/core/                      the compiler/interpreter — pure ES modules, no DOM or Node APIs
│   ├─ lexer / expr / template / loose / types / program / blocks / functions   (parsing)
│   ├─ interp / exec / runtime / render / oracle / ops / scope / values         (evaluation)
│   ├─ stdlib/                    text, list, math, objects, colors, variation helpers
│   └─ compile.js                 compile(source | { files, main }, options) → result
└─ tests/                         node:test suites (core semantics, lessons, fuzz/robustness)
```

`src/core` has no dependencies, so the same code can run in the VS Code extension, in a CLI
(`import { compile } from './src/core/index.js'`) or in the browser.

The extension manifest also exposes **DreamScript: Compile with Academy**. It saves the active
`.dream` document, runs this same CLI with `--all --json`, maps diagnostics back onto the editor,
and opens the generated dreams in a `DreamScript Academy` output channel. The command does not
contact an image-generation service; renderer jobs remain simulated just like they are in the academy.

## Adding a lesson

Add an object to a file in `src/lessons/` (see `stage1.js` for the schema): `id`, `title`, `intro[]`, `syntax[]`,
`files`, `tasks[]` (each with a `check(result, files)` function), a `solution` and a `focus` tab.
`npm test` verifies that every starter compiles without errors, that every solution satisfies all its tasks, and that
no starter is already complete.
