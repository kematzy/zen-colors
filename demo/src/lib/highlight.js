/**
 * Lightweight code presentation (no Shiki runtime — keeps the demo bundle small).
 * Dedents by the first non-empty line so indented HTML source stays clean.
 */

/**
 * @param {string} code
 */
export function dedentCode(code) {
  const lines = String(code)
    .replace(/^\n/, '')
    .replace(/\n\s*$/, '')
    .split('\n');
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

/**
 * @param {string} code
 * @param {string} [_lang]
 * @param {'light' | 'dark'} [_themeMode]
 */
export async function highlightCode(code, _lang = 'javascript', _themeMode = 'dark') {
  const clean = dedentCode(code);
  return `<pre class="code-block"><code>${escapeHtml(clean)}</code></pre>`;
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replaceAll('&', '&' + 'amp;')
    .replaceAll('<', '&' + 'lt;')
    .replaceAll('>', '&' + 'gt;')
    .replaceAll('"', '&' + 'quot;');
}
