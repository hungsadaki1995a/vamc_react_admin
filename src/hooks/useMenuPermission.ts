import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { findMenuByKey } from '@/utils/menuUtils';

export interface MenuPermission {
  permType: string; // 'M' | 'S' | ''
  canRead: boolean; // S or M
  canWrite: boolean; // M only
}

/**
 * Returns the permission of the currently active menu tab.
 * - permType 'M': 읽기 + 수정 (canRead=true, canWrite=true)
 * - permType 'S': 읽기만  (canRead=true, canWrite=false)
 * - permType ''  : 권한없음 (canRead=false, canWrite=false)
 *
 * Usage:
 *   const { canWrite } = useMenuPermission();
 *   <Button disabled={!canWrite}>신규</Button>
 */
export function useMenuPermission(): MenuPermission {
  const activeTabKey = useTabStore((s) => s.activeTabKey);
  const serverMenus = useMenuStore((s) => s.serverMenus);

  const menu = activeTabKey ? findMenuByKey(serverMenus, activeTabKey) : null;
  const permType = menu?.permType ?? '';

  return {
    permType,
    canRead: permType === 'S' || permType === 'M',
    canWrite: permType === 'M',
  };
}
