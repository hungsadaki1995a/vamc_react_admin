import { expect, test } from '@playwright/test';
import { getApplication, listApplications, pickReceivable, shot } from '../support/trade-setup';
import type { TradeKind } from '../support/trade-setup';
import { MENU, openApplication, openScreen, pickOption, staffPage, topModal } from '../support/workflow-ui';

// WP0 acceptance (FLOWS/admin-trade-screens.md §4 WP0): receipt with an officer, contract list filters,
// ddMMyyyy dates shown as dd/MM/yyyy, single NPL code in the application popup.

const BOARDS: { kind: TradeKind; menu: string[]; viaSearchPopup: boolean }[] = [
  { kind: 'sale', menu: MENU.saleApplications, viaSearchPopup: true },
  { kind: 'purchase', menu: MENU.purchaseApplications, viaSearchPopup: false },
  { kind: 'consulting', menu: MENU.consultingApplications, viaSearchPopup: false },
];

for (const board of BOARDS) {
  test(`W0-1 rcpt01 receives a ${board.kind} application with an officer`, async ({ browser }) => {
    const id = await pickReceivable(board.kind);
    test.info().annotations.push({ type: 'record', description: `${board.kind} ${id}` });
    const page = await staffPage(browser, 'rcpt01');
    const panel = await openScreen(page, board.menu);
    await pickOption(page, panel.locator('.ant-select').first(), 'Submitted');
    const popup = await openApplication(page, panel, id);
    await popup.getByRole('button', { name: 'Receipt' }).click();

    const receipt = topModal(page);
    await expect(receipt.locator('.ant-modal-title')).toHaveText('Receipt');
    // Officer is required.
    await receipt.getByRole('button', { name: 'Receipt' }).click();
    await expect(receipt).toContainText('Select the officer in charge.');
    if (board.viaSearchPopup) {
      await receipt.getByRole('button', { name: 'Search' }).click();
      const search = topModal(page);
      await expect(search).toContainText('Officer Search');
      await search.locator('.ant-table-row', { hasText: 'prcs01' }).click();
      await shot(page, `wp0-${board.kind}-officer-search`);
      await search.getByRole('button', { name: 'Select' }).click();
    } else {
      await pickOption(page, receipt.locator('.ant-select').first(), 'prcs01');
    }
    await shot(page, `wp0-${board.kind}-receipt`);
    await receipt.getByRole('button', { name: 'Receipt' }).click();
    await expect(page.getByText('Received.')).toBeVisible();

    const after = await getApplication(board.kind, id, 'rcpt01');
    expect(after.tkcgEmpNo).toBe('prcs01');
    expect(after.srvcPrcsSttsCd).toBe('PRCS');
    // The board (still filtered on Submitted) no longer lists it.
    await expect(panel.locator(`tr[data-row-key="${id}"]`)).toHaveCount(0);
    await page.context().close();
  });
}

// The backend filters the contract term inside the period: CTRT_CNCLS_DMY >= from AND CTRT_END_DMY <= to.
test('W0-2 sale contract list: period + status filter, dates as dd/MM/yyyy', async ({ browser }) => {
  const page = await staffPage(browser, 'prcs01');
  const panel = await openScreen(page, MENU.saleContracts);
  const range = panel.locator('.ant-picker-range').first();
  await range.locator('input').first().click();
  await range.locator('input').first().fill('01/01/2026');
  await range.locator('input').nth(1).fill('31/12/2027');
  await range.locator('input').nth(1).press('Enter');
  await pickOption(page, panel.locator('.ant-select').first(), 'In Effect');
  const response = page.waitForResponse((r) => r.url().includes('/api/v1/sale-brokerage-contracts?') && r.url().includes('ctrtFromDt='));
  await panel.getByRole('button', { name: /Search$/ }).first().click();
  const res = await response;
  expect(res.status()).toBe(200);
  expect(res.url()).toContain('ctrtFromDt=2026-01-01');
  expect(res.url()).toContain('ctrtSttsCds');
  const rows = panel.locator('.ant-table-tbody tr.ant-table-row');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(rows.first().locator('td').nth(6)).toHaveText(/^(\d{2}\/\d{2}\/\d{4}|-)$/);
  await expect(panel.locator('td').filter({ hasText: /^\d{8}$/ })).toHaveCount(0);
  await shot(page, 'wp0-contract-filter');
  await page.context().close();
});

test('W0-3 application popup shows the single NPL code', async ({ browser }) => {
  const row = (await listApplications('sale', 'prcs01', 'bndLotYn=N')).find((r) => r.bndCd);
  if (!row?.bndCd) throw new Error('No single-NPL sale application');
  const page = await staffPage(browser, 'prcs01');
  const panel = await openScreen(page, MENU.saleApplications);
  const popup = await openApplication(page, panel, row.srvcAplyId);
  await expect(popup).toContainText(row.bndCd);
  await expect(popup).toContainText(/\d{2}\/\d{2}\/\d{4}/);
  await shot(page, 'wp0-application-popup');
  await page.context().close();
});
