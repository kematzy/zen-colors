/** Query-param helpers for shareable playground state. */

const MODES = new Set(['intro', 'scale', 'methods', 'contrast', 'docs', 'api']);

/**
 * @param {string} [search]
 * @returns {{ c: string | null, w: number | null, mode: string | null }}
 */
export function parseQuery(search = window.location.search) {
  const params = new URLSearchParams(search);
  const c = params.get('c') || params.get('color');
  const wRaw = params.get('w') || params.get('p') || params.get('weight') || params.get('step');
  const modeRaw = params.get('mode');
  let w = null;
  if (wRaw != null) {
    const n = Number.parseInt(wRaw, 10);
    if (Number.isInteger(n) && n >= 2 && n <= 25) w = n;
  }
  const mode = modeRaw && MODES.has(modeRaw) ? modeRaw : null;
  return { c, w, mode };
}

/**
 * @param {{ c: string, w: number, mode: string }} state
 * @param {{ replace?: boolean }} [opts]
 */
export function writeQuery(state, opts = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set('c', state.c);
  url.searchParams.set('w', String(state.w));
  if (state.mode && state.mode !== 'intro') {
    url.searchParams.set('mode', state.mode);
  } else {
    url.searchParams.delete('mode');
  }
  const method = opts.replace === false ? 'pushState' : 'replaceState';
  window.history[method]({}, '', url);
  return url.toString();
}

/**
 * Absolute share URL for the current playground state.
 * @param {{ c: string, w: number, mode?: string }} state
 */
export function shareUrl(state) {
  const url = new URL(window.location.href);
  url.searchParams.set('c', state.c);
  url.searchParams.set('w', String(state.w));
  if (state.mode && state.mode !== 'intro') {
    url.searchParams.set('mode', state.mode);
  } else {
    url.searchParams.delete('mode');
  }
  // Drop hash noise for clean shares
  url.hash = '';
  return url.toString();
}
