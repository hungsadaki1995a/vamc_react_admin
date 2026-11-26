import { expect, test } from '@playwright/test';
import { getApplication, listApplications, shot } from '../support/trade-setup';
import type { TradeKind } from '../support/trade-setup';
import { MENU, fillDate, modalTitled, openApplication, openScreen, pickOption, staffPage, topModal, uploadSamplePdf } from '../support/workflow-ui';

// WP3 acceptance per kind: rcpt01 registers a paper application (member picked, registered NPL picked, scan,
// officer prcs01) → it is listed as Manual / Received and prcs01 can continue in the processing popup;
// then an editable application is edited (price, or the consulting request) — the PUT carries only that field.
// Consulting (R3-07): a listed collateral and a collateral typed from the paper form.

const KINDS: { kind: TradeKind; menu: string[] }[] = [
  { kind: 'sale', menu: MENU.saleApplications },
  { kind: 'purchase', menu: MENU.purchaseApplications },
  { kind: 'consulting', menu: MENU.consultingApplications },
];
const MEMBER = 'TV00000002';

for (const { kind, menu } of KINDS) {
  test(`W3-1 ${kind}: manual registration as rcpt01`, async ({ browser }) => {
    const page = await staffPage(browser, 'rcpt01');
    const panel = await openScreen(page, menu);
    await panel.getByRole('button', { name: /Add New/ }).click();
    // Pin the form by its title: topModal() re-resolves to the processing popup opened after the save.
    const form = page.locator('.ant-modal-wrap').filter({ has: page.locator('.ant-modal-title', { hasText: '(Manual)' }) });
    await expect(form).toBeVisible();

    // Required fields are checked before the call.
    await form.getByRole('button', { name: 'Register' }).click();
    await expect(form).toContainText('Select the applicant member.');
    await expect(form).toContainText('Select the officer in charge.');

    await form.getByRole('button', { name: /Member Search/ }).click();
    const members = topModal(page);
    await members.locator('input').first().fill(MEMBER);
    await members.locator('input').first().press('Enter');
    await members.locator('.ant-table-row', { hasText: MEMBER }).click();
    await members.getByRole('button', { name: 'Select' }).click();
    await expect(form).toContainText(MEMBER);

    if (kind === 'consulting') {
      await pickOption(page, form.locator('.ant-select').first(), 'Debtor Advice');
      await form.locator('textarea').first().fill('Advice on the debtor restructuring options (e2e manual).');
      // Listed collateral (Collateral Search, listed only).
      await form.getByRole('button', { name: 'Collateral Search' }).click();
      const collaterals = modalTitled(page, 'Collateral Search');
      await collaterals.locator('.ant-table-row').first().click();
      await collaterals.getByRole('button', { name: 'Select' }).click();
      await expect(collaterals).toBeHidden();
      await expect(form.getByPlaceholder('Search a listed collateral')).toHaveValue(/^TSBD/);
      // A collateral typed from the paper form; the required fields are checked first.
      await form.getByRole('button', { name: 'Add Collateral' }).click();
      const typed = modalTitled(page, 'Add Target Collateral');
      await typed.getByRole('button', { name: 'Add' }).click();
      await expect(typed).toContainText('Enter the category');
      await pickOption(page, typed.locator('.ant-select').first(), 'Real estate');
      await typed.locator('input:not([type="search"])').first().fill('HDTC-E2E/2022');
      await fillDate(typed, 0, '02/05/2022');
      await typed.locator('textarea').fill('Factory and land use right, lot C-12 (e2e)');
      await typed.getByRole('button', { name: 'Add' }).click();
      await expect(typed).toBeHidden();
      await expect(form).toContainText('HDTC-E2E/2022');
      await expect(form).toContainText('(1/20)');
    } else {
      await form.getByRole('button', { name: /NPL Search/ }).click();
      const npls = topModal(page);
      // An NPL still on sale (SA): a sold one (SD) is refused for a purchase.
      await npls.locator('.ant-table-row').filter({ has: page.locator('td', { hasText: /^SA$/ }) }).first().click();
      await npls.getByRole('button', { name: 'Select' }).click();
      await form.locator('.ant-input-number input').fill('1500000000');
    }
    await expect(form).toContainText('NPL Management first'); // N2 notice
    await uploadSamplePdf(form, 'e2e-manual.pdf');
    await expect(form).toContainText('e2e-manual.pdf');
    await pickOption(page, form.locator('.ant-select').last(), 'prcs01');
    await shot(page, `wp3-${kind}-form`);
    await form.getByRole('button', { name: 'Register' }).click();
    await expect(form).toBeHidden();

    // The new application opens in the processing popup.
    const popup = topModal(page);
    const key = popup.locator('[data-record-key]');
    await expect(key).toHaveCount(1);
    const id = (await key.getAttribute('data-record-key')) ?? '';
    expect(id).not.toBe('');
    test.info().annotations.push({ type: 'record', description: `${kind} manual ${id}` });
    await expect(popup).toContainText('Manual');
    await shot(page, `wp3-${kind}-created`);

    const created = await getApplication(kind, id, 'prcs01');
    expect(created.srvcPrcsSttsCd).toBe('PRCS');
    if (kind === 'consulting') {
      const consulting = created as unknown as { cltrAstCd?: string; collaterals?: { cltrAstCd?: string; cltrCtrtNo?: string }[] };
      expect(consulting.cltrAstCd).toMatch(/^TSBD/);
      expect(consulting.collaterals?.some((c) => c.cltrCtrtNo === 'HDTC-E2E/2022')).toBe(true);
      await expect(popup).toContainText('HDTC-E2E/2022');
    }
    expect(created.tkcgEmpNo).toBe('prcs01');
    expect(created.availableAction).toBe('CHECK_DOCUMENTS'); // continues in the WP2 popup as the officer
    const listed = await listApplications(kind, 'rcpt01', `keyword=${id}`);
    expect(listed[0]?.srvcPrcsSttsCd).toBe('PRCS');
    await page.context().close();
  });

  test(`W3-2 ${kind}: edit an application before approval`, async ({ browser }) => {
    const row = (await listApplications(kind, 'rcpt01', 'sttsCds=RCPT&sttsCds=PRCS')).find((r) => r.approvalStage !== 'IN_APPROVAL');
    if (!row) throw new Error(`No editable ${kind} application`);
    test.info().annotations.push({ type: 'record', description: `${kind} edited ${row.srvcAplyId}` });
    const page = await staffPage(browser, 'rcpt01');
    const panel = await openScreen(page, menu);
    const popup = await openApplication(page, panel, row.srvcAplyId);
    await popup.getByRole('button', { name: 'Edit' }).click();
    const form = page.locator('.ant-modal-wrap').filter({ has: page.locator('.ant-modal-title', { hasText: /^Edit / }) });
    await expect(form).toBeVisible();
    const before = await getApplication(kind, row.srvcAplyId, 'rcpt01');
    // Values that differ from any earlier run, so the field really changes.
    const request = `Edited consulting request (e2e ${Date.now()}).`;
    const price = 2_345_000_000 + (Date.now() % 1000) * 1000;
    if (kind === 'consulting') {
      await form.locator('textarea').first().fill(request);
    } else {
      await form.locator('.ant-input-number input').fill(String(price));
    }
    const put = page.waitForRequest((r) => r.method() === 'PUT' && r.url().includes(`/service-applications/${kind}/`));
    await form.getByRole('button', { name: 'Save' }).click();
    // Only the changed field is sent; the server keeps the others (R3-06).
    expect(Object.keys((await put).postDataJSON() as object)).toEqual([kind === 'consulting' ? 'cnsltDmndPrpsCn' : 'prpDsplPrc']);
    await expect(form).toBeHidden();
    const after = await getApplication(kind, row.srvcAplyId, 'rcpt01');
    if (kind === 'consulting') {
      expect((after as unknown as { cnsltDmndPrpsCn: string }).cnsltDmndPrpsCn).toBe(request);
    } else {
      expect(Number((after as unknown as { prpDsplPrc: number }).prpDsplPrc)).toBe(price);
    }
    // Fields not on the form are kept (scan group, member).
    expect((after as unknown as { esntlDcmntScnFile?: string }).esntlDcmntScnFile).toBe(
      (before as unknown as { esntlDcmntScnFile?: string }).esntlDcmntScnFile,
    );
    await shot(page, `wp3-${kind}-edited`);
    await page.context().close();
  });
}
