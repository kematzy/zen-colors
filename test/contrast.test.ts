import { describe, expect, it } from 'vitest';

import { Color, ColorError } from '../src/index.js';

describe('Color.contrast()', () => {
  it('returns ratio 21 for black vs white', () => {
    const black = new Color('#000');
    const result = black.contrast('#fff');
    expect(result.ratio).toBeCloseTo(21, 5);
    expect(result.passes.aa).toBe(true);
    expect(result.passes.aaLarge).toBe(true);
    expect(result.passes.aaa).toBe(true);
    expect(result.passes.aaaLarge).toBe(true);
  });

  it('accepts a Color instance as the other color', () => {
    const a = new Color('#000');
    const b = new Color('#fff');
    expect(a.contrast(b).ratio).toBeCloseTo(21, 5);
  });

  it('identifies darker and lighter of the pair', () => {
    const color = new Color('#0af');
    const result = color.contrast('#fff');
    expect(result.darker.hexString().toLowerCase()).toBe('#00aaff');
    expect(result.lighter.hexString().toLowerCase()).toBe('#ffffff');
    expect(result.current).toBe('darker');
  });

  it('marks current as lighter when this color is lighter', () => {
    const color = new Color('#fff');
    const result = color.contrast('#0af');
    expect(result.current).toBe('lighter');
  });

  it('reports WCAG pass flags for mid contrast pairs', () => {
    // black on #0af ≈ 8.19
    const result = new Color('#0af').contrast('#000');
    expect(result.ratio).toBeGreaterThan(7);
    expect(result.passes.aa).toBe(true);
    expect(result.passes.aaa).toBe(true);
  });

  it('throws ColorError for invalid other color string', () => {
    expect(() => new Color('#0af').contrast('not-a-color')).toThrow(ColorError);
  });
});

describe('Color.fg() / bestForeground()', () => {
  it('returns black on a light background (default base ≥ 5:1)', () => {
    const fg = new Color('#fff').fg();
    expect(fg.hexString().toLowerCase()).toBe('#000000');
  });

  it('returns white on a dark background', () => {
    const fg = new Color('#000').fg();
    expect(fg.hexString().toLowerCase()).toBe('#ffffff');
  });

  it('returns black on cyan (#0af) for higher contrast', () => {
    // black:~8.19 vs white:~2.56
    const fg = new Color('#0af').fg();
    expect(fg.hexString().toLowerCase()).toBe('#000000');
  });

  it('empty fg() matches explicit base level', () => {
    const c = new Color('#0af');
    expect(c.fg().hexString()).toBe(c.fg('base').hexString());
  });

  it('prefers a B/W that meets the minimum when only one does', () => {
    // On #0af white fails aa (4.5); black passes → black for aa and strong
    const bg = new Color('#0af');
    expect(bg.fg('aa').hexString().toLowerCase()).toBe('#000000');
    expect(bg.fg('strong').hexString().toLowerCase()).toBe('#000000');
    expect(bg.fg('ui').hexString().toLowerCase()).toBe('#000000');
  });

  it('best-effort when neither B/W meets a high floor', () => {
    // Mid grey: both ratios modest; aaa may be unreachable for both in some cases
    // Use a mid chroma mid L where white and black are closer
    const bg = new Color('oklch(55% 0.02 100)');
    const fg = bg.fg('aaa');
    const rBlack = new Color('#000').contrast(bg).ratio;
    const rWhite = new Color('#fff').contrast(bg).ratio;
    const chosen = fg.hexString().toLowerCase() === '#000000' ? rBlack : rWhite;
    expect(chosen).toBeGreaterThanOrEqual(Math.max(rBlack, rWhite) - 1e-9);
  });

  it('throws ColorError for unknown or alias levels', () => {
    const c = new Color('#0af');
    expect(() => c.fg('best' as 'aa')).toThrow(ColorError);
    expect(() => c.fg('aalarge' as 'aa')).toThrow(ColorError);
    expect(() => c.fg('normal' as 'aa')).toThrow(ColorError);
  });

  it('returns a Color that chains to formatters', () => {
    const s = new Color('#0af').fg().rgbString();
    expect(s).toBe('rgb(0 0 0)');
  });

  it('bestForeground is an alias of fg', () => {
    const c = new Color('#333');
    expect(c.bestForeground().hexString()).toBe(c.fg().hexString());
    expect(c.bestForeground('aaa').hexString()).toBe(c.fg('aaa').hexString());
  });
});

describe('Color.on()', () => {
  it('defaults against white and returns a Color from the current family', () => {
    // pure cyan on white fails AA; a darker shade should pass 4.5
    const result = new Color('#0af').on(4.5);
    expect(result).toBeInstanceOf(Color);
    // Should be darker than base (a shade)
    expect(result.oklch.l).toBeLessThan(new Color('#0af').oklch.l);
    expect(result.contrast('#fff').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('returns base unchanged when base already meets the target', () => {
    // black already has 21:1 on white
    const black = new Color('#000');
    const result = black.on(4.5);
    expect(result.hexString().toLowerCase()).toBe('#000000');
  });

  it('supports an explicit against surface', () => {
    // light color on black → likely a tint of itself
    const result = new Color('#0af').on(4.5, { against: '#000' });
    expect(result).toBeInstanceOf(Color);
    expect(result.contrast('#000').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('accepts against as a Color instance', () => {
    const result = new Color('#0af').on(7, { against: new Color('#fff') });
    expect(result.contrast('#fff').ratio).toBeGreaterThanOrEqual(7);
  });

  it('throws ColorError for invalid target ratio', () => {
    expect(() => new Color('#0af').on(0)).toThrow(ColorError);
    expect(() => new Color('#0af').on(-1)).toThrow(ColorError);
  });

  it('throws ColorError for invalid against color', () => {
    expect(() => new Color('#0af').on(4.5, { against: 'nope' })).toThrow(ColorError);
  });
});
