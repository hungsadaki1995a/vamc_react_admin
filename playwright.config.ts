import { defineConfig, devices } from '@playwright/test';

// E2E tests run against a dedicated Vite server (E2E_PORT, default 13000) that proxies /api
// to a test backend (E2E_API_TARGET, default the admin backend on 127.0.0.1:17200), so the
// developer's own `pnpm dev` on :3000 is never touched.
// Credentials come from E2E_USER / E2E_PASS (see e2e/README.md) — never commit them.

const PORT = Number(process.env.E2E_PORT ?? 13000);
const API_TARGET = process.env.E2E_API_TARGET ?? 'http://127.0.0.1:17200';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e/.report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1600, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 }, storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts|auth\/.*\.spec\.ts/,
    },
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
      testMatch: /auth\/.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_API_BASE_URL: '', VITE_API_PROXY_TARGET: API_TARGET },
  },
});
