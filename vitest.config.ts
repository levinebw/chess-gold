import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    setupFiles: ['test/setup.ts'],
    passWithNoTests: true,
    // UI tests use `// @vitest-environment jsdom` directive per-file
  },
});
