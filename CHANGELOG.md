# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Spellcheck: allow `lightningcss` in the project dictionary (CI Node 24).

### Changed

- `npm run check` and `prepublishOnly` now include spellcheck (and publish also runs lint + format) so local pre-push and releases match CI quality gates.
- Demo markup split into Handlebars partials (`demo/partials/`) via `vite-plugin-handlebars` so `demo/index.html` stays a short shell.

### Added

- GitHub social preview assets under `assets/` (HTML source, render script, PNG).
- Demo syntax highlighting via Prism.js (`javascript`, `bash`, `markup`) and a custom `light-dark()` token theme (`demo/src/lib/prism.css`).
- `Color#cssVariablesString(name, options?)` and free `cssVariablesString(colors, name, options?)` to export scales as CSS custom properties (`zen` / `tailwind` / series; formats oklch, hex, rgb, hsl).
- `Color#fg(level?)`: no level → pure black/white; with level → soft grey meeting that minimum ratio on the background (via tint/shade search), else B/W best effort. Levels: WCAG + intent (`strong`/`base`/`muted`/`subtle`).
- Contrast demo rebuilt: A/B pickers with OKLCH overlays, surface toggle, dual-row level chips, `.on` slider, scale clarity strip.

### Changed

- `fg(level)` no longer returns only black/white for named levels — it targets the band floor with greys when possible.
- Coverage thresholds: 100% statements/lines/functions (branches ≥95%); `src/types.ts` excluded as type-only.

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
