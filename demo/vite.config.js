import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { env } from 'node:process';
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages project site: https://kematzy.github.io/zen-colors/
  base: env.VITE_BASE || '/zen-colors/',
  plugins: [tailwindcss()],
  root: resolve(import.meta.dirname),
  resolve: {
    alias: {
      // Dev/build resolves the local library source
      '@kematzy/zen-colors': resolve(import.meta.dirname, '../src/index.ts'),
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
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    // Vite 8 defaults to lightningcss for CSS minify, which rewrites native
    // light-dark() into --lightningcss-light/--lightningcss-dark var pairs.
    // That breaks our @theme semantic tokens. Keep native light-dark().
    cssMinify: 'esbuild',
  },
});
