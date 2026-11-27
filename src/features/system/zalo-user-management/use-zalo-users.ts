import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { useMenuStore } from '@/stores/menu-store';
import { useTabStore } from '@/stores/tab-store';
import { findMenuByKey } from '@/utils/menu-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  downloadZaloUsersExcel,
  getZaloStatus,
  getZaloTemplates,
  getZaloUser,
  getZaloUserHistory,
  getZaloUserMessages,
  getZaloUsers,
  getZaloUserSummary,
  linkZaloUser,
  sendZaloInvitation,
  sendZaloUserTestMessage,
  simulateZaloFollow,
  unlinkZaloUser,
} from '@/api/system/zalo-api';
import type {
  LinkZaloUserRequest,
  SimulateZaloFollowRequest,
  ZaloChangeHistory,
  ZaloInvitationRequest,
  ZaloStatus,
  ZaloTemplate,
  ZaloUser,
  ZaloUserMessage,
  ZaloUserSearch,
  ZaloUserSummary,
} from '@/api/system/zalo-api';

// Data hooks of Zalo Users (menu A09050300).

/** Menu of Notification Send History, opened from the Messages tab. */
const SEND_HISTORY_MENU = 'A09050200';

const ZALO_USER_KEYS = {
  all: ['system', 'zalo-users'] as const,
  list: (search: ZaloUserSearch, query: PageQuery) => ['system', 'zalo-users', 'list', search, query] as const,
  summary: ['system', 'zalo-users', 'summary'] as const,
  detail: (zaloUserId: string | null) => ['system', 'zalo-users', 'detail', zaloUserId] as const,
  history: (zaloUserId: string | null) => ['system', 'zalo-users', 'history', zaloUserId] as const,
  messages: (zaloUserId: string | null) => ['system', 'zalo-users', 'messages', zaloUserId] as const,
  status: ['system', 'zalo-status'] as const,
  activeTemplates: ['system', 'zalo-templates', 'active'] as const,
};

export function useZaloUsers(search: ZaloUserSearch, query: PageQuery) {
  return useApiQuery<PageResponse<ZaloUser>>(ZALO_USER_KEYS.list(search, query), () => getZaloUsers(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** Header cells: linked / pending / following and today's invitations of the signed-in employee. */
export function useZaloUserSummary() {
  return useApiQuery<ZaloUserSummary>(ZALO_USER_KEYS.summary, getZaloUserSummary);
}

/** Selected user of the detail panel; skipped while none is selected. */
export function useZaloUser(zaloUserId: string | null) {
  return useApiQuery<ZaloUser>(ZALO_USER_KEYS.detail(zaloUserId), () => getZaloUser(zaloUserId as string), {
    enabled: zaloUserId !== null,
  });
}

/** Link History tab; loaded only while the tab is open. */
export function useZaloUserHistory(zaloUserId: string | null, enabled: boolean) {
  return useApiQuery<ZaloChangeHistory[]>(ZALO_USER_KEYS.history(zaloUserId), () => getZaloUserHistory(zaloUserId as string), {
    enabled: enabled && zaloUserId !== null,
  });
}

/** Always loaded for the selected user: the tab label shows the count. */
export function useZaloUserMessages(zaloUserId: string | null) {
  return useApiQuery<ZaloUserMessage[]>(ZALO_USER_KEYS.messages(zaloUserId), () => getZaloUserMessages(zaloUserId as string), {
    enabled: zaloUserId !== null,
  });
}

/** Demo flag and phone index readiness; decides whether [Simulate] is shown. */
export function useZaloStatus() {
  return useApiQuery<ZaloStatus>(ZALO_USER_KEYS.status, getZaloStatus, { staleTime: 60 * 1000 });
}

/** Templates in use for [Send Test Message] (needs read access to Zalo Templates). */
export function useActiveZaloTemplates() {
  return useApiQuery<PageResponse<ZaloTemplate>>(ZALO_USER_KEYS.activeTemplates, () =>
    getZaloTemplates({ useYn: 'Y' }, { page: 1, size: 100 }),
  );
}

export function useDownloadZaloUsersExcel() {
  return useApiDownload(downloadZaloUsersExcel);
}

export function useLinkZaloUser() {
  return useApiAction(
    ({ zaloUserId, request }: { zaloUserId: string; request: LinkZaloUserRequest }) => linkZaloUser(zaloUserId, request),
    { invalidate: [ZALO_USER_KEYS.all] },
  );
}

export function useUnlinkZaloUser() {
  return useApiAction((zaloUserId: string) => unlinkZaloUser(zaloUserId), { invalidate: [ZALO_USER_KEYS.all] });
}

/** Refreshes the summary (today's invitations); the Zalo user itself appears only after following the OA. */
export function useSendZaloInvitation() {
  return useApiAction((request: ZaloInvitationRequest) => sendZaloInvitation(request), {
    invalidate: [ZALO_USER_KEYS.summary],
  });
}

/** Refreshes the Messages tab of the user. */
export function useSendZaloUserTestMessage() {
  return useApiAction(
    ({ zaloUserId, tplCd }: { zaloUserId: string; tplCd: string }) => sendZaloUserTestMessage(zaloUserId, tplCd),
    { invalidate: [ZALO_USER_KEYS.all] },
  );
}

export function useSimulateZaloFollow() {
  return useApiAction((request: SimulateZaloFollowRequest) => simulateZaloFollow(request), {
    invalidate: [ZALO_USER_KEYS.all],
  });
}

/** Opens Notification Send History in a tab; null when the employee has no access to it. */
export function useOpenZaloSendHistory(): (() => void) | null {
  const serverMenus = useMenuStore((s) => s.serverMenus);
  const openTab = useTabStore((s) => s.openTab);
  const menu = findMenuByKey(serverMenus, SEND_HISTORY_MENU);
  return menu ? () => openTab(menu) : null;
}
