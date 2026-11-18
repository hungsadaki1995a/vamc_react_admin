import { useTabStore } from '@/stores/tab-store';
import { useMenuStore } from '@/stores/menu-store';
import { findMenuByKey } from '@/utils/menu-utils';
import { menuConfig } from '@/config/menu-config';

/** MENU_ROLE_MPNG.MENU_AUTHRT domain */
export const AUTHRT_READ = 'RD';
export const AUTHRT_WRITE = 'WT';
export const AUTHRT_ALL = 'AL';

const READABLE: readonly string[] = [AUTHRT_READ, AUTHRT_WRITE, AUTHRT_ALL];
const WRITABLE: readonly string[] = [AUTHRT_WRITE, AUTHRT_ALL];

export interface MenuPermission {
  permType: string; // 'RD' | 'WT' | 'AL' | ''
  canRead: boolean; // RD, WT, AL
  canWrite: boolean; // WT, AL
}

/**
 * Returns the permission of the currently active menu tab.
 * - permType 'AL': All (canRead=true, canWrite=true)
 * - permType 'WT': Write — write includes read (canRead=true, canWrite=true)
 * - permType 'RD': Read-only (canRead=true, canWrite=false)
 * - permType ''  : No permission (canRead=false, canWrite=false)
 *
 * Usage:
 *   const { canWrite } = useMenuPermission();
 *   <Button disabled={!canWrite}>New</Button>
 */
export function useMenuPermission(): MenuPermission {
  const activeTabKey = useTabStore((s) => s.activeTabKey);
  const serverMenus = useMenuStore((s) => s.serverMenus);

  const serverMenu = activeTabKey ? findMenuByKey(serverMenus, activeTabKey) : null;
  // Static menus (dashboard/dev tools — menuConfig) are not subject to server permissions — fallback to write-allowed
  const staticMenu = !serverMenu && activeTabKey ? findMenuByKey(menuConfig, activeTabKey) : null;
  const permType = serverMenu?.permType ?? (staticMenu ? AUTHRT_ALL : '');

  return {
    permType,
    canRead: READABLE.includes(permType),
    canWrite: WRITABLE.includes(permType),
  };
}
