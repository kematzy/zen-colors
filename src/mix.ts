import { interpolate } from 'culori';
import type { Color as CuloriColor } from 'culori';

/**
 * Normalize a weight parameter.
 * Non-finite / non-number values fall back to `fallback`.
 * Finite numbers are clamped to `0–100`.
 */
export function normalizeWeight(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, value));
}

/**
 * Mix `color` toward `target` by `weight` percent in OKLCH.
 * `weight` 0 → original color, 100 → target.
 */
export function mixOklch(
  color: CuloriColor,
  target: CuloriColor | string,
  weight: number,
): CuloriColor {
  const t = Math.min(100, Math.max(0, weight)) / 100;
  const mixer = interpolate([color, target], 'oklch');
  return mixer(t);
}

/** Mix toward pure white in OKLCH. */
export function tintOklch(color: CuloriColor, weight: number): CuloriColor {
  return mixOklch(color, 'white', weight);
}

/** Mix toward pure black in OKLCH. */
export function shadeOklch(color: CuloriColor, weight: number): CuloriColor {
  return mixOklch(color, 'black', weight);
}

/**
 * Build the series of weights: step, 2×step, … including 100 when it lands
 * on the grid (weights always end at 100 for series helpers).
 *
 * Example: step 25 → [25, 50, 75, 100]
 * Example: step 10 → [10, 20, …, 100]
 */
export function seriesWeights(step: number): number[] {
  const s = Math.min(100, Math.max(1, step));
  const weights: number[] = [];
  for (let w = s; w < 100; w += s) {
    weights.push(w);
  }
  weights.push(100);
  return weights;
}
