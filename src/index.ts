/**
 * zen-colors
 *
 * Zen-like CSS color scales, tints, shades, and contrast helpers.
 * Default mix space: OKLCH. Default string form: modern `oklch(...)`.
 */

export { Color, parse } from './color.js';
export type { ContrastPasses, ContrastResult, FgLevel, OnOptions } from './contrast.js';
export { FG_LEVEL_MIN_RATIO, resolveFgLevel } from './contrast.js';
export {
  assertCssNameSegment,
  cssKeyForColor,
  cssVariablesString,
  formatCssColorValue,
} from './css-export.js';
export { ColorError } from './errors.js';
export type {
  ColorJSON,
  ColorType,
  CssColorFormat,
  CssVariablesOptions,
  OklchChannels,
  RgbChannels,
  ScaleOptions,
  ScalePreset,
} from './types.js';

export const VERSION = '0.1.0';
