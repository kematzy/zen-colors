import type { Color } from './color.js';
import { ColorError } from './errors.js';
import type { CssColorFormat, CssVariablesOptions } from './types.js';

/**
 * Validate the palette name used in `--{prefix}-{name}-{key}`.
 * Allows CSS custom-property identifier segments: letter/underscore start, then word/hyphen.
 */
export function assertCssNameSegment(name: string, label = 'name'): string {
  if (typeof name !== 'string') {
    throw new ColorError(`CSS variable ${label} must be a string, got: ${String(name)}`);
  }
  const n = name.trim();
  if (!n) {
    throw new ColorError(`CSS variable ${label} must be a non-empty string`);
  }
  if (!/^[a-zA-Z_][\w-]*$/.test(n)) {
    throw new ColorError(
      `Invalid CSS variable ${label} "${name}": use letters, digits, hyphens, underscores; start with a letter or underscore`,
    );
  }
  return n;
}

/**
 * Key for a Color in an array export (from `all()`, basic `scale()`, etc.).
 * - base → `base`
 * - tint / shade → `t{N}` / `s{N}` (weights &lt; 10 padded to 2 digits, e.g. `t05`)
 * - scale → numeric key as string (Tailwind-like steps when type is `scale`)
 */
export function cssKeyForColor(color: Color): string {
  const { type, weight } = color;
  if (type === 'base') return 'base';
  if (type === 'tint') return `t${formatWeightKey(weight)}`;
  if (type === 'shade') return `s${formatWeightKey(weight)}`;
  // type === 'scale' (Tailwind steps) or any future role
  return String(weight);
}

function formatWeightKey(weight: number): string {
  if (!Number.isFinite(weight)) return '0';
  const n = Math.round(weight);
  return n < 10 && n >= 0 ? String(n).padStart(2, '0') : String(n);
}

/**
 * Format a Color as a CSS color value.
 */
export function formatCssColorValue(color: Color, format: CssColorFormat = 'oklch'): string {
  switch (format) {
    case 'hex':
      return color.hexString();
    case 'rgb':
      return color.rgbString();
    case 'hsl':
      return color.hslString();
    case 'oklch':
      return color.oklchString();
    default:
      throw new ColorError(`Unknown CSS color format: ${String(format)}`);
  }
}

function normalizeEntries(colors: Color[] | Record<string, Color>): Array<[string, Color]> {
  if (Array.isArray(colors)) {
    return colors.map((c) => [cssKeyForColor(c), c]);
  }
  if (colors !== null && typeof colors === 'object') {
    return Object.entries(colors);
  }
  throw new ColorError(`Expected Color[] or Record<string, Color>, got: ${String(colors)}`);
}

/**
 * Build a multi-line CSS custom property block from a scale or series.
 *
 * @example
 * ```ts
 * cssVariablesString(new Color('#f90').scale(10, { preset: 'zen' }), 'primary')
 * // --color-primary-t90: oklch(...);
 * // ...
 * // --color-primary-base: oklch(...);
 * ```
 *
 * @param colors - `Color[]` from `all()` / basic `scale()`, or a keyed record from a preset
 * @param name - palette segment, e.g. `primary` → `--color-primary-*`
 * @param options - output format and optional prefix (default `color`)
 */
export function cssVariablesString(
  colors: Color[] | Record<string, Color>,
  name: string,
  options?: CssVariablesOptions,
): string {
  const segment = assertCssNameSegment(name);
  const prefix = assertCssNameSegment(options?.prefix ?? 'color', 'prefix');
  const format = options?.format ?? 'oklch';
  if (format !== 'oklch' && format !== 'hex' && format !== 'rgb' && format !== 'hsl') {
    throw new ColorError(`Unknown CSS color format: ${String(format)}`);
  }

  const entries = normalizeEntries(colors);
  if (entries.length === 0) {
    throw new ColorError('Cannot export CSS variables from an empty color list');
  }

  const lines = entries.map(([key, color]) => {
    const suffix = key === 'base' ? 'base' : key;
    const value = formatCssColorValue(color, format);
    return `--${prefix}-${segment}-${suffix}: ${value};`;
  });

  return `${lines.join('\n')}\n`;
}
