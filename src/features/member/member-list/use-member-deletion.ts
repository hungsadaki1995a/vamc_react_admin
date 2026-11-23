import { useApiAction } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import {
  approveMemberRequest,
  getDeletionApprovers,
  getRestorationApprovers,
  rejectMemberRequest,
  requestMemberDeletion,
  requestMemberRestoration,
} from '@/api/member/member-deletion-api';
import type { ApprovalCandidate } from '@/api/member/member-approval-api';

// Data hooks of member deletion and restoration requests (VPA030100P03).

/** A request or decision changes the member row and its detail, which `use-members.ts` caches under these keys. */
const AFTER_CHANGE = [['members'], ['memberDetail'], ['member', 'approval']];

/** Deletion request (2026-11-23); the member stays until the approver approves. */
export function useRequestMemberDeletion() {
  return useApiAction(
    ({ mbrNo, reason, approverEmpNo }: { mbrNo: string; reason: string; approverEmpNo: string }) =>
      requestMemberDeletion(mbrNo, reason, approverEmpNo),
    { invalidate: AFTER_CHANGE },
  );
}

/** Restoration request (C05); the member stays deleted until the approver approves. */
export function useRequestMemberRestoration() {
  return useApiAction(
    ({ mbrNo, approverEmpNo }: { mbrNo: string; approverEmpNo: string }) => requestMemberRestoration(mbrNo, approverEmpNo),
    { invalidate: AFTER_CHANGE },
  );
}

/** The approver's decision on a pending deletion or restoration request (from the member detail popup). */
export function useDecideMemberRequest() {
  return useApiAction(
    ({ atrzHstryId, approve, text }: { atrzHstryId: string; approve: boolean; text: string }) =>
      approve ? approveMemberRequest(atrzHstryId, text || undefined) : rejectMemberRequest(atrzHstryId, text),
    { invalidate: AFTER_CHANGE },
  );
}

/** Approvers of the deletion process; loaded only while the popup is open. */
export function useDeletionApprovers(enabled: boolean) {
  return useApiQuery<ApprovalCandidate[]>(['member', 'deletion', 'approvers'], getDeletionApprovers, {
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Approvers of the restoration process; loaded only while the popup is open. */
export function useRestorationApprovers(enabled: boolean) {
  return useApiQuery<ApprovalCandidate[]>(['member', 'restoration', 'approvers'], getRestorationApprovers, {
    enabled,
    staleTime: 60 * 1000,
  });
}
