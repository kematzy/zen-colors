---
name: dev-workflow
description: >
  Git, quality gates, changelog, versioning, and release workflow for the
  zen-colors repo (@kematzy/zen-colors). Use when the user asks to commit,
  merge, ship, release, bump version, cut a changelog, tag, npm publish,
  create a GitHub release, or formalize git/check hygiene in this project.
  Prefer this skill over inventing a parallel process. Slash: /dev-workflow.
---

# zen-colors — dev workflow

Follow **AGENTS.md** at the repo root for project facts. This skill is the **procedure**.

## Hard rules

1. Run **`npm run check`** before push (or rely on pre-push hook). Fix failures before continuing.
2. **Do not push** to origin and **do not `npm publish`** unless the user clearly asks.
3. Keep **`package.json` version**, **lockfile root version**, and **`src/index.ts` `VERSION`** identical on release.
4. Put ongoing notes in **`CHANGELOG.md` → `[Unreleased]`**; cut a dated section on release.
5. Prefer **feature branch → FF merge to main → delete branch**. No force-push to `main`.
6. New public API or behavior → **tests** (aim 100% stmts/lines; branches ≥95%).

## Daily feature work

1. Start from clean `main` (or ask before basing on dirty trees).
2. `git checkout -b <type>/<short-name>` (e.g. `feat/…`, `fix/…`).
3. Implement; keep commits focused.
4. `npm run check` (and `npm run demo:build` if demo markup/config changed).
5. Commit with a clear message (complete sentences; why when useful).
6. When user wants it on main: checkout `main`, `git merge --ff-only <branch>`, `git branch -d <branch>`.
7. Push only if asked: `git push origin main`.

## Commit style

- Imperative or clear past tense is fine; **complete sentences**.
- Prefer conventional-ish prefixes when natural: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Do not commit secrets, `.env`, or huge generated noise. `demo/dist` and `coverage/` stay untracked.

## Changelog discipline

During development, append under:

```markdown
## [Unreleased]

### Added | Changed | Fixed
- …
```

On release, move Unreleased bullets into `## [X.Y.Z] - YYYY-MM-DD` and leave empty Unreleased.

## Release (only when user asks)

1. Confirm working tree clean enough to release; `npm run check` + `npm run test:coverage` + `npm run build`.
2. Choose SemVer: **patch** (fixes), **minor** (features), **major** (breaking). This package is `0.x` — breaking can still be minor if intentional, but document clearly.
3. Bump `package.json`, `package-lock.json` root `version`, `src/index.ts` `VERSION`.
4. Cut `CHANGELOG.md` for the version.
5. Commit: `chore: release vX.Y.Z`.
6. Tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
7. Push: `git push origin main --tags` (only if user wants remote).
8. GitHub Release from tag (optional but preferred): notes from CHANGELOG.
9. npm: `npm whoami` then `npm publish` (OTP/2FA may be required on the user’s machine). Scoped public package already has `publishConfig.access: public`.
10. Verify: `npm view @kematzy/zen-colors version`.

## Quality commands

| Gate | Command |
| --- | --- |
| Full local gate | `npm run check` |
| Coverage | `npm run test:coverage` |
| Library build | `npm run build` |
| Demo build | `npm run demo:build` |
| Publish gate | `npm publish` runs `prepublishOnly` |

## Demo notes

- Markup: `demo/index.html` + `demo/partials/` (Handlebars).
- After partial/HTML/CSS/JS demo changes: `npm run demo:build` must pass.
- Prod demo sourcemaps are **off** (Tailwind SOURCEMAP_BROKEN noise).

## Out of scope

- Semantic theme product / Zen-Themes features belong **outside** this repo.
- Do not weaken coverage thresholds without explicit user approval.
