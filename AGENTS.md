# Agent instructions — zen-colors

This file is **always-on** guidance for agents working in this repository.

## Project

- **Package:** `@kematzy/zen-colors` (public npm, MIT)
- **Role:** Perceptual color scales, tints/shades, contrast helpers, CSS scale export (`--color-*`). OKLCH by default.
- **Not in scope:** Semantic theme builders / `--theme-*` products (separate projects only). Demo may illustrate library APIs; do not grow a full theme product here.

## Workflow skill (required for ship work)

For branches, commits, merges, changelog, version bumps, tags, GitHub releases, and npm publish, **follow the project skill**:

- Path: [`.grok/skills/dev-workflow/SKILL.md`](.grok/skills/dev-workflow/SKILL.md)
- Prefer loading that skill when the user asks to ship, merge, release, bump version, or formalize git/changelog steps.

Do not invent a parallel process.

## Quality gates

Before pushing or publishing, the project must pass:

```bash
npm run check
# typecheck + lint + format:check + spellcheck + test
```

- **Coverage:** `npm run test:coverage` — 100% statements/lines/functions; branches ≥ 95%. `src/types.ts` is type-only (excluded from coverage).
- **Pre-push:** `.githooks/pre-push` runs `npm run check` (installed via `prepare` / `npm run hooks:install`).
- **Publish:** `prepublishOnly` runs typecheck, lint, format, spellcheck, coverage, build.

## Local commands (common)

| Task | Command |
| --- | --- |
| Unit tests | `npm test` |
| Coverage | `npm run test:coverage` |
| Build library | `npm run build` |
| Demo | `npm run demo:dev` / `npm run demo:build` |
| Browser smoke | `npm run test:browser` (Playwright Chromium once installed) |

## Version source of truth

Keep these **in sync** on every release:

- `package.json` → `version`
- `package-lock.json` root version
- `src/index.ts` → `export const VERSION`

## Changelog

- File: `CHANGELOG.md` (Keep a Changelog + SemVer)
- Ongoing work goes under `## [Unreleased]`
- Releases cut a dated `## [X.Y.Z]` section and leave a fresh empty Unreleased

## Git defaults for this repo

- Prefer short-lived feature branches → **fast-forward merge** into `main` → delete branch
- Do **not** force-push `main`
- **Do not push or `npm publish` unless the user explicitly asks**
- Commit messages: complete sentences; explain *why* when non-obvious

## Out of scope reminders

- Do not add Zen-Themes product docs or features into this package
- Prefer library changes with tests; demo changes should not break `demo:build`
