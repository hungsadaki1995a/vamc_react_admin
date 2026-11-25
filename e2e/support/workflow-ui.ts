import { expect } from '@playwright/test';
import type { Browser, Locator, Page } from '@playwright/test';
import { forceEnglish } from './session';
import { activePanel, openMenu } from './shell';
import { storageStateOf } from './trade-setup';
import type { StaffKey } from './trade-setup';

// UI helpers of the workflow specs: one browser context per staff account, menu paths, antd select picking.

export const MENU = {
  saleApplications: ['Transaction Management', 'Application Management', 'Sale Brokerage Application'],
  purchaseApplications: ['Transaction Management', 'Application Management', 'Purchase Brokerage Application'],
  consultingApplications: ['Transaction Management', 'Application Management', 'Consulting Application'],
  saleContracts: ['Transaction Management', 'Contract Management', 'Sale Brokerage Contract Management'],
  approvals: ['Approval Management'],
};

/** New context signed in as `key` (session saved by workflow.setup.ts), on the admin shell. */
export async function staffPage(browser: Browser, key: StaffKey): Promise<Page> {
  const context = await browser.newContext({ storageState: storageStateOf(key), viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  await forceEnglish(page);
  await page.goto('/');
  await expect(page.locator('.icon-rail')).toBeVisible({ timeout: 20_000 });
  return page;
}

export async function openScreen(page: Page, path: string[]): Promise<Locator> {
  await openMenu(page, path);
  const panel = activePanel(page);
  await expect(panel.locator('.ant-table').first()).toBeVisible();
  return panel;
}

/** Opens an antd select inside `scope` and clicks the option whose text contains `text`. */
export async function pickOption(page: Page, select: Locator, text: string | RegExp): Promise<void> {
  await select.click();
  const option = page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: text }).first();
  await expect(option).toBeVisible();
  // The dropdown of a select inside a stacked modal keeps animating its position; no stability wait.
  await option.click({ force: true });
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
}

/** Visible antd modal on top. */
export function topModal(page: Page): Locator {
  return page.locator('.ant-modal-wrap').filter({ visible: true }).last();
}

/** Filters an application board by keyword (application ID) and opens the row's popup. */
export async function openApplication(page: Page, panel: Locator, id: string): Promise<Locator> {
  await panel.getByPlaceholder('Application No., name...').fill(id);
  await panel.getByPlaceholder('Application No., name...').press('Enter');
  // Rows are keyed by the id; the screen shows the readable number.
  const link = panel.locator(`tr[data-row-key="${id}"] a`).first();
  await expect(link).toBeVisible();
  await link.click();
  const modal = page.locator('.ant-modal-wrap').filter({ has: page.locator(`[data-record-key="${id}"]`) }).last();
  await expect(modal.getByText('Documents', { exact: true })).toBeVisible();
  return modal;
}

/** Smallest valid PDF (the backend checks the MIME type with Tika). */
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

/** Uploads a sample PDF through the first file input inside `scope`. */
export async function uploadSamplePdf(scope: Locator, name = 'e2e-scan.pdf'): Promise<void> {
  await scope.locator('input[type="file"]').first().setInputFiles({ name, mimeType: 'application/pdf', buffer: PDF });
}

export const CONTRACT_MENU = {
  sale: ['Transaction Management', 'Contract Management', 'Sale Brokerage Contract Management'],
  purchase: ['Transaction Management', 'Contract Management', 'Purchase Brokerage Contract Management'],
  consulting: ['Transaction Management', 'Contract Management', 'Consulting Contract Management'],
};

/** The contract popup, pinned by its record key (sub-popups stack on top of it). */
export function contractPopup(page: Page, ctrtCd: string): Locator {
  return page.locator('.ant-modal-wrap').filter({ has: page.locator(`[data-record-key="${ctrtCd}"]`) }).first();
}

/** Opens a contract board, filters by the contract code and opens its popup. */
export async function openContract(page: Page, kind: 'sale' | 'purchase' | 'consulting', ctrtCd: string): Promise<Locator> {
  const panel = await openScreen(page, CONTRACT_MENU[kind]);
  await panel.getByPlaceholder('Contract No. or keyword').fill(ctrtCd);
  await panel.getByPlaceholder('Contract No. or keyword').press('Enter');
  await panel.locator(`tr[data-row-key="${ctrtCd}"] a`).first().click();
  const popup = contractPopup(page, ctrtCd);
  await expect(popup.getByRole('tab', { name: 'Documents' })).toBeVisible();
  return popup;
}

/** Types a dd/MM/yyyy date into the n-th date picker of `scope`. */
export async function fillDate(scope: Locator, index: number, ddmmyyyy: string): Promise<void> {
  const input = scope.locator('.ant-picker input').nth(index);
  await input.click();
  await input.fill(ddmmyyyy);
  await input.press('Enter');
}

/** Sub-popup on top, by title. */
export function modalTitled(page: Page, title: string | RegExp): Locator {
  return page.locator('.ant-modal-wrap').filter({ has: page.locator('.ant-modal-title', { hasText: title }) }).last();
}

/** Approval request popup: approver appr01, confirmation, submit; waits until it closes. */
export async function submitApprovalRequest(page: Page, title: string | RegExp): Promise<void> {
  const request = modalTitled(page, title);
  await expect(request).toBeVisible();
  await pickOption(page, request.locator('.ant-select').first(), 'appr01');
  await request.getByRole('checkbox').check();
  await request.getByRole('button', { name: 'Submit' }).click();
  await expect(request).toBeHidden();
}

/** Approve popup: tick and confirm (`Confirm`, or `Signing Complete` for signature steps). */
export async function confirmApproval(page: Page, button: string | RegExp = /^(Confirm|Signing Complete)$/): Promise<void> {
  const approve = modalTitled(page, /^Approve$/);
  await expect(approve).toBeVisible();
  await approve.getByRole('checkbox').check();
  await approve.getByRole('button', { name: button }).click();
  await expect(approve).toBeHidden();
}
