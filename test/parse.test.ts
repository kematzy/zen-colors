import { describe, expect, it } from 'vitest';

import { Color, ColorError, parse } from '../src/index.js';

describe('parse()', () => {
  it('parses 3-digit hex', () => {
    const color = parse('#0af');
    expect(color).toBeInstanceOf(Color);
    expect(color?.hexString().toLowerCase()).toBe('#00aaff');
  });

  it('parses 6-digit hex', () => {
    const color = parse('#00aaff');
    expect(color?.hexString().toLowerCase()).toBe('#00aaff');
  });

  it('parses 8-digit hex with alpha', () => {
    const color = parse('#00aaff80');
    expect(color).toBeInstanceOf(Color);
    expect(color?.alpha).toBeCloseTo(0.5019607843, 5);
  });

  it('parses rgb modern syntax', () => {
    const color = parse('rgb(0 170 255)');
    expect(color?.rgb).toEqual({ r: 0, g: 170, b: 255 });
    expect(color?.alpha).toBe(1);
  });

  it('parses rgba with alpha', () => {
    const color = parse('rgba(0, 170, 255, 0.5)');
    expect(color?.rgb).toEqual({ r: 0, g: 170, b: 255 });
    expect(color?.alpha).toBeCloseTo(0.5, 5);
  });

  it('parses hsl', () => {
    const color = parse('hsl(200 100% 50%)');
    expect(color).toBeInstanceOf(Color);
    expect(color?.rgb.r).toBe(0);
    expect(color?.rgb.g).toBe(170);
    expect(color?.rgb.b).toBe(255);
  });

  it('parses oklch with percentage lightness', () => {
    const color = parse('oklch(64.9% 0.009 99)');
    expect(color).toBeInstanceOf(Color);
    expect(color?.oklch.l).toBeCloseTo(64.9, 1);
    expect(color?.oklch.c).toBeCloseTo(0.009, 3);
    expect(color?.oklch.h).toBeCloseTo(99, 0);
  });

  it('parses color keywords', () => {
    const red = parse('red');
    expect(red?.rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses transparent as black with zero alpha', () => {
    const color = parse('transparent');
    expect(color?.rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(color?.alpha).toBe(0);
  });

  it('returns null for invalid color strings', () => {
    expect(parse('not-a-color')).toBeNull();
    expect(parse('')).toBeNull();
    expect(parse('currentColor')).toBeNull();
  });

  it('returns null for non-string input', () => {
    // @ts-expect-error intentional invalid input
    expect(parse(null)).toBeNull();
    // @ts-expect-error intentional invalid input
    expect(parse(42)).toBeNull();
  });
});

describe('new Color()', () => {
  it('constructs from a valid CSS color string', () => {
    const color = new Color('#0af');
    expect(color).toBeInstanceOf(Color);
    expect(color.type).toBe('base');
    expect(color.weight).toBe(0);
  });

  it('defaults to black when called with no argument', () => {
    const color = new Color();
    expect(color.hexString().toLowerCase()).toBe('#000000');
  });

  it('throws ColorError for invalid color strings', () => {
    expect(() => new Color('not-a-color')).toThrow(ColorError);
    expect(() => new Color('not-a-color')).toThrow(/unable to parse/i);
  });

  it('throws ColorError for non-string input', () => {
    // @ts-expect-error intentional invalid input
    expect(() => new Color(123)).toThrow(ColorError);
  });
});
