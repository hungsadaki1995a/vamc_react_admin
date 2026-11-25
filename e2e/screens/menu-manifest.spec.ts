import { expect, test } from '@playwright/test';
import { SCREENS } from '../support/screens';

// T-01: the screen manifest matches the menu tree the server gives the test account.
// When it fails, update e2e/support/screens.ts (new / removed / renamed menus).

interface MenuNode {
  menuCd: string;
  menuLblVal?: string;
  menuNmDisplay: string;
  children?: MenuNode[];
}

test('T-01 manifest matches the server menu tree', async ({ page }) => {
  await page.goto('/members');
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const res = await page.request.get('/api/common/menus/my', {
    headers: { Authorization: `Bearer ${token}`, 'X-Lang': 'en' },
  });
  expect(res.ok()).toBeTruthy();
  const tree = ((await res.json()) as { data: MenuNode[] }).data;

  const leaves: string[] = [];
  const walk = (nodes: MenuNode[], path: string[]) => {
    for (const node of nodes) {
      const label = (node.menuLblVal || node.menuNmDisplay).trim();
      if (node.children?.length) walk(node.children, [...path, label]);
      else leaves.push(`${node.menuCd} ${[...path, label].join(' > ')}`);
    }
  };
  walk(tree, []);

  const manifest = SCREENS.map((s) => `${s.code} ${s.path.join(' > ')}`);
  expect(leaves.sort()).toEqual(manifest.sort());
});
