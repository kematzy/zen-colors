import { Color, VERSION, parse } from 'zen-colors';

/**
 * Client-side JSON API for agents & demos (no server).
 * @param {URLSearchParams | Record<string, string>} input
 */
export function runApi(input) {
  const params =
    input instanceof URLSearchParams ? input : new URLSearchParams(Object.entries(input));

  const op = (params.get('op') || 'parse').toLowerCase();
  const c = params.get('c') || params.get('color') || '#00aaff';
  const weight = num(params.get('weight') ?? params.get('w') ?? params.get('step'), 10);
  const against = params.get('against') || '#ffffff';
  const ratio = num(params.get('ratio'), 4.5);
  const preset = params.get('preset'); // null | zen | tailwind
  const seed = params.get('seed');

  try {
    if (op === 'random') {
      const color = randomColor(seed);
      return envelope(op, { seed }, serializeColor(color), color);
    }

    if (op === 'parse') {
      const color = parseOrThrow(c);
      return envelope(op, { c }, serializeColor(color), color);
    }

    const color = parseOrThrow(c);

    switch (op) {
      case 'tint': {
        const result = color.tint(weight);
        return envelope(op, { c, weight }, serializeColor(result), color);
      }
      case 'shade': {
        const result = color.shade(weight);
        return envelope(op, { c, weight }, serializeColor(result), color);
      }
      case 'tints': {
        return envelope(op, { c, weight }, color.tints(weight).map(serializeColor), color);
      }
      case 'shades': {
        return envelope(op, { c, weight }, color.shades(weight).map(serializeColor), color);
      }
      case 'all': {
        return envelope(op, { c, weight }, color.all(weight).map(serializeColor), color);
      }
      case 'scale': {
        const p = preset === 'tailwind' || preset === 'zen' ? preset : null;
        const scale = color.scale(weight, { preset: p });
        const result = Array.isArray(scale)
          ? scale.map(serializeColor)
          : Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, serializeColor(v)]));
        return envelope(op, { c, weight, preset: p }, result, color);
      }
      case 'contrast': {
        const report = color.contrast(against);
        return envelope(
          op,
          { c, against },
          {
            ratio: report.ratio,
            passes: report.passes,
            current: report.current,
            darker: serializeColor(report.darker),
            lighter: serializeColor(report.lighter),
          },
          color,
        );
      }
      case 'fg': {
        return envelope(op, { c }, serializeColor(color.fg()), color);
      }
      case 'on': {
        return envelope(
          op,
          { c, ratio, against },
          serializeColor(color.on(ratio, { against })),
          color,
        );
      }
      default:
        return errorEnvelope(`Unknown op: ${op}`, op);
    }
  } catch (err) {
    return errorEnvelope(err instanceof Error ? err.message : String(err), op);
  }
}

/**
 * @param {string} c
 */
function parseOrThrow(c) {
  try {
    return new Color(c);
  } catch {
    const p = parse(c);
    if (!p) throw new Error(`Unable to parse color: ${c}`);
    return p;
  }
}

/**
 * @param {import('zen-colors').Color} color
 */
function serializeColor(color) {
  return {
    hex: color.hexString(),
    oklch: color.oklchString(),
    rgb: color.rgbString(),
    hsl: color.hslString(),
    type: color.type,
    weight: color.weight,
    alpha: color.alpha,
    channels: {
      rgb: color.rgb,
      oklch: color.oklch,
    },
  };
}

/**
 * @param {string} op
 * @param {Record<string, unknown>} input
 * @param {unknown} result
 * @param {import('zen-colors').Color} [base]
 */
function envelope(op, input, result, base) {
  const api = new URL(window.location.href);
  api.search = '';
  api.hash = '';
  api.searchParams.set('mode', 'api');
  api.searchParams.set('op', op);
  for (const [k, v] of Object.entries(input)) {
    if (v != null && v !== '') api.searchParams.set(k, String(v));
  }

  return {
    ok: true,
    lib: 'zen-colors',
    version: VERSION,
    op,
    input,
    base: base ? serializeColor(base) : null,
    result,
    url: api.toString(),
  };
}

/**
 * @param {string} message
 * @param {string} op
 */
function errorEnvelope(message, op) {
  return {
    ok: false,
    lib: 'zen-colors',
    version: VERSION,
    op,
    error: message,
  };
}

/**
 * @param {string | null} value
 * @param {number} fallback
 */
function num(value, fallback) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {string | null} seed
 */
function randomColor(seed) {
  const rand = mulberry32(seedToInt(seed));
  const l = 35 + rand() * 45; // 35–80%
  const c = 0.04 + rand() * 0.18;
  const h = rand() * 360;
  return new Color(`oklch(${l.toFixed(1)}% ${c.toFixed(4)} ${h.toFixed(1)})`);
}

/** @param {string | null} seed */
function seedToInt(seed) {
  if (!seed) return (Math.random() * 0xffffffff) >>> 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** @param {number} a */
function mulberry32(a) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
