import { parse as culoriParse } from 'culori';
import type { Color } from 'culori';

/**
 * Parse a CSS color string into a culori color object.
 * Returns `undefined` when input is not a recognized color string.
 */
export function parseCulori(input: string): Color | undefined {
  return culoriParse(input.trim()) ?? undefined;
}
