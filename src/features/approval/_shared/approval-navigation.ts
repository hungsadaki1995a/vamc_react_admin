import type { ApprovalInboxItem } from '@/api/common/approval-api';

// Hand-off from Approval Management (VPA10000001) to the screen that owns an approval target: the inbox opens the
// target menu with the inbox row as tab parameter; the screen reads it with `readApprovalTarget(tab.params)` and
// opens its popup (application → processing popup, contract / report → contract popup, termination → its tab,
// member sign-up → MemberApprovalModal). Wired by the screens in later packages.

export const APPROVAL_TARGET_PARAM = 'approvalTarget';

export function readApprovalTarget(params?: Record<string, unknown>): ApprovalInboxItem | null {
  const value = params?.[APPROVAL_TARGET_PARAM];
  if (value && typeof value === 'object' && 'atrzHstryId' in value) return value as ApprovalInboxItem;
  return null;
}
