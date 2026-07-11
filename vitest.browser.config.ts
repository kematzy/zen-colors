import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Browser-side smoke tests for zen-colors.
 * Run with: npm run test:browser
 */
export default defineConfig({
  test: {
    name: 'browser',
    include: ['test/browser/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium', headless: true }],
    },
  },
});
