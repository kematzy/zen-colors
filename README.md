# zen-colors

Zen-like CSS color scales, tints, shades, and contrast helpers — **OKLCH by default**.

> Turn any common CSS color into perceptual tints, shades, scales, and readable foregrounds.

## Status

Early development (`0.1.0`). API is stabilizing.

## Install

```bash
npm install zen-colors
```

## Quick example

```ts
import { Color } from 'zen-colors';

const cyan = new Color('#0af');

cyan.tint(25).oklchString();
// → 'oklch(...% ... ...)'

cyan.shade(40).hexString();
cyan.all(10); // lightest → base → darkest
cyan.scale(10); // same idea as all(), as Color[]
cyan.fg().rgbString(); // black or white on top of cyan
```

## Features (roadmap)

| Area | Status |
| --- | --- |
| Parse hex / rgb / hsl / oklch / keywords | planned |
| `tint` / `shade` / `tints` / `shades` / `all` (OKLCH mix) | planned |
| `scale(weight)` basic scale | planned |
| Optional `preset: 'tailwind' \| 'zen'` | planned |
| Contrast helpers (`contrast`, `fg`, `on`) | planned |
| Interactive demo site | later |

## Concepts

- **Primary**: create tints and shades from a single color.
- **Scales**: `scale(weight)` with integer weight `2–25` (default `10`).
- **Presets**: optional extras — only run when you pass `preset`.
- **Default mix space**: OKLCH (perceptual, stable hue).
- **Default export string**: modern `oklch(...)`.

## License

[MIT](./LICENSE) © kematzy

See [CREDITS.md](./CREDITS.md) for prior art and dependencies.
