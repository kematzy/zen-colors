# TODOs

## Confirmed


1) **DEMO: Convert to `vite-plugin-handlebars` & partials** ✅

Done on branch `demo/handlebars-partials`: `demo/index.html` shell + `demo/partials/*.html`
(header, pages, drawer, footer) via `vite-plugin-handlebars`.

2) **DEMO: Improve the Contrast section**

This section is confusing and not clear. Can be improved.

3) **DEMO: Syntax highlighted code examples**

Work out some way to have code examples syntax highlighted. Ideally with shiki, but others are OK as well.

4) **Library: Build in `cssExport(name, preset)`**

It should be easy to export a color scale to CSS variables with a passed name

```js
new Color('#ff9900')
  .all(10)
  .cssVariablesString('primary');

  // --color-primary-t90:...;
  // ...
  // --color-primary-t10:...;
  // --color-primary-base:...;
  // --color-primary-s10:...;
  // ...
  // --color-primary-s90:...;
```

```js
new Color('#ff9900')
  .scales(10, { preset: 'tailwind' })
  .cssVariablesString('primary');

  // --color-primary-50:...;
  // ...
  // --color-primary-500:...;
  // ...
  // --color-primary-950:...;
```



## Ideas only

In random order

### DEMO: GUI and semantic theme builder.
A very simplified version of [daisyUI's theme generator](daisyui.com/theme-generator/) and similar, which allows choices for
desired colors, tints/shades and displayed within a demo GUI.
