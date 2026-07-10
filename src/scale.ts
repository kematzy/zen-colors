import { Color } from './color.js';
import { ColorError } from './errors.js';
import type { ColorType, ScaleOptions, ScalePreset } from './types.js';

/** Fixed mix weights toward white for Tailwind steps lighter than 500. */
const TAILWIND_TINT_WEIGHTS: Readonly<Record<string, number>> = {
  '50': 95,
  '100': 90,
  '200': 75,
  '300': 55,
  '400': 30,
};

/** Fixed mix weights toward black for Tailwind steps darker than 500. */
const TAILWIND_SHADE_WEIGHTS: Readonly<Record<string, number>> = {
  '600': 15,
  '700': 35,
  '800': 55,
  '900': 75,
  '950': 90,
};

/**
 * Validate scale weight: integer in the closed range `2–25`.
 * @throws {ColorError}
 */
export function assertScaleWeight(weight: unknown): number {
  if (typeof weight !== 'number' || Number.isNaN(weight) || !Number.isFinite(weight)) {
    throw new ColorError(`Scale weight must be an integer between 2 and 25, got: ${String(weight)}`);
  }
  if (!Number.isInteger(weight) || weight < 2 || weight > 25) {
    throw new ColorError(`Scale weight must be an integer between 2 and 25, got: ${weight}`);
  }
  return weight;
}

/**
 * Weights for the basic scale: step, 2×step, … while **strictly less than 100**.
 * Does **not** include 0 or 100.
 */
export function basicScaleWeights(step: number): number[] {
  const weights: number[] = [];
  for (let w = step; w < 100; w += step) {
    weights.push(w);
  }
  return weights;
}

function cloneAs(color: Color, type: ColorType, weight: number): Color {
  return Color.fromCulori(color.toCulori(), type, weight);
}

/**
 * Basic scale: lightest → base → darkest as a flat `Color[]`.
 * Skips pure white/black (weight 100); includes base once in the middle.
 */
export function generateBasicScale(color: Color, weight: number): Color[] {
  const steps = basicScaleWeights(weight);
  const tints = steps
    .slice()
    .reverse()
    .map((w) => color.tint(w));
  const base = cloneAs(color, 'base', 0);
  const shades = steps.map((w) => color.shade(w));
  return [...tints, base, ...shades];
}

/**
 * Tailwind-style scale `50…950` with the base color at `500`.
 */
export function generateTailwindScale(color: Color): Record<string, Color> {
  const scale: Record<string, Color> = {};

  for (const [key, w] of Object.entries(TAILWIND_TINT_WEIGHTS)) {
    scale[key] = cloneAs(color.tint(w), 'scale', Number(key));
  }

  scale['500'] = cloneAs(color, 'base', 500);

  for (const [key, w] of Object.entries(TAILWIND_SHADE_WEIGHTS)) {
    scale[key] = cloneAs(color.shade(w), 'scale', Number(key));
  }

  return scale;
}

/**
 * Zen-style scale `t90…t10`, `base`, `s10…s90`.
 */
export function generateZenScale(color: Color): Record<string, Color> {
  const scale: Record<string, Color> = {};

  for (let w = 90; w >= 10; w -= 10) {
    scale[`t${w}`] = cloneAs(color.tint(w), 'tint', w);
  }

  scale.base = cloneAs(color, 'base', 0);

  for (let w = 10; w <= 90; w += 10) {
    scale[`s${w}`] = cloneAs(color.shade(w), 'shade', w);
  }

  return scale;
}

/** Normalize / validate the preset option. */
export function resolvePreset(options?: ScaleOptions): ScalePreset {
  if (options == null || options.preset == null) return null;
  const { preset } = options;
  if (preset === 'tailwind' || preset === 'zen' || preset === null) return preset;
  throw new ColorError(`Unknown scale preset: ${String(preset)}`);
}

/**
 * Build ascale for `color`.
 *
 * - Default / `preset: null` → basic `Color[]` using integer `weight` (2–25, default 10)
 * - `preset: 'tailwind'` → fixed `50…950` record (weight ignored once validated if passed)
 * - `preset: 'zen'` → fixed `t* / base / s*` record
 */
export function buildScale(
  color: Color,
  weight?: number,
  options?: ScaleOptions,
): Color[] | Record<string, Color> {
  const preset = resolvePreset(options);

  if (preset === 'tailwind') {
    if (weight !== undefined) assertScaleWeight(weight);
    return generateTailwindScale(color);
  }

  if (preset === 'zen') {
    if (weight !== undefined) assertScaleWeight(weight);
    return generateZenScale(color);
  }

  const w = weight === undefined ? 10 : assertScaleWeight(weight);
  return generateBasicScale(color, w);
}
