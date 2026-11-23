import { useApiAction } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import {
  deleteExpiredMember,
  deleteMember,
  approveMemberRestoration,
  getRestorationApprovers,
  rejectMemberRestoration,
  requestMemberRestoration,
} from '@/api/member/member-deletion-api';
import type { ApprovalCandidate } from '@/api/member/member-approval-api';

// Data hooks of member deletion (VPA030100P03, list flag of unrenewed memberships).

/** A deletion changes the member row and its detail, which `use-members.ts` caches under these keys. */
const AFTER_DELETE = [['members'], ['memberDetail'], ['member', 'approval']];

export function useDeleteMember() {
  return useApiAction(({ mbrNo, reason }: { mbrNo: string; reason: string }) => deleteMember(mbrNo, reason), {
    invalidate: AFTER_DELETE,
  });
}

/** Restoration request (C05); the member stays deleted until the approver approves. */
export function useRequestMemberRestoration() {
  return useApiAction(
    ({ mbrNo, approverEmpNo }: { mbrNo: string; approverEmpNo: string }) => requestMemberRestoration(mbrNo, approverEmpNo),
    { invalidate: AFTER_DELETE },
  );
}

/** The approver's decision on a pending restoration (from the member detail popup). */
export function useDecideMemberRestoration() {
  return useApiAction(
    ({ atrzHstryId, approve, text }: { atrzHstryId: string; approve: boolean; text: string }) =>
      approve ? approveMemberRestoration(atrzHstryId, text || undefined) : rejectMemberRestoration(atrzHstryId, text),
    { invalidate: AFTER_DELETE },
  );
}

/** Approvers of the restoration process; loaded only while the popup is open. */
export function useRestorationApprovers(enabled: boolean) {
  return useApiQuery<ApprovalCandidate[]>(['member', 'restoration', 'approvers'], getRestorationApprovers, {
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useDeleteExpiredMember() {
  return useApiAction((mbrNo: string) => deleteExpiredMember(mbrNo), { invalidate: AFTER_DELETE });
}
