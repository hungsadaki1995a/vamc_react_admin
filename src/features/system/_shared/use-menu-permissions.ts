import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { getMenuPermissionMatrix, saveMenuPermissionMatrix } from '@/api/system/menu-permission-api';
import type { MenuPermissionMatrix } from '@/api/system/menu-permission-api';
import type { MenuSeCd } from '@/api/system/menu-setting-api';

// Data hooks of the Menu Permission matrix (VPA09010501 / VPA09020401).

export const MENU_PERMISSION_KEYS = {
  all: ['system', 'menu-permissions'] as const,
  detail: (menuSeCd: MenuSeCd) => ['system', 'menu-permissions', 'detail', menuSeCd] as const,
};

/** Menus × roles permission matrix of one menu tree (W = platform, A = admin). */
export function useMenuPermissionMatrix(menuSeCd: MenuSeCd) {
  return useApiQuery<MenuPermissionMatrix>(
    MENU_PERMISSION_KEYS.detail(menuSeCd),
    () => getMenuPermissionMatrix(menuSeCd),
    { retry: false },
  );
}

export function useSaveMenuPermissionMatrix() {
  return useApiAction(saveMenuPermissionMatrix, { invalidate: [MENU_PERMISSION_KEYS.all] });
}
