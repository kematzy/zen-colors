# zen-colors

[![npm](https://img.shields.io/npm/v/@kematzy/zen-colors.svg)](https://www.npmjs.com/package/@kematzy/zen-colors)
[![Node.js](https://img.shields.io/node/v/@kematzy/zen-colors.svg)](https://www.npmjs.com/package/@kematzy/zen-colors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/kematzy/zen-colors/actions/workflows/ci.yml/badge.svg)](https://github.com/kematzy/zen-colors/actions/workflows/ci.yml)

Zen-like CSS color scales, tints, shades, and contrast helpers — **OKLCH by default**.

> Turn any common CSS color into perceptual tints, shades, scales, and readable foregrounds.

```ts
import { Color } from '@kematzy/zen-colors';

new Color('#0af').tint(25).oklchString();
// → 'oklch(78.04% 0.126 242.04)'
```

## Install

```bash
npm install @kematzy/zen-colors
```

**Requirements:** Node.js ≥ 20

## Quick start

```ts
import { Color, parse } from '@kematzy/zen-colors';

const cyan = new Color('#0af');

// Single mixes (OKLCH toward white / black)
cyan.tint(25); // lighter
cyan.shade(40); // darker

// Series (include pure white / black at weight 100)
cyan.tints(10); // weights 10…100
cyan.shades(25); // 25, 50, 75, 100
cyan.all(10); // lightest → base → darkest (21 colors)

// Basic scale (skip pure white/black) — primary scale API
cyan.scale(); // weight 10 default → Color[]
cyan.scale(25); // 75,50,25 + base + 25,50,75

// Optional named presets (explicit only — never the default)
cyan.scale(10, { preset: 'tailwind' }); // fixed { 50…950 }, base at 500
cyan.scale(10, { preset: 'zen' }); // { t90…t10, base, s10…s90 }
cyan.scale(25, { preset: 'zen' }); // { t75, t50, t25, base, s25, s50, s75 }
cyan.scale(2, { preset: 'zen' }); // { t98…t2, base, s2…s98 }

// Contrast (current-color centric)
cyan.contrast('#fff'); // { ratio, passes, darker, lighter, current }
cyan.fg().rgbString(); // best black/white on top of cyan
cyan.on(4.5); // tint/shade of cyan with ≥ 4.5:1 on white

// Formats
cyan.oklchString(); // preferred
cyan.rgbString(); // modern: rgb(0 170 255)
cyan.hslString();
cyan.hexString();
cyan.toString(); // = oklchString()

// Null-safe parse
parse('not-a-color'); // null
new Color('not-a-color'); // throws ColorError
```

## Concepts

| Idea | Behavior |
| --- | --- |
| **Mix space** | OKLCH (perceptual; stable hue) |
| **OKLCH object `l`** | Percent `0–100` (not 0–1) |
| **String default** | Modern `oklch(L% C H)` |
| **Primary job** | Tints & shades from one color |
| **`scale(weight)`** | Integer weight **2–25**, default **10**; skips 0 & 100 |
| **Presets** | Extra only — `preset: 'tailwind'` (fixed) or `'zen'` (weight-driven keys) |
| **Immutability** | Methods return **new** `Color` instances |

### `scale()` weight examples

| Weight | Steps in each direction | Array shape (basic) |
| --- | --- | --- |
| `25` | 25, 50, 75 | `[t75, t50, t25, base, s25, s50, s75]` |
| `10` | 10…90 | 19 colors |
| `2` | 2, 4, …, 98 | 99 colors |

### Contrast helpers

- **`contrast(other)`** — rich report for custom checks (`ratio`, WCAG `passes`, `darker` / `lighter`).
- **`fg()` / `bestForeground()`** — this color is the **background**; pick black or white for text.
- **`on(ratio, { against? })`** — this color is the **palette**; pick a tint/shade that meets the ratio (default surface: white).

## Supported input

Any string [culori](https://culorijs.org/) understands in common CSS, including:

- Hex: `#RGB`, `#RRGGBB`, `#RGBA`, `#RRGGBBAA`
- `rgb()` / `rgba()` (comma and space syntax)
- `hsl()` / `hsla()`
- `oklch()` / `oklab()` / `lab()` / `lch()` / `hwb()`
- Named CSS keywords
- `transparent`

## API surface

| Export | Kind |
| --- | --- |
| `Color` | class |
| `parse(input)` | `Color \| null` |
| `ColorError` | error class |
| `VERSION` | string |
| Types | `ColorJSON`, `ColorType`, `OklchChannels`, `RgbChannels`, `ScaleOptions`, `ScalePreset`, `ContrastResult`, `ContrastPasses`, `OnOptions` |

Full signatures are in the published TypeScript declarations (`dist/index.d.ts`).

## Development

```bash
npm install
npm test              # vitest (node)
npm run test:ui       # vitest interactive UI
npm run test:coverage # ≥ 90% thresholds enforced
npm run test:browser  # vitest browser smoke (Playwright / Chromium)
npm run typecheck
npm run lint
npm run spellcheck    # project dictionary via cspell (`.cspell.json`)
npm run check         # typecheck + lint + format + spellcheck + test (pre-push gate)
npm run build
npm run demo:dev      # playground (Vite)
npm run demo:build    # static demo → demo/dist
```

> First-time browser tests need Playwright browsers: `npx playwright install chromium`

This library is developed **test-first** (TDD).

### Quality gates (push / main / publish)

**Local `pre-push` hook** (installed via `npm install` / `prepare`):

- Runs `npm run check` and **blocks the push** if anything fails
- `check` matches CI’s quality steps, including **spellcheck** (same dictionary as Node 24 CI)
- See [`.githooks/README.md`](./.githooks/README.md)
- Bypass only when intentional: `git push --no-verify`

**`npm publish` (`prepublishOnly`):** typecheck, lint, format, spellcheck, coverage tests, and build — so dictionary/format drift fails before a release tarball is uploaded.

**GitHub (required for real protection):** on `main`, enable a
[ruleset / branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
with **Require status checks to pass**, selecting the CI `test (…)` jobs from
`.github/workflows/ci.yml` (at least **`test (24)`**, which runs spellcheck + demo build). That cannot be skipped with `--no-verify`.

## Playground demo

Static GitHub Pages app under `demo/`:

- **Intro** first (skippable; preference in `localStorage`)
- **Scale** — `all(weight)` swatch grid, OKLCH sliders, Set Base, share URL
- **Methods** — live `tint` / `shade` / series / `scale` presets
- **Contrast** — `contrast`, `fg`, `on`, scale matrix
- **Docs** — short getting-started + API notes
- **API** — browser-only JSON builder for agents
- Drawer: CSS export (zen keys default, Tailwind optional) + history

Markup is split with [vite-plugin-handlebars](https://www.npmjs.com/package/vite-plugin-handlebars):
`demo/index.html` is a short shell; sections live in `demo/partials/` (`header`, `page-*`, `drawer`, `footer`, …).

```bash
npm run demo:dev
# http://localhost:5173/zen-colors/
```

## Credits

Inspired by Noel Delgado’s [values.js](https://github.com/noeldelgado/values.js) and [parse-css-color](https://github.com/noeldelgado/parse-css-color).  
Color math via [culori](https://github.com/Evercoder/culori).

Helpfully assisted by **Grok 4.5** using [Pi Coding Agent](https://pi.dev) and [Grok Build](https://grok.com/build).

See [CREDITS.md](./CREDITS.md).

## License

[MIT](./LICENSE) © kematzy
