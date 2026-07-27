import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

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

  const serverMenu = activeTabKey ? findMenuByKey(serverMenus, activeTabKey) : null;
  // 정적 메뉴(대시보드/개발도구 — menuConfig)는 서버 권한 대상이 아님 — 쓰기 허용 폴백
  const staticMenu = !serverMenu && activeTabKey ? findMenuByKey(menuConfig, activeTabKey) : null;
  const permType = serverMenu?.permType ?? (staticMenu ? 'M' : '');

  return {
    permType,
    canRead: permType === 'S' || permType === 'M',
    canWrite: permType === 'M',
  };
}
