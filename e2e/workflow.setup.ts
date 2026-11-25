import { expect, test as setup } from '@playwright/test';
import { forceEnglish } from './support/session';
import { STAFF, storageStateOf, workflowPassword } from './support/trade-setup';

// Logs in the four workflow accounts through the UI once and stores their sessions (project "workflow").
for (const account of STAFF) {
  setup(`log in as ${account.key}`, async ({ page }) => {
    await forceEnglish(page);
    await page.goto('/login');
    await page.getByPlaceholder('Enter email or phone number').fill(account.uiLoginId);
    await page.getByPlaceholder('Enter password').fill(workflowPassword());
    await page.getByRole('button', { name: 'Log In' }).click();
    // Accounts without the member menu land elsewhere: wait for the shell, not a URL.
    await expect(page.locator('.icon-rail')).toBeVisible({ timeout: 20_000 });
    await page.context().storageState({ path: storageStateOf(account.key) });
  });
}
