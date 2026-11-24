import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** Visible tab panel (inactive tabs stay mounted but hidden). */
export function activePanel(page: Page): Locator {
  return page.locator('.tab-content-panel').filter({ visible: true });
}

/** Opens the rail group whose flyout title equals `group`. */
export async function openRailGroup(page: Page, group: string): Promise<void> {
  const title = page.locator('.flyout-panel.visible .lnb-title-text');
  if ((await title.count()) && (await title.innerText()).trim() === group) return;

  const items = page.locator('.icon-rail .rail-item');
  const count = await items.count();
  for (let i = 0; i < count; i += 1) {
    await items.nth(i).click();
    await page.waitForTimeout(150);
    if ((await title.count()) && (await title.innerText()).trim() === group) return;
  }
  throw new Error(`Rail group not found: ${group}`);
}

/** Clicks the rail icon of a top-level menu without submenus (e.g. Admin Home), which opens its tab directly. */
async function openRailLeaf(page: Page, label: string): Promise<void> {
  const items = page.locator('.icon-rail .rail-item');
  const count = await items.count();
  for (let i = 0; i < count; i += 1) {
    await items.nth(i).click();
    await page.waitForTimeout(150);
    if (((await activeTab(page).innerText().catch(() => '')) ?? '').includes(label)) return;
  }
  throw new Error(`Rail menu not found: ${label}`);
}

/** Expands the flyout folders of `path` and clicks the leaf — the same clicks a user makes. */
export async function openMenu(page: Page, path: string[]): Promise<void> {
  const [group, ...rest] = path;
  if (rest.length === 0) {
    await openRailLeaf(page, group);
    return;
  }
  await openRailGroup(page, group);

  let scope = page.locator('.flyout-panel.visible .lnb-menu-list');
  for (const folder of rest.slice(0, -1)) {
    const item = scope
      .locator(':scope > div > .lnb-folder-item')
      .filter({ has: page.locator('.lnb-folder-label').getByText(folder, { exact: true }) });
    await expect(item, `folder "${folder}"`).toHaveCount(1);
    if (!(await item.getAttribute('class'))?.includes('expanded')) await item.click();
    scope = item.locator('xpath=..').locator(':scope > .lnb-children');
    await expect(scope).toBeVisible();
  }

  const leafLabel = rest[rest.length - 1];
  const leaf = scope
    .locator(':scope > .lnb-file-item')
    .filter({ has: page.locator('.lnb-file-label').getByText(leafLabel, { exact: true }) });
  await expect(leaf, `menu "${leafLabel}"`).toHaveCount(1);
  await leaf.click();
}

/** Active tab in the tab bar. */
export function activeTab(page: Page): Locator {
  return page.locator('.tab-item.active');
}

export interface PageProblems {
  pageErrors: string[];
  consoleErrors: string[];
  failedApi: string[];
  /** Forget everything collected so far (e.g. after login / navigation noise). */
  reset: () => void;
}

/** Collects uncaught errors, console errors and failed `/api` calls while a test runs. */
export function watchProblems(page: Page): PageProblems {
  const problems: PageProblems = {
    pageErrors: [],
    consoleErrors: [],
    failedApi: [],
    reset() {
      this.pageErrors.length = 0;
      this.consoleErrors.length = 0;
      this.failedApi.length = 0;
    },
  };
  page.on('pageerror', (e) => problems.pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // A failed request is already reported through `failedApi`.
    if (text.startsWith('Failed to load resource')) return;
    problems.consoleErrors.push(text.slice(0, 300));
  });
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith('/api/') && r.status() >= 400) {
      problems.failedApi.push(`${r.request().method()} ${url.pathname}${url.search} → ${r.status()}`);
    }
  });
  return problems;
}

/** Visible antd modal (popup) on top. */
export function topModal(page: Page): Locator {
  return page.locator('.ant-modal-wrap').filter({ visible: true }).last();
}

/** Closes the top popup with its Cancel / Close button, or the × icon. */
export async function closeTopModal(page: Page): Promise<void> {
  const modal = topModal(page);
  const button = modal.getByRole('button', { name: /^(Cancel|Close)$/ }).last();
  if (await button.count()) await button.click();
  else await modal.locator('.ant-modal-close').click();
  // A "discard changes?" confirmation may follow — confirm it.
  const confirm = page.locator('.ant-modal-confirm').filter({ visible: true });
  if (await confirm.count()) await confirm.getByRole('button').last().click();
}
