import {
  converter,
  formatCss,
  formatHex,
  formatHex8,
  round,
} from 'culori';
import type { Color as CuloriColor } from 'culori';

import type { OklchChannels, RgbChannels } from './types.js';

const toOklch = converter('oklch');
const toRgb = converter('rgb');
const toHsl = converter('hsl');

const round2 = round(2);
const round4 = round(4);

/** Clamp and round a number into the integer 0–255 RGB channel range. */
export function toRgbByte(channel: number): number {
  return Math.min(255, Math.max(0, Math.round(channel * 255)));
}

/** Read integer RGB channels from any culori color. */
export function getRgb(color: CuloriColor): RgbChannels {
  const rgb = toRgb(color);
  return {
    r: toRgbByte(rgb.r ?? 0),
    g: toRgbByte(rgb.g ?? 0),
    b: toRgbByte(rgb.b ?? 0),
  };
}

/** Read OKLCH with lightness as **percent** (0–100). */
export function getOklch(color: CuloriColor): OklchChannels {
  const o = toOklch(color);
  const alpha = o.alpha ?? 1;
  return {
    l: (o.l ?? 0) * 100,
    c: o.c ?? 0,
    h: o.h ?? 0,
    alpha,
  };
}

/** Read alpha channel 0–1. */
export function getAlpha(color: CuloriColor): number {
  return color.alpha ?? 1;
}

/**
 * Modern `oklch(L% C H)` / `oklch(L% C H / a)` string.
 * Lightness is always expressed as a percentage.
 */
export function formatOklchString(color: CuloriColor): string {
  const o = toOklch(color);
  const l = round2((o.l ?? 0) * 100);
  const c = round4(o.c ?? 0);
  const h = round2(o.h ?? 0);
  const alpha = o.alpha ?? 1;

  if (alpha < 1) {
    return `oklch(${l}% ${c} ${h} / ${round4(alpha)})`;
  }
  return `oklch(${l}% ${c} ${h})`;
}

/** Modern `rgb(r g b)` / `rgb(r g b / a)` string with integer channels. */
export function formatRgbString(color: CuloriColor): string {
  const { r, g, b } = getRgb(color);
  const alpha = getAlpha(color);
  if (alpha < 1) {
    return `rgb(${r} ${g} ${b} / ${round4(alpha)})`;
  }
  return `rgb(${r} ${g} ${b})`;
}

/** Modern `hsl(h s% l%)` / with alpha. */
export function formatHslString(color: CuloriColor): string {
  const hsl = toHsl(color);
  const h = round2(hsl.h ?? 0);
  const s = round2((hsl.s ?? 0) * 100);
  const l = round2((hsl.l ?? 0) * 100);
  const alpha = hsl.alpha ?? 1;

  if (alpha < 1) {
    return `hsl(${h} ${s}% ${l}% / ${round4(alpha)})`;
  }
  return `hsl(${h} ${s}% ${l}%)`;
}

/** `#rrggbb` or `#rrggbbaa` when alpha < 1. */
export function formatHexString(color: CuloriColor): string {
  const alpha = getAlpha(color);
  if (alpha < 1) {
    return formatHex8(color) ?? '#00000000';
  }
  return formatHex(color) ?? '#000000';
}

/** Hex without leading `#`. */
export function formatHexDigits(color: CuloriColor): string {
  return formatHexString(color).replace(/^#/, '');
}

/**
 * Fallback CSS serialization via culori (useful for debugging).
 * Preferred public APIs are the dedicated formatters above.
 */
export function formatCssString(color: CuloriColor): string {
  return formatCss(color) ?? formatOklchString(color);
}
