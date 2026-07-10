import { describe, expect, it } from 'vitest';

import { Color, ColorError } from '../src/index.js';

describe('Color.scale() — basic (default)', () => {
  const cyan = new Color('#0af');

  it('defaults to weight 10 and returns a Color[]', () => {
    const scale = cyan.scale();
    expect(Array.isArray(scale)).toBe(true);
    // tints 90..10 (9) + base (1) + shades 10..90 (9) = 19
    expect(scale).toHaveLength(19);
  });

  it('orders lightest → base → darkest', () => {
    const scale = cyan.scale(25);
    // tints 75,50,25 + base + shades 25,50,75
    expect(scale).toHaveLength(7);
    expect(scale.map((c) => c.type)).toEqual([
      'tint',
      'tint',
      'tint',
      'base',
      'shade',
      'shade',
      'shade',
    ]);
    expect(scale.map((c) => c.weight)).toEqual([75, 50, 25, 0, 25, 50, 75]);
  });

  it('skips pure white (100) and pure black (100)', () => {
    const scale = cyan.scale(25);
    for (const color of scale) {
      if (color.type !== 'base') {
        expect(color.weight).toBeLessThan(100);
        expect(color.weight).toBeGreaterThan(0);
      }
    }
    expect(scale[0]?.hexString().toLowerCase()).not.toBe('#ffffff');
    expect(scale[scale.length - 1]?.hexString().toLowerCase()).not.toBe('#000000');
  });

  it('includes a distinct base in the middle', () => {
    const scale = cyan.scale(10);
    const mid = scale[Math.floor(scale.length / 2)];
    expect(mid?.type).toBe('base');
    expect(mid?.hexString().toLowerCase()).toBe(cyan.hexString().toLowerCase());
    expect(mid).not.toBe(cyan);
  });

  it('accepts integer weight 2', () => {
    const scale = cyan.scale(2);
    // weights 2,4,...,98 → 49 tints + base + 49 shades = 99
    expect(scale).toHaveLength(99);
    expect(scale[0]?.weight).toBe(98);
    expect(scale[scale.length - 1]?.weight).toBe(98);
  });

  it('throws ColorError when weight is not an integer', () => {
    expect(() => cyan.scale(10.5)).toThrow(ColorError);
    expect(() => cyan.scale(10.5)).toThrow(/integer/i);
  });

  it('throws ColorError when weight is out of range 2–25', () => {
    expect(() => cyan.scale(1)).toThrow(ColorError);
    expect(() => cyan.scale(26)).toThrow(ColorError);
    expect(() => cyan.scale(0)).toThrow(ColorError);
  });

  it('throws ColorError for non-number weight when provided', () => {
    // @ts-expect-error intentional
    expect(() => cyan.scale('10')).toThrow(ColorError);
  });
});

describe("Color.scale() — preset: 'tailwind'", () => {
  const base = new Color('#0af');

  it('returns a record keyed by Tailwind steps', () => {
    const scale = base.scale(10, { preset: 'tailwind' });
    expect(Array.isArray(scale)).toBe(false);
    expect(Object.keys(scale)).toEqual([
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      '950',
    ]);
  });

  it('places the base color at 500', () => {
    const scale = base.scale(10, { preset: 'tailwind' }) as Record<string, Color>;
    expect(scale['500']?.hexString().toLowerCase()).toBe(base.hexString().toLowerCase());
    expect(scale['500']?.type).toBe('base');
  });

  it('makes 50 lighter than 500 and 950 darker than 500', () => {
    const scale = base.scale(10, { preset: 'tailwind' }) as Record<string, Color>;
    expect(scale['50']!.oklch.l).toBeGreaterThan(scale['500']!.oklch.l);
    expect(scale['950']!.oklch.l).toBeLessThan(scale['500']!.oklch.l);
  });

  it('ignores weight for the fixed Tailwind stops', () => {
    const a = base.scale(2, { preset: 'tailwind' }) as Record<string, Color>;
    const b = base.scale(25, { preset: 'tailwind' }) as Record<string, Color>;
    expect(a['500']?.hexString()).toBe(b['500']?.hexString());
    expect(a['50']?.hexString()).toBe(b['50']?.hexString());
  });
});

describe("Color.scale() — preset: 'zen'", () => {
  const base = new Color('#0af');

  it('returns a record with t*, base, and s* keys', () => {
    const scale = base.scale(10, { preset: 'zen' }) as Record<string, Color>;
    expect(scale.base?.hexString().toLowerCase()).toBe(base.hexString().toLowerCase());
    expect(scale.t90).toBeInstanceOf(Color);
    expect(scale.t10).toBeInstanceOf(Color);
    expect(scale.s10).toBeInstanceOf(Color);
    expect(scale.s90).toBeInstanceOf(Color);
    expect(Object.keys(scale)).toEqual([
      't90',
      't80',
      't70',
      't60',
      't50',
      't40',
      't30',
      't20',
      't10',
      'base',
      's10',
      's20',
      's30',
      's40',
      's50',
      's60',
      's70',
      's80',
      's90',
    ]);
  });

  it('orders tints lightest (t90) to darkest shade (s90) to become lighter/darker', () => {
    const scale = base.scale(10, { preset: 'zen' }) as Record<string, Color>;
    expect(scale.t90!.oklch.l).toBeGreaterThan(scale.t10!.oklch.l);
    expect(scale.t10!.oklch.l).toBeGreaterThan(scale.base!.oklch.l);
    expect(scale.s10!.oklch.l).toBeLessThan(scale.base!.oklch.l);
    expect(scale.s90!.oklch.l).toBeLessThan(scale.s10!.oklch.l);
  });
});
