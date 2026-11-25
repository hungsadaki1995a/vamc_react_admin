import { expect, test } from '@playwright/test';
import { listApplications, getApplication, pickReceivable, shot } from '../support/trade-setup';
import type { TradeKind } from '../support/trade-setup';
import { MENU, openApplication, openScreen, pickOption, staffPage, topModal, uploadSamplePdf } from '../support/workflow-ui';
import type { Locator, Page } from '@playwright/test';

// WP2 acceptance per kind, on applications picked in RCPT at run time:
//   rcpt01 receipt → prcs01 scan + documents incomplete (note required) → complete → request approval →
//   appr01 approves from the popup → CMPL + contract; and rcpt01 cancels another one with a reason.

const KINDS: { kind: TradeKind; menu: string[] }[] = [
  { kind: 'sale', menu: MENU.saleApplications },
  { kind: 'purchase', menu: MENU.purchaseApplications },
  { kind: 'consulting', menu: MENU.consultingApplications },
];

async function popupOf(page: Page, menu: string[], id: string): Promise<Locator> {
  const panel = await openScreen(page, menu);
  return openApplication(page, panel, id);
}

async function toast(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.locator('.ant-message, .ant-notification').getByText(text).first()).toBeVisible();
}

for (const { kind, menu } of KINDS) {
  test.describe(`W2 ${kind}`, () => {
    test.describe.configure({ mode: 'serial' });
    let id = '';

    test(`W2-1 ${kind}: receipt, documents, approval request and approval in the popup`, async ({ browser }) => {
      id = await pickReceivable(kind);
      test.info().annotations.push({ type: 'record', description: `${kind} processed ${id}` });

      // rcpt01: receipt with the officer
      const rcpt = await staffPage(browser, 'rcpt01');
      let popup = await popupOf(rcpt, menu, id);
      await popup.getByRole('button', { name: 'Receipt' }).click();
      const receipt = topModal(rcpt);
      await pickOption(rcpt, receipt.locator('.ant-select').first(), 'prcs01');
      await receipt.getByRole('button', { name: 'Receipt' }).click();
      await toast(rcpt, 'Received.');
      await expect(popup).toContainText('Default Processing Officer');
      await rcpt.context().close();

      // prcs01: scan upload, incomplete (note required), complete, request approval
      const prcs = await staffPage(browser, 'prcs01');
      popup = await popupOf(prcs, menu, id);
      const completeButton = popup.getByRole('button', { name: 'Mark Documents Complete' });
      await expect(completeButton).toBeDisabled(); // no scan yet (Q-U5)
      await uploadSamplePdf(popup);
      await toast(prcs, 'Scanned documents uploaded.');
      await expect(popup).toContainText('e2e-scan.pdf');

      await popup.getByText('Documents incomplete', { exact: true }).click();
      await popup.getByRole('button', { name: 'Mark Documents Incomplete' }).click();
      await expect(popup).toContainText('Enter the missing documents.');
      await popup.getByPlaceholder(/Missing documents/).fill('Loan contract copy missing (e2e).');
      await shot(prcs, `wp2-${kind}-incomplete`);
      await popup.getByRole('button', { name: 'Mark Documents Incomplete' }).click();
      await toast(prcs, 'Documents marked incomplete.');
      await expect.poll(async () => (await getApplication(kind, id, 'prcs01')).srvcPrcsSttsCd).toBe('DCIN');

      await popup.getByText('Documents complete', { exact: true }).click();
      await popup.getByRole('button', { name: 'Mark Documents Complete' }).click();
      await toast(prcs, 'Documents marked complete.');
      await expect.poll(async () => (await getApplication(kind, id, 'prcs01')).srvcPrcsSttsCd).toBe('DCOK');

      await popup.getByRole('button', { name: 'Request Approval' }).click();
      const request = topModal(prcs);
      await pickOption(prcs, request.locator('.ant-select').first(), 'appr01');
      await request.getByRole('checkbox').check();
      await request.getByRole('button', { name: 'Submit' }).click();
      await expect(prcs.locator('.ant-modal-title', { hasText: 'Request Application Approval' })).toHaveCount(0);
      await expect(popup).toContainText('In Approval');
      await shot(prcs, `wp2-${kind}-in-approval`);
      await prcs.context().close();

      // appr01: approve from the popup
      const appr = await staffPage(browser, 'appr01');
      popup = await popupOf(appr, menu, id);
      await popup.getByRole('button', { name: 'Approve' }).click();
      const approve = topModal(appr);
      await approve.getByRole('checkbox').check();
      await approve.getByRole('button', { name: 'Confirm' }).click();
      await expect(appr.locator('.ant-modal-title', { hasText: /^Approve$/ })).toHaveCount(0);
      await expect.poll(async () => (await getApplication(kind, id, 'appr01')).srvcPrcsSttsCd).toBe('CMPL');
      const after = await getApplication(kind, id, 'appr01');
      expect(after.srvcCtrtCd).toBeTruthy();
      test.info().annotations.push({ type: 'record', description: `${kind} contract ${after.srvcCtrtCd}` });
      await expect(popup).toContainText(after.srvcCtrtCd as string);
      await shot(appr, `wp2-${kind}-approved`);
      await appr.context().close();
    });

    test(`W2-2 ${kind}: cancel a submitted application with a reason`, async ({ browser }) => {
      const cancelId = await pickReceivable(kind);
      test.info().annotations.push({ type: 'record', description: `${kind} cancelled ${cancelId}` });
      const page = await staffPage(browser, 'rcpt01');
      const popup = await popupOf(page, menu, cancelId);
      await popup.getByRole('button', { name: 'Cancel Application' }).click();
      const dialog = topModal(page);
      const submit = dialog.getByRole('button', { name: 'Submit' });
      await expect(submit).toBeDisabled();
      await dialog.locator('textarea').fill('Customer withdrew the request by phone (e2e).');
      await expect(submit).toBeDisabled();
      await dialog.getByRole('checkbox').check();
      await submit.click();
      await toast(page, 'Application cancelled.');
      await expect(popup).toContainText('Cancellation reason: Customer withdrew');
      expect((await getApplication(kind, cancelId, 'rcpt01')).srvcPrcsSttsCd).toBe('CNCL');
      await shot(page, `wp2-${kind}-cancelled`);
      await page.context().close();
    });
  });
}

test('W2-3 officer name opens the officer change; the second officer prcs02 takes over', async ({ browser }) => {
  const id = await pickReceivable('purchase');
  const page = await staffPage(browser, 'rcpt01');
  const panel = await openScreen(page, MENU.purchaseApplications);
  let popup = await openApplication(page, panel, id);
  await popup.getByRole('button', { name: 'Receipt' }).click();
  await pickOption(page, topModal(page).locator('.ant-select').first(), 'prcs01');
  await topModal(page).getByRole('button', { name: 'Receipt' }).click();
  await toast(page, 'Received.');
  popup = topModal(page);
  await popup.getByRole('button', { name: 'Default Processing Officer' }).click();
  const change = topModal(page);
  await expect(change.locator('.ant-modal-title')).toHaveText('Change Officer in Charge');
  await expect(change).toContainText('Current Officer');
  await change.getByRole('button', { name: 'Search' }).click();
  const search = topModal(page);
  await expect(search).toContainText('Officer Search');
  await expect(search.locator('.ant-table-row', { hasText: 'prcs02' })).toBeVisible();
  await expect(search.locator('.ant-table-row', { hasText: 'prcs01' })).toHaveCount(0); // current officer
  await search.locator('.ant-table-row', { hasText: 'prcs02' }).click();
  await search.getByRole('button', { name: 'Select' }).click();
  await shot(page, 'wp2-officer-change');
  await change.getByRole('button', { name: 'Change' }).click();
  // topModal() re-resolves to the popup underneath once the change popup closes: check by title.
  await expect(page.locator('.ant-modal-title', { hasText: 'Change Officer in Charge' }).filter({ visible: true })).toHaveCount(0);
  await expect.poll(async () => (await getApplication('purchase', id, 'rcpt01')).tkcgEmpNo).toBe('prcs02');
  await expect(topModal(page).getByRole('button', { name: 'Second Processing Officer' })).toBeVisible();
  test.info().annotations.push({ type: 'record', description: `purchase received ${id}, officer prcs02` });
  await page.context().close();
});

test('W2-4 board officer filter lists the processing officers by role (employees/lookup?roleId=PRCS)', async ({ browser }) => {
  const page = await staffPage(browser, 'prcs01');
  const panel = await openScreen(page, MENU.purchaseApplications);
  const lookup = page.waitForResponse((r) => r.url().includes('/api/v1/employees/lookup') && r.url().includes('roleId=PRCS'));
  // The [Search] of the Officer filter (the page header has its own search button).
  await panel.getByText('Officer', { exact: true }).locator('..').getByRole('button', { name: 'Search' }).click();
  const search = topModal(page);
  await expect(search).toContainText('Officer Search');
  expect((await lookup).status()).toBe(200); // trade staff may read the lookup now (was 403)
  await expect(search.locator('.ant-table-row', { hasText: 'prcs02' })).toBeVisible();
  await expect(search.locator('.ant-table-row', { hasText: 'rcpt01' })).toHaveCount(0);
  await search.locator('.ant-table-row', { hasText: 'prcs02' }).click();
  await search.getByRole('button', { name: 'Select' }).click();
  const list = page.waitForResponse((r) => r.url().includes('/api/v1/service-applications/purchase?') && r.url().includes('tkcgEmpNo=prcs02'));
  await panel.getByRole('button', { name: /Search$/ }).first().click();
  expect((await list).status()).toBe(200);
  await shot(page, 'wp2-officer-filter');
  await page.context().close();
});

test('W2-5 purchase list warns about a running purchase contract on the same subject', async ({ browser }) => {
  const rows = await listApplications('purchase', 'prcs01', 'sttsCds=RCPT&sttsCds=PRCS&sttsCds=DCIN&sttsCds=DCOK');
  const blocked = rows.find((r) => (r as { activePurchaseCtrtCd?: string }).activePurchaseCtrtCd);
  test.skip(!blocked, 'No purchase application with a running purchase contract on its subject');
  const page = await staffPage(browser, 'prcs01');
  const panel = await openScreen(page, MENU.purchaseApplications);
  await panel.getByPlaceholder('Application No., name...').fill(blocked?.srvcAplyNo ?? '');
  await panel.getByPlaceholder('Application No., name...').press('Enter');
  const row = panel.locator(`tr[data-row-key="${blocked?.srvcAplyId}"]`);
  await expect(row).toContainText('Contract running');
  await row.locator('a').first().click();
  await expect(topModal(page)).toContainText('purchase contract for the same subject is still running');
  await shot(page, 'wp2-purchase-running');
  await page.context().close();
});
