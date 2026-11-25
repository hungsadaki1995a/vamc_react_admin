import {
  gnbBookOpenText,
  gnbBuildingOffice,
  gnbChartPieSlice,
  gnbGavel,
  gnbHandshake,
  gnbNetwork,
  gnbPenNib,
  gnbUser,
} from '@/assets/images';
import type { MenuItem, MenuTreeItem } from '@/types/menu';
import { resolveMenuComponent } from '@/config/menu-component-fallback';

export const MENU_ICON_BY_CODE: Record<string, string> = {
  A03000000: gnbUser,
  A04000000: gnbBuildingOffice,
  A05000000: gnbHandshake,
  A06000000: gnbGavel,
  A07000000: gnbBookOpenText,
  A08000000: gnbChartPieSlice,
  A09000000: gnbNetwork,
  A10000000: gnbPenNib,
};

/** False for menus set to Show in Menu = No: kept for routing and permissions, not drawn in the rail/LNB. */
export const isMenuShown = (item: MenuTreeItem) => item.menuExpsrYn !== 'N';

/** Returns the top-level (first list) items from login menuTrees that are shown in the menu. */
export function getTopLevelMenuItems(menuTrees: MenuTreeItem[]): MenuTreeItem[] {
  if (!Array.isArray(menuTrees)) return [];
  return menuTrees.filter(isMenuShown).sort((a, b) => (a.menuSeq ?? 0) - (b.menuSeq ?? 0));
}

/** Returns the hardcoded GNB icon asset for a top-level menuCd. */
export function getMenuIconByCode(menuCd?: string): string | undefined {
  if (!menuCd) return undefined;
  return MENU_ICON_BY_CODE[menuCd];
}

/** Loops through menuTrees to find the menu node matching menuCd. */
export function findMenuTreeByCode(
  menuTrees: MenuTreeItem[],
  menuCd: string,
): MenuTreeItem | null {
  for (const item of menuTrees) {
    if (item.menuCd === menuCd) return item;
    if (item.children?.length) {
      const found = findMenuTreeByCode(item.children, menuCd);
      if (found) return found;
    }
  }
  return null;
}

/** Converts login menuTrees into MenuItem[] for tabs, breadcrumbs, and permissions. */
export function mapMenuTreesToMenuItems(menuTrees: MenuTreeItem[]): MenuItem[] {
  return menuTrees.map((item) => ({
    key: item.menuCd ?? '',
    label: item.menuLblVal?.trim() || item.menuNmDisplay?.trim() || '',
    componentPath: resolveMenuComponent(item.menuCd, item.menuUrlAddr),
    sceId: resolveMenuComponent(item.menuCd, item.menuUrlAddr),
    labelKey: item.lblCd ?? undefined,
    permType: item.menuAuthrt ?? undefined,
    hidden: !isMenuShown(item) || undefined,
    children: item.children?.length ? mapMenuTreesToMenuItems(item.children) : undefined,
  }));
}
