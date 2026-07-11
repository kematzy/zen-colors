import { describe, expect, it } from 'vitest';

import { Color, parse } from '../../src/index.js';

/**
 * Smoke tests that the package runs correctly in a real browser (Chromium).
 * Focused on the public happy-path surface rather than full unit coverage
 * (which lives in the Node Vitest suite).
 */
describe('zen-colors in browser', () => {
  it('parses and formats CSS colors', () => {
    const color = new Color('#0af');
    expect(color.hexString().toLowerCase()).toBe('#00aaff');
    expect(color.rgbString()).toBe('rgb(0 170 255)');
    expect(color.oklchString()).toMatch(/^oklch\(/);
    expect(color.toString()).toBe(color.oklchString());
  });

  it('supports fluent tint chains', () => {
    const s = new Color('#0af').tint(25).oklchString();
    expect(s).toMatch(/^oklch\(/);
    expect(s).toMatch(/%/);
  });

  it('builds a weight-driven zen scale in-browser', () => {
    const scale = new Color('oklch(64.9% 0.12 250)').scale(25, {
      preset: 'zen',
    }) as Record<string, Color>;

    expect(Object.keys(scale)).toEqual(['t75', 't50', 't25', 'base', 's25', 's50', 's75']);
    expect(scale.base?.oklch.l).toBeCloseTo(64.9, 1);
    expect(scale.t75!.oklch.l).toBeGreaterThan(scale.base!.oklch.l);
    expect(scale.s75!.oklch.l).toBeLessThan(scale.base!.oklch.l);
  });

  it('computes contrast and foreground helpers', () => {
    const brand = new Color('#0af');
    expect(brand.contrast('#fff').ratio).toBeGreaterThan(1);
    expect(brand.fg().hexString().toLowerCase()).toBe('#000000');
    expect(brand.on(4.5).contrast('#fff').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('parse returns null for invalid input', () => {
    expect(parse('not-a-color')).toBeNull();
  });
});
