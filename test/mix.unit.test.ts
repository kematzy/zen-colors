import { describe, expect, it } from 'vitest';

import { mixOklch, normalizeWeight, seriesWeights, shadeOklch, tintOklch } from '../src/mix.js';

describe('mix helpers', () => {
  it('normalizeWeight falls back for non-numbers', () => {
    expect(normalizeWeight(undefined, 50)).toBe(50);
    expect(normalizeWeight(null, 50)).toBe(50);
    expect(normalizeWeight('10', 50)).toBe(50);
    expect(normalizeWeight(Number.NaN, 50)).toBe(50);
    expect(normalizeWeight(Number.POSITIVE_INFINITY, 50)).toBe(50);
  });

  it('normalizeWeight clamps finite numbers into 0–100', () => {
    expect(normalizeWeight(-5, 50)).toBe(0);
    expect(normalizeWeight(0, 50)).toBe(0);
    expect(normalizeWeight(50, 50)).toBe(50);
    expect(normalizeWeight(150, 50)).toBe(100);
  });

  it('seriesWeights always ends with 100', () => {
    expect(seriesWeights(25)).toEqual([25, 50, 75, 100]);
    expect(seriesWeights(40)).toEqual([40, 80, 100]);
    expect(seriesWeights(100)).toEqual([100]);
  });

  it('seriesWeights clamps step into a safe positive range', () => {
    expect(seriesWeights(0)[0]).toBe(1);
    expect(seriesWeights(200)).toEqual([100]);
  });

  it('mixOklch clamps weight and moves toward the target', () => {
    const red = { mode: 'rgb' as const, r: 1, g: 0, b: 0 };
    const towardWhite = mixOklch(red, 'white', 150);
    // fully white
    expect(towardWhite).toBeTruthy();
    const same = mixOklch(red, 'white', -10);
    // fully original side
    expect(same).toBeTruthy();
  });

  it('tintOklch / shadeOklch are convenience wrappers', () => {
    const red = { mode: 'rgb' as const, r: 1, g: 0, b: 0 };
    expect(tintOklch(red, 100)).toBeTruthy();
    expect(shadeOklch(red, 100)).toBeTruthy();
  });
});
