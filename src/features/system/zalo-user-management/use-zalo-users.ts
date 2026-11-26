import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  getZaloStatus,
  getZaloUserSummary,
  getZaloUsers,
  linkZaloUser,
  rebuildZaloPhoneIndex,
  sendZaloInvitation,
  simulateZaloFollow,
  unlinkZaloUser,
} from '@/api/system/zalo-api';
import type {
  LinkZaloUserRequest,
  SimulateZaloFollowRequest,
  ZaloInvitationRequest,
  ZaloStatus,
  ZaloUser,
  ZaloUserSearch,
  ZaloUserSummary,
} from '@/api/system/zalo-api';

// Data hooks of Zalo Users (menu A09050300).

const ZALO_USER_KEYS = {
  all: ['system', 'zalo-users'] as const,
  list: (search: ZaloUserSearch, query: PageQuery) => ['system', 'zalo-users', 'list', search, query] as const,
  summary: ['system', 'zalo-users', 'summary'] as const,
  status: ['system', 'zalo-status'] as const,
};

export function useZaloUsers(search: ZaloUserSearch, query: PageQuery) {
  return useApiQuery<PageResponse<ZaloUser>>(ZALO_USER_KEYS.list(search, query), () => getZaloUsers(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** Linked / pending / following totals (refetched with the list after every write). */
export function useZaloUserSummary() {
  return useApiQuery<ZaloUserSummary>(ZALO_USER_KEYS.summary, getZaloUserSummary);
}

/** Demo flag and phone index readiness; decides whether [Simulate] is shown. */
export function useZaloStatus() {
  return useApiQuery<ZaloStatus>(ZALO_USER_KEYS.status, getZaloStatus, { staleTime: 60 * 1000 });
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

/** Invitation does not change the user list (the Zalo user appears only after following the OA). */
export function useSendZaloInvitation() {
  return useApiAction((request: ZaloInvitationRequest) => sendZaloInvitation(request));
}

export function useRebuildZaloPhoneIndex() {
  return useApiAction(() => rebuildZaloPhoneIndex(), { invalidate: [ZALO_USER_KEYS.all] });
}

export function useSimulateZaloFollow() {
  return useApiAction((request: SimulateZaloFollowRequest) => simulateZaloFollow(request), {
    invalidate: [ZALO_USER_KEYS.all],
  });
}
