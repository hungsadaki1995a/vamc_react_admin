import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  approveMemberApplication,
  assignMemberOfficer,
  completeMemberDocuments,
  completeMemberSignup,
  getMemberApprovalCandidates,
  getMemberApprovalContext,
  receiveMemberApplication,
  requestMemberSupplement,
} from '@/api/member/member-approval-api';
import type { ApprovalCandidate, MemberApprovalContext, MemberSignupCompletion } from '@/api/member/member-approval-api';

// Data hooks of the member sign-up popup (ADF1234 P08–P12) — the popup never calls the API itself.

const MEMBER_APPROVAL_KEYS = {
  all: ['member', 'approval'] as const,
  context: (mbrNo: string | null) => ['member', 'approval', 'context', mbrNo] as const,
  candidates: (stpNo: number | null, atrzHstryId: string | null) =>
    ['member', 'approval', 'candidates', stpNo, atrzHstryId] as const,
};

/** Every write changes the member row and its detail, which `use-members.ts` caches under these keys. */
const AFTER_WRITE = [MEMBER_APPROVAL_KEYS.all, ['members'], ['memberDetail']];

/** Stage, steps and the action open to the signed-in employee; skipped while `mbrNo` is null. */
export function useMemberApprovalContext(mbrNo: string | null) {
  return useApiQuery<MemberApprovalContext>(
    MEMBER_APPROVAL_KEYS.context(mbrNo),
    () => getMemberApprovalContext(mbrNo as string),
    { enabled: mbrNo !== null, gcTime: 0 },
  );
}

/** Employees selectable for a step of the member's session; skipped while `stpNo` is null. */
export function useMemberApprovalCandidates(stpNo: number | null, atrzHstryId: string | null = null) {
  return useApiQuery<ApprovalCandidate[]>(
    MEMBER_APPROVAL_KEYS.candidates(stpNo, atrzHstryId),
    () => getMemberApprovalCandidates(stpNo as number, atrzHstryId),
    { enabled: stpNo !== null, staleTime: 60 * 1000 },
  );
}

export function useReceiveMemberApplication() {
  return useApiAction((mbrNo: string) => receiveMemberApplication(mbrNo), { invalidate: AFTER_WRITE });
}

/** Step 1 document check: complete, or incomplete with the supplement note mailed to the applicant. */
export function useCheckMemberDocuments() {
  return useApiAction(
    ({ mbrNo, complete, note }: { mbrNo: string; complete: boolean; note?: string }) =>
      complete ? completeMemberDocuments(mbrNo) : requestMemberSupplement(mbrNo, note ?? ''),
    { invalidate: AFTER_WRITE },
  );
}

export function useAssignMemberOfficer() {
  return useApiAction(
    ({ mbrNo, assigneeEmpNo }: { mbrNo: string; assigneeEmpNo: string }) => assignMemberOfficer(mbrNo, assigneeEmpNo),
    { invalidate: AFTER_WRITE },
  );
}

/**
 * Step 2 completion. The documents are marked complete first, which is a no-op for a new application (checked at
 * step 1) and still needed for one received before 2026-11-22, whose documents were checked at step 2.
 */
export function useCompleteMemberSignup() {
  return useApiAction(
    async ({ mbrNo, request }: { mbrNo: string; request: MemberSignupCompletion }) => {
      const documents = await completeMemberDocuments(mbrNo);
      return documents.success ? completeMemberSignup(mbrNo, request) : documents;
    },
    { invalidate: AFTER_WRITE },
  );
}

/** Former step 3: approve an application received before 2026-11-22. */
export function useApproveMemberApplication() {
  return useApiAction(
    ({ atrzHstryId, comment }: { atrzHstryId: string; comment: string }) =>
      approveMemberApplication(atrzHstryId, comment || undefined),
    { invalidate: AFTER_WRITE },
  );
}
