/**
 * Scale demo (basic + presets).
 * Run: node examples/scales.mjs
 */
import { Color } from '../dist/index.js';

const brand = new Color('oklch(64.9% 0.12 250)');

console.log('--- basic scale(20) ---');
for (const c of brand.scale(20)) {
  console.log(`${c.type.padEnd(5)} w=${String(c.weight).padStart(3)}  ${c.oklchString()}`);
}

console.log('\n--- preset: tailwind ---');
const tw = brand.scale(10, { preset: 'tailwind' });
for (const [key, c] of Object.entries(tw)) {
  console.log(`${key.padStart(3)}  ${c.oklchString()}`);
}

console.log('\n--- preset: zen ---');
const zen = brand.scale(10, { preset: 'zen' });
for (const [key, c] of Object.entries(zen)) {
  console.log(`${key.padEnd(4)}  ${c.oklchString()}`);
}
