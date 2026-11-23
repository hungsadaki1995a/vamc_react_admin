import { apiGet, apiPost } from '@/api/common/api-utils';
import type { ApprovalCandidate } from '@/api/member/member-approval-api';

// Member deletion API — MemberApprovalController (`/api/v1/members/{mbrNo}/deletion`, `/expiry-deletion`),
// guard menu A01020000, screen VPA030100P03. Decided 2026-11-22: the officer in charge (or an administrator)
// deletes directly, without approval; deleted members are never restored. Every deletion is a soft delete.

/**
 * Flag of a member whose membership expired without renewal: WARNING from 15 days before the deletion due date
 * (expiry + 1 year), DUE from that date on.
 */
export type DeletionAlert = 'WARNING' | 'DUE';

/** Fields of the member list row that the generated SDK does not describe yet. */
export interface MemberDeletionFields {
  /** yyyy-MM-dd: membership expiry + 1 year. */
  deletionDueDt?: string;
  deletionAlert?: DeletionAlert;
}

/** Member list filter that the generated SDK does not describe yet. */
export interface MemberDeletionFilter {
  deletionAlerts?: DeletionAlert[];
}

export interface MemberDeletion {
  delDt?: string;
  /** yyyy-MM-dd: deleted date + 1 year; restorable until then (decided 2026-11-23). */
  rtnEndDt?: string;
  delRsn?: string;
  /** Within one year of the deletion and no restoration request open. */
  restorable?: boolean;
  /** Restoration request waiting for its approver. */
  pendingRestoration?: PendingRestoration | null;
  /** The signed-in employee is the approver of the pending restoration. */
  canDecideRestoration?: boolean;
}

export interface PendingRestoration {
  atrzHstryId: string;
  requestedAt?: string;
  requesterEmpNo?: string;
  /** Partially masked by the server. */
  requesterNm?: string;
  approverEmpNo?: string;
  approverNm?: string;
}

/** Restoration approval started (VPA030100P03, C05). */
export interface MemberRestorationRequestResult {
  mbrNo: string;
  requestType: 'RESTORE';
  atrzHstryId: string;
  approverEmpNo: string;
}

/** Restoration process: step 2 is the approver (role 1STAPPR). */
export const MEMBER_RESTORATION_PROCESS = 'PROC_MBR_RSTR';
export const MEMBER_RESTORATION_APPROVER_STEP = 2;

/** Server error codes the screens react to. */
export const MEMBER_DELETION_ERRORS = {
  notDue: 'MBR013',
  notOfficerInCharge: 'MBR014',
} as const;

const member = (mbrNo: string) => `/api/v1/members/${encodeURIComponent(mbrNo)}`;

/** Delete a member with a reason (≤ 500 characters). */
export const deleteMember = (mbrNo: string, reason: string) =>
  apiPost<MemberDeletion>(`${member(mbrNo)}/deletion`, { reason });

/**
 * Ask the approver to restore a deleted member (C05, decided 2026-11-23): only within one year of the deletion;
 * the approval puts the member back to the status before deletion. 409 past the year, while a request is open or
 * when the contact e-mail / phone is now used by another member; 403 MBR014 for another employee.
 */
export const requestMemberRestoration = (mbrNo: string, approverEmpNo: string) =>
  apiPost<MemberRestorationRequestResult>(`${member(mbrNo)}/restoration-request`, { approverEmpNo });

const approvalSession = (atrzHstryId: string) => `/api/v1/approvals/${encodeURIComponent(atrzHstryId)}`;

/** The approver restores the member (back to the status before deletion); refused past one year of the deletion. */
export const approveMemberRestoration = (atrzHstryId: string, cmntCn?: string) =>
  apiPost<unknown>(`${approvalSession(atrzHstryId)}/approve`, { confirmed: true, cmntCn });

/** The approver rejects the restoration; the member stays deleted. */
export const rejectMemberRestoration = (atrzHstryId: string, rjctRsn: string) =>
  apiPost<unknown>(`${approvalSession(atrzHstryId)}/reject`, { confirmed: true, rjctRsn });

/** Employees who can approve a restoration (roles of step 2 of the restoration process). */
export const getRestorationApprovers = () =>
  apiGet<ApprovalCandidate[]>('/api/v1/approvals/candidates', {
    atrzProcCd: MEMBER_RESTORATION_PROCESS,
    stpNo: MEMBER_RESTORATION_APPROVER_STEP,
  }, []);

/** Delete a member whose membership expired without renewal one year ago (flag DUE). */
export const deleteExpiredMember = (mbrNo: string) => apiPost<MemberDeletion>(`${member(mbrNo)}/expiry-deletion`);
