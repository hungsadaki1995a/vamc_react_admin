import { expect, test } from '@playwright/test';
import { SCREENS } from '../support/screens';
import { blockWrites } from '../support/guard';
import { activePanel, activeTab, closeTopModal, openMenu, topModal, watchProblems } from '../support/shell';
import { forceEnglish } from '../support/session';

// Smoke scenario run on every leaf menu (see e2e/SCENARIOS.md, S-01 … S-08).
// Read-only: popups are opened and closed, nothing is saved.

const SEARCH = /(^|\s)Search$/;
const RESET = /(^|\s)Reset$/;
const NEW = /(^|\s)(New|Register|Add New)$/;

// Hidden menus (Show in Menu = No) cannot be opened from the rail / LNB.
const OPENABLE = SCREENS.filter((screen) => screen.kind !== 'hidden');
const groups = [...new Set(OPENABLE.map((screen) => screen.path[0]))];

for (const group of groups) {
  test.describe(group, () => {
    for (const screen of OPENABLE.filter((s) => s.path[0] === group)) {
      const leaf = screen.path[screen.path.length - 1];

      test(`${screen.code} ${leaf}`, async ({ page }, testInfo) => {
        await forceEnglish(page);
        const problems = watchProblems(page);
        const blocked = await blockWrites(page);
        await page.goto('/members');
        await expect(page.locator('.icon-rail')).toBeVisible();
        await page.waitForLoadState('networkidle');
        problems.reset();

        // S-01 open from the menu → S-02 tab is active
        await test.step('open from menu', async () => {
          await openMenu(page, screen.path);
          await expect(activeTab(page)).toContainText(leaf);
        });

        const panel = activePanel(page);

        // S-03 the screen is registered and renders
        await test.step('screen renders', async () => {
          await expect(panel).not.toContainText('Component not found');
          await page.waitForLoadState('networkidle');
          if (screen.kind === 'pending') {
            await expect(panel).toContainText('This screen is not available yet');
          } else {
            await expect(panel.locator('.ant-table, form, .ant-form, .ant-tree, table, [role="tree"]').first()).toBeVisible();
          }
        });
        await testInfo.attach('screen', { body: await page.screenshot(), contentType: 'image/png' });

        if (screen.kind === 'screen') {
          // S-04 search + reset answer without errors
          const search = panel.getByRole('button', { name: SEARCH }).first();
          if (await search.isVisible().catch(() => false)) {
            await test.step('search', async () => {
              await search.click();
              await page.waitForLoadState('networkidle');
              const reset = panel.getByRole('button', { name: RESET }).first();
              if (await reset.isVisible().catch(() => false)) {
                await reset.click();
                await page.waitForLoadState('networkidle');
              }
            });
          }

          // S-05 register popup opens and closes
          const create = panel.getByRole('button', { name: NEW }).first();
          if ((await create.isVisible().catch(() => false)) && (await create.isEnabled())) {
            await test.step('register popup', async () => {
              await create.click();
              const modal = topModal(page);
              await expect(modal, 'register popup').toBeVisible();
              await page.waitForLoadState('networkidle');
              await testInfo.attach('register-popup', { body: await page.screenshot(), contentType: 'image/png' });
              await closeTopModal(page);
              await expect(modal).toBeHidden();
            });
          }

          // S-06 first row opens its detail (when the row is clickable)
          const firstRow = panel.locator('.ant-table-tbody tr.ant-table-row').first();
          if (await firstRow.isVisible().catch(() => false)) {
            await test.step('row detail', async () => {
              await firstRow.locator('td').nth(2).click();
              await page.waitForTimeout(500);
              const modal = topModal(page);
              if (await modal.isVisible().catch(() => false)) {
                await page.waitForLoadState('networkidle');
                await testInfo.attach('detail-popup', { body: await page.screenshot(), contentType: 'image/png' });
                await closeTopModal(page);
                await expect(modal).toBeHidden();
              }
            });
          }
        }

        // S-07 / S-08 no uncaught errors, no failed API calls
        expect.soft(problems.pageErrors, 'uncaught page errors').toEqual([]);
        expect.soft(problems.failedApi, 'failed /api calls').toEqual([]);
        expect.soft(blocked, 'opening / closing screens must not write').toEqual([]);
        if (problems.consoleErrors.length) {
          testInfo.annotations.push({ type: 'console-errors', description: problems.consoleErrors.join('\n') });
        }
      });
    }
  });
}
