import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

/** MENU_ROLE_MPNG.MENU_AUTHRT 도메인 */
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
 * - permType 'AL': 전체 (canRead=true, canWrite=true)
 * - permType 'WT': 쓰기 — 쓰기는 읽기를 포함 (canRead=true, canWrite=true)
 * - permType 'RD': 읽기만 (canRead=true, canWrite=false)
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
  const permType = serverMenu?.permType ?? (staticMenu ? AUTHRT_ALL : '');

  return {
    permType,
    canRead: READABLE.includes(permType),
    canWrite: WRITABLE.includes(permType),
  };
}
