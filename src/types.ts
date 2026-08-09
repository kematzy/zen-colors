/** Role of a Color instance within a palette or mix. */
export type ColorType = 'base' | 'tint' | 'shade' | 'scale';

/** Integer RGB channels in the 0–255 range. */
export interface RgbChannels {
  r: number;
  g: number;
  b: number;
}

/**
 * OKLCH channels with lightness in **percent** (`0–100`), matching CSS `oklch()`.
 * Chroma and hue follow culori / CSS Color Level 4 conventions.
 */
export interface OklchChannels {
  /** Lightness percent, 0–100 */
  l: number;
  /** Chroma (unitless, typically 0–0.4) */
  c: number;
  /** Hue angle in degrees 0–360 (may be undefined for achromatic colors internally) */
  h: number;
  /** Alpha 0–1 */
  alpha: number;
}

/** Serializable snapshot of a Color. */
export interface ColorJSON {
  type: ColorType;
  weight: number;
  alpha: number;
  hex: string;
  rgb: RgbChannels;
  oklch: OklchChannels;
}

/** Optional scale generators (extras). Default is `null` → basic scale. */
export type ScalePreset = 'tailwind' | 'zen' | null;

export interface ScaleOptions {
  preset?: ScalePreset;
}

/** CSS color value format for variable export. Default: `oklch`. */
export type CssColorFormat = 'oklch' | 'hex' | 'rgb' | 'hsl';

/**
 * Options for {@link cssVariablesString} (standalone) and
 * {@link Color.cssVariablesString}.
 */
export interface CssVariablesOptions {
  /**
   * Scale weight for generation from a single {@link Color} (`2–25`, default `10`).
   * Ignored when `preset` is `'tailwind'`.
   */
  weight?: number;
  /**
   * Scale shape when generating from a {@link Color}.
   * Default for `Color#cssVariablesString`: `'zen'` (stable keys for CSS).
   * Use `'tailwind'` for `50…950`. Use `null` for a basic `Color[]` keyed by type/weight.
   */
  preset?: ScalePreset;
  /** CSS color function / hex for values. Default: `oklch`. */
  format?: CssColorFormat;
  /**
   * Middle segment before the palette name.
   * Default `color` → `--color-{name}-{key}`.
   */
  prefix?: string;
}
