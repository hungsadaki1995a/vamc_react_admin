import { defineConfig, devices } from '@playwright/test';

// E2E tests run against a dedicated Vite server (E2E_PORT, default 13000) that proxies /api
// to the admin backend (E2E_API_TARGET, default the local backend on 127.0.0.1:7200), so the
// developer's own `pnpm dev` on :3000 is never touched.
// Credentials come from E2E_USER / E2E_PASS (see e2e/README.md) — never commit them.
// Team entry point: `pnpm e2e` (e2e/run.mjs).
// The `workflow` project WRITES data (receipt, approval requests, decisions) with the staff accounts
// rcpt01 / prcs01 / appr01 / admin; it is only defined when E2E_WORKFLOW=1 (password in E2E_WORKFLOW_PASS).

const PORT = Number(process.env.E2E_PORT ?? 13000);
const API_TARGET = process.env.E2E_API_TARGET ?? 'http://127.0.0.1:7200';
const BASE_URL = `http://localhost:${PORT}`;
// e2e/run.mjs points this at a timestamped folder so earlier reports are kept.
const REPORT_DIR = process.env.E2E_REPORT_DIR ?? 'e2e/.report';
const WORKFLOW = process.env.E2E_WORKFLOW === '1';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: REPORT_DIR, open: 'never' }]],
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
      testIgnore: /auth\.setup\.ts|auth\/.*\.spec\.ts|workflow\.setup\.ts|workflow\/.*\.spec\.ts/,
    },
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
      testMatch: /auth\/.*\.spec\.ts/,
    },
    ...(WORKFLOW
      ? [
          { name: 'workflow-setup', testMatch: /workflow\.setup\.ts/ },
          {
            name: 'workflow',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
            testMatch: /workflow\/.*\.spec\.ts/,
            dependencies: ['workflow-setup'],
          },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { VITE_API_BASE_URL: '', VITE_API_PROXY_TARGET: API_TARGET },
  },
});
