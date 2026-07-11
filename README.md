# zen-colors

Zen-like CSS color scales, tints, shades, and contrast helpers — **OKLCH by default**.

> Turn any common CSS color into perceptual tints, shades, scales, and readable foregrounds.

```ts
import { Color } from 'zen-colors';

new Color('#0af').tint(25).oklchString();
// → 'oklch(78.04% 0.126 242.04)'
```

## Install

```bash
npm install zen-colors
```

**Requirements:** Node.js ≥ 18

## Quick start

```ts
import { Color, parse } from 'zen-colors';

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
npm run spellcheck    # project dictionary via cspell
npm run build
```

> First-time browser tests need Playwright browsers: `npx playwright install chromium`

This library is developed **test-first** (TDD).

## Credits

Inspired by Noel Delgado’s [values.js](https://github.com/noeldelgado/values.js) and [parse-css-color](https://github.com/noeldelgado/parse-css-color).  
Color math via [culori](https://github.com/Evercoder/culori).

See [CREDITS.md](./CREDITS.md).

## License

[MIT](./LICENSE) © kematzy
