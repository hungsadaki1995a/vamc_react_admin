import { expect, test } from '@playwright/test';
import { api, CONTRACT_PATH, getContract, payOpenFees, prepareContractInProgress, shot } from '../support/trade-setup';
import type { TradeKind } from '../support/trade-setup';
import { confirmApproval, modalTitled, openContract, staffPage, submitApprovalRequest, uploadSamplePdf } from '../support/workflow-ui';
import type { Browser, Locator, Page } from '@playwright/test';

// WP6 acceptance: termination chain (register → approval → minutes → minutes signature → signed scan → close)
// for a sold sale contract (CMPL → CMPTN), an unsold one (CMPL refused by the server guard, then CNCL → CNCLN)
// and a consulting contract (no Expired reason; CNCL).

async function terminationTab(browser: Browser, as: 'prcs01' | 'appr01', kind: TradeKind, ctrtCd: string): Promise<{ page: Page; popup: Locator }> {
  const page = await staffPage(browser, as);
  const popup = await openContract(page, kind, ctrtCd);
  await popup.getByRole('tab', { name: /^Termination/ }).click();
  return { page, popup };
}

async function approveAs(browser: Browser, kind: TradeKind, ctrtCd: string): Promise<void> {
  const page = await staffPage(browser, 'appr01');
  const popup = await openContract(page, kind, ctrtCd);
  await popup.getByRole('button', { name: 'Approve' }).click();
  await confirmApproval(page);
  await page.context().close();
}

const endStatus = async (kind: TradeKind, ctrtCd: string) =>
  ((await getContract(kind, ctrtCd)) as unknown as { terminations?: { endSttsCd?: string }[] }).terminations?.at(-1)?.endSttsCd;

async function register(page: Page, popup: Locator, reason: string, note?: string, refund = false): Promise<void> {
  await popup.getByRole('button', { name: 'Register Termination' }).click();
  const modal = modalTitled(page, 'Register Termination');
  await modal.getByText(reason, { exact: true }).click();
  if (refund) await modal.getByText('Refund', { exact: true }).click();
  if (note) await modal.locator('textarea').fill(note);
  await modal.getByRole('button', { name: 'Register' }).click();
}

/** From a registered termination to the closed contract, through the UI. */
async function runChain(browser: Browser, kind: TradeKind, ctrtCd: string, final: 'CMPTN' | 'CNCLN'): Promise<void> {
  let { page, popup } = await terminationTab(browser, 'prcs01', kind, ctrtCd);
  await popup.getByRole('button', { name: 'Request Termination Approval' }).click();
  await submitApprovalRequest(page, 'Request Termination Approval');
  await page.context().close();
  await approveAs(browser, kind, ctrtCd);
  await expect.poll(() => endStatus(kind, ctrtCd)).toBe('DRFAPR');

  ({ page, popup } = await terminationTab(browser, 'prcs01', kind, ctrtCd));
  await uploadSamplePdf(popup, 'e2e-minutes.pdf');
  await expect.poll(() => endStatus(kind, ctrtCd)).toBe('SGNWT');
  await expect(popup).toContainText('e2e-minutes.pdf');
  await popup.getByRole('button', { name: 'Request Minutes Signature Approval' }).click();
  await submitApprovalRequest(page, 'Request Termination Signing Approval');
  await page.context().close();
  await approveAs(browser, kind, ctrtCd);
  await expect.poll(() => endStatus(kind, ctrtCd)).toBe('SGNCP');

  ({ page, popup } = await terminationTab(browser, 'prcs01', kind, ctrtCd));
  await expect(popup.getByRole('button', { name: 'Close Contract' })).toBeDisabled();
  await uploadSamplePdf(popup, 'e2e-minutes-signed.pdf');
  await expect(popup.getByRole('button', { name: 'Close Contract' })).toBeEnabled();
  await popup.getByRole('button', { name: 'Close Contract' }).click();
  await expect.poll(async () => (await getContract(kind, ctrtCd)).ctrtSttsCd).toBe(final);
  await shot(page, `wp6-${kind}-${final}`);
  await page.context().close();
}

test('W6-1 sale: completed termination after the sale and the fees', async ({ browser }) => {
  test.setTimeout(240_000);
  const ctrtCd = await prepareContractInProgress('sale');
  test.info().annotations.push({ type: 'record', description: `sale CMPL ${ctrtCd}` });
  await payOpenFees('sale', ctrtCd);
  const today = new Date().toISOString().slice(0, 10);
  await api('prcs01', 'POST', `${CONTRACT_PATH.sale}/${ctrtCd}/sale-completion`, { trdCnclsDt: today, rltrPrc: 900000000, finalFeeAmt: 100000000 });
  await payOpenFees('sale', ctrtCd);

  const { page, popup } = await terminationTab(browser, 'prcs01', 'sale', ctrtCd);
  await register(page, popup, 'Completed');
  await expect.poll(async () => (await getContract('sale', ctrtCd)).ctrtSttsCd).toBe('ENDING');
  await page.context().close();
  await runChain(browser, 'sale', ctrtCd, 'CMPTN');
});

test('W6-2 sale: Completed refused before the sale, then early termination with refund', async ({ browser }) => {
  test.setTimeout(240_000);
  const ctrtCd = await prepareContractInProgress('sale');
  test.info().annotations.push({ type: 'record', description: `sale CNCL ${ctrtCd}` });
  const { page, popup } = await terminationTab(browser, 'prcs01', 'sale', ctrtCd);
  await register(page, popup, 'Completed');
  // Server guard (sale not finished / fee open): the message is shown and nothing changes.
  await expect(page.locator('.ant-message-error, .ant-message-notice-error').first()).toBeVisible();
  await shot(page, 'wp6-guard');
  await modalTitled(page, 'Register Termination').getByRole('button', { name: 'Cancel' }).click();
  expect((await getContract('sale', ctrtCd)).ctrtSttsCd).toBe('PROGS');

  await register(page, popup, 'Early termination', 'Customer ended the brokerage by agreement (e2e).', true);
  await expect.poll(async () => (await getContract('sale', ctrtCd)).ctrtSttsCd).toBe('ENDING');
  await page.context().close();
  await runChain(browser, 'sale', ctrtCd, 'CNCLN');
});

test('W6-3 consulting: no Expired reason; early termination to the end', async ({ browser }) => {
  test.setTimeout(240_000);
  const ctrtCd = await prepareContractInProgress('consulting');
  test.info().annotations.push({ type: 'record', description: `consulting CNCL ${ctrtCd}` });
  const { page, popup } = await terminationTab(browser, 'prcs01', 'consulting', ctrtCd);
  await popup.getByRole('button', { name: 'Register Termination' }).click();
  const modal = modalTitled(page, 'Register Termination');
  await expect(modal.getByText('Expired', { exact: true })).toHaveCount(0);
  await modal.getByRole('button', { name: 'Cancel' }).click();
  await register(page, popup, 'Early termination', 'Consulting stopped at the customer request (e2e).');
  await expect.poll(async () => (await getContract('consulting', ctrtCd)).ctrtSttsCd).toBe('ENDING');
  await page.context().close();
  await runChain(browser, 'consulting', ctrtCd, 'CNCLN');
});
