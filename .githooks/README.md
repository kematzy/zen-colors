# Git hooks

This repo uses **`core.hooksPath=.githooks`** so hooks are versioned with the project.

## pre-push

Runs `npm run check` (typecheck → lint → format:check → test) and **blocks the push** if anything fails.

```bash
git push
# fails if checks fail

git push --no-verify   # bypass local hook only — not a substitute for GitHub rules
```

## First-time setup

```bash
npm install            # runs `prepare` → enables hooksPath
# or:
npm run hooks:install
```

## GitHub enforcement (recommended)

Local hooks can be skipped. Protect `main` on GitHub:

1. **Settings → Rules → Rulesets** (or Branch protection)
2. Target `main`
3. **Require status checks to pass**
4. Require CI checks (from `.github/workflows/ci.yml`), e.g.:
   - `test (24)`
   - `test (22)`
   - `test (20)`  
   (exact names appear under Actions after a completed CI run)
5. Optionally require PRs, block force pushes, require branch to be up to date

That gate applies even when someone uses `--no-verify` or the GitHub UI.
