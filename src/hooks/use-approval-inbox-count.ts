import { useApiQuery } from '@/hooks/use-api-query';
import { getApprovalInboxSummary } from '@/api/common/approval-api';
import type { ApprovalInboxSummary } from '@/api/common/approval-api';
import { useMenuStore } from '@/stores/menu-store';
import { findMenuByKey } from '@/utils/menu-utils';

/** Menu of Approval Management (VPA10000001). */
export const APPROVAL_MENU_CD = 'A10000000';

/** Same key as the inbox summary of Approval Management, so decisions refresh the badge too. */
const SUMMARY_KEY = ['approval', 'inbox', 'summary'] as const;

/**
 * Items waiting for the signed-in employee (GET /approvals/inbox/summary `total`) for the menu badge; 0 while the
 * employee has no Approval Management menu. Refreshed every minute.
 */
export function useApprovalInboxCount(): number {
  const hasMenu = useMenuStore((s) => !!findMenuByKey(s.serverMenus, APPROVAL_MENU_CD));
  const { data } = useApiQuery<ApprovalInboxSummary>(SUMMARY_KEY, getApprovalInboxSummary, {
    enabled: hasMenu,
    refetchInterval: 60 * 1000,
  });
  return hasMenu ? (data?.total ?? 0) : 0;
}
