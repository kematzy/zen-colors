import { describe, expect, it } from 'vitest';

import {
  Color,
  ColorError,
  cssKeyForColor,
  cssVariablesString,
  formatCssColorValue,
} from '../src/index.js';

describe('cssVariablesString (standalone)', () => {
  const orange = new Color('#ff9900');

  it('exports a zen-style record with --color-{name}-{key}', () => {
    const scale = orange.scale(10, { preset: 'zen' }) as Record<string, Color>;
    const css = cssVariablesString(scale, 'primary');
    expect(css).toContain('--color-primary-t90:');
    expect(css).toContain('--color-primary-t10:');
    expect(css).toContain('--color-primary-base:');
    expect(css).toContain('--color-primary-s10:');
    expect(css).toContain('--color-primary-s90:');
    expect(css.trimEnd().endsWith(';')).toBe(true);
    // ends with newline
    expect(css.endsWith('\n')).toBe(true);
    // values default to oklch
    expect(css).toMatch(/--color-primary-base: oklch\(/);
  });

  it('exports a tailwind record', () => {
    const scale = orange.scale(10, { preset: 'tailwind' }) as Record<string, Color>;
    const css = cssVariablesString(scale, 'brand');
    expect(css).toContain('--color-brand-50:');
    expect(css).toContain('--color-brand-500:');
    expect(css).toContain('--color-brand-950:');
    expect(css).not.toContain('-base:');
  });

  it('keys Color[] from all() by type + weight', () => {
    const series = orange.all(25);
    const css = cssVariablesString(series, 'accent');
    // all(25): tints 100,75,50,25 + base + shades 25,50,75,100
    expect(css).toContain('--color-accent-t100:');
    expect(css).toContain('--color-accent-t75:');
    expect(css).toContain('--color-accent-base:');
    expect(css).toContain('--color-accent-s25:');
    expect(css).toContain('--color-accent-s100:');
  });

  it('keys basic scale() array with padded single-digit weights', () => {
    const scale = orange.scale(25) as Color[];
    const css = cssVariablesString(scale, 'x');
    expect(css).toContain('--color-x-t75:');
    expect(css).toContain('--color-x-t50:');
    expect(css).toContain('--color-x-t25:');
    expect(css).toContain('--color-x-base:');
    expect(css).toContain('--color-x-s25:');
  });

  it('supports format hex / rgb / hsl', () => {
    const one = { base: orange };
    expect(cssVariablesString(one, 'p', { format: 'hex' })).toMatch(
      /--color-p-base: #[0-9a-f]{6};/i,
    );
    expect(cssVariablesString(one, 'p', { format: 'rgb' })).toMatch(/--color-p-base: rgb\(/);
    expect(cssVariablesString(one, 'p', { format: 'hsl' })).toMatch(/--color-p-base: hsl\(/);
  });

  it('supports custom prefix', () => {
    const css = cssVariablesString({ base: orange }, 'brand', { prefix: 'zen' });
    expect(css).toBe(`--zen-brand-base: ${orange.oklchString()};\n`);
  });

  it('throws on invalid name', () => {
    expect(() => cssVariablesString({ base: orange }, '')).toThrow(ColorError);
    expect(() => cssVariablesString({ base: orange }, '1bad')).toThrow(ColorError);
    expect(() => cssVariablesString({ base: orange }, 'has space')).toThrow(ColorError);
    // @ts-expect-error intentional non-string
    expect(() => cssVariablesString({ base: orange }, 42)).toThrow(ColorError);
  });

  it('throws on empty list', () => {
    expect(() => cssVariablesString([], 'primary')).toThrow(/empty/i);
  });

  it('throws on non-array non-object colors', () => {
    // @ts-expect-error intentional
    expect(() => cssVariablesString(null, 'primary')).toThrow(ColorError);
    // @ts-expect-error intentional
    expect(() => cssVariablesString('nope', 'primary')).toThrow(ColorError);
  });

  it('throws on invalid format option', () => {
    // @ts-expect-error intentional
    expect(() => cssVariablesString({ base: orange }, 'p', { format: 'lab' })).toThrow(ColorError);
  });
});

describe('Color.cssVariablesString()', () => {
  const orange = new Color('#ff9900');

  it('defaults to zen preset at weight 10', () => {
    const css = orange.cssVariablesString('primary');
    expect(css).toContain('--color-primary-t90:');
    expect(css).toContain('--color-primary-base:');
    expect(css).toContain('--color-primary-s90:');
    const fromScale = cssVariablesString(orange.scale(10, { preset: 'zen' }), 'primary');
    expect(css).toBe(fromScale);
  });

  it('supports weight and zen preset', () => {
    const css = orange.cssVariablesString('primary', { weight: 25, preset: 'zen' });
    expect(css).toContain('--color-primary-t75:');
    expect(css).toContain('--color-primary-t50:');
    expect(css).toContain('--color-primary-t25:');
    expect(css).not.toContain('-t90:');
  });

  it('supports preset tailwind', () => {
    const css = orange.cssVariablesString('primary', { preset: 'tailwind' });
    expect(css).toContain('--color-primary-50:');
    expect(css).toContain('--color-primary-500:');
    expect(css).toContain('--color-primary-950:');
  });

  it('supports basic scale via preset null', () => {
    const css = orange.cssVariablesString('primary', { weight: 25, preset: null });
    expect(css).toContain('--color-primary-t75:');
    expect(css).toContain('--color-primary-base:');
    expect(css).toContain('--color-primary-s75:');
  });

  it('matches the TODO tailwind example shape', () => {
    const css = orange.cssVariablesString('primary', { preset: 'tailwind', format: 'hex' });
    const lines = css.trim().split('\n');
    expect(lines[0]).toMatch(/^--color-primary-50: #/);
    expect(lines.some((l) => l.startsWith('--color-primary-500:'))).toBe(true);
    expect(lines[lines.length - 1]).toMatch(/^--color-primary-950: #/);
  });

  it('supports format and prefix options on Color method', () => {
    const css = orange.cssVariablesString('brand', {
      preset: 'zen',
      weight: 25,
      format: 'hex',
      prefix: 'zen',
    });
    expect(css).toContain('--zen-brand-base: #');
    expect(css).toContain('--zen-brand-t75:');
  });
});

describe('css helpers', () => {
  it('cssKeyForColor', () => {
    const c = new Color('#0af');
    expect(cssKeyForColor(c)).toBe('base');
    expect(cssKeyForColor(c.tint(5))).toBe('t05');
    expect(cssKeyForColor(c.shade(10))).toBe('s10');
  });

  it('cssKeyForColor uses numeric keys for type scale', () => {
    const tw = new Color('#0af').scale(10, { preset: 'tailwind' }) as Record<string, Color>;
    // 500 is type base; lighter/darker steps use type scale with weight = step
    expect(cssKeyForColor(tw['500']!)).toBe('base');
    expect(cssKeyForColor(tw['50']!)).toBe('50');
    expect(cssKeyForColor(tw['900']!)).toBe('900');
  });

  it('cssKeyForColor pads and handles non-finite weight', () => {
    const c = Color.fromCulori(new Color('#0af').toCulori(), 'tint', Number.NaN);
    expect(cssKeyForColor(c)).toBe('t0');
  });

  it('formatCssColorValue rejects unknown format', () => {
    // @ts-expect-error intentional
    expect(() => formatCssColorValue(new Color('#000'), 'lab')).toThrow(ColorError);
  });
});
