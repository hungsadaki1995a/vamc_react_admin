import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';
import { getContract, preparePreparingContract, shot } from '../support/trade-setup';
import type { TradeKind } from '../support/trade-setup';
import {
  MENU,
  confirmApproval,
  fillDate,
  openContract,
  openScreen,
  staffPage,
  submitApprovalRequest,
  uploadSamplePdf,
} from '../support/workflow-ui';

// WP4 acceptance per kind: a main contract in PREPR (sale from the seed, purchase / consulting built by the API
// fixture) → draft terms → draft approval (appr01 from Approval Management) → draft registration → signature
// approval (appr01 "Signing Complete" in the contract popup) → signed scan → conclusion (PROGS) with fees.

const KINDS: TradeKind[] = ['sale', 'purchase', 'consulting'];
const INBOX_CHIP: Record<TradeKind, RegExp> = { sale: /^Sale/, purchase: /^Purchase/, consulting: /^Consulting/ };

for (const kind of KINDS) {
  test(`W4-1 ${kind}: contract draft → approval → signing → conclusion`, async ({ browser }) => {
    test.setTimeout(180_000);
    const ctrtCd = await preparePreparingContract(kind);
    test.info().annotations.push({ type: 'record', description: `${kind} contract ${ctrtCd}` });

    // admin (not the officer) sees the terms read-only
    const admin = await staffPage(browser, 'admin');
    let popup = await openContract(admin, kind, ctrtCd);
    await expect(popup.getByRole('button', { name: 'Save Draft' })).toHaveCount(0);
    await admin.context().close();

    // prcs01: terms + draft approval request
    const prcs = await staffPage(browser, 'prcs01');
    popup = await openContract(prcs, kind, ctrtCd);
    const today = dayjs().format('DD/MM/YYYY');
    await fillDate(popup, 0, today);
    if (kind === 'sale') {
      // End date defaults to start + 1 year (flow contract step 2).
      await expect(popup.locator('.ant-picker input').nth(1)).toHaveValue(dayjs().add(1, 'year').subtract(1, 'day').format('DD/MM/YYYY'));
    }
    await popup.getByText('③ Advance + balance').click();
    await popup.locator('.ant-input-number input').nth(1).fill('100000000');
    await popup.locator('.ant-input-number input').nth(2).fill('20');
    await expect(popup).toContainText('Advance: 20,000,000');
    await popup.getByRole('button', { name: 'Save Draft' }).click();
    await expect.poll(async () => (await getContract(kind, ctrtCd)).availableActions ?? []).toContain('REQUEST_DRAFT_APPROVAL');
    await shot(prcs, `wp4-${kind}-draft`);
    await popup.getByRole('button', { name: 'Request Draft Approval' }).click();
    await submitApprovalRequest(prcs, 'Request Draft Contract Approval');
    await expect.poll(async () => (await getContract(kind, ctrtCd)).openAtrzHstryId).toBeTruthy();
    await prcs.context().close();

    // appr01: approve the draft from Approval Management
    const appr = await staffPage(browser, 'appr01');
    const panel = await openScreen(appr, MENU.approvals);
    await panel.getByRole('tab', { name: INBOX_CHIP[kind] }).click();
    const no = (await getContract(kind, ctrtCd)).srvcCtrtNo;
    const row = panel.locator('.ant-table-row', { hasText: new RegExp(no ? `${no}|${ctrtCd}` : ctrtCd) });
    await row.getByRole('button', { name: 'Approve' }).click();
    await confirmApproval(appr, 'Confirm');
    await expect.poll(async () => (await getContract(kind, ctrtCd)).ctrtSttsCd).toBe('DRFAPR');
    await appr.context().close();

    // prcs01: register the draft, request the signature approval
    const prcs2 = await staffPage(browser, 'prcs01');
    popup = await openContract(prcs2, kind, ctrtCd);
    await popup.getByRole('tab', { name: 'Documents' }).click();
    await uploadSamplePdf(popup, 'e2e-draft.pdf');
    await expect.poll(async () => (await getContract(kind, ctrtCd)).ctrtSttsCd).toBe('SGNWT');
    await expect(popup).toContainText('e2e-draft.pdf');
    await popup.getByRole('button', { name: 'Request Signature Approval' }).click();
    await submitApprovalRequest(prcs2, 'Request Signing Approval');
    await prcs2.context().close();

    // appr01: "Signing Complete" in the contract popup
    const appr2 = await staffPage(browser, 'appr01');
    popup = await openContract(appr2, kind, ctrtCd);
    await popup.getByRole('button', { name: 'Approve' }).click();
    await confirmApproval(appr2, 'Signing Complete');
    await expect.poll(async () => (await getContract(kind, ctrtCd)).ctrtSttsCd).toBe('SGNCP');
    await appr2.context().close();

    // prcs01: conclusion is disabled until the signed scan is uploaded
    const prcs3 = await staffPage(browser, 'prcs01');
    popup = await openContract(prcs3, kind, ctrtCd);
    await popup.getByRole('tab', { name: 'Documents' }).click();
    await expect(popup.getByRole('button', { name: 'Complete Signing' })).toBeDisabled();
    await uploadSamplePdf(popup, 'e2e-signed.pdf');
    await expect(popup).toContainText('e2e-signed.pdf');
    await expect(popup.getByRole('button', { name: 'Complete Signing' })).toBeEnabled();
    await popup.getByRole('button', { name: 'Complete Signing' }).click();
    await expect.poll(async () => (await getContract(kind, ctrtCd)).ctrtSttsCd).toBe('PROGS');
    await popup.getByRole('tab', { name: /^Fees/ }).click();
    await expect(popup.locator('.ant-tabs-tabpane-active .ant-table-row').first()).toBeVisible();
    await shot(prcs3, `wp4-${kind}-concluded`);
    await prcs3.context().close();
  });
}
