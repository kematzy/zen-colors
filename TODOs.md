# TODOs

## Confirmed


1) **DEMO: Convert to `vite-plugin-handlebars` & partials** ✅

Done on branch `demo/handlebars-partials`: `demo/index.html` shell + `demo/partials/*.html`
(header, pages, drawer, footer) via `vite-plugin-handlebars`.

2) **DEMO: Improve the Contrast section**

This section is confusing and not clear. Can be improved.

3) **DEMO: Syntax highlighted code examples** ✅

Done on branch `demo/prism-highlight`: Prism.js (js / bash / markup) + custom
`demo/src/lib/prism.css` with CSS variables and `light-dark()`. Method panels
still use strong/muted `code-sample` emphasis (not full token HL).

4) **Library: Build in `cssExport(name, preset)`** ✅

`Color#cssVariablesString(name, options?)` and free `cssVariablesString(colors, name, options?)`.

```js
new Color('#ff9900').cssVariablesString('primary');
// --color-primary-t90:…; … --color-primary-base:…; … --color-primary-s90:…;

new Color('#ff9900').cssVariablesString('primary', { preset: 'tailwind' });
// --color-primary-50:…; … --color-primary-500:…; … --color-primary-950:…;

// Existing series / scales:
cssVariablesString(new Color('#ff9900').all(10), 'primary');
cssVariablesString(new Color('#ff9900').scale(10, { preset: 'zen' }), 'primary');
```



## Ideas only

In random order

### DEMO: GUI and semantic theme builder.
A very simplified version of [daisyUI's theme generator](daisyui.com/theme-generator/) and similar, which allows choices for
desired colors, tints/shades and displayed within a demo GUI.
