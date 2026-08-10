import { describe, expect, it } from 'vitest';

import { Color } from '../src/index.js';

describe('Color.fg() — pure black/white (no level)', () => {
  it('on white returns black', () => {
    const c = new Color('#fff');
    expect(c.fg().hexString()).toBe('#000000');
  });

  it('on black returns white', () => {
    const c = new Color('#000');
    expect(c.fg().hexString()).toBe('#ffffff');
  });
});

describe('Color.fg(level) ≈ on(min, { against: background })', () => {
  it("fg('aa-large'/'ui') on white meets ≥ 3:1 (soft grey)", () => {
    const c = new Color('#fff');
    const expected = new Color('#fff').on(3, { against: c });
    expect(c.fg('aa-large').hexString()).toBe(expected.hexString());
    expect(c.fg('ui').hexString()).toBe(expected.hexString());
    expect(c.fg('subtle').hexString()).toBe(expected.hexString());
    expect(c.fg('aa-large').contrast(c).ratio).toBeGreaterThanOrEqual(3);
  });

  it("fg('aa'/'aaa-large') on white meets ≥ 4.5:1", () => {
    const c = new Color('#fff');
    const expected = new Color('#fff').on(4.5, { against: c });
    expect(c.fg('aa').hexString()).toBe(expected.hexString());
    expect(c.fg('aaa-large').hexString()).toBe(expected.hexString());
    expect(c.fg('aa').contrast(c).ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("fg('aa') on black meets ≥ 4.5:1 against black", () => {
    const c = new Color('#000');
    const expected = new Color('#000').on(4.5, { against: c });
    expect(c.fg('aa').hexString()).toBe(expected.hexString());
    expect(c.fg('aaa-large').hexString()).toBe(expected.hexString());
    expect(c.fg('aa').contrast(c).ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("fg('aaa') meets ≥ 7:1", () => {
    const white = new Color('#fff');
    const black = new Color('#000');
    expect(white.fg('aaa').hexString()).toBe(
      new Color('#fff').on(7, { against: white }).hexString(),
    );
    expect(black.fg('aaa').hexString()).toBe(
      new Color('#000').on(7, { against: black }).hexString(),
    );
    expect(white.fg('aaa').contrast(white).ratio).toBeGreaterThanOrEqual(7);
    expect(black.fg('aaa').contrast(black).ratio).toBeGreaterThanOrEqual(7);
  });

  it("fg('base') meets ≥ 5:1", () => {
    const white = new Color('#fff');
    const black = new Color('#000');
    expect(white.fg('base').hexString()).toBe(
      new Color('#fff').on(5, { against: white }).hexString(),
    );
    expect(black.fg('base').hexString()).toBe(
      new Color('#000').on(5, { against: black }).hexString(),
    );
  });

  it("fg('strong') meets ≥ 6:1", () => {
    const white = new Color('#fff');
    const black = new Color('#000');
    expect(white.fg('strong').hexString()).toBe(
      new Color('#fff').on(6, { against: white }).hexString(),
    );
    expect(black.fg('strong').hexString()).toBe(
      new Color('#000').on(6, { against: black }).hexString(),
    );
  });

  it("fg('muted') meets ≥ 4:1", () => {
    const white = new Color('#fff');
    const black = new Color('#000');
    expect(white.fg('muted').hexString()).toBe(
      new Color('#fff').on(4, { against: white }).hexString(),
    );
    expect(black.fg('muted').hexString()).toBe(
      new Color('#000').on(4, { against: black }).hexString(),
    );
  });
});

describe('Color.on() against the surface (not default white when surface is black)', () => {
  it('shades white against white to meet a ratio', () => {
    const g = new Color('#fff').on(4.5, { against: '#fff' });
    expect(g.contrast('#fff').ratio).toBeGreaterThanOrEqual(4.5);
    expect(g.hexString().toLowerCase()).not.toBe('#ffffff');
  });

  it('tints black against black to meet a ratio', () => {
    const g = new Color('#000').on(4.5, { against: '#000' });
    expect(g.contrast('#000').ratio).toBeGreaterThanOrEqual(4.5);
    expect(g.hexString().toLowerCase()).not.toBe('#000000');
  });
});
