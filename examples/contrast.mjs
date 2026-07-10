/**
 * Contrast helper demo.
 * Run: node examples/contrast.mjs
 */
import { Color } from '../dist/index.js';

const brand = new Color('#0af');

console.log('contrast vs white', brand.contrast('#fff'));
console.log('fg on brand     ', brand.fg().rgbString());
console.log('on(4.5) on white', brand.on(4.5).oklchString(), brand.on(4.5).contrast('#fff').ratio);
console.log('on(7) on white  ', brand.on(7).oklchString(), brand.on(7).contrast('#fff').ratio);
console.log(
  'on(4.5) on black',
  brand.on(4.5, { against: '#000' }).oklchString(),
  brand.on(4.5, { against: '#000' }).contrast('#000').ratio,
);
