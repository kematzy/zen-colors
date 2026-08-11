import { describe, expect, it } from 'vitest';

import { Color, ColorError, FG_LEVEL_MIN_RATIO } from '../src/index.js';

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
  it('returns pure black on white when no level', () => {
    expect(new Color('#fff').fg().hexString().toLowerCase()).toBe('#000000');
  });

  it('returns pure white on black when no level', () => {
    expect(new Color('#000').fg().hexString().toLowerCase()).toBe('#ffffff');
  });

  it('returns pure black on cyan without level (higher than white)', () => {
    expect(new Color('#0af').fg().hexString().toLowerCase()).toBe('#000000');
  });

  it('with level returns soft grey meeting the floor on white', () => {
    const bg = new Color('#fff');
    const fg = bg.fg('base');
    expect(fg.hexString().toLowerCase()).not.toBe('#000000');
    expect(fg.hexString().toLowerCase()).not.toBe('#ffffff');
    expect(fg.contrast(bg).ratio).toBeGreaterThanOrEqual(FG_LEVEL_MIN_RATIO.base);
    expect(fg.hexString()).toBe(new Color('#fff').on(5, { against: bg }).hexString());
  });

  it('with level on black returns soft grey meeting the floor', () => {
    const bg = new Color('#000');
    const fg = bg.fg('aa');
    expect(fg.hexString().toLowerCase()).not.toBe('#000000');
    expect(fg.contrast(bg).ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('best-effort pure B/W when soft greys cannot meet a high floor', () => {
    // Mid grey: max B/W contrast is ~5.3:1 — aaa (7:1) is unreachable
    const bg = new Color('#808080');
    const fg = bg.fg('aaa');
    const black = new Color('#000').contrast(bg).ratio;
    const white = new Color('#fff').contrast(bg).ratio;
    const chosen = fg.hexString().toLowerCase() === '#000000' ? black : white;
    expect(chosen).toBeCloseTo(Math.max(black, white), 5);
    expect(
      fg.hexString().toLowerCase() === '#000000' || fg.hexString().toLowerCase() === '#ffffff',
    ).toBe(true);
  });

  it('prefers the softer of two greys when both meet the floor', () => {
    const bg = new Color('#fff');
    const fg = bg.fg('subtle'); // 3:1 — both white-search and black-search meet
    expect(fg.contrast(bg).ratio).toBeGreaterThanOrEqual(3);
    // Soft grey, not pure black
    expect(fg.hexString().toLowerCase()).not.toBe('#000000');
  });

  it('throws ColorError for unknown or alias levels', () => {
    const c = new Color('#0af');
    expect(() => c.fg('best' as 'aa')).toThrow(ColorError);
    expect(() => c.fg('aalarge' as 'aa')).toThrow(ColorError);
    expect(() => c.fg('normal' as 'aa')).toThrow(ColorError);
  });

  it('returns a Color that chains to formatters', () => {
    expect(new Color('#0af').fg().rgbString()).toBe('rgb(0 0 0)');
  });

  it('bestForeground is an alias of fg', () => {
    const c = new Color('#333');
    expect(c.bestForeground().hexString()).toBe(c.fg().hexString());
    expect(c.bestForeground('aaa').hexString()).toBe(c.fg('aaa').hexString());
  });
});

describe('Color.on()', () => {
  it('defaults against white and returns a Color from the current family', () => {
    const result = new Color('#0af').on(4.5);
    expect(result).toBeInstanceOf(Color);
    expect(result.oklch.l).toBeLessThan(new Color('#0af').oklch.l);
    expect(result.contrast('#fff').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('returns base unchanged when base already meets the target', () => {
    const black = new Color('#000');
    const result = black.on(4.5);
    expect(result.hexString().toLowerCase()).toBe('#000000');
  });

  it('against black tints black to a grey that meets the ratio', () => {
    const result = new Color('#000').on(4.5, { against: '#000' });
    expect(result.hexString().toLowerCase()).not.toBe('#000000');
    expect(result.contrast('#000').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('against white shades white to a grey that meets the ratio', () => {
    const result = new Color('#fff').on(4.5, { against: '#fff' });
    expect(result.hexString().toLowerCase()).not.toBe('#ffffff');
    expect(result.contrast('#fff').ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('supports an explicit against surface', () => {
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
