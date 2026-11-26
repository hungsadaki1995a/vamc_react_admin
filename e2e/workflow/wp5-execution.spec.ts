import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';
import { CONTRACT_PATH, api, findContractWith, getContract, listContracts, prepareContractInProgress, shot } from '../support/trade-setup';
import { confirmApproval, contractPopup, fillDate, modalTitled, openContract, staffPage, submitApprovalRequest, uploadSamplePdf } from '../support/workflow-ui';
import type { Locator, Page } from '@playwright/test';

// WP5 acceptance: sale fees + sale completion, sale EXTN annex through to conclusion (parent end date moves),
// renewal decision when a contract offers it, purchase fee + trade conclusion + delivery.

test.describe.configure({ mode: 'serial' });

async function confirmFirstUnpaidFee(page: Page, popup: Locator, label: RegExp): Promise<void> {
  await popup.getByRole('tab', { name: /^Fees/ }).click();
  const row = popup.locator('.ant-tabs-tabpane-active .ant-table-row').filter({ hasText: label }).filter({ hasText: 'Unpaid' }).first();
  await row.getByRole('button', { name: 'Confirm' }).click();
  const modal = modalTitled(page, 'Confirm Fee Payment');
  const amount = modal.locator('.ant-input-number input');
  await amount.fill('0');
  await expect(modal).toContainText('Enter an amount greater than 0.');
  await expect(modal.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  await amount.fill('');
  await amount.fill('20000000');
  await modal.getByRole('button', { name: 'Confirm' }).click();
  await expect(modal).toBeHidden();
}

let saleCtrt = '';

test('W5-1 sale: advance fee, sale completion, balance fee', async ({ browser }) => {
  test.setTimeout(120_000);
  saleCtrt = await prepareContractInProgress('sale');
  test.info().annotations.push({ type: 'record', description: `sale contract ${saleCtrt}` });
  const page = await staffPage(browser, 'prcs01');
  const popup = await openContract(page, 'sale', saleCtrt);
  await confirmFirstUnpaidFee(page, popup, /Advance/);
  await expect.poll(async () => (await getContract('sale', saleCtrt)).fees?.[0]?.feeRcptYn).toBe('Y');

  await popup.getByRole('button', { name: 'Sale Completion' }).click();
  const completion = modalTitled(page, 'Sale Completion');
  await completion.locator('.ant-input-number input').nth(0).fill('900000000');
  await completion.locator('.ant-input-number input').nth(1).fill('100000000');
  await shot(page, 'wp5-sale-completion');
  await completion.getByRole('button', { name: 'Save' }).click();
  await expect(completion).toBeHidden();
  await expect.poll(async () => (await getContract('sale', saleCtrt)).trdCnclsDmy).toBeTruthy();

  await confirmFirstUnpaidFee(page, popup, /Balance/);
  await expect.poll(async () => (await getContract('sale', saleCtrt)).fees?.every((f) => f.feeRcptYn === 'Y')).toBe(true);
  await shot(page, 'wp5-sale-fees');
  await page.context().close();
});

test('W5-2 sale: EXTN annex through conclusion moves the parent end date', async ({ browser }) => {
  test.setTimeout(180_000);
  const parent = await prepareContractInProgress('sale', dayjs().add(1, 'year').format('YYYY-MM-DD'));
  test.info().annotations.push({ type: 'record', description: `sale parent ${parent}` });
  const newEnd = dayjs().add(18, 'month');
  let page = await staffPage(browser, 'prcs01');
  let popup = await openContract(page, 'sale', parent);
  await popup.getByRole('tab', { name: /^Annexes/ }).click();
  await popup.getByRole('button', { name: 'Create Annex' }).click();
  const create = modalTitled(page, 'Create Annex');
  await fillDate(create, 0, newEnd.format('DD/MM/YYYY'));
  await create.getByRole('button', { name: 'Create' }).click();
  await expect(create).toBeHidden();
  // The popup switches to the annex.
  await expect(page.locator('.ant-modal-title', { hasText: 'Annex ' })).toBeVisible();
  const annex = (await page.locator('.ant-modal-wrap [data-record-key]').last().getAttribute('data-record-key')) ?? '';
  expect(annex).not.toBe(parent);
  test.info().annotations.push({ type: 'record', description: `sale annex ${annex}` });
  popup = contractPopup(page, annex);
  await fillDate(popup, 0, dayjs().format('DD/MM/YYYY'));
  await popup.getByRole('button', { name: 'Save Draft' }).click();
  await expect.poll(async () => (await getContract('sale', annex)).availableActions ?? []).toContain('REQUEST_DRAFT_APPROVAL');
  await popup.getByRole('button', { name: 'Request Draft Approval' }).click();
  await submitApprovalRequest(page, 'Request Annex Approval');
  await page.context().close();

  const decide = async () => {
    const appr = await staffPage(browser, 'appr01');
    const p = await openContract(appr, 'sale', parent);
    await p.getByRole('tab', { name: /^Annexes/ }).click();
    await p.locator(`tr[data-row-key="${annex}"] button`).click();
    await contractPopup(appr, annex).getByRole('button', { name: 'Approve' }).click();
    await confirmApproval(appr);
    await appr.context().close();
  };
  await decide();
  await expect.poll(async () => (await getContract('sale', annex)).ctrtSttsCd).toBe('DRFAPR');

  const openAnnex = async () => {
    page = await staffPage(browser, 'prcs01');
    const p = await openContract(page, 'sale', parent);
    await p.getByRole('tab', { name: /^Annexes/ }).click();
    await p.locator(`tr[data-row-key="${annex}"] button`).click();
    const a = contractPopup(page, annex);
    await a.getByRole('tab', { name: 'Documents' }).click();
    return a;
  };
  popup = await openAnnex();
  await uploadSamplePdf(popup, 'e2e-annex-draft.pdf');
  await expect.poll(async () => (await getContract('sale', annex)).ctrtSttsCd).toBe('SGNWT');
  await popup.getByRole('button', { name: 'Request Signature Approval' }).click();
  await submitApprovalRequest(page, 'Request Signing Approval');
  await page.context().close();
  await decide();
  await expect.poll(async () => (await getContract('sale', annex)).ctrtSttsCd).toBe('SGNCP');

  popup = await openAnnex();
  await uploadSamplePdf(popup, 'e2e-annex-signed.pdf');
  await expect(popup.getByRole('button', { name: 'Complete Signing' })).toBeEnabled();
  await popup.getByRole('button', { name: 'Complete Signing' }).click();
  await expect.poll(async () => (await getContract('sale', annex)).ctrtSttsCd).toBe('PROGS');
  await expect.poll(async () => (await getContract('sale', parent)).ctrtEndDmy).toBe(newEnd.format('DDMMYYYY'));
  await shot(page, 'wp5-annex-concluded');
  await page.context().close();
});

test('W5-3 renewal decision only within 30 days of the end date (D-30)', async ({ browser }) => {
  test.setTimeout(180_000);
  // Far from the end: no button, and the API refuses with 409 TRD053.
  const far =
    (await listContracts('sale', 'ctrtSttsCds=PROGS')).find(
      (r) => (!r.mstCtrtCd || r.mstCtrtCd === r.srvcCtrtCd) && (r.remainingDays ?? 0) > 30 && r.tkcgEmpNo === 'prcs01',
    )?.srvcCtrtCd ?? (await prepareContractInProgress('sale', dayjs().add(1, 'year').format('YYYY-MM-DD')));
  expect((await getContract('sale', far)).availableActions ?? []).not.toContain('DECIDE_RENEWAL');
  await expect(api('prcs01', 'POST', `${CONTRACT_PATH.sale}/${far}/renewal-decision`, { decision: 'NO_EXTEND', note: 'e2e early' })).rejects.toThrow(/409/);
  const early = await staffPage(browser, 'prcs01');
  const farPopup = await openContract(early, 'sale', far);
  await expect(farPopup.getByRole('button', { name: 'Renewal Decision' })).toHaveCount(0);
  await early.context().close();

  // A seeded contract near its end date, else a fixture contract ending in 20 days (D-30 window).
  const ctrtCd =
    (await findContractWith('sale', 'ctrtSttsCds=PROGS&endingWithinDays=30', 'DECIDE_RENEWAL')) ??
    (await prepareContractInProgress('sale', dayjs().add(20, 'day').format('YYYY-MM-DD')));
  expect((await getContract('sale', ctrtCd)).availableActions).toContain('DECIDE_RENEWAL');
  const page = await staffPage(browser, 'prcs01');
  const popup = await openContract(page, 'sale', ctrtCd);
  await popup.getByRole('button', { name: 'Renewal Decision' }).click();
  const modal = modalTitled(page, 'Renewal Decision');
  await expect(modal).toContainText('30 days before the end date');
  await modal.getByText('Do not extend').click();
  await expect(modal).toContainText('N3');
  await modal.getByRole('button', { name: 'Save' }).click();
  await expect(modal).toBeHidden();
  test.info().annotations.push({ type: 'record', description: `sale renewal NO_EXTEND ${ctrtCd}` });
  await expect.poll(async () => (await getContract('sale', ctrtCd)).ctrtSttsCd).toBe('ENDING');
  await page.context().close();
});

test('W5-4 purchase: advance fee, trade conclusion, delivery', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctrtCd = await prepareContractInProgress('purchase');
  test.info().annotations.push({ type: 'record', description: `purchase contract ${ctrtCd}` });
  const page = await staffPage(browser, 'prcs01');
  const popup = await openContract(page, 'purchase', ctrtCd);
  await expect(popup.getByRole('button', { name: 'Record Delivery' })).toHaveCount(0); // before the agreement
  await confirmFirstUnpaidFee(page, popup, /Advance/);
  await popup.getByRole('button', { name: 'Sale and Purchase Agreement' }).click();
  const agreement = modalTitled(page, 'Sale and Purchase Agreement');
  await agreement.locator('.ant-input-number input').nth(0).fill('800000000');
  await agreement.getByRole('button', { name: 'Save' }).click();
  await expect(agreement).toBeHidden();
  await expect.poll(async () => (await getContract('purchase', ctrtCd)).trdCnclsDmy).toBeTruthy();
  await popup.getByRole('button', { name: 'Record Delivery' }).click();
  const delivery = modalTitled(page, 'Record Delivery');
  await delivery.locator('textarea').fill('Documents handed over at VAMC office (e2e).');
  await delivery.getByRole('button', { name: 'Save' }).click();
  await expect(delivery).toBeHidden();
  await expect.poll(async () => (await getContract('purchase', ctrtCd)).dlvrCmptnDmy).toBeTruthy();
  await shot(page, 'wp5-purchase-delivery');
  await page.context().close();
});
