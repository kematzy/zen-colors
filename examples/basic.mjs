/**
 * Basic tint / shade / format demo.
 * Run: node examples/basic.mjs
 */
import { Color } from '../dist/index.js';

const cyan = new Color('#0af');

console.log('base     ', cyan.oklchString(), cyan.hexString());
console.log('tint 25  ', cyan.tint(25).oklchString());
console.log('shade 40 ', cyan.shade(40).oklchString());
console.log('all(25)  ');
for (const step of cyan.all(25)) {
  console.log(`  ${step.type.padEnd(5)} w=${String(step.weight).padStart(3)}  ${step.hexString()}`);
}
