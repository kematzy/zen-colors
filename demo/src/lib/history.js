const KEY = 'zen-colors-history';
const MAX = 20;

/**
 * @typedef {{ id: number, inputColor: string, weight: number, variableName: string, createdAt: string }} HistoryEntry
 */

/** @returns {HistoryEntry[]} */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {HistoryEntry[]} history
 */
export function saveHistory(history) {
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)));
}

/**
 * @param {HistoryEntry} entry
 * @param {HistoryEntry[]} history
 */
export function isDuplicate(entry, history) {
  return history.some(
    (h) =>
      h.inputColor === entry.inputColor &&
      h.weight === entry.weight &&
      h.variableName === entry.variableName,
  );
}

/**
 * @param {{ inputColor: string, weight: number, variableName: string }} data
 * @param {HistoryEntry[]} history
 * @returns {HistoryEntry[]}
 */
export function pushHistory(data, history) {
  const entry = {
    id: Date.now(),
    inputColor: data.inputColor,
    weight: data.weight,
    variableName: data.variableName,
    createdAt: new Date().toISOString(),
  };
  if (isDuplicate(entry, history)) return history;
  return [entry, ...history].slice(0, MAX);
}

/**
 * @param {string} iso
 */
export function formatRelativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}
