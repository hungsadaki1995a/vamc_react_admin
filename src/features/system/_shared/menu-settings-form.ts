import type { MenuSeCd, MenuSetting, YesNo } from '@/api/system/menu-setting-api';
import type { MenuTree } from './menu-tree';

// Form model and code helpers of the Menu Settings detail panel.

export interface MenuForm {
  menuCd: string;
  useYn: YesNo;
  menuNmVn: string;
  menuNmEn: string;
  lblCd: string;
  /** Web Path (W) / Screen ID (A). */
  menuUrlAddr: string;
  /** Admin "Show in Menu" — TODO(schema): no column yet (MENU_EXPSR_YN), never sent. */
  showInMenu: YesNo;
}

export type MenuFormKey = keyof MenuForm;

export const REQUIRED_MENU_FIELDS: MenuFormKey[] = ['menuCd', 'useYn', 'menuNmVn', 'menuNmEn', 'lblCd'];

/** Label key the server uses by convention for a menu. */
export const defaultLabelKey = (menuCd: string) => (menuCd ? `lbl.menu.${menuCd}` : '');

export const menuCodePattern = (menuSeCd: MenuSeCd) => new RegExp(`^${menuSeCd}\\d{8}$`);

export function toMenuForm(menu: MenuSetting): MenuForm {
  return {
    menuCd: menu.menuCd,
    useYn: menu.useYn,
    menuNmVn: menu.menuNmVn ?? '',
    menuNmEn: menu.menuNmEn ?? '',
    lblCd: menu.lblCd ?? '',
    menuUrlAddr: menu.menuUrlAddr ?? '',
    showInMenu: 'Y',
  };
}

export function emptyMenuForm(menuCd: string): MenuForm {
  return {
    menuCd,
    useYn: 'Y',
    menuNmVn: '',
    menuNmEn: '',
    lblCd: defaultLabelKey(menuCd),
    menuUrlAddr: '',
    showInMenu: 'Y',
  };
}

export const sameMenuForm = (a: MenuForm, b: MenuForm) =>
  (Object.keys(a) as MenuFormKey[]).every((key) => a[key] === b[key]);

const SEGMENTS = 4;

/**
 * Next free code under `parentCd` following the 2-digit-per-level scheme (W01 02 03 00).
 * Empty when the scheme has no room (deeper than 4 levels or 99 siblings) — the user then types one.
 */
export function suggestMenuCode(
  menuSeCd: MenuSeCd,
  tree: MenuTree<MenuSetting>,
  parentCd: string,
): string {
  const parentLevel = parentCd === tree.rootCd ? 0 : tree.byCd.get(parentCd)?.level;
  if (parentLevel === undefined || parentLevel >= SEGMENTS) return '';
  const digits = parentCd.slice(1);
  const prefix = `${menuSeCd}${digits.slice(0, parentLevel * 2)}`;
  const used = new Set<string>([...tree.byCd.keys(), tree.rootCd ?? '']);
  let max = 0;
  used.forEach((code) => {
    if (!code.startsWith(prefix)) return;
    const n = Number(code.slice(prefix.length, prefix.length + 2));
    if (Number.isFinite(n)) max = Math.max(max, n);
  });
  const zeros = '0'.repeat((SEGMENTS - parentLevel - 1) * 2);
  for (let n = max + 1; n <= 99; n += 1) {
    const code = `${prefix}${String(n).padStart(2, '0')}${zeros}`;
    if (!used.has(code)) return code;
  }
  return '';
}
