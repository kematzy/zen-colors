/**
 * Build a multi-line emphasized code sample.
 * Strong lines = current method; muted = scaffolding.
 *
 * @param {Array<{ text: string, strong?: boolean }>} lines
 */
export function codeSampleHtml(lines) {
  const body = lines
    .map((line) => {
      const cls = line.strong ? 'code-line-strong' : 'code-line-muted';
      return `<span class="line ${cls}">${escapeHtml(line.text)}</span>`;
    })
    .join('');
  return `<div class="code-sample">${body}</div>`;
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Canonical chain sample for methods demos.
 * @param {object} opts
 * @param {string} opts.color
 * @param {string} opts.methodLine  e.g. ".tint(25)"
 * @param {string} [opts.terminal]  e.g. ".oklchString()"
 * @param {string} [opts.comment]
 */
export function methodChainSample({
  color,
  methodLine,
  terminal = '.oklchString()',
  comment = '// .rgbString()',
}) {
  return codeSampleHtml([
    { text: `new Color('${color}')`, strong: false },
    { text: `  ${methodLine}`, strong: true },
    { text: `  ${terminal}  ${comment}`, strong: false },
  ]);
}
