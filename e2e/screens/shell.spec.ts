import { expect, test } from '@playwright/test';
import { blockWrites } from '../support/guard';
import { activePanel, activeTab, openMenu, openRailGroup } from '../support/shell';
import { forceEnglish } from '../support/session';

// SH-01 … SH-08: admin shell — tabs, context menu, sidebar, language, routes, persistence.

const FEE = ['System Operation Management', 'NPL Platform Management', 'Fee Management'];
const FORM = ['System Operation Management', 'NPL Platform Management', 'Form Management'];
const USERS = ['System Operation Management', 'Admin Management', 'User Management'];

test.beforeEach(async ({ page }) => {
  await forceEnglish(page);
  await blockWrites(page);
  await page.goto('/members');
  await expect(page.locator('.icon-rail')).toBeVisible();
});

test('SH-01 tabs keep their state when switching', async ({ page }) => {
  await openMenu(page, FEE);
  const keyword = activePanel(page).getByRole('textbox').last();
  await keyword.fill('e2e-keep-me');
  await openMenu(page, FORM);
  await expect(activeTab(page)).toContainText('Form Management');

  await page.locator('.tab-item', { hasText: 'Fee Management' }).click();
  await expect(activeTab(page)).toContainText('Fee Management');
  await expect(activePanel(page).getByRole('textbox').last()).toHaveValue('e2e-keep-me');
});

test('SH-02 reopening a menu activates the existing tab', async ({ page }) => {
  await openMenu(page, FEE);
  await openMenu(page, FORM);
  const before = await page.locator('.tab-item').count();
  await openMenu(page, FEE);
  await expect(page.locator('.tab-item')).toHaveCount(before);
  await expect(activeTab(page)).toContainText('Fee Management');
});

test('SH-03 a tab closes with its × button', async ({ page }) => {
  await openMenu(page, FEE);
  const tab = page.locator('.tab-item', { hasText: 'Fee Management' });
  await tab.locator('.tab-close').click();
  await expect(tab).toHaveCount(0);
});

test('SH-04 context menu closes the other tabs', async ({ page }) => {
  await openMenu(page, FEE);
  await openMenu(page, FORM);
  await openMenu(page, USERS);
  await page.locator('.tab-item', { hasText: 'Form Management' }).click({ button: 'right' });
  await page.getByText('Close Other Tabs', { exact: true }).click();
  await expect(page.locator('.tab-item', { hasText: 'Fee Management' })).toHaveCount(0);
  await expect(page.locator('.tab-item', { hasText: 'User Management' })).toHaveCount(0);
  await expect(page.locator('.tab-item', { hasText: 'Form Management' })).toHaveCount(1);
});

test('SH-05 the sidebar toggle hides and shows the flyout', async ({ page }) => {
  await openRailGroup(page, 'System Operation Management');
  const flyout = page.locator('.flyout-panel');
  await expect(flyout).toHaveClass(/visible/);
  await page.locator('.sidebar-toggle-btn').click();
  await expect(flyout).not.toHaveClass(/visible/);
  await page.locator('.sidebar-toggle-btn').click();
  await expect(flyout).toHaveClass(/visible/);
});

test('SH-06 switching to Vietnamese relabels the menus', async ({ page }) => {
  await page.getByRole('banner').getByText('Eng', { exact: true }).click();
  await page.getByText('Tiếng Việt', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await openRailGroup(page, 'Quản lý vận hành hệ thống');
});

test('SH-07 a mapped URL opens its screen and keeps the URL', async ({ page }) => {
  await page.goto('/system-operation/npl-platform/fee');
  await expect(activeTab(page)).toContainText('Fee Management');
  await expect(activePanel(page).locator('.ant-table')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect(page, 'URL must stay on the screen route').toHaveURL(/\/system-operation\/npl-platform\/fee$/);
});

test('SH-08 reloading keeps the active screen', async ({ page }) => {
  await openMenu(page, FEE);
  await expect(activeTab(page)).toContainText('Fee Management');
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(activeTab(page)).toContainText('Fee Management');
});
