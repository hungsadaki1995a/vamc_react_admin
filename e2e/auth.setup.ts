import { test as setup } from '@playwright/test';
import { credentials, loginThroughUi } from './support/session';

// Logs in once and stores the session for every screen test (project "chromium").
setup('log in as admin', async ({ page }) => {
  const { user, pass } = credentials();
  await loginThroughUi(page, user, pass);
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});
