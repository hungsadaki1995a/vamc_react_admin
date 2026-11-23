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
 * Step 2 completion with the SGDN code and the fee terms. The documents are not posted first: since 2026-11-23 a
 * documents check by the officer completes the sign-up by itself, so the SGDN step would then find it closed.
 */
export function useCompleteMemberSignup() {
  return useApiAction(
    ({ mbrNo, request }: { mbrNo: string; request: MemberSignupCompletion }) => completeMemberSignup(mbrNo, request),
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
