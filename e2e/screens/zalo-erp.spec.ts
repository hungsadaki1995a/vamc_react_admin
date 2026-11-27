import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { activePanel, openMenu, topModal, watchProblems } from '../support/shell';
import { forceEnglish } from '../support/session';
import { zaloApi } from '../support/zalo-setup';
import type { ZaloStatusBody } from '../support/zalo-setup';

// Zalo ERP screens (menus A09050500 Zalo Sending Limits, A09050600 Zalo OA Connection) — WRITES data, so it runs only
// with E2E_ZALO_DEMO=1 against a local backend in demo mode (ZALO_ENABLED unset): rule list → Rule Details tabs →
// edit Warn At of a rule → page tabs → stop the Zalo channel (reason required) → resume → OA connection in demo mode.
// Clean-up through the API: the rule gets its saved values back and the channel is resumed. Change history and audit
// rows of the run stay (there is no delete API for them).

const LIMITS = ['System Operation Management', 'Notification Management', 'Zalo Sending Limits'];
const CONNECTION = ['System Operation Management', 'Notification Management', 'Zalo OA Connection'];
/** Seed rule edited by the test (system-wide daily message count). */
const RULE_CD = process.env.E2E_ZALO_RULE ?? 'LMT-001';
const RULE_PATH = `/api/v1/zalo/limits/rules/${RULE_CD}`;

interface RuleBody {
  lmtPrdCd: string;
  lmtMsrCd: string;
  lmtVal: number;
  warnRt: number;
  excdActCd: string;
  efctBgngDt: string;
  efctEndDt?: string | null;
  lmtExpln?: string | null;
  useYn: string;
}

let savedRule: RuleBody | undefined;

/** Value cell of a SysField, found by its label text. */
function field(scope: Locator, label: string): Locator {
  return scope.locator(`xpath=.//div[./span[normalize-space(text()[1])="${label}"]]/following-sibling::div[1]`);
}

/** Header cell value ("Zalo Channel | Sending [Stop]"), found by its label. */
function statCell(scope: Locator, label: string): Locator {
  return scope.locator(`xpath=.//span[normalize-space(text())="${label}"]/following-sibling::span[1]`);
}

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

/** Puts the rule back as it was before the run. */
async function restoreRule(): Promise<void> {
  if (!savedRule) return;
  const { useYn, ...body } = savedRule;
  await zaloApi('PUT', RULE_PATH, { ...body, efctEndDt: body.efctEndDt ?? null, lmtExpln: body.lmtExpln ?? '' });
  await zaloApi('PATCH', `${RULE_PATH}/use`, { useYn });
}

test.describe('Zalo ERP screens', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(process.env.E2E_ZALO_DEMO !== '1', 'Set E2E_ZALO_DEMO=1 to run the Zalo ERP screens (writes data).');

  test.beforeAll(async () => {
    const { status, data } = await zaloApi<ZaloStatusBody>('GET', '/api/v1/zalo/status');
    test.skip(status !== 200 || !data?.mockMode, 'Backend is not in Zalo demo mode.');
    const rule = await zaloApi<RuleBody>('GET', RULE_PATH);
    test.skip(rule.status !== 200 || !rule.data, `Seed rule ${RULE_CD} not found.`);
    savedRule = rule.data;
    // A stop left by an earlier run would hide the [Stop] button.
    await zaloApi('POST', '/api/v1/zalo/limits/channel/resume');
  });

  test.afterAll(async () => {
    await restoreRule();
    await zaloApi('POST', '/api/v1/zalo/limits/channel/resume');
  });

  test('limit rules → rule edit → page tabs → channel stop / resume', async ({ page }, testInfo) => {
    await forceEnglish(page);
    const problems = watchProblems(page);
    await page.goto('/members');
    await expect(page.locator('.icon-rail')).toBeVisible();
    await page.waitForLoadState('networkidle');
    problems.reset();

    await test.step('open the rule list and the Rule Details tabs', async () => {
      await openMenu(page, LIMITS);
      const panel = activePanel(page);
      await expect(statCell(panel, 'Zalo Channel')).toContainText('Sending');
      const rows = panel.locator('.ant-table-tbody tr.ant-table-row');
      await expect(rows.filter({ hasText: 'LMT-003' })).toHaveCount(1);
      await rows.filter({ hasText: 'LMT-006' }).click();
      await expect(panel).toContainText('Rule Details|LMT-006');
      await panel.getByRole('tab', { name: /^Exceptions \(\d+\)$/ }).click();
      await expect(panel.getByRole('button', { name: 'Add' })).toBeVisible();
      await panel.getByRole('tab', { name: 'Change History' }).click();
      await expect(panel).toContainText('Every change is also written to the audit log.');
      await panel.getByRole('tab', { name: 'General' }).click();
    });

    await test.step(`edit Warn At of ${RULE_CD}`, async () => {
      const panel = activePanel(page);
      await panel.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: RULE_CD }).click();
      await expect(panel).toContainText(`Rule Details|${RULE_CD}`);
      const warnAt = panel.getByRole('spinbutton', { name: 'Warn At' });
      const next = savedRule && savedRule.warnRt > 50 ? savedRule.warnRt - 5 : 75;
      await warnAt.fill(String(next));
      await warnAt.blur();
      await expect(panel).toContainText(`A warning is raised at`);
      await panel.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(toast(page)).toContainText('Updated');
      await panel.getByRole('tab', { name: 'Change History' }).click();
      await expect(panel.locator('.ant-table-tbody').last()).toContainText('Warn At');
      await panel.getByRole('tab', { name: 'General' }).click();
      await shot(page, 'zalo-limits');
    });

    await test.step('Unit Prices and Cost Summary pages', async () => {
      const panel = activePanel(page);
      await panel.getByRole('tab', { name: 'Unit Prices' }).click();
      await expect(panel.getByRole('spinbutton', { name: 'Unit price OA message' })).toBeDisabled();
      await expect(panel.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
      await expect(panel).toContainText('OA messages are free');
      await panel.getByRole('tab', { name: 'Cost Summary' }).click();
      await expect(panel).toContainText('Projected Month-End');
      await expect(panel).toContainText('Top Senders (ZNS)');
      // Loaded: the seed budget rule names the budget line.
      await expect(panel).toContainText(/Monthly Budget \(LMT-\d+\)/);
      await expect(panel.locator('.ant-spin-blur')).toHaveCount(0);
      await shot(page, 'zalo-limits-cost');
      await panel.getByRole('tab', { name: 'Limit Rules' }).click();
    });

    await test.step('stop the Zalo channel: the reason is required', async () => {
      const panel = activePanel(page);
      await statCell(panel, 'Zalo Channel').getByRole('button', { name: 'Stop' }).click();
      const modal = topModal(page);
      await expect(modal).toContainText('Stop Zalo Sending');
      await modal.getByRole('button', { name: 'Stop Sending' }).click();
      await expect(modal).toContainText('Select a reason.');
      await modal.getByText('Incident at Zalo', { exact: true }).click();
      await expect(modal).toContainText('except verification codes');
      await shot(page, 'zalo-limits-stop');
      await modal.getByRole('button', { name: 'Stop Sending' }).click();
      await expect(toast(page)).toContainText('Zalo sending stopped');
      await expect(modal).toBeHidden();
      await expect(statCell(panel, 'Zalo Channel')).toContainText('Stopped');
    });

    await test.step('resume from the channel status popup', async () => {
      const panel = activePanel(page);
      await statCell(panel, 'Zalo Channel').getByRole('button', { name: 'Resume' }).click();
      const modal = topModal(page);
      await expect(modal).toContainText('Zalo Channel Status');
      await expect(field(modal, 'Reason')).toContainText('Incident at Zalo');
      await expect(field(modal, 'Held Since Stop')).toContainText('not sent again on resume');
      await shot(page, 'zalo-limits-channel');
      await modal.getByRole('button', { name: 'Resume Sending' }).click();
      await expect(toast(page)).toContainText('Zalo sending resumed');
      await expect(modal).toBeHidden();
      await expect(statCell(panel, 'Zalo Channel')).toContainText('Sending');
    });

    expect.soft(problems.pageErrors, 'uncaught page errors').toEqual([]);
    expect.soft(problems.failedApi, 'failed /api calls').toEqual([]);
    testInfo.annotations.push({ type: 'record', description: JSON.stringify({ rule: RULE_CD }) });
  });

  test('OA connection in demo mode', async ({ page }) => {
    await forceEnglish(page);
    const problems = watchProblems(page);
    await page.goto('/members');
    await expect(page.locator('.icon-rail')).toBeVisible();
    await page.waitForLoadState('networkidle');
    problems.reset();

    await openMenu(page, CONNECTION);
    const panel = activePanel(page);
    await expect(statCell(panel, 'Mode')).toContainText('Demo (simulated)');
    await expect(statCell(panel, 'Connection')).toContainText('Not connected');
    await expect(field(panel, 'App Secret / OA Secret')).toContainText('never shown or stored here');
    await expect(field(panel, 'Last Check')).toContainText('Not checked in this session');
    await panel.getByRole('button', { name: 'Test Connection' }).click();
    await expect(toast(page)).toContainText('Demo mode: no call was made to Zalo');
    await expect(field(panel, 'Last Check')).toContainText('Demo mode, no call made');
    await expect(panel).toContainText('Demo mode: nothing reaches Zalo');
    await shot(page, 'zalo-connection');

    expect.soft(problems.pageErrors, 'uncaught page errors').toEqual([]);
    expect.soft(problems.failedApi, 'failed /api calls').toEqual([]);
  });
});
