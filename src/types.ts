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
