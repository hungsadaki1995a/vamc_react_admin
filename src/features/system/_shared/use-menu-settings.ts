import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createMenuSetting,
  deleteMenuSetting,
  getMenuSettings,
  updateMenuSetting,
} from '@/api/system/menu-setting-api';
import type { MenuSetting, MenuSettingSearch, SaveMenuSettingRequest } from '@/api/system/menu-setting-api';
import { MENU_PERMISSION_KEYS } from './use-menu-permissions';

// Data hooks of Menu Settings (VPA003901 / VPA004401).

const MENU_SETTING_KEYS = {
  all: ['system', 'menu-settings'] as const,
  list: (search: MenuSettingSearch) => ['system', 'menu-settings', 'list', search] as const,
};

// The permission matrix reads the same menu table, so it is refreshed as well.
const AFTER_WRITE = [MENU_SETTING_KEYS.all, MENU_PERMISSION_KEYS.all];

/** Flat menu tree of one menu kind, filtered by `search`. */
export function useMenuSettings(search: MenuSettingSearch) {
  return useApiQuery<MenuSetting[]>(MENU_SETTING_KEYS.list(search), () => getMenuSettings(search));
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

/** Deletes a menu and its sub-menus. */
export function useDeleteMenuSetting() {
  return useApiAction(deleteMenuSetting, { invalidate: AFTER_WRITE });
}
