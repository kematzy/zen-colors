/**
 * Domain error thrown for invalid color input or arguments.
 */
export class ColorError extends Error {
  override readonly name = 'ColorError';

  constructor(message: string) {
    super(message);
  }
}
