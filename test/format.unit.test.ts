import { describe, expect, it } from 'vitest';

import {
  formatHexString,
  formatHslString,
  formatOklchString,
  formatRgbString,
  getAlpha,
  getOklch,
  getRgb,
  toRgbByte,
} from '../src/format.js';

describe('format unit helpers', () => {
  it('toRgbByte clamps below 0 and above 1', () => {
    expect(toRgbByte(-0.5)).toBe(0);
    expect(toRgbByte(0)).toBe(0);
    expect(toRgbByte(0.5)).toBe(128);
    expect(toRgbByte(1)).toBe(255);
    expect(toRgbByte(2)).toBe(255);
  });

  it('getRgb defaults missing channels to 0', () => {
    // incomplete rgb-like object
    expect(getRgb({ mode: 'rgb' } as never)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('getOklch defaults missing channels for achromatic / sparse colors', () => {
    const o = getOklch({ mode: 'oklch', l: 0.5 } as never);
    expect(o.l).toBeCloseTo(50);
    expect(o.c).toBe(0);
    expect(o.h).toBe(0);
    expect(o.alpha).toBe(1);
  });

  it('getAlpha defaults to 1 when missing', () => {
    expect(getAlpha({ mode: 'rgb', r: 1, g: 0, b: 0 })).toBe(1);
    expect(getAlpha({ mode: 'rgb', r: 1, g: 0, b: 0, alpha: 0.3 })).toBe(0.3);
  });

  it('formatOklchString handles sparse oklch and alpha', () => {
    const opaque = formatOklchString({ mode: 'oklch', l: 0.5, c: 0.1, h: 40 } as never);
    expect(opaque).toBe('oklch(50% 0.1 40)');

    const faded = formatOklchString({
      mode: 'oklch',
      l: 0.5,
      c: 0.1,
      h: 40,
      alpha: 0.25,
    } as never);
    expect(faded).toBe('oklch(50% 0.1 40 / 0.25)');

    // missing l/c/h
    const sparse = formatOklchString({ mode: 'oklch' } as never);
    expect(sparse).toBe('oklch(0% 0 0)');
  });

  it('formatRgbString with α', () => {
    expect(formatRgbString({ mode: 'rgb', r: 1, g: 0, b: 0, alpha: 0.5 } as never)).toBe(
      'rgb(255 0 0 / 0.5)',
    );
    expect(formatRgbString({ mode: 'rgb', r: 1, g: 0, b: 0 } as never)).toBe('rgb(255 0 0)');
  });

  it('formatHslString defaults missing channels and supports alpha', () => {
    expect(formatHslString({ mode: 'hsl' } as never)).toBe('hsl(0 0% 0%)');
    expect(formatHslString({ mode: 'hsl', h: 120, s: 1, l: 0.5, alpha: 0.4 } as never)).toBe(
      'hsl(120 100% 50% / 0.4)',
    );
  });

  it('formatHexString falls back when formatters return empty for odd input', () => {
    // legitimate translucent red still formats
    expect(formatHexString({ mode: 'rgb', r: 1, g: 0, b: 0, alpha: 0.5 } as never).length).toBe(9);
    expect(formatHexString({ mode: 'rgb', r: 1, g: 0, b: 0 } as never).toLowerCase()).toBe(
      '#ff0000',
    );
  });
});
