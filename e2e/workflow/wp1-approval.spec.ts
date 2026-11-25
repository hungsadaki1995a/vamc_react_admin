import { expect, test } from '@playwright/test';
import { applicationText, getApplication, prepareApprovalRequest, requestApproval, shot } from '../support/trade-setup';
import { MENU, openApplication, openScreen, pickOption, staffPage, topModal } from '../support/workflow-ui';
import type { Locator, Page } from '@playwright/test';

// WP1 acceptance: approval request (prcs01) → reject with a reason from the inbox (appr01) → request again →
// approve from the inbox → approval information shows the three steps. One sale application, picked at run time.

test.describe.configure({ mode: 'serial' });

let id = '';
const REASON = `e2e: documents unreadable ${Date.now()}`;

async function inboxRow(page: Page): Promise<{ panel: Locator; row: Locator }> {
  const panel = await openScreen(page, MENU.approvals);
  const saleChip = panel.getByRole('tab', { name: /^Sale/ });
  await expect(saleChip).toBeVisible();
  // The count comes from /inbox/summary, which may answer after the chip is drawn.
  await expect.poll(async () => Number(await saleChip.locator('span').innerText())).toBeGreaterThanOrEqual(1);
  await saleChip.click();
  const row = panel.locator('.ant-table-row', { hasText: await applicationText('sale', id) });
  await expect(row).toBeVisible();
  return { panel, row };
}

test.beforeAll(async () => {
  id = await prepareApprovalRequest('sale');
});

test('W1-1 prcs01 requests the receipt approval with an approver', async ({ browser }) => {
  test.info().annotations.push({ type: 'record', description: `sale ${id}` });
  const page = await staffPage(browser, 'prcs01');
  const panel = await openScreen(page, MENU.saleApplications);
  const popup = await openApplication(page, panel, id);
  await popup.getByRole('button', { name: 'Request Approval' }).click();

  const request = topModal(page);
  await expect(request.locator('.ant-modal-title')).toHaveText('Request Application Approval');
  const submit = request.getByRole('button', { name: 'Submit' });
  await expect(submit).toBeDisabled();
  await pickOption(page, request.locator('.ant-select').first(), 'appr01');
  await expect(submit).toBeDisabled(); // confirmation not ticked yet
  await request.locator('textarea').fill('Please approve the receipt (e2e).');
  await request.getByRole('checkbox').check();
  await shot(page, 'wp1-request-approval');
  await submit.click();
  await expect(page.getByText(/approval/i).filter({ visible: true }).first()).toBeVisible();

  await expect.poll(async () => (await getApplication('sale', id, 'prcs01')).approvalStage).toBe('IN_APPROVAL');
  await page.context().close();
});

test('W1-2 appr01 rejects from Approval Management; a reason is required', async ({ browser }) => {
  const page = await staffPage(browser, 'appr01');
  const { panel, row } = await inboxRow(page);
  await shot(page, 'wp1-inbox');
  await row.getByRole('button', { name: 'Reject' }).click();

  const reject = topModal(page);
  await expect(reject.locator('.ant-modal-title')).toHaveText('Reject');
  const submit = reject.getByRole('button', { name: 'Submit' });
  await reject.getByRole('checkbox').check();
  await expect(submit).toBeDisabled(); // no reason
  await reject.locator('textarea').fill(REASON);
  await expect(submit).toBeEnabled();
  await shot(page, 'wp1-reject');
  await submit.click();
  await expect(reject).toBeHidden();
  await expect(panel.locator('.ant-table-row', { hasText: await applicationText('sale', id) })).toHaveCount(0);

  const after = await getApplication('sale', id, 'appr01');
  expect(after.approvalStage).toBe('REJECTED');
  expect(after.rjctRsnCn).toBe(REASON);
  await page.context().close();
});

test('W1-3 appr01 approves the repeated request from Approval Management', async ({ browser }) => {
  await requestApproval('sale', id);
  const page = await staffPage(browser, 'appr01');
  const { panel, row } = await inboxRow(page);

  // [Info] from the inbox: the session in progress with its steps.
  await row.getByRole('button', { name: 'Info' }).click();
  const info = topModal(page);
  await expect(info.locator('.ant-modal-title')).toHaveText('Approval Information');
  await expect(info.locator('.ant-table-row')).toHaveCount(3);
  await info.locator('button', { hasText: 'Close' }).click();
  await expect(info).toBeHidden();

  await row.getByRole('button', { name: 'Approve' }).click();
  const approve = topModal(page);
  await expect(approve.locator('.ant-modal-title')).toHaveText('Approve');
  const confirm = approve.getByRole('button', { name: 'Confirm' });
  await expect(confirm).toBeDisabled();
  await approve.locator('textarea').fill('Approved (e2e).');
  await approve.getByRole('checkbox').check();
  await shot(page, 'wp1-approve');
  await confirm.click();
  await expect(approve).toBeHidden();
  await expect(panel.locator('.ant-table-row', { hasText: await applicationText('sale', id) })).toHaveCount(0);

  const after = await getApplication('sale', id, 'appr01');
  expect(after.srvcPrcsSttsCd).toBe('CMPL');
  expect(after.srvcCtrtCd).toBeTruthy();
  test.info().annotations.push({ type: 'record', description: `contract ${after.srvcCtrtCd}` });
  await page.context().close();
});

test('W1-4 approval information shows the three steps with employee and time', async ({ browser }) => {
  const page = await staffPage(browser, 'appr01');
  const panel = await openScreen(page, MENU.saleApplications);
  const popup = await openApplication(page, panel, id);
  await popup.getByRole('button', { name: 'Approval Info' }).click();
  const info = page.locator('.ant-modal-wrap').filter({ has: page.locator('.ant-modal-title', { hasText: 'Approval Information' }) });
  await expect(info).toBeVisible();
  const rows = info.locator('.ant-table-row');
  await expect(rows).toHaveCount(3);
  for (const [index, step] of ['Receipt', 'Officer in Charge', 'Approval'].entries()) {
    await expect(rows.nth(index)).toContainText(step);
    await expect(rows.nth(index)).toContainText('Done');
    await expect(rows.nth(index)).toContainText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    await expect(rows.nth(index)).toContainText(/Default /); // employee name of the step
  }
  await expect(rows.nth(2)).toContainText('Default First Approver');
  await expect(info).toContainText('Approved');
  await shot(page, 'wp1-approval-info');
  await page.context().close();
});
