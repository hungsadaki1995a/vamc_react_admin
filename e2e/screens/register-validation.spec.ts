import { expect, test } from '@playwright/test';
import { SCREENS } from '../support/screens';
import { blockWrites } from '../support/guard';
import { activePanel, closeTopModal, openMenu, topModal } from '../support/shell';
import { forceEnglish } from '../support/session';

// V-01: on every screen with a register popup, submitting the empty form must stop on the
// client (required-field messages) and never send a write call. Writes are blocked anyway.

const NEW = /(^|\s)(New|Register|Add New)$/;
const SUBMIT = /^(Register|Save|Confirm|Create|Request.*|OK)$/;
// Inline field messages (System screens) or a warning toast (Content / NPL screens: "Enter the title.").
const ERROR_TEXT = /required|Please (enter|select|fill|input|choose)|^(Enter|Select|Choose) |is mandatory|cannot be empty/i;

for (const screen of SCREENS.filter((s) => s.kind === 'screen')) {
  const leaf = screen.path[screen.path.length - 1];

  test(`${screen.code} ${leaf} — empty register form is rejected`, async ({ page }, testInfo) => {
    await forceEnglish(page);
    const blocked = await blockWrites(page);
    await page.goto('/members');
    await expect(page.locator('.icon-rail')).toBeVisible();
    await openMenu(page, screen.path);
    await expect(
      activePanel(page).locator('.ant-table, form, .ant-form, .ant-tree, table, [role="tree"]').first(),
    ).toBeVisible();
    await page.waitForLoadState('networkidle');

    const create = activePanel(page).getByRole('button', { name: NEW }).first();
    const hasCreate = (await create.isVisible().catch(() => false)) && (await create.isEnabled());
    test.skip(!hasCreate, 'no register popup on this screen');

    await create.click();
    const modal = topModal(page);
    await expect(modal).toBeVisible();
    await page.waitForLoadState('networkidle');

    const submit = modal.locator('.ant-modal-footer, [class*="modalFooter"], [class*="footer"]').getByRole('button', { name: SUBMIT }).last();
    test.skip(!(await submit.isVisible().catch(() => false)), 'no submit button found in the popup footer');

    await submit.click();
    await page.waitForTimeout(800);
    await testInfo.attach('after-submit', { body: await page.screenshot(), contentType: 'image/png' });

    expect.soft(blocked, 'empty form must not call a write API').toEqual([]);
    await expect.soft(page.getByText(ERROR_TEXT).first(), 'a required-field message is shown').toBeVisible();

    if (await modal.isVisible().catch(() => false)) await closeTopModal(page);
  });
}
