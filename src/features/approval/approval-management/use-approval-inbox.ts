import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { AUTHRT_ALL, AUTHRT_WRITE } from '@/hooks/use-menu-permission';
import { useMenuStore } from '@/stores/menu-store';
import { useTabStore } from '@/stores/tab-store';
import { findMenuByKey } from '@/utils/menu-utils';
import { getApprovalInbox, getApprovalInboxSummary } from '@/api/common/approval-api';
import type { ApprovalInboxItem, ApprovalInboxSearch, ApprovalInboxSummary } from '@/api/common/approval-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import { APPROVAL_KEYS } from '../_shared/use-approval';
import { APPROVAL_TARGET_PARAM } from '../_shared/approval-navigation';

// Data hooks of Approval Management (VPA10000001) — the screen never calls the API itself.

const INBOX_KEYS = {
  list: (search: ApprovalInboxSearch, query: PageQuery) => [...APPROVAL_KEYS.inbox, 'list', search, query] as const,
  summary: [...APPROVAL_KEYS.inbox, 'summary'] as const,
};

/** Sessions waiting for the signed-in employee. */
export function useApprovalInbox(search: ApprovalInboxSearch, query: PageQuery) {
  return useApiQuery<PageResponse<ApprovalInboxItem>>(INBOX_KEYS.list(search, query), () => getApprovalInbox(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** Waiting counts per process kind (chips, menu badge). */
export function useApprovalInboxSummary() {
  return useApiQuery<ApprovalInboxSummary>(INBOX_KEYS.summary, getApprovalInboxSummary);
}

/**
 * The decision is checked against the menu that owns the target (e.g. A05010200), not against this screen, whose
 * menu is usually read-only: returns whether the signed-in employee may write on a menu.
 */
export function useMenuWriteCheck(): (menuCd?: string) => boolean {
  const serverMenus = useMenuStore((s) => s.serverMenus);
  return (menuCd) => {
    if (!menuCd) return false;
    const permType = findMenuByKey(serverMenus, menuCd)?.permType;
    return permType === AUTHRT_WRITE || permType === AUTHRT_ALL;
  };
}

/**
 * Opens the menu that owns an inbox item, passing the item as tab parameter `approvalTarget` so the screen can open
 * the target popup. Returns false when the employee has no access to that menu.
 */
export function useOpenApprovalTarget(): (item: ApprovalInboxItem) => boolean {
  const serverMenus = useMenuStore((s) => s.serverMenus);
  const openTab = useTabStore((s) => s.openTab);
  return (item) => {
    const menu = item.menuCd ? findMenuByKey(serverMenus, item.menuCd) : null;
    if (!menu) return false;
    openTab(menu, { [APPROVAL_TARGET_PARAM]: item });
    return true;
  };
}
