import type { Color as CuloriColor } from 'culori';

import {
  bestForegroundOf,
  contrastOf,
  onContrast,
  type ContrastResult,
  type FgLevel,
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
import { cssVariablesString as formatCssVariablesString } from './css-export.js';
import { buildScale } from './scale.js';
import type {
  ColorJSON,
  ColorType,
  CssVariablesOptions,
  OklchChannels,
  RgbChannels,
  ScaleOptions,
} from './types.js';

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
  private _color: CuloriColor;

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
    const instance = new Color('#000000', type, weight);
    instance._color = color;
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
   * - `'tailwind'` → fixed `Record` keyed `50…950` (base at `500`; weight ignored)
   * - `'zen'` → weight-driven `Record` keyed `t{N}`, `base`, `s{N}`
   *   (e.g. weight `10` → `t90…t10, base, s10…s90`)
   */
  scale(weight?: number, options?: ScaleOptions): Color[] | Record<string, Color> {
    return buildScale(this, weight, options);
  }

  /**
   * Export a generated scale as CSS custom properties.
   *
   * Default preset is **`zen`** (weight-driven `t* / base / s*` keys) so names are
   * stable for design tokens. Pass `{ preset: 'tailwind' }` for `50…950`.
   *
   * @example
   * ```ts
   * new Color('#ff9900').cssVariablesString('primary')
   * // --color-primary-t90: oklch(...);
   * // --color-primary-base: oklch(...);
   * // --color-primary-s10: oklch(...);
   *
   * new Color('#ff9900').cssVariablesString('primary', { preset: 'tailwind' })
   * // --color-primary-50: …; … --color-primary-500: …;
   * ```
   *
   * For an already-built series (`all()`, basic `scale()`, or a record), use the
   * free function {@link cssVariablesString} instead.
   */
  cssVariablesString(name: string, options?: CssVariablesOptions): string {
    const preset = options?.preset === undefined ? 'zen' : options.preset;
    const weight = options?.weight;
    const scale = buildScale(this, weight, { preset });
    const formatOpts: CssVariablesOptions = {};
    if (options?.format !== undefined) formatOpts.format = options.format;
    if (options?.prefix !== undefined) formatOpts.prefix = options.prefix;
    return formatCssVariablesString(scale, name, formatOpts);
  }

  /**
   * Compare this color with another and return a rich contrast report
   * (ratio, WCAG pass flags, darker/lighter).
   */
  contrast(other: string | Color): ContrastResult {
    return contrastOf(this, other);
  }

  /**
   * Foreground color on top of this color (as **background**).
   *
   * - **`fg()`** — pure black or white (higher contrast).
   * - **`fg(level)`** — color meeting that level’s **minimum** ratio against this
   *   background (soft grey when possible; black/white only if out of range).
   *   Levels: WCAG `aaa` · `aaa-large` · `aa` · `aa-large` · `ui`, or intent
   *   `strong` · `base` · `muted` · `subtle` (see {@link FgLevel}).
   *
   * Use {@link on} to adjust **this** color’s own tint/shade to meet a ratio on a surface.
   */
  fg(level?: FgLevel): Color {
    return bestForegroundOf(this, level);
  }

  /** Alias of {@link fg}. */
  bestForeground(level?: FgLevel): Color {
    return this.fg(level);
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
