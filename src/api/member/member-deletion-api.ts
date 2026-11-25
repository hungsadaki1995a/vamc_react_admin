import i18n from '@/lib/i18n';
import { apiGet, apiPost } from '@/api/common/api-utils';
import type { ApprovalCandidate } from '@/api/member/member-approval-api';

// Member deletion and restoration API — MemberApprovalController (`/api/v1/members/{mbrNo}/deletion-request`,
// `/restoration-request`) and ApprovalController (`/api/v1/approvals/{atrzHstryId}/approve|reject`), guard menu
// A03010000, screen VPA030100P03. Decided 2026-11-23: no automatic deletion; the Staff in Charge requests the
// deletion (or the restoration within one year) and the chosen approver decides. Every deletion is a soft delete.
// Detail fields (`deletionRequest`, `deletable`, `deletionBlockCd`, `deletion.pendingRestoration`) come from the
// generated `MemberDetailResponse` / `PendingRequest` types.

/** Deletion or restoration approval started. */
export interface MemberRequestResult {
  mbrNo: string;
  requestType: 'DELETE' | 'RESTORE';
  atrzHstryId: string;
  approverEmpNo: string;
}

/** Deletion process: step 2 is the approver. */
export const MEMBER_DELETION_PROCESS = 'PROC_MBR_LOSS';
export const MEMBER_DELETION_APPROVER_STEP = 2;

/** Restoration process: step 2 is the approver (role 1STAPPR). */
export const MEMBER_RESTORATION_PROCESS = 'PROC_MBR_RSTR';
export const MEMBER_RESTORATION_APPROVER_STEP = 2;

/** Server error codes the screens react to. */
export const MEMBER_DELETION_ERRORS = {
  notOfficerInCharge: 'MBR014',
  /** Only Pending Approval past the payment deadline, or Full members. */
  notDeletable: 'MBR017',
  paymentDeadlineNotPassed: 'MBR018',
  /** Restoration: the Login ID is now used by another member. */
  loginIdInUse: 'MBR019',
} as const;

/** Why the Delete button is disabled (`deletionBlockCd` of the member detail). */
export const DELETION_BLOCK_REASONS: Record<string, string> = {
  get MBR017() {
    return i18n.t('messages.member.detail.deletionBlock.MBR017');
  },
  get MBR018() {
    return i18n.t('messages.member.detail.deletionBlock.MBR018');
  },
  get REQUEST_PENDING() {
    return i18n.t('messages.member.detail.deletionBlock.REQUEST_PENDING');
  },
  get E09() {
    return i18n.t('messages.member.detail.deletionBlock.E09');
  },
};

const member = (mbrNo: string) => `/api/v1/members/${encodeURIComponent(mbrNo)}`;

/**
 * Ask the approver to delete a member (reason ≤ 500 characters). 409 MBR017 / MBR018 / E09 / request pending,
 * 403 MBR014 for another employee than the Staff in Charge.
 */
export const requestMemberDeletion = (mbrNo: string, reason: string, approverEmpNo: string) =>
  apiPost<MemberRequestResult>(`${member(mbrNo)}/deletion-request`, { reason, approverEmpNo });

/**
 * Ask the approver to restore a deleted member (C05): only within one year of the deletion; the approval puts the
 * member back to the status before deletion. 409 past the year, while a request is open, when the contact is now
 * used by another member or the Login ID is taken (MBR019); 403 MBR014 for another employee.
 */
export const requestMemberRestoration = (mbrNo: string, approverEmpNo: string) =>
  apiPost<MemberRequestResult>(`${member(mbrNo)}/restoration-request`, { approverEmpNo });

const approvalSession = (atrzHstryId: string) => `/api/v1/approvals/${encodeURIComponent(atrzHstryId)}`;

/** The approver approves a pending deletion or restoration request. */
export const approveMemberRequest = (atrzHstryId: string, cmntCn?: string) =>
  apiPost<unknown>(`${approvalSession(atrzHstryId)}/approve`, { confirmed: true, cmntCn });

/** The approver rejects a pending deletion or restoration request; the member stays as it is. */
export const rejectMemberRequest = (atrzHstryId: string, rjctRsn: string) =>
  apiPost<unknown>(`${approvalSession(atrzHstryId)}/reject`, { confirmed: true, rjctRsn });

const approvers = (atrzProcCd: string, stpNo: number) => () =>
  apiGet<ApprovalCandidate[]>('/api/v1/approvals/candidates', { atrzProcCd, stpNo }, []);

/** Employees who can approve a deletion (roles of step 2 of the deletion process). */
export const getDeletionApprovers = approvers(MEMBER_DELETION_PROCESS, MEMBER_DELETION_APPROVER_STEP);

/** Employees who can approve a restoration (roles of step 2 of the restoration process). */
export const getRestorationApprovers = approvers(MEMBER_RESTORATION_PROCESS, MEMBER_RESTORATION_APPROVER_STEP);
