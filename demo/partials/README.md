# Demo HTML partials

`vite-plugin-handlebars` composes these into `demo/index.html` at dev/build time.

| Partial | Content |
| --- | --- |
| `header` | Logo, color/weight inputs, OKLCH sliders, actions, nav |
| `error-banner` | Parse/error strip under the header |
| `page-intro` | Intro / features / install |
| `page-scale` | Full-bleed `all(weight)` canvas |
| `page-methods` | Live method panels |
| `page-contrast` | Contrast tools + matrix |
| `page-docs` | Docs + license |
| `page-api` | Browser JSON API |
| `drawer` | Export + history side panel |
| `footer` | Version + GitHub link |

Edit a partial, then `npm run demo:dev` or `npm run demo:build`. Do not put Handlebars `{{ … }}` expressions in Alpine markup without escaping — Alpine uses `x-*` attributes, not mustaches.
