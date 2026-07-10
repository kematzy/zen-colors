import { describe, expect, it } from 'vitest';

import { Color } from '../src/index.js';

describe('Color.tint()', () => {
  const cyan = new Color('#0af');

  it('defaults to 50% weight', () => {
    const tint = cyan.tint();
    expect(tint.type).toBe('tint');
    expect(tint.weight).toBe(50);
  });

  it('returns a new Color instance', () => {
    const tint = cyan.tint(25);
    expect(tint).toBeInstanceOf(Color);
    expect(tint).not.toBe(cyan);
  });

  it('lightens toward white as weight increases', () => {
    const t0 = cyan.tint(0);
    const t25 = cyan.tint(25);
    const t50 = cyan.tint(50);
    const t100 = cyan.tint(100);

    expect(t0.oklch.l).toBeCloseTo(cyan.oklch.l, 1);
    expect(t25.oklch.l).toBeGreaterThan(cyan.oklch.l);
    expect(t50.oklch.l).toBeGreaterThan(t25.oklch.l);
    expect(t100.oklch.l).toBeCloseTo(100, 0);
  });

  it('approaches white at 100%', () => {
    const white = cyan.tint(100);
    expect(white.hexString().toLowerCase()).toBe('#ffffff');
  });

  it('preserves hue while lightening (perceptual OKLCH mix)', () => {
    const baseHue = cyan.oklch.h;
    const tint = cyan.tint(25);
    // Hue should stay essentially the same for non-extreme mixes
    expect(Math.abs(tint.oklch.h - baseHue)).toBeLessThan(1);
  });

  it('records the requested weight', () => {
    expect(cyan.tint(12).weight).toBe(12);
    expect(cyan.tint(75).weight).toBe(75);
  });

  it('clamps weight into 0–100', () => {
    expect(cyan.tint(-20).weight).toBe(0);
    expect(cyan.tint(200).weight).toBe(100);
    expect(cyan.tint(-20).hexString().toLowerCase()).toBe(cyan.hexString().toLowerCase());
    expect(cyan.tint(200).hexString().toLowerCase()).toBe('#ffffff');
  });

  it('coerces invalid weight to default 50', () => {
    // @ts-expect-error intentional invalid
    expect(cyan.tint('foo').weight).toBe(50);
    // @ts-expect-error intentional invalid
    expect(cyan.tint(null).weight).toBe(50);
    expect(cyan.tint(Number.NaN).weight).toBe(50);
  });

  it('supports fluent chaining to oklchString', () => {
    const s = new Color('#0af').tint(25).oklchString();
    expect(s).toMatch(/^oklch\(/);
    expect(s).toMatch(/%/);
  });
});

describe('Color.shade()', () => {
  const cyan = new Color('#0af');

  it('defaults to 50% weight', () => {
    const shade = cyan.shade();
    expect(shade.type).toBe('shade');
    expect(shade.weight).toBe(50);
  });

  it('darkens toward black as weight increases', () => {
    const s0 = cyan.shade(0);
    const s25 = cyan.shade(25);
    const s50 = cyan.shade(50);
    const s100 = cyan.shade(100);

    expect(s0.oklch.l).toBeCloseTo(cyan.oklch.l, 1);
    expect(s25.oklch.l).toBeLessThan(cyan.oklch.l);
    expect(s50.oklch.l).toBeLessThan(s25.oklch.l);
    expect(s100.oklch.l).toBeCloseTo(0, 0);
  });

  it('approaches black at 100%', () => {
    const black = cyan.shade(100);
    expect(black.hexString().toLowerCase()).toBe('#000000');
  });

  it('preserves hue while darkening', () => {
    const baseHue = cyan.oklch.h;
    const shade = cyan.shade(25);
    expect(Math.abs(shade.oklch.h - baseHue)).toBeLessThan(1);
  });

  it('records the requested weight', () => {
    expect(cyan.shade(33).weight).toBe(33);
  });
});

describe('Color.tints()', () => {
  const red = new Color('red');

  it('defaults to step weight 10 → 10 tints including 100', () => {
    const tints = red.tints();
    expect(tints).toHaveLength(10);
    expect(tints.map((c) => c.weight)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(tints.every((c) => c.type === 'tint')).toBe(true);
  });

  it('uses custom step weight and includes 100', () => {
    const tints = red.tints(25);
    expect(tints.map((c) => c.weight)).toEqual([25, 50, 75, 100]);
    expect(tints[tints.length - 1]?.hexString().toLowerCase()).toBe('#ffffff');
  });

  it('each step is progressively lighter', () => {
    const tints = red.tints(25);
    for (let i = 1; i < tints.length; i++) {
      expect(tints[i]!.oklch.l).toBeGreaterThanOrEqual(tints[i - 1]!.oklch.l);
    }
  });
});

describe('Color.shades()', () => {
  const red = new Color('red');

  it('defaults to step weight 10 → 10 shades including 100', () => {
    const shades = red.shades();
    expect(shades).toHaveLength(10);
    expect(shades.map((c) => c.weight)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(shades.every((c) => c.type === 'shade')).toBe(true);
  });

  it('uses custom step weight and includes 100', () => {
    const shades = red.shades(25);
    expect(shades.map((c) => c.weight)).toEqual([25, 50, 75, 100]);
    expect(shades[shades.length - 1]?.hexString().toLowerCase()).toBe('#000000');
  });

  it('each step is progressively darker', () => {
    const shades = red.shades(25);
    for (let i = 1; i < shades.length; i++) {
      expect(shades[i]!.oklch.l).toBeLessThanOrEqual(shades[i - 1]!.oklch.l);
    }
  });
});

describe('Color.all()', () => {
  const color = new Color('#00ffff');

  it('defaults to step 10 → tints (reversed) + base + shades', () => {
    const all = color.all();
    // 10 tints + 1 base + 10 shades
    expect(all).toHaveLength(21);

    expect(all[0]?.type).toBe('tint');
    expect(all[0]?.weight).toBe(100);
    expect(all[0]?.hexString().toLowerCase()).toBe('#ffffff');

    const mid = all[10];
    expect(mid?.type).toBe('base');
    expect(mid?.weight).toBe(0);
    expect(mid?.hexString().toLowerCase()).toBe('#00ffff');

    const last = all[all.length - 1];
    expect(last?.type).toBe('shade');
    expect(last?.weight).toBe(100);
    expect(last?.hexString().toLowerCase()).toBe('#000000');
  });

  it('orders lightest → base → darkest', () => {
    const all = color.all(25);
    // tints 100,75,50,25 + base + shades 25,50,75,100
    expect(all).toHaveLength(9);
    expect(all.map((c) => c.type)).toEqual([
      'tint',
      'tint',
      'tint',
      'tint',
      'base',
      'shade',
      'shade',
      'shade',
      'shade',
    ]);
    expect(all.map((c) => c.weight)).toEqual([100, 75, 50, 25, 0, 25, 50, 75, 100]);
  });

  it('base copy is a distinct instance', () => {
    const all = color.all(50);
    const base = all.find((c) => c.type === 'base');
    expect(base).toBeInstanceOf(Color);
    expect(base).not.toBe(color);
    expect(base?.hexString()).toBe(color.hexString());
  });
});
