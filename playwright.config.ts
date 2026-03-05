import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test/e2e',
  webServer: {
    command: 'npm run dev -- --port 5199',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:5199',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
