# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
