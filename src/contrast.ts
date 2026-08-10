import { wcagContrast } from 'culori';

import { Color } from './color.js';
import { ColorError } from './errors.js';

/** WCAG 2.x pass flags for a contrast ratio. */
export interface ContrastPasses {
  /** ≥ 4.5:1 body text */
  aa: boolean;
  /** ≥ 3:1 large text */
  aaLarge: boolean;
  /** ≥ 7:1 enhanced body text */
  aaa: boolean;
  /** ≥ 4.5:1 large text enhanced */
  aaaLarge: boolean;
}

/** Rich result of comparing two colors. */
export interface ContrastResult {
  /** WCAG contrast ratio (1–21). */
  ratio: number;
  /** Threshold pass flags. */
  passes: ContrastPasses;
  /** Darker of the two colors (by relative luminance / OKLCH L). */
  darker: Color;
  /** Lighter of the two colors. */
  lighter: Color;
  /** Whether the *current* color is the darker or lighter side. */
  current: 'darker' | 'lighter';
}

export interface OnOptions {
  /**
   * Surface the result should contrast against.
   * Defaults to white (`#ffffff`).
   */
  against?: string | Color;
}

/**
 * Named minimum contrast targets for {@link Color.fg}.
 *
 * **WCAG-oriented** (`aaa`, `aa`, …) use standard thresholds.
 * **Intent** (`strong`, `base`, `muted`, `subtle`) use Zen minimums for
 * those bands — not WCAG grade names.
 *
 * Strings are exact lowercase only (no aliases like `aalarge` or `best`).
 */
export type FgLevel =
  'aaa' | 'aaa-large' | 'aa' | 'aa-large' | 'ui' | 'strong' | 'base' | 'muted' | 'subtle';

/**
 * Minimum contrast ratio for each {@link FgLevel}.
 * Intent levels are band floors (prefer meeting them; black/white only).
 */
export const FG_LEVEL_MIN_RATIO: Readonly<Record<FgLevel, number>> = {
  aaa: 7,
  'aaa-large': 4.5,
  aa: 4.5,
  'aa-large': 3,
  ui: 3,
  strong: 6,
  base: 5,
  muted: 4,
  subtle: 3,
};

const FG_LEVELS = new Set<string>(Object.keys(FG_LEVEL_MIN_RATIO));

/**
 * Resolve a foreground level string to its minimum ratio.
 * @throws {ColorError} on unknown level
 */
export function resolveFgLevel(level: FgLevel | string): number {
  if (typeof level !== 'string' || !FG_LEVELS.has(level)) {
    throw new ColorError(`Unknown fg level "${String(level)}". Use: ${[...FG_LEVELS].join(', ')}`);
  }
  return FG_LEVEL_MIN_RATIO[level as FgLevel];
}

function passesFromRatio(ratio: number): ContrastPasses {
  return {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

function toColor(input: string | Color, label: string): Color {
  if (input instanceof Color) return input;
  try {
    return new Color(input);
  } catch {
    throw new ColorError(`Unable to parse ${label} color: ${String(input)}`);
  }
}

/** Compare `current` with `other` and return a rich contrast report. */
export function contrastOf(current: Color, other: string | Color): ContrastResult {
  const otherColor = toColor(other, 'contrast');
  const ratio = wcagContrast(current.toCulori(), otherColor.toCulori());

  const currentL = current.oklch.l;
  const otherL = otherColor.oklch.l;
  const currentIsDarker = currentL <= otherL;

  return {
    ratio,
    passes: passesFromRatio(ratio),
    darker: currentIsDarker ? current : otherColor,
    lighter: currentIsDarker ? otherColor : current,
    current: currentIsDarker ? 'darker' : 'lighter',
  };
}

/**
 * Pick black or white as a foreground on top of `background`.
 *
 * - Optional `level` sets a **minimum** target ratio (see {@link FG_LEVEL_MIN_RATIO}).
 * - Prefers a candidate that meets the minimum; if neither does, returns the
 *   higher-ratio of black/white (**best effort**).
 * - Never leaves the black/white pair (use {@link onContrast} for family tints/shades).
 * - Omit `level` → same as `'base'` (minimum 5:1).
 */
export function bestForegroundOf(background: Color, level?: FgLevel): Color {
  const minRatio = level === undefined ? FG_LEVEL_MIN_RATIO.base : resolveFgLevel(level);

  const black = new Color('#000000');
  const white = new Color('#ffffff');
  const blackRatio = wcagContrast(black.toCulori(), background.toCulori());
  const whiteRatio = wcagContrast(white.toCulori(), background.toCulori());

  const blackOk = blackRatio >= minRatio;
  const whiteOk = whiteRatio >= minRatio;

  if (blackOk && whiteOk) {
    return blackRatio >= whiteRatio ? black : white;
  }
  if (blackOk) return black;
  if (whiteOk) return white;
  // Best effort: neither meets the band floor
  return blackRatio >= whiteRatio ? black : white;
}

/**
 * Walk tints and shades of `color` and return the nearest family member
 * that meets `targetRatio` against the given surface (default white).
 *
 * Search order preference:
 * 1. Base itself, if it already passes
 * 2. Progressive shades (darker) and tints (lighter) by increasing weight
 * 3. Best-effort highest-ratio candidate if the target is unreachable
 */
export function onContrast(color: Color, targetRatio: number, options: OnOptions = {}): Color {
  if (typeof targetRatio !== 'number' || !Number.isFinite(targetRatio) || targetRatio <= 0) {
    throw new ColorError(
      `Target contrast ratio must be a positive number, got: ${String(targetRatio)}`,
    );
  }

  const against = toColor(options.against ?? '#ffffff', 'against');
  const againstCulori = against.toCulori();

  const ratioOf = (c: Color): number => wcagContrast(c.toCulori(), againstCulori);

  if (ratioOf(color) >= targetRatio) {
    return Color.fromCulori(color.toCulori(), 'base', 0);
  }

  // Search 1, 2, … 100 in both directions; take the first that meets the ratio.
  // Prefer the direction that improves contrast if both would pass at same weight.
  let best: Color = color;
  let bestRatio = ratioOf(color);

  for (let w = 1; w <= 100; w += 1) {
    const shade = color.shade(w);
    const shadeRatio = ratioOf(shade);
    if (shadeRatio > bestRatio) {
      best = shade;
      bestRatio = shadeRatio;
    }
    if (shadeRatio >= targetRatio) return shade;

    const tint = color.tint(w);
    const tintRatio = ratioOf(tint);
    if (tintRatio > bestRatio) {
      best = tint;
      bestRatio = tintRatio;
    }
    if (tintRatio >= targetRatio) return tint;
  }

  // Unreachable target — return best effort from the family
  /* v8 ignore next -- @preserve */
  return best;
}
