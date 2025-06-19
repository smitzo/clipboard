import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:15173',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'node server/server.js', url: 'http://127.0.0.1:15080/api/health',
      env: { PORT: '15080', CORS_ORIGIN: 'http://127.0.0.1:15173', CLIPBOARD_SECRET: 'generic-browser-fixture-secret-only' }, reuseExistingServer: false },
    { command: 'npm --prefix client run dev -- --host 127.0.0.1 --port 15173 --strictPort',
      url: 'http://127.0.0.1:15173', env: { VITE_API_URL: 'http://127.0.0.1:15080/api' }, reuseExistingServer: false },
  ],
});
