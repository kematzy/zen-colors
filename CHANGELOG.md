# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-11

### Added

- `Color#cssVariablesString(name, options?)` and free `cssVariablesString(colors, name, options?)` to export scales as CSS custom properties (`zen` / `tailwind` / series; formats oklch, hex, rgb, hsl).
- `Color#fg(level?)`: no level → pure black/white; with level → soft grey meeting that level’s **minimum** ratio on the background (via tint/shade search from white/black), else B/W best effort.
  - WCAG/UI levels: `aaa`, `aaa-large`, `aa`, `aa-large`, `ui`
  - Intent band floors: `strong` (6), `base` (5), `muted` (4), `subtle` (3)
  - Helpers: `FgLevel`, `FG_LEVEL_MIN_RATIO`, `resolveFgLevel`
- Demo: Methods page live docs for CSS variable export; Contrast page rebuilt (A/B pickers, surface toggle, level chips, `.on` slider, scale clarity strip).
- Demo: Handlebars partials (`vite-plugin-handlebars`), Prism.js syntax highlighting, social preview assets.
- Quality: spellcheck in `check` / `prepublishOnly`; coverage 100% statements/lines/functions (≥95% branches).

### Changed

- Local `npm run check` and publish gates include spellcheck (and publish runs lint + format).
- Demo production sourcemaps disabled (avoids Tailwind SOURCEMAP_BROKEN noise).
- Package dictionary allows `lightningcss`, Prism/cspell terms as needed.

### Fixed

- Spellcheck: allow `lightningcss` in the project dictionary (CI Node 24).

## [0.1.0] - 2026-08-08

First public release on npm as **`@kematzy/zen-colors`**.

### Added

- Local `pre-push` hook (`.githooks/`) and `npm run check` so bad builds cannot be pushed easily; `prepare` enables hooks on install.
- Interactive playground under `demo/` (Intro, Scale, Methods, Contrast, Docs, browser JSON API).
- CSS export drawer with zen keys by default, optional Tailwind 50–950, share-URL comment.
- GitHub Pages deploy workflow (`.github/workflows/pages.yml`).
- Project scaffold: TypeScript, tsup, Vitest (≥90% coverage), ESLint, Prettier, CI, MIT license.
- `Color` construction from common CSS color strings (via culori) and null-safe `parse()`.
- Formatters: `oklchString()`, `rgbString()`, `hslString()`, `hexString()`, `toString()`, `toJSON()`.
- OKLCH object channels with lightness as **percent** (`0–100`).
- OKLCH `tint` / `shade` / `tints` / `shades` / `all` mix helpers.
- `scale(weight, options?)` basic scale (integer weight 2–25, default 10) as `Color[]`.
- Optional scale presets: `preset: 'tailwind'` (`50…950`, fixed) and `preset: 'zen'` (weight-driven `t{N}` / `s{N}` keys).
- Contrast helpers: `contrast()`, `fg()` / `bestForeground()`, `on(ratio, options?)`.
- `ColorError` for invalid input and arguments.
- `npm run test:browser` smoke suite via Vitest + Playwright Chromium.
- `npm run test:ui` for Vitest interactive UI.
- ESLint support for `examples/**` Node scripts.
- Project CSpell config (`.cspell.json`) and `npm run spellcheck` (CI: Node 24 only; optional quality gate).

### Changed

- Package name set to `@kematzy/zen-colors` with public `publishConfig` for npm.
