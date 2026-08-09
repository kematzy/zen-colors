/**
 * Syntax highlighting via Prism.js (javascript, bash, markup/html).
 * Theme colors live in prism.css (CSS variables + light-dark()).
 */
import Prism from 'prismjs';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-bash.js';

import './prism.css';

/** @type {Record<string, string>} */
const LANG_ALIASES = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'javascript',
  typescript: 'javascript',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  html: 'markup',
  markup: 'markup',
  xml: 'markup',
};

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
 * Highlight a code string. Returns a ready-to-inject HTML fragment.
 * `themeMode` is accepted for API compatibility; token colors follow
 * the document color-scheme via light-dark() in prism.css.
 *
 * @param {string} code
 * @param {string} [lang]
 * @param {'light' | 'dark'} [_themeMode]
 */
export async function highlightCode(code, lang = 'javascript', _themeMode = 'dark') {
  const clean = dedentCode(code);
  const grammarKey = LANG_ALIASES[lang] ?? LANG_ALIASES[String(lang).toLowerCase()] ?? 'javascript';
  const grammar = Prism.languages[grammarKey] ?? Prism.languages.javascript;
  const highlighted = Prism.highlight(clean, grammar, grammarKey);

  return `<pre class="code-block language-${grammarKey}"><code class="language-${grammarKey}">${highlighted}</code></pre>`;
}
