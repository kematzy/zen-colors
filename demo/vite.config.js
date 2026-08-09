import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { env } from 'node:process';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

const demoRoot = import.meta.dirname;

export default defineConfig({
  // GitHub Pages project site: https://kematzy.github.io/zen-colors/
  base: env.VITE_BASE || '/zen-colors/',
  plugins: [
    handlebars({
      // Split demo/index.html into demo/partials/*.html
      partialDirectory: resolve(demoRoot, 'partials'),
    }),
    tailwindcss(),
  ],
  root: resolve(demoRoot),
  resolve: {
    alias: {
      // Dev/build resolves the local library source
      '@kematzy/zen-colors': resolve(demoRoot, '../src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,

    // allow @fontsource fonts
    fs: {
      allow: [
        '.',
        '../node_modules/@fontsource/montserrat',
        '../node_modules/@fontsource/roboto-mono',
      ],
    },
  },
  build: {
    outDir: resolve(demoRoot, 'dist'),
    emptyOutDir: true,
    // Demo Pages build: no prod sourcemaps (avoids @tailwindcss/vite SOURCEMAP_BROKEN noise)
    sourcemap: false,
    // Vite 8 defaults to lightningcss for CSS minify, which rewrites native
    // light-dark() into --lightningcss-light/--lightningcss-dark var pairs.
    // That breaks our @theme semantic tokens. Keep native light-dark().
    cssMinify: 'esbuild',
  },
});
