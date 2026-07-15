#!/usr/bin/env node
/**
 * Enable versioned hooks at .githooks (safe to run outside a git checkout).
 * Invoked by npm prepare so clones pick up pre-push automatically.
 */
import { chmodSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gitDir = resolve(root, '.git');

if (!existsSync(gitDir)) {
  // e.g. npm pack / published tarball install — nothing to do
  process.exit(0);
}

const cfg = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: root,
  encoding: 'utf8',
});

if (cfg.status !== 0) {
  console.warn('prepare: could not set core.hooksPath:', cfg.stderr || cfg.error);
  process.exit(0);
}

const prePush = resolve(root, '.githooks/pre-push');
try {
  chmodSync(prePush, 0o755);
} catch {
  // ignore
}

console.log('prepare: git hooks enabled (core.hooksPath=.githooks)');
