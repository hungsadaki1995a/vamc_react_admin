import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createMenuSetting,
  getMenuSettings,
  moveMenuSetting,
  updateMenuSetting,
} from '@/api/system/menu-setting-api';
import type { MenuSeCd, MenuSetting, MoveMenuSettingRequest, SaveMenuSettingRequest } from '@/api/system/menu-setting-api';
import { MENU_PERMISSION_KEYS } from './use-menu-permissions';

// Data hooks of Menu Settings (VPA09010101) / Admin Menu Settings (VPA09020101).

const MENU_SETTING_KEYS = {
  all: ['system', 'menu-settings'] as const,
  list: (menuSeCd: MenuSeCd) => ['system', 'menu-settings', 'list', menuSeCd] as const,
};

// The permission matrix reads the same menu table, so it is refreshed as well.
const AFTER_WRITE = [MENU_SETTING_KEYS.all, MENU_PERMISSION_KEYS.all];

/** Whole flat menu list of one kind (root row and Inactive menus included). */
export function useMenuSettings(menuSeCd: MenuSeCd) {
  return useApiQuery<MenuSetting[]>(MENU_SETTING_KEYS.list(menuSeCd), () => getMenuSettings({ menuSeCd }));
}

export interface SaveMenuSettingVariables {
  isEdit: boolean;
  request: SaveMenuSettingRequest;
}

/** Registers or edits a menu. */
export function useSaveMenuSetting() {
  return useApiAction(
    ({ isEdit, request }: SaveMenuSettingVariables) =>
      isEdit ? updateMenuSetting(request) : createMenuSetting(request),
    { invalidate: AFTER_WRITE },
  );
}

export interface MoveMenuSettingVariables {
  menuCd: string;
  request: MoveMenuSettingRequest;
}

/** Drag & drop move (new parent + full sibling order), saved on drop. */
export function useMoveMenuSetting() {
  return useApiAction(({ menuCd, request }: MoveMenuSettingVariables) => moveMenuSetting(menuCd, request), {
    invalidate: AFTER_WRITE,
  });
}
