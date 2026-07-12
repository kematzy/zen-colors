import Alpine from 'alpinejs';
import { Color, VERSION, parse } from 'zen-colors';

import { runApi } from './lib/api.js';
import { methodChainSample } from './lib/code-sample.js';
import { exportThemeCss, sanitizeVarName, validateVarName } from './lib/export-css.js';
import { highlightCode } from './lib/highlight.js';
import { formatRelativeTime, loadHistory, pushHistory, saveHistory } from './lib/history.js';
import { parseQuery, shareUrl, writeQuery } from './lib/url.js';
import './main.css';

const INTRO_SKIP_KEY = 'zen-colors-skip-intro';
const THEME_KEY = 'zen-colors-theme';
const DEFAULT_COLOR = 'oklch(52.1% 0.023 104)';

/**
 * @returns {'light' | 'dark'}
 */
function detectTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    VERSION,
    mode: 'intro',
    colorInput: DEFAULT_COLOR,
    weight: 10,
    theme: 'dark',
    error: '',
    skipIntro: false,

    /** @type {import('zen-colors').Color | null} */
    baseColor: null,

    /** @type {import('zen-colors').Color[]} */
    scaleColors: [],

    oklch: { l: 52.1, c: 0.023, h: 104, alpha: 1 },
    showSliders: false,
    syncingFromSliders: false,

    drawerOpen: false,
    drawerTab: 'export',

    variableName: 'primary',
    outputFormat: /** @type {'oklch'|'hex'|'rgb'} */ ('oklch'),
    includeThemeWrapper: true,
    clearDefaults: false,
    tailwindSteps: false,

    /** @type {import('./lib/history.js').HistoryEntry[]} */
    history: [],
    historyTimer: null,

    showToast: false,
    toastMessage: '',
    toastTimer: null,

    // methods mode — shared controls
    methodWeight: 25,
    methodStep: 10,

    contrastAgainst: '#ffffff',
    onRatio: 4.5,

    apiOp: 'scale',
    apiPreset: 'zen',
    apiJson: '',

    // highlighted snippets cache
    /** @type {Record<string, string>} */
    shiny: {},

    init() {
      this.theme = detectTheme();
      this.applyTheme();
      this.skipIntro = localStorage.getItem(INTRO_SKIP_KEY) === '1';
      this.history = loadHistory();

      const q = parseQuery();
      if (q.c) this.colorInput = q.c;
      if (q.w != null) this.weight = q.w;

      if (q.mode) {
        this.mode = q.mode;
      } else if (this.skipIntro) {
        this.mode = 'scale';
      } else {
        this.mode = 'intro';
      }

      this.applyColorInput({ silentUrl: true });
      this.refreshHighlights();

      if (this.mode === 'api') this.runApiFromLocation();

      this.$watch('colorInput', () => {
        if (this.syncingFromSliders) return;
        this.debounceColor();
      });
      this.$watch('weight', () => {
        this.rebuildScale();
        this.scheduleHistory();
        this.syncUrl();
        this.refreshHighlights();
      });
      this.$watch('mode', () => {
        this.syncUrl();
        this.refreshHighlights();
      });
      this.$watch('methodWeight', () => this.refreshHighlights());
      this.$watch('methodStep', () => this.refreshHighlights());
      this.$watch('theme', () => this.refreshHighlights());

      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          document.getElementById('color-input')?.focus();
        }
        if (e.key === 'Escape') {
          this.drawerOpen = false;
          this.showSliders = false;
        }
      });
    },

    applyTheme() {
      document.body.classList.toggle('theme-dark', this.theme === 'dark');
      document.body.classList.toggle('theme-light', this.theme === 'light');
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, this.theme);
      this.applyTheme();
    },

    setSkipIntro(value) {
      this.skipIntro = Boolean(value);
      localStorage.setItem(INTRO_SKIP_KEY, this.skipIntro ? '1' : '0');
    },
    goToScaleFromIntro() {
      this.mode = 'scale';
      this.syncUrl();
    },

    debounceColor() {
      clearTimeout(this._colorTimer);
      this._colorTimer = setTimeout(() => this.applyColorInput(), 280);
    },

    applyColorInput({ silentUrl = false } = {}) {
      this.error = '';
      const parsed = parse(this.colorInput.trim());
      if (!parsed) {
        this.error = 'Invalid color. Try #hex, rgb(...), hsl(...), or oklch(...).';
        return;
      }
      this.baseColor = parsed;
      const o = parsed.oklch;
      this.oklch = {
        l: round(o.l, 2),
        c: round(o.c, 4),
        h: round(o.h, 2),
        alpha: round(o.alpha, 4),
      };
      this.rebuildScale();
      this.scheduleHistory();
      if (!silentUrl) this.syncUrl();
      this.refreshHighlights();
    },

    applyFromSliders() {
      this.syncingFromSliders = true;
      const { l, c, h, alpha } = this.oklch;
      const a = alpha < 1 ? ` / ${alpha}` : '';
      const css = `oklch(${round(l, 2)}% ${round(c, 4)} ${round(h, 2)}${a})`;
      this.colorInput = css;
      this.error = '';
      try {
        this.baseColor = new Color(css);
        this.rebuildScale();
        this.scheduleHistory();
        this.syncUrl();
        this.refreshHighlights();
      } catch {
        this.error = 'Could not build color from sliders.';
      }
      queueMicrotask(() => {
        this.syncingFromSliders = false;
      });
    },

    rebuildScale() {
      if (!this.baseColor) {
        this.scaleColors = [];
        return;
      }
      try {
        this.scaleColors = this.baseColor.all(this.weight);
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err);
        this.scaleColors = [];
      }
    },

    setAsBase(color) {
      this.colorInput = color.oklchString();
      this.applyColorInput();
      this.toast('Base color updated');
    },

    syncUrl() {
      writeQuery({ c: this.colorInput, w: this.weight, mode: this.mode });
    },
    currentShareUrl() {
      return shareUrl({ c: this.colorInput, w: this.weight, mode: this.mode });
    },
    async copyShareUrl() {
      await this.copyText(this.currentShareUrl(), 'URL copied');
    },

    async copyText(text, message = 'Copied!') {
      try {
        await navigator.clipboard.writeText(text);
        this.toast(message);
      } catch {
        this.toast('Clipboard unavailable');
      }
    },
    toast(message) {
      this.toastMessage = message;
      this.showToast = true;
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.showToast = false;
      }, 1800);
    },

    toggleDrawer(tab) {
      if (tab) this.drawerTab = tab;
      this.drawerOpen = !this.drawerOpen;
    },
    openDrawer(tab = 'export') {
      this.drawerTab = tab;
      this.drawerOpen = true;
    },
    exportCss() {
      try {
        return exportThemeCss({
          inputColor: this.colorInput,
          weight: this.weight,
          variableName: this.variableName,
          format: this.outputFormat,
          includeThemeWrapper: this.includeThemeWrapper,
          clearDefaults: this.clearDefaults,
          tailwindSteps: this.tailwindSteps,
          share: shareUrl({ c: this.colorInput, w: this.weight, mode: 'scale' }),
        });
      } catch (err) {
        return `/* export error: ${err instanceof Error ? err.message : String(err)} */`;
      }
    },
    varNameError() {
      return validateVarName(this.variableName);
    },
    sanitizedVar() {
      return sanitizeVarName(this.variableName);
    },

    scheduleHistory() {
      clearTimeout(this.historyTimer);
      this.historyTimer = setTimeout(() => this.commitHistory(), 600);
    },
    commitHistory() {
      if (this.error || !this.baseColor) return;
      this.history = pushHistory(
        {
          inputColor: this.colorInput,
          weight: this.weight,
          variableName: this.variableName,
        },
        this.history,
      );
      saveHistory(this.history);
    },
    loadHistoryEntry(entry) {
      this.colorInput = entry.inputColor;
      this.weight = entry.weight;
      this.variableName = entry.variableName;
      this.mode = 'scale';
      this.applyColorInput();
      this.toast('Loaded from history');
      this.drawerOpen = false;
    },
    deleteHistoryEntry(id) {
      this.history = this.history.filter((h) => h.id !== id);
      saveHistory(this.history);
    },
    clearHistory() {
      if (!confirm('Clear all history?')) return;
      this.history = [];
      saveHistory([]);
      this.toast('History cleared');
    },
    relTime: formatRelativeTime,

    // ---------- methods ----------
    methodTint() {
      return this.baseColor?.tint(this.methodWeight) ?? null;
    },
    methodShade() {
      return this.baseColor?.shade(this.methodWeight) ?? null;
    },
    methodTints() {
      return this.baseColor?.tints(this.methodStep) ?? [];
    },
    methodShades() {
      return this.baseColor?.shades(this.methodStep) ?? [];
    },
    methodAll() {
      return this.baseColor?.all(this.weight) ?? [];
    },
    methodScaleBasic() {
      try {
        return this.baseColor?.scale(this.methodStep) ?? [];
      } catch {
        return [];
      }
    },
    methodScaleZen() {
      try {
        return this.baseColor?.scale(this.methodStep, { preset: 'zen' }) ?? {};
      } catch {
        return {};
      }
    },
    methodScaleTw() {
      try {
        return this.baseColor?.scale(this.methodStep, { preset: 'tailwind' }) ?? {};
      } catch {
        return {};
      }
    },

    /** Emphasized multi-line sample HTML */
    chainSample(methodLine) {
      return methodChainSample({
        color: this.colorInput,
        methodLine,
      });
    },

    // ---------- contrast ----------
    contrastReport() {
      if (!this.baseColor) return null;
      try {
        return this.baseColor.contrast(this.contrastAgainst);
      } catch {
        return null;
      }
    },
    foregroundOnBase() {
      return this.baseColor?.fg() ?? null;
    },
    onTarget() {
      if (!this.baseColor) return null;
      try {
        return this.baseColor.on(this.onRatio, { against: this.contrastAgainst });
      } catch {
        return null;
      }
    },
    contrastMatrix() {
      if (!this.baseColor) return [];
      return this.baseColor.all(this.weight).map((step) => {
        const vsWhite = step.contrast('#fff');
        const vsBlack = step.contrast('#000');
        return { step, vsWhite, vsBlack };
      });
    },

    labelFor(color) {
      if (color.type === 'base') return 'BASE';
      return color.type.toUpperCase();
    },
    chipLabel(color) {
      if (color.type === 'base') return 'base';
      return `${color.type}: ${color.weight}`;
    },

    headerSwatch() {
      return this.baseColor?.hexString() ?? '#6b6a5b';
    },

    // ---------- shiki ----------
    async refreshHighlights() {
      const mode = this.theme;
      const jobs = {
        introInstall: await highlightCode('npm install zen-colors', 'bash', mode),
        introUsage: await highlightCode(
          `import { Color } from 'zen-colors'\n\nconst c = new Color('${this.colorInput}')\nc.tint(25).oklchString()`,
          'javascript',
          mode,
        ),
        scaleCanvas: await highlightCode(
          `new Color('${this.colorInput}').all(${this.weight})`,
          'javascript',
          mode,
        ),
        docsStart: await highlightCode(
          `import { Color } from 'zen-colors'\n\nconst c = new Color('#0af')\nc.tint(25).oklchString()\nc.all(10)\nc.scale(10, { preset: 'zen' })\nc.fg().rgbString()\nc.on(4.5)`,
          'javascript',
          mode,
        ),
        docsApi: await highlightCode(
          `new Color(input)\nparse(input)                 // Color | null\ncolor.tint(w?) / shade(w?)\ncolor.tints(step?) / shades(step?) / all(step?)\ncolor.scale(weight?, { preset?: 'zen' | 'tailwind' | null })\ncolor.contrast(other)\ncolor.fg() / bestForeground()\ncolor.on(ratio, { against? })\ncolor.oklchString() / rgbString() / hslString() / hexString()`,
          'javascript',
          mode,
        ),
        scaleZen: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep}, { preset: 'zen' })`,
          'javascript',
          mode,
        ),
        scaleTw: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep}, { preset: 'tailwind' })`,
          'javascript',
          mode,
        ),
        scaleBasic: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep})`,
          'javascript',
          mode,
        ),
      };
      this.shiny = jobs;
    },

    // ---------- api ----------
    runApiDemo() {
      const params = {
        op: this.apiOp,
        c: this.colorInput,
        weight: String(this.weight),
      };
      if (this.apiOp === 'scale' && this.apiPreset) {
        params.preset = this.apiPreset;
      }
      if (this.apiOp === 'contrast' || this.apiOp === 'on') {
        params.against = this.contrastAgainst;
      }
      if (this.apiOp === 'on') params.ratio = String(this.onRatio);
      const result = runApi(params);
      this.apiJson = JSON.stringify(result, null, 2);
    },
    runApiFromLocation() {
      const result = runApi(new URLSearchParams(window.location.search));
      this.apiJson = JSON.stringify(result, null, 2);
      if (result.input?.c) this.colorInput = String(result.input.c);
    },
  }));
});

Alpine.start();

/** @param {number} n @param {number} d */
function round(n, d) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}
