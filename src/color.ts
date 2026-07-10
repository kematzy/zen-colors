import type { Color as CuloriColor } from 'culori';

import {
  bestForegroundOf,
  contrastOf,
  onContrast,
  type ContrastResult,
  type OnOptions,
} from './contrast.js';
import { ColorError } from './errors.js';
import {
  formatHexDigits,
  formatHexString,
  formatHslString,
  formatOklchString,
  formatRgbString,
  getAlpha,
  getOklch,
  getRgb,
} from './format.js';
import { normalizeWeight, seriesWeights, shadeOklch, tintOklch } from './mix.js';
import { parseCulori } from './parse.js';
import { buildScale } from './scale.js';
import type { ColorJSON, ColorType, OklchChannels, RgbChannels, ScaleOptions } from './types.js';

/**
 * A CSS color with OKLCH-first mixing, formatting, and (upcoming) scale helpers.
 *
 * @example
 * ```ts
 * new Color('#0af').tint(25).oklchString()
 * ```
 */
export class Color {
  /** Underlying culori color (RGB/HSL/OKLCH modes as provided by the library). */
  private readonly _color: CuloriColor;

  /** Role of this instance (`base`, `tint`, `shade`, …). */
  readonly type: ColorType;

  /**
   * Mix weight (0–100) relative to the generation method that produced this color.
   * Base colors use `0`.
   */
  readonly weight: number;

  constructor(input: string = '#000', type: ColorType = 'base', weight = 0) {
    if (typeof input !== 'string') {
      throw new ColorError(`Input should be a string: ${String(input)}`);
    }

    const parsed = parseCulori(input);
    if (!parsed) {
      throw new ColorError(`Unable to parse color from string: ${input}`);
    }

    this._color = parsed;
    this.type = type;
    this.weight = weight;
  }

  /** Create a Color from an already-parsed culori color (internal + advanced use). */
  static fromCulori(color: CuloriColor, type: ColorType = 'base', weight = 0): Color {
    const instance = Object.create(Color.prototype) as Color;
    (instance as { _color: CuloriColor })._color = color;
    (instance as { type: ColorType }).type = type;
    (instance as { weight: number }).weight = weight;
    return instance;
  }

  /** Alpha channel in the range `0–1`. */
  get alpha(): number {
    return getAlpha(this._color);
  }

  /** Integer RGB channels (`0–255`). */
  get rgb(): RgbChannels {
    return getRgb(this._color);
  }

  /** OKLCH channels with lightness as percent (`0–100`). */
  get oklch(): OklchChannels {
    return getOklch(this._color);
  }

  /** Hex digits without `#` (`rrggbb` or `rrggbbaa`). */
  get hex(): string {
    return formatHexDigits(this._color);
  }

  /** `#rrggbb` or `#rrggbbaa`. */
  hexString(): string {
    return formatHexString(this._color);
  }

  /** Modern `rgb(r g b)` / `rgb(r g b / a)`. */
  rgbString(): string {
    return formatRgbString(this._color);
  }

  /** Modern `hsl(h s% l%)` / with alpha. */
  hslString(): string {
    return formatHslString(this._color);
  }

  /** Modern `oklch(L% C H)` / with alpha — preferred string form. */
  oklchString(): string {
    return formatOklchString(this._color);
  }

  /** Defaults to {@link oklchString}. */
  toString(): string {
    return this.oklchString();
  }

  /** JSON-friendly snapshot. */
  toJSON(): ColorJSON {
    return {
      type: this.type,
      weight: this.weight,
      alpha: this.alpha,
      hex: this.hex,
      rgb: this.rgb,
      oklch: this.oklch,
    };
  }

  /** Expose underlying culori color for mix helpers. */
  toCulori(): CuloriColor {
    return this._color;
  }

  /**
   * Lighten toward white in OKLCH by `weight` percent (default `50`).
   * Returns a new Color; the original is never mutated.
   */
  tint(weight?: number): Color {
    const w = normalizeWeight(weight, 50);
    return Color.fromCulori(tintOklch(this._color, w), 'tint', w);
  }

  /**
   * Darken toward black in OKLCH by `weight` percent (default `50`).
   * Returns a new Color; the original is never mutated.
   */
  shade(weight?: number): Color {
    const w = normalizeWeight(weight, 50);
    return Color.fromCulori(shadeOklch(this._color, w), 'shade', w);
  }

  /**
   * Series of tints at every `step` percent, including 100 (white).
   * Default step: `10` → weights 10, 20, …, 100.
   */
  tints(step?: number): Color[] {
    const s = normalizeWeight(step, 10);
    // zero step would infinite-loop; treat as default
    const effective = s === 0 ? 10 : s;
    return seriesWeights(effective).map((w) => this.tint(w));
  }

  /**
   * Series of shades at every `step` percent, including 100 (black).
   * Default step: `10` → weights 10, 20, …, 100.
   */
  shades(step?: number): Color[] {
    const s = normalizeWeight(step, 10);
    const effective = s === 0 ? 10 : s;
    return seriesWeights(effective).map((w) => this.shade(w));
  }

  /**
   * Full series: lightest tint → … → base → … → darkest shade.
   * Default step: `10` (21 colors total). Includes pure white and black.
   */
  all(step?: number): Color[] {
    const s = normalizeWeight(step, 10);
    const effective = s === 0 ? 10 : s;
    const tints = this.tints(effective).reverse();
    const base = Color.fromCulori(this._color, 'base', 0);
    const shades = this.shades(effective);
    return [...tints, base, ...shades];
  }

  /**
   * Generate a scale of tints and shades from this color.
   *
   * **Basic (default)** — integer `weight` in `2–25` (default `10`).
   * Returns `Color[]` ordered lightest → base → darkest, skipping pure white/black.
   *
   * **Presets** — optional extras when `options.preset` is set:
   * - `'tailwind'` → `Record` keyed `50…950` (base at `500`)
   * - `'zen'` → `Record` keyed `t90…t10`, `base`, `s10…s90`
   */
  scale(weight?: number, options?: ScaleOptions): Color[] | Record<string, Color> {
    return buildScale(this, weight, options);
  }

  /**
   * Compare this color with another and return a rich contrast report
   * (ratio, WCAG pass flags, darker/lighter).
   */
  contrast(other: string | Color): ContrastResult {
    return contrastOf(this, other);
  }

  /**
   * Best black or white foreground to place on top of this color (as a background).
   */
  fg(): Color {
    return bestForegroundOf(this);
  }

  /** Alias of {@link fg}. */
  bestForeground(): Color {
    return this.fg();
  }

  /**
   * Return a tint or shade of **this** color that meets `targetRatio`
   * against a surface (default: white).
   */
  on(targetRatio: number, options?: OnOptions): Color {
    return onContrast(this, targetRatio, options);
  }
}

/**
 * Parse a CSS color string.
 * @returns a {@link Color}, or `null` when input is not recognized
 */
export function parse(input: unknown): Color | null {
  if (typeof input !== 'string') return null;
  const parsed = parseCulori(input);
  if (!parsed) return null;
  return Color.fromCulori(parsed);
}
