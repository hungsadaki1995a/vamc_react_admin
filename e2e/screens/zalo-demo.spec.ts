import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { activePanel, openMenu, topModal, watchProblems } from '../support/shell';
import { forceEnglish } from '../support/session';
import { zaloApi, zaloUsersOf } from '../support/zalo-setup';
import type { ZaloStatusBody } from '../support/zalo-setup';

// Zalo demo flow (menus A09050400 Zalo Templates, A09050300 Zalo Users) — WRITES data, so it runs only with
// E2E_ZALO_DEMO=1 against a local backend in demo mode (ZALO_ENABLED unset) with NOTIFICATION_ADDRESS_HASH_KEY set:
// create / edit a template → preview → test send → invitation → simulated OA follow + phone share of an existing
// member → "Linked (auto)" → unlink. The member defaults to the local seed TV00000001 / 0909000001.
// Clean-up through the API: the member link is removed and the test template switched off. The API has no delete for
// templates, Zalo users or send logs: remove them from a disposable DB afterwards (see e2e/README.md).

const MEMBER_NO = process.env.E2E_ZALO_MBR_NO ?? 'TV00000001';
const MEMBER_PHONE = process.env.E2E_ZALO_PHONE ?? '0909000001';
const TEMPLATES = ['System Operation Management', 'Notification Management', 'Zalo Templates'];
const USERS = ['System Operation Management', 'Notification Management', 'Zalo Users'];
const TPL_CD = `E2E_ZL_${Date.now().toString().slice(-8)}`;

/** Value cell of a SysField, found by its label text. */
function field(scope: Locator, label: string): Locator {
  return scope.locator(`xpath=.//div[./span[normalize-space(text()[1])="${label}"]]/following-sibling::div[1]`);
}

/** Control of a SysFilterItem, found by its label text. */
function filter(scope: Locator, label: string): Locator {
  return scope.locator(`xpath=.//span[normalize-space(text())="${label}"]/following-sibling::div[1]`);
}

/** Latest antd message toast. */
function toast(page: Page): Locator {
  return page.locator('.ant-message-notice').last();
}

/** Screenshot into E2E_SHOT_DIR (kept outside the repo) once the toasts and loading are gone, when set. */
async function shot(page: Page, name: string): Promise<void> {
  const dir = process.env.E2E_SHOT_DIR;
  if (!dir) return;
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.ant-message-notice')).toHaveCount(0, { timeout: 15_000 });
  await page.screenshot({ path: `${dir}/${name}.png` });
}

test.describe('Zalo demo flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(process.env.E2E_ZALO_DEMO !== '1', 'Set E2E_ZALO_DEMO=1 to run the Zalo demo flow (writes data).');

  test.beforeAll(async () => {
    const { status, data } = await zaloApi<ZaloStatusBody>('GET', '/api/v1/zalo/status');
    test.skip(status !== 200 || !data?.mockMode || !data.phoneIndexReady, 'Backend is not in Zalo demo mode with a phone index key.');
    // A link left by an earlier run would hide the automatic link.
    for (const user of await zaloUsersOf(MEMBER_NO)) {
      if (user.linkStatus === 'LINKED') await zaloApi('DELETE', `/api/v1/zalo/users/${encodeURIComponent(user.zaloUserId)}/link`);
    }
  });

  test.afterAll(async () => {
    for (const user of await zaloUsersOf(MEMBER_NO)) {
      if (user.linkStatus === 'LINKED') await zaloApi('DELETE', `/api/v1/zalo/users/${encodeURIComponent(user.zaloUserId)}/link`);
    }
    await zaloApi('PATCH', `/api/v1/zalo/templates/${TPL_CD}/use`, { useYn: 'N' });
  });

  test('template → preview → test send → invitation → simulated follow → auto link → unlink', async ({ page }, testInfo) => {
    await forceEnglish(page);
    const problems = watchProblems(page);
    await page.goto('/members');
    await expect(page.locator('.icon-rail')).toBeVisible();
    await page.waitForLoadState('networkidle');
    problems.reset();

    await test.step('register a template', async () => {
      await openMenu(page, TEMPLATES);
      const panel = activePanel(page);
      await expect(panel.locator('.ant-table-tbody tr.ant-table-row').first()).toBeVisible();
      await panel.getByRole('button', { name: 'New' }).click();
      const modal = topModal(page);
      await expect(modal).toContainText('Register Zalo Template');
      await field(modal, 'Template Code').locator('input').fill(TPL_CD);
      await field(modal, 'Template Name').locator('input').fill('E2E welcome');
      await field(modal, 'Content').locator('textarea').fill('Xin chào {{mbrNm}}, mã hồ sơ {{mbrNo}}.');
      await field(modal, 'Parameter Map').locator('textarea').fill('{"mbrNm":"customer_name"}');
      await modal.getByRole('button', { name: 'Register' }).click();
      await expect(toast(page)).toContainText('Registered');
      await expect(modal).toBeHidden();
    });

    await test.step('edit it and preview with the sample data', async () => {
      const panel = activePanel(page);
      await filter(panel, 'Keyword').locator('input').fill(TPL_CD);
      await panel.getByRole('button', { name: /(^|\s)Search$/ }).click();
      const row = panel.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: TPL_CD });
      await expect(row).toHaveCount(1);
      await row.locator('td').nth(3).click();
      const modal = topModal(page);
      await expect(modal).toContainText('Edit Zalo Template');
      await field(modal, 'Template Name').locator('input').fill('E2E welcome (edited)');
      await field(modal, 'Content').locator('textarea').fill('Xin chào {{mbrNm}}, mã hồ sơ {{mbrNo}}, ghi chú {{e2eNote}}.');
      await modal.getByRole('button', { name: 'Preview', exact: true }).click();
      const preview = modal.getByTestId('zalo-preview');
      await expect(preview).toContainText('Xin chào');
      await expect(preview).not.toContainText('{{mbrNm}}');
      await expect(modal).toContainText('Variables without a value: e2eNote');
      await shot(page, 'zalo-template-edit');
      await modal.getByRole('button', { name: 'Edit', exact: true }).click();
      await expect(toast(page)).toContainText('Updated');
      await expect(modal).toBeHidden();
      await expect(row).toContainText('E2E welcome (edited)');
    });

    await test.step('test send the saved template (simulated)', async () => {
      const panel = activePanel(page);
      await panel.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: TPL_CD }).locator('td').nth(3).click();
      const modal = topModal(page);
      await expect(modal).toContainText('Test Send');
      await modal.getByRole('textbox', { name: 'Mobile Number' }).fill(MEMBER_PHONE);
      await modal.getByRole('button', { name: 'Test Send' }).click();
      await expect(toast(page)).toContainText('Sent (simulated)');
      await expect(toast(page)).toContainText('MOCK-');
      await modal.getByRole('button', { name: 'Cancel' }).click();
      await expect(modal).toBeHidden();
      await filter(panel, 'Keyword').locator('input').fill('');
      await panel.getByRole('button', { name: /(^|\s)Search$/ }).click();
      await page.waitForLoadState('networkidle');
      await shot(page, 'zalo-templates');
    });

    await test.step('send a link invitation', async () => {
      await openMenu(page, USERS);
      const panel = activePanel(page);
      await expect(panel).toContainText('Demo mode');
      await panel.getByRole('button', { name: 'Send Invitation' }).click();
      const modal = topModal(page);
      await field(modal, 'Mobile Number').locator('input').fill(MEMBER_PHONE);
      await field(modal, 'Recipient Name').locator('input').fill('E2E');
      await modal.getByRole('button', { name: 'Send', exact: true }).click();
      await expect(toast(page)).toContainText('Sent (simulated)');
      await expect(modal).toBeHidden();
    });

    await test.step('simulate OA follow + phone share → linked automatically', async () => {
      const panel = activePanel(page);
      await panel.getByRole('button', { name: 'Simulate OA Follow + Phone Share' }).click();
      const modal = topModal(page);
      await field(modal, 'Zalo Name').locator('input').fill('E2E Zalo Demo');
      await field(modal, 'Mobile Number').locator('input').fill(MEMBER_PHONE);
      await modal.getByRole('button', { name: 'Run', exact: true }).click();
      await expect(toast(page)).toContainText('linked automatically');
      await expect(modal).toBeHidden();
      const row = panel.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: MEMBER_NO });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText('Linked (auto)');
      await shot(page, 'zalo-users');
    });

    await test.step('unlink', async () => {
      const panel = activePanel(page);
      // Newest interaction first: the simulated user is the first row.
      const row = panel.locator('.ant-table-tbody tr.ant-table-row').first();
      await expect(row).toContainText(MEMBER_NO);
      await row.getByRole('button', { name: 'Unlink' }).click();
      const confirm = page.locator('.ant-modal-confirm').filter({ visible: true });
      await expect(confirm).toContainText(MEMBER_NO);
      await confirm.getByRole('button', { name: 'Unlink' }).click();
      await expect(toast(page)).toContainText('Link removed');
      await expect(panel.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: MEMBER_NO })).toHaveCount(0);
      await expect(row).toContainText('Pending link');
    });

    expect.soft(problems.pageErrors, 'uncaught page errors').toEqual([]);
    expect.soft(problems.failedApi, 'failed /api calls').toEqual([]);
    testInfo.annotations.push({ type: 'record', description: JSON.stringify({ tplCd: TPL_CD, memberNo: MEMBER_NO }) });
  });
});
