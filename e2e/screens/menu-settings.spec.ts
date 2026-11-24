import { expect, test } from '@playwright/test';
import { blockWrites } from '../support/guard';
import { activePanel, openMenu } from '../support/shell';
import { forceEnglish } from '../support/session';

// M-01 … M-03: the two tree-based Menu Settings screens (platform menus / admin menus).

const SCREENS = [
  ['System Operation Management', 'NPL Platform Management', 'Menu Settings'],
  ['System Operation Management', 'Admin Management', 'Admin Menu Settings'],
];

for (const path of SCREENS) {
  test.describe(path[path.length - 1], () => {
    test.beforeEach(async ({ page }) => {
      await forceEnglish(page);
      await blockWrites(page);
      await page.goto('/members');
      await openMenu(page, path);
      await page.waitForLoadState('networkidle');
    });

    test('M-01 tree loads with the empty detail panel', async ({ page }) => {
      const panel = activePanel(page);
      await expect(panel.getByRole('tree')).toBeVisible();
      await expect(panel.getByRole('treeitem').first()).toBeVisible();
      await expect(panel.getByText('Select a menu in the tree, or add a new one.')).toBeVisible();
    });

    test('M-02 selecting a node fills the detail form', async ({ page }) => {
      const panel = activePanel(page);
      const node = panel.getByRole('treeitem').first();
      await node.click();
      await expect(node).toHaveAttribute('aria-selected', 'true');
      await expect(panel.getByText('Menu Name (EN)')).toBeVisible();
      await expect(panel.getByRole('button', { name: /(^|\s)Save$/ })).toBeVisible();
    });

    test('M-03 expand / collapse all toggles the tree', async ({ page }) => {
      const panel = activePanel(page);
      const toggle = panel.getByRole('button', { name: /^(Collapse All|Expand All)$/ });
      await expect(panel.getByRole('treeitem').first()).toBeVisible();
      const before = await panel.getByRole('treeitem').count();
      await toggle.click();
      await expect.poll(() => panel.getByRole('treeitem').count()).not.toBe(before);
      await toggle.click();
      await expect.poll(() => panel.getByRole('treeitem').count()).toBe(before);
    });
  });
}
