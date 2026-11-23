import { apiGet, apiPost, apiPut } from '@/api/common/api-utils';

// Member sign-up API — MemberApprovalController (`/api/v1/members/{mbrNo}/…`) and ApprovalController
// (`/api/v1/approvals/…`), process PROC_MBR_JOIN, guard menu A01010000. Screens ADF1234 P08–P12.
// Two steps (decided 2026-11-22): 1 receiver — receive, check the posted documents, assign the officer in charge;
// 2 officer in charge — enter the SGDN code and the fee terms, which completes the sign-up. No approval, no rejection.

export const MEMBER_JOIN_PROCESS = 'PROC_MBR_JOIN';
/** Step whose employees can be assigned as officer in charge. */
export const MEMBER_JOIN_OFFICER_STEP = 2;

export type ApprovalStage = 'NOT_RECEIVED' | 'REQUESTED' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
/**
 * What the signed-in employee may do now. Step 1: RECEIVE, CHECK_DOCUMENTS, ASSIGN. Step 2: REQUEST (complete).
 * DECIDE only for an application received before 2026-11-22 that still waits for its approver.
 */
export type ApprovalAction = 'RECEIVE' | 'CHECK_DOCUMENTS' | 'ASSIGN' | 'REQUEST' | 'DECIDE' | 'VIEW';
export type YesNo = 'Y' | 'N';

export interface ApprovalActor {
  empNo?: string;
  empNm?: string;
  jbpsNm?: string;
  deptNm?: string;
}

export interface ApprovalStep {
  stpNo: number;
  /** RCPT, PRCS (1ST_ATRZ on applications received before 2026-11-22). */
  stpNm: string;
  /** WAITING, INPROGRESS, APPROVED, REJECTED. */
  status: string;
  empNo?: string;
  empNm?: string;
  processedAt?: string;
  comment?: string;
}

export interface MemberApprovalContext {
  mbrNo: string;
  /** Approval session; absent until the application is received. */
  atrzHstryId?: string;
  atrzProcCd?: string;
  stage: ApprovalStage;
  nowStpNo?: number;
  availableAction: ApprovalAction;
  /** Employee holding the current step (receiver at step 1, officer in charge at step 2). */
  assignee?: ApprovalActor;
  approver?: ApprovalActor;
  rejectionReason?: string;
  steps?: ApprovalStep[];
}

export interface ApprovalCandidate {
  empNo: string;
  empNm: string;
  jbpsNm?: string;
  roleNm?: string;
}

export interface MemberSignupCompletion {
  /** 1–10 characters: letters, digits, `. _ / -`. */
  sgdnMbrCd: string;
  mbrshpFeeExmpYn: YesNo;
  mbrshpPayYn: YesNo;
}

/** Server error codes the popup reacts to. */
export const MEMBER_APPROVAL_ERRORS = {
  officerNotAssigned: 'MBR015',
} as const;

const MEMBERS = '/api/v1/members';
const APPROVALS = '/api/v1/approvals';
const member = (mbrNo: string) => `${MEMBERS}/${encodeURIComponent(mbrNo)}`;
const session = (atrzHstryId: string) => `${APPROVALS}/${encodeURIComponent(atrzHstryId)}`;

export const getMemberApprovalContext = (mbrNo: string) => apiGet<MemberApprovalContext>(`${member(mbrNo)}/approval`);

/**
 * Employees who can hold the given step of the member sign-up process. With `atrzHstryId` (a session in
 * progress) the server uses the roles snapshotted when the session started, the same roles it checks on
 * save, so editing the process mid-session does not shift the list.
 */
export const getMemberApprovalCandidates = (stpNo: number, atrzHstryId?: string | null) =>
  apiGet<ApprovalCandidate[]>(`${APPROVALS}/candidates`, {
    atrzProcCd: MEMBER_JOIN_PROCESS,
    stpNo,
    ...(atrzHstryId ? { atrzHstryId } : {}),
  });

/** Step 1: receive the application; the receiver holds step 1. */
export const receiveMemberApplication = (mbrNo: string) => apiPost<unknown>(`${member(mbrNo)}/approvals/receive`);

/** Step 1: original documents complete. */
export const completeMemberDocuments = (mbrNo: string) =>
  apiPost<unknown>(`${member(mbrNo)}/documents`, { documentsComplete: 'Y' });

/** Step 1: documents incomplete — closes the session and mails the supplement request (note ≤ 1000). */
export const requestMemberSupplement = (mbrNo: string, supplementNote: string) =>
  apiPost<unknown>(`${member(mbrNo)}/documents`, { documentsComplete: 'N', supplementNote });

/** Step 1 → 2: assign the officer in charge once the documents are complete (also changes the officer at step 2). */
export const assignMemberOfficer = (mbrNo: string, assigneeEmpNo: string) =>
  apiPut<unknown>(`${member(mbrNo)}/approvals/assignee`, { assigneeEmpNo });

/** Step 2: the officer enters the SGDN member code and the fee terms; the member becomes a general or full member. */
export const completeMemberSignup = (mbrNo: string, request: MemberSignupCompletion) =>
  apiPost<unknown>(`${member(mbrNo)}/approval`, { ...request, confirmed: true });

/** Former step 3 (applications received before 2026-11-22): approve. Rejection no longer exists. */
export const approveMemberApplication = (atrzHstryId: string, cmntCn?: string) =>
  apiPost<unknown>(`${session(atrzHstryId)}/approve`, { confirmed: true, cmntCn });
