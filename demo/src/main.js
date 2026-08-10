import Alpine from 'alpinejs';
import { Color, FG_LEVEL_MIN_RATIO, VERSION, cssVariablesString, parse } from '@kematzy/zen-colors';

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

    /** @type {import('@kematzy/zen-colors').Color | null} */
    baseColor: null,

    /** @type {import('@kematzy/zen-colors').Color[]} */
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

    /** Color B for contrast tools (A is header colorInput / baseColor). */
    contrastB: '#ffffff',
    oklchB: { l: 100, c: 0, h: 0, alpha: 1 },
    showContrastASliders: false,
    showContrastBPicker: false,
    /** Which side is the surface/background for .fg / .on previews. */
    contrastSurface: /** @type {'A' | 'B'} */ ('B'),
    /** @type {import('@kematzy/zen-colors').FgLevel | null} */
    fgLevel: 'base',
    onRatio: 4.5,

    fgLevelOptionsWcag: [
      { id: 'ui', title: 'UI non-text · minimum 3:1' },
      { id: 'aa-large', title: 'WCAG AA large · minimum 3:1' },
      { id: 'aa', title: 'WCAG AA body · minimum 4.5:1' },
      { id: 'aaa-large', title: 'WCAG AAA large · minimum 4.5:1' },
      { id: 'aaa', title: 'WCAG AAA body · minimum 7:1' },
    ],
    fgLevelOptionsIntent: [
      { id: 'subtle', title: 'Intent · minimum 3:1' },
      { id: 'muted', title: 'Intent · minimum 4:1' },
      { id: 'base', title: 'Intent · minimum 5:1' },
      { id: 'strong', title: 'Intent · minimum 6:1' },
    ],

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
      this.syncContrastBOklch();
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
      this.$watch('variableName', () => this.refreshHighlights());
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
      // Keep <html data-theme> in sync for native form controls / CSS hooks
      document.documentElement.dataset.theme = this.theme;
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

    /** Safe palette name for CSS demos (falls back to primary). */
    cssDemoName() {
      const n = sanitizeVarName(this.variableName);
      return n || 'primary';
    },

    /** Live CSS from Color#cssVariablesString — zen keys (default). */
    methodCssZen() {
      if (!this.baseColor) return '';
      try {
        return this.baseColor.cssVariablesString(this.cssDemoName(), {
          weight: this.methodStep,
          preset: 'zen',
        });
      } catch {
        return '';
      }
    },

    /** Live CSS — Tailwind 50…950. */
    methodCssTw() {
      if (!this.baseColor) return '';
      try {
        return this.baseColor.cssVariablesString(this.cssDemoName(), {
          preset: 'tailwind',
        });
      } catch {
        return '';
      }
    },

    /** Live CSS — free function on all(weight) series. */
    methodCssAll() {
      if (!this.baseColor) return '';
      try {
        return cssVariablesString(this.baseColor.all(this.methodStep), this.cssDemoName());
      } catch {
        return '';
      }
    },

    /** Live CSS — zen keys as hex. */
    methodCssHex() {
      if (!this.baseColor) return '';
      try {
        return this.baseColor.cssVariablesString(this.cssDemoName(), {
          weight: this.methodStep,
          preset: 'zen',
          format: 'hex',
        });
      } catch {
        return '';
      }
    },

    /** Emphasized multi-line sample HTML */
    chainSample(methodLine) {
      return methodChainSample({
        color: this.colorInput,
        methodLine,
      });
    },

    // ---------- contrast (A = header, B = contrastB) ----------
    contrastColorA() {
      return this.baseColor;
    },
    contrastColorB() {
      return parse(this.contrastB);
    },
    contrastSurfaceColor() {
      return this.contrastSurface === 'A' ? this.contrastColorA() : this.contrastColorB();
    },
    contrastInkColor() {
      return this.contrastSurface === 'A' ? this.contrastColorB() : this.contrastColorA();
    },
    swapContrastColors() {
      const a = this.colorInput;
      this.colorInput = this.contrastB;
      this.contrastB = a;
      this.applyColorInput();
      this.syncContrastBOklch();
    },
    toggleContrastBPicker() {
      this.showContrastASliders = false;
      this.showContrastBPicker = !this.showContrastBPicker;
      if (this.showContrastBPicker) this.syncContrastBOklch();
    },
    syncContrastBOklch() {
      const c = this.contrastColorB();
      if (!c) return;
      const o = c.oklch;
      this.oklchB = {
        l: round(o.l, 2),
        c: round(o.c, 4),
        h: round(o.h, 2),
        alpha: round(o.alpha, 4),
      };
    },
    applyContrastBFromSliders() {
      const { l, c, h, alpha } = this.oklchB;
      const a = alpha < 1 ? ` / ${alpha}` : '';
      this.contrastB = `oklch(${round(l, 2)}% ${round(c, 4)} ${round(h, 2)}${a})`;
    },
    setContrastBFromColor(color) {
      this.contrastB = color.oklchString();
      this.syncContrastBOklch();
    },
    contrastBScale() {
      const c = this.contrastColorB();
      if (!c) return [];
      try {
        return c.all(this.weight);
      } catch {
        return [];
      }
    },
    contrastReport() {
      const a = this.contrastColorA();
      const b = this.contrastColorB();
      if (!a || !b) return null;
      try {
        return a.contrast(b);
      } catch {
        return null;
      }
    },
    /** Badges ordered by threshold: UI, AA large, AA, AAA large, AAA */
    contrastBadgesOrdered() {
      const r = this.contrastReport();
      if (!r) return [];
      const { passes } = r;
      return [
        { key: 'ui', label: 'UI', pass: passes.aaLarge, title: '≥ 3:1 non-text / large' },
        { key: 'aaL', label: 'AA large', pass: passes.aaLarge, title: '≥ 3:1 large text' },
        { key: 'aa', label: 'AA', pass: passes.aa, title: '≥ 4.5:1 body text' },
        { key: 'aaaL', label: 'AAA large', pass: passes.aaaLarge, title: '≥ 4.5:1 large enhanced' },
        { key: 'aaa', label: 'AAA', pass: passes.aaa, title: '≥ 7:1 body enhanced' },
      ];
    },
    fgMinRatio() {
      if (!this.fgLevel) return null;
      return FG_LEVEL_MIN_RATIO[this.fgLevel] ?? null;
    },
    fgLevelHint() {
      if (this.fgLevel === null) {
        return 'No level: pure black or white (higher contrast).';
      }
      const r = this.fgMinRatio();
      const intent = ['strong', 'base', 'muted', 'subtle'].includes(this.fgLevel);
      return intent
        ? `Intent “${this.fgLevel}”: soft grey with minimum ${r}:1 when possible (not a WCAG grade).`
        : `WCAG/UI “${this.fgLevel}”: soft grey with minimum ${r}:1 when possible.`;
    },
    foregroundOnSurface() {
      const surface = this.contrastSurfaceColor();
      if (!surface) return null;
      try {
        return this.fgLevel === null ? surface.fg() : surface.fg(this.fgLevel);
      } catch {
        return null;
      }
    },
    onTarget() {
      const ink = this.contrastInkColor();
      const surface = this.contrastSurfaceColor();
      if (!ink || !surface) return null;
      try {
        return ink.on(this.onRatio, { against: surface });
      } catch {
        return null;
      }
    },
    /**
     * Highest WCAG-style band met by a ratio (for scale strip badges).
     * @param {number} ratio
     */
    badgeForRatio(ratio) {
      if (ratio >= 7) return { label: 'AAA', pass: true };
      if (ratio >= 4.5) return { label: 'AA', pass: true };
      if (ratio >= 3) return { label: 'AA large', pass: true };
      return { label: 'FAIL', pass: false };
    },
    contrastScaleRows() {
      const palette = this.contrastColorA();
      const surface = this.contrastSurfaceColor();
      if (!palette || !surface) return [];
      try {
        return palette.all(this.weight).map((step) => {
          const report = step.contrast(surface);
          const badge = this.badgeForRatio(report.ratio);
          const passTitle = [
            `ratio ${report.ratio.toFixed(2)}:1`,
            `UI/AA-large ${report.passes.aaLarge ? 'pass' : 'fail'}`,
            `AA ${report.passes.aa ? 'pass' : 'fail'}`,
            `AAA ${report.passes.aaa ? 'pass' : 'fail'}`,
          ].join(' · ');
          return {
            step,
            ratio: report.ratio,
            badgeLabel: badge.label,
            badgePass: badge.pass,
            passTitle,
          };
        });
      } catch {
        return [];
      }
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

    featureColors() {
      const hexStr = this.baseColor?.hexString() || '#6b6a5b';
      const rgbStr = this.baseColor?.rgbString() || 'rgb(107 106 91)';
      const hslStr = this.baseColor?.hslString() || 'hsl(56.2 8.08% 38.8%)';
      const lchStr = this.baseColor?.oklchString() || 'oklch(52.07% 0.0229 104.03)';

      return `Convert <kbd>${hexStr}</kbd> or <kbd>${rgbStr}</kbd> or <kbd>${lchStr}</kbd> or <kbd>${hslStr}</kbd> and even <kbd>rebeccapurple</kbd>.`;
    },

    // ---------- prism (syntax highlight → shiny.*) ----------
    async refreshHighlights() {
      // Theme colors come from prism.css light-dark(); we still re-run when
      // color/weight change so snippets stay in sync with the playground state.
      const jobs = {
        introInstall: await highlightCode('npm install @kematzy/zen-colors', 'bash'),
        introUsage: await highlightCode(
          `import { Color } from '@kematzy/zen-colors'\n\nconst c = new Color('${this.colorInput}')\n  .tint(25).oklchString();`,
          'javascript',
        ),
        scaleCanvas: await highlightCode(
          `new Color('${this.colorInput}').all(${this.weight})`,
          'javascript',
        ),
        docsStart: await highlightCode(
          `import { Color } from '@kematzy/zen-colors'\n\nconst c = new Color('#0af')\nc.tint(25).oklchString()\nc.all(10)\nc.scale(10, { preset: 'zen' })\nc.fg().rgbString()\nc.on(4.5)`,
          'javascript',
        ),
        docsApi: await highlightCode(
          `new Color(input)\nparse(input)                 // Color | null\ncolor.tint(w?) / shade(w?)\ncolor.tints(step?) / shades(step?) / all(step?)\ncolor.scale(weight?, { preset?: 'zen' | 'tailwind' | null })\ncolor.cssVariablesString(name, opts?)\ncssVariablesString(colors, name, opts?)\ncolor.contrast(other)\ncolor.fg() / fg('aa'|'base'|…)\ncolor.on(ratio, { against? })\ncolor.oklchString() / rgbString() / hslString() / hexString()`,
          'javascript',
        ),
        scaleZen: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep}, { preset: 'zen' })`,
          'javascript',
        ),
        scaleTw: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep}, { preset: 'tailwind' })`,
          'javascript',
        ),
        scaleBasic: await highlightCode(
          `new Color('${this.colorInput}')\n  .scale(${this.methodStep})`,
          'javascript',
        ),
        cssVarZen: await highlightCode(
          `new Color('${this.colorInput}')\n  .cssVariablesString('${this.cssDemoName()}')\n// default: preset 'zen', weight 10 → --color-${this.cssDemoName()}-t* / base / s*`,
          'javascript',
        ),
        cssVarZenWeight: await highlightCode(
          `new Color('${this.colorInput}')\n  .cssVariablesString('${this.cssDemoName()}', {\n    weight: ${this.methodStep},\n    preset: 'zen',\n  })`,
          'javascript',
        ),
        cssVarTw: await highlightCode(
          `new Color('${this.colorInput}')\n  .cssVariablesString('${this.cssDemoName()}', {\n    preset: 'tailwind',\n  })\n// --color-${this.cssDemoName()}-50 … 500 … 950`,
          'javascript',
        ),
        cssVarAll: await highlightCode(
          `import { cssVariablesString } from '@kematzy/zen-colors'\n\ncssVariablesString(\n  new Color('${this.colorInput}').all(${this.methodStep}),\n  '${this.cssDemoName()}',\n)\n// keys from type + weight (includes t100 / s100)`,
          'javascript',
        ),
        cssVarHex: await highlightCode(
          `new Color('${this.colorInput}')\n  .cssVariablesString('${this.cssDemoName()}', {\n    weight: ${this.methodStep},\n    preset: 'zen',\n    format: 'hex',\n  })`,
          'javascript',
        ),
        cssVarPrefix: await highlightCode(
          `new Color('${this.colorInput}')\n  .cssVariablesString('${this.cssDemoName()}', {\n    prefix: 'zen',\n    format: 'rgb',\n  })\n// --zen-${this.cssDemoName()}-base: rgb(...)`,
          'javascript',
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
        params.against = this.contrastB;
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
