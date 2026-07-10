import { describe, expect, it } from 'vitest';

import { Color, ColorError, VERSION, parse } from '../src/index.js';

describe('edge cases & remaining branches', () => {
  it('exports VERSION', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('formats translucent hsl with alpha slash syntax', () => {
    const s = new Color('rgba(255, 0, 0, 0.25)').hslString();
    expect(s).toMatch(/^hsl\(/);
    expect(s).toMatch(/\/\s*0\.25/);
  });

  it('tints/shades/all treat step 0 as default 10', () => {
    const c = new Color('red');
    expect(c.tints(0)).toHaveLength(10);
    expect(c.shades(0)).toHaveLength(10);
    expect(c.all(0)).toHaveLength(21);
  });

  it('tints/shades coerce invalid step to default 10', () => {
    const c = new Color('red');
    // @ts-expect-error intentional
    expect(c.tints('nope')).toHaveLength(10);
    // @ts-expect-error intentional
    expect(c.shades(null)).toHaveLength(10);
  });

  it('throws for unknown scale preset', () => {
    // @ts-expect-error intentional
    expect(() => new Color('#0af').scale(10, { preset: 'bootstrap' })).toThrow(ColorError);
  });

  it('accepts explicit preset null on scale', () => {
    const scale = new Color('#0af').scale(25, { preset: null });
    expect(Array.isArray(scale)).toBe(true);
    expect(scale).toHaveLength(7);
  });

  it('on() prefers a tint when surface is black', () => {
    // A dark red needs lightening against black to reach high contrast
    const result = new Color('#400').on(4.5, { against: '#000' });
    expect(result.oklch.l).toBeGreaterThan(new Color('#400').oklch.l);
    expect(result.contrast('#000').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('on() best-effort returns a family color when target is extreme', () => {
    // target 21 against mid gray is only achievable near black/white extremes
    const result = new Color('#888').on(21);
    expect(result).toBeInstanceOf(Color);
    // best effort should still produce a valid formatted color
    expect(result.oklchString()).toMatch(/^oklch\(/);
  });

  it('contrast reports failing AA for low-contrast pairs', () => {
    const result = new Color('#ccc').contrast('#ddd');
    expect(result.ratio).toBeLessThan(3);
    expect(result.passes.aa).toBe(false);
    expect(result.passes.aaLarge).toBe(false);
    expect(result.passes.aaa).toBe(false);
  });

  it('fg returns white on very dark colors', () => {
    expect(new Color('#111').fg().hexString().toLowerCase()).toBe('#ffffff');
  });

  it('parse trims surrounding whitespace', () => {
    const c = parse('  #0af  ');
    expect(c?.hexString().toLowerCase()).toBe('#00aaff');
  });

  it('toCulori is usable by other Color instances', () => {
    const a = new Color('#f00');
    const b = Color.fromCulori(a.toCulori(), 'base', 0);
    expect(b.hexString().toLowerCase()).toBe('#ff0000');
  });

  it('transparent alpha formats across exporters', () => {
    const t = new Color('transparent');
    expect(t.alpha).toBe(0);
    expect(t.oklchString()).toMatch(/\/\s*0/);
    expect(t.rgbString()).toMatch(/\/\s*0/);
    expect(t.hexString().length).toBe(9);
  });
});
