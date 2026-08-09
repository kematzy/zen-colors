#!/usr/bin/env node
/**
 * Render assets/social-preview.html → assets/social-preview.png (1280×640).
 *
 * Usage (repo root): node assets/render-social-preview.mjs
 * Requires Playwright Chromium: npx playwright install chromium
 */
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(root, 'assets/social-preview.html');
const outPath = resolve(root, 'assets/social-preview.png');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 1,
});

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
// Google Fonts + first paint
await page.waitForTimeout(900);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();

const kb = (statSync(outPath).size / 1024).toFixed(1);
// eslint-disable-next-line
console.log(`Wrote ${outPath} (${kb} KB)`);
