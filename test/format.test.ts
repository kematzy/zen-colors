import { describe, expect, it } from 'vitest';

import { Color } from '../src/index.js';

describe('Color formatters', () => {
  const cyan = new Color('#0af');
  const translucent = new Color('rgba(0, 170, 255, 0.5)');

  describe('oklch object (lightness as percent 0–100)', () => {
    it('exposes l in percentage form', () => {
      const { l, c, h, alpha } = cyan.oklch;
      expect(l).toBeGreaterThan(1); // percent, not 0–1 fraction
      expect(l).toBeLessThanOrEqual(100);
      expect(c).toBeGreaterThan(0);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
      expect(alpha).toBe(1);
    });

    it('includes alpha for translucent colors', () => {
      expect(translucent.oklch.alpha).toBeCloseTo(0.5, 5);
    });
  });

  describe('oklchString()', () => {
    it('returns modern oklch() with percentage lightness', () => {
      const s = cyan.oklchString();
      expect(s).toMatch(/^oklch\(/);
      expect(s).toMatch(/%/);
      expect(s).not.toMatch(/oklch\(0\.\d+/); // not fractional L
    });

    it('includes alpha when less than 1', () => {
      const s = translucent.oklchString();
      expect(s).toMatch(/\/\s*0\.5/);
    });
  });

  describe('rgb object and rgbString()', () => {
    it('exposes integer rgb channels 0–255', () => {
      expect(cyan.rgb).toEqual({ r: 0, g: 170, b: 255 });
    });

    it('returns modern rgb() syntax without commas', () => {
      expect(cyan.rgbString()).toBe('rgb(0 170 255)');
    });

    it('includes alpha with slash syntax when translucent', () => {
      expect(translucent.rgbString()).toBe('rgb(0 170 255 / 0.5)');
    });
  });

  describe('hex and hexString()', () => {
    it('hex getter omits the hash', () => {
      expect(cyan.hex.toLowerCase()).toBe('00aaff');
    });

    it('hexString includes the hash', () => {
      expect(cyan.hexString().toLowerCase()).toBe('#00aaff');
    });

    it('includes alpha as 8-digit hex when translucent', () => {
      expect(translucent.hexString().toLowerCase()).toMatch(/^#00aaff/i);
      expect(translucent.hexString().length).toBe(9);
    });
  });

  describe('hslString()', () => {
    it('returns modern hsl() syntax', () => {
      const s = cyan.hslString();
      expect(s).toMatch(/^hsl\(/);
      expect(s).toMatch(/%/);
    });
  });

  describe('toString() and toJSON()', () => {
    it('toString defaults to oklchString', () => {
      expect(cyan.toString()).toBe(cyan.oklchString());
    });

    it('toJSON includes practical serializable fields', () => {
      const json = cyan.toJSON();
      expect(json).toMatchObject({
        type: 'base',
        weight: 0,
        alpha: 1,
      });
      expect(json.hex).toBeDefined();
      expect(json.rgb).toEqual({ r: 0, g: 170, b: 255 });
      expect(json.oklch).toBeDefined();
      expect(json.oklch.l).toBeGreaterThan(1);
    });
  });
});
