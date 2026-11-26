import { expect, test } from '@playwright/test';
import { api, getContract, prepareConsultingContractOf, requestFollowUpAsMember, shot } from '../support/trade-setup';
import { CONTRACT_MENU, confirmApproval, modalTitled, openContract, openScreen, pickOption, staffPage, uploadSamplePdf } from '../support/workflow-ui';

// WP7 acceptance: consulting contract of a seed member (TV00000006 / 09 / 03) (seed application in processing → contract in progress,
// advance paid, by the API fixture) → consultant (not the officer) → report draft → report approval → completion →
// remaining fee → published; follow-up request sent by the member through the client API → receive → answer.

test.describe.configure({ mode: 'serial' });

/** Seed members with consulting applications in processing and their client login (password E2E_WORKFLOW_PASS). */
const MEMBERS = [
  { mbrNo: 'TV00000006', loginId: '0909000006' },
  { mbrNo: 'TV00000009', loginId: '0909000009' },
  { mbrNo: 'TV00000003', loginId: 'vobachnhac03@gmail.com' },
];
let MEMBER = MEMBERS[0];
let ctrtCd = '';
let srvcAplyId = '';

type ConsultingRow = { cnsltEmpNo?: string; cnsltRptpSttsCd?: string; additionalConsultations?: { adtnId: string; adtnSttsCd?: string; rqstCn?: string }[] };
const consulting = async () => (await getContract('consulting', ctrtCd)) as unknown as ConsultingRow;

test.beforeAll(async () => {
  for (const member of MEMBERS) {
    try {
      ({ srvcAplyId, ctrtCd } = await prepareConsultingContractOf(member.mbrNo));
      MEMBER = member;
      return;
    } catch (error) {
      if (!String(error).includes('No consulting application')) throw error;
    }
  }
  throw new Error('No seed member has a consulting application in processing');
});

test('W7-1 assign the consultant (the officer cannot be chosen)', async ({ browser }) => {
  test.info().annotations.push({ type: 'record', description: `consulting ${srvcAplyId} → contract ${ctrtCd}` });
  // The flow lets the approver assign the consultant (WP8 round 2); the button follows ASSIGN_CONSULTANT.
  const assigner = (await getContract('consulting', ctrtCd, 'appr01')).availableActions?.includes('ASSIGN_CONSULTANT') ? 'appr01' : 'prcs01';
  if (assigner === 'appr01') {
    const officer = await staffPage(browser, 'prcs01');
    const own = await openContract(officer, 'consulting', ctrtCd);
    await expect(own.getByRole('button', { name: 'Assign', exact: true })).toHaveCount(0);
    await officer.context().close();
  }
  const page = await staffPage(browser, assigner);
  const popup = await openContract(page, 'consulting', ctrtCd);
  await popup.getByRole('button', { name: 'Assign', exact: true }).click();
  const assign = modalTitled(page, 'Assign Consultant');
  await assign.getByRole('button', { name: 'Search' }).click();
  const search = modalTitled(page, 'Consultant Search');
  // Any employed staff member, from GET /employees/lookup (open to trade staff since round 3).
  const lookup = page.waitForResponse((r) => r.url().includes('/api/v1/employees/lookup') && r.url().includes('empNo=prcs01'));
  await search.locator('input').first().fill('prcs01');
  await search.locator('input').first().press('Enter');
  expect((await lookup).status()).toBe(200);
  await expect(search.locator('.ant-table-row', { hasText: 'prcs01' })).toHaveCount(0); // officer excluded
  await search.locator('input').first().fill('rcpt01');
  await search.locator('input').first().press('Enter');
  await search.locator('.ant-table-row', { hasText: 'rcpt01' }).click();
  await search.getByRole('button', { name: 'Select' }).click();
  await assign.getByRole('button', { name: 'Assign' }).click();
  await expect(assign).toBeHidden();
  await expect.poll(async () => (await consulting()).cnsltEmpNo).toBe('rcpt01');
  await shot(page, 'wp7-consultant');
  await page.context().close();
});

test('W7-2 report draft → approval → completion → published after the remaining fee', async ({ browser }) => {
  test.setTimeout(180_000);
  let page = await staffPage(browser, 'prcs01');
  let popup = await openContract(page, 'consulting', ctrtCd);
  await popup.getByRole('tab', { name: /^Report/ }).click();
  await uploadSamplePdf(popup, 'e2e-report.pdf');
  await popup.getByPlaceholder('Report summary shown to the member').fill('Debtor restructuring is feasible within 12 months (e2e).');
  await popup.getByRole('button', { name: 'Save Report' }).click();
  await expect.poll(async () => (await consulting()).cnsltRptpSttsCd).toBe('DRFT');
  await popup.getByRole('button', { name: 'Request Report Approval' }).click();
  const request = modalTitled(page, 'Request Consulting Report Approval');
  await pickOption(page, request.locator('.ant-select').first(), 'appr01');
  await request.getByRole('checkbox').check();
  await request.getByRole('button', { name: 'Submit' }).click();
  await expect(request).toBeHidden();
  await page.context().close();

  const appr = await staffPage(browser, 'appr01');
  const p = await openContract(appr, 'consulting', ctrtCd);
  await p.getByRole('button', { name: 'Approve' }).click();
  await confirmApproval(appr);
  await appr.context().close();
  await expect.poll(async () => (await consulting()).cnsltRptpSttsCd).toBe('APRV');

  page = await staffPage(browser, 'prcs01');
  popup = await openContract(page, 'consulting', ctrtCd);
  await popup.getByRole('tab', { name: /^Report/ }).click();
  await popup.getByRole('button', { name: 'Complete Report' }).click();
  await expect.poll(async () => (await consulting()).cnsltRptpSttsCd).toMatch(/^(RDY|OPEN)$/);
  if ((await consulting()).cnsltRptpSttsCd === 'RDY') {
    // The report is published when the remaining fee is paid (flow P9).
    await popup.getByRole('tab', { name: /^Fees/ }).click();
    const row = popup.locator('.ant-tabs-tabpane-active .ant-table-row').filter({ hasText: 'Unpaid' }).first();
    await row.getByRole('button', { name: 'Confirm' }).click();
    await modalTitled(page, 'Confirm Fee Payment').getByRole('button', { name: 'Confirm' }).click();
  }
  await expect.poll(async () => (await consulting()).cnsltRptpSttsCd).toBe('OPEN');
  await popup.getByRole('tab', { name: /^Report/ }).click();
  await expect(popup).toContainText('Published');
  await shot(page, 'wp7-report-published');
  await page.context().close();
});

test('W7-3 follow-up consultation from the member: receive and answer', async ({ browser }) => {
  test.setTimeout(120_000);
  // Switch on follow-up requests from the consulting contract board.
  let page = await staffPage(browser, 'prcs01');
  const setting = page.waitForResponse((r) => r.request().method() === 'GET' && r.url().includes('/settings/additional-consulting'));
  const panel = await openScreen(page, CONTRACT_MENU.consulting);
  const toggle = panel.getByRole('switch');
  const current = ((await (await setting).json()) as { data: boolean }).data;
  await expect(toggle).toHaveAttribute('aria-checked', String(current));
  // The switch sends a boolean (R3-09): off then on, or just on.
  if ((await toggle.getAttribute('aria-checked')) === 'true') {
    const off = page.waitForRequest((r) => r.method() === 'PUT' && r.url().includes('/settings/additional-consulting'));
    await toggle.click();
    expect((await off).postDataJSON()).toEqual({ enabled: false });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  }
  const on = page.waitForRequest((r) => r.method() === 'PUT' && r.url().includes('/settings/additional-consulting'));
  await toggle.click();
  expect((await on).postDataJSON()).toEqual({ enabled: true });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  expect(await api<boolean>('prcs01', 'GET', '/api/v1/consulting-contracts/settings/additional-consulting')).toBe(true);
  await page.context().close();

  const question = `Can the restructuring start before the court decision? (e2e ${Date.now()})`;
  await requestFollowUpAsMember(MEMBER.loginId, srvcAplyId, question);
  const requested = (await consulting()).additionalConsultations?.find((a) => a.rqstCn === question);
  expect(requested?.adtnSttsCd).toBe('RQST');
  test.info().annotations.push({ type: 'record', description: `follow-up ${requested?.adtnId}` });

  page = await staffPage(browser, 'prcs01');
  const popup = await openContract(page, 'consulting', ctrtCd);
  await popup.getByRole('tab', { name: /^Report/ }).click();
  const row = popup.locator('.ant-table-row', { hasText: question });
  await row.getByRole('button', { name: 'Receive' }).click();
  await expect(row).toContainText('Received');
  await row.getByRole('button', { name: 'Answer' }).click();
  const answer = modalTitled(page, 'Answer Follow-up Consultation');
  await answer.locator('textarea').fill('Yes, the creditor committee can approve it first (e2e).');
  await answer.getByRole('button', { name: 'Send Answer' }).click();
  await expect(answer).toBeHidden();
  await expect.poll(async () => (await consulting()).additionalConsultations?.find((a) => a.rqstCn === question)?.adtnSttsCd).toBe('CMPTN');
  await shot(page, 'wp7-follow-up');
  await page.context().close();
});
