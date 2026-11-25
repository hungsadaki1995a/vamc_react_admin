import { apiGet, apiPost } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { ApiResponse } from '@/lib/api/types';

// Common approval API — ApprovalController (/api/v1/approvals): inbox, session detail, step candidates,
// approver decision. Screens VPA10000001 (Approval Management) and the common popups VPA020100P01–0400P01,
// VPA020500P01. Approval requests are sent by each module (POST …/approval of applications, contracts, …).

/** Inbox filter by process kind; `other` (auctions, …) has a count but no filter. */
export type ApprovalInboxKind = 'member' | 'sale' | 'purchase' | 'consulting';
/** Session status (ATRZ_HSTRY.ATRZ_STTS_CD). */
export type ApprovalSessionStatus = 'INPROGRESS' | 'COMPLETED' | 'REJECTED' | string;
/** Step status of the timeline. */
export type ApprovalStepStatus = 'WAITING' | 'INPROGRESS' | 'APPROVED' | 'REJECTED' | string;
/** Screen that owns the approval target (navigation hint of an inbox row). */
export type ApprovalTargetScreen = 'APPLICATION' | 'CONTRACT' | 'TERMINATION' | 'CONSULTING_REPORT' | 'MEMBER_SIGNUP';

export interface ApprovalStep {
  stpNo: number;
  /** RCPT, PRCS, 1ST_ATRZ. */
  stpNm: string;
  status: ApprovalStepStatus;
  empNo?: string;
  empNm?: string;
  /** ISO date-time. */
  processedAt?: string;
  /** Comment, or the rejection reason of a rejected step. */
  comment?: string;
}

export interface ApprovalDetail {
  atrzHstryId: string;
  atrzProcCd: string;
  atrzProcNm?: string;
  /** SRVC_APLY, SRVC_CTRT, CTRT_END, MBR, … */
  atrzTrgtSeCd?: string;
  atrzTrgtId?: string;
  nowStpNo?: number;
  atrzSttsCd: ApprovalSessionStatus;
  atrzCmptnDt?: string;
  /** Employee who sent the approval request. */
  rtsoEmpNo?: string;
  rtsoDt?: string;
  steps?: ApprovalStep[];
}

export interface ApprovalInboxItem {
  atrzHstryId: string;
  atrzProcCd: string;
  atrzProcNm?: string;
  atrzTrgtSeCd?: string;
  atrzTrgtId?: string;
  nowStpNo?: number;
  stpNm?: string;
  requesterEmpNo?: string;
  requesterEmpNm?: string;
  requestedAt?: string;
  assignedAt?: string;
  /** MEMBER, SALE, PURCHASE, CONSULTING, OTHER. */
  processKind?: string;
  targetScreen?: ApprovalTargetScreen;
  /** Admin menu that owns the target (A05010200, …). */
  menuCd?: string;
  /** SALE, PURCHASE, CONSULTING. */
  tradeKind?: string;
  srvcAplyId?: string;
  /** Readable numbers of the target, when the server sends them. */
  srvcAplyNo?: string;
  srvcCtrtCd?: string;
  srvcCtrtNo?: string;
  ctrtEndId?: string;
  mbrNo?: string;
}

export interface ApprovalInboxSummary {
  total: number;
  member: number;
  sale: number;
  purchase: number;
  consulting: number;
  other: number;
}

export interface ApprovalInboxSearch {
  kind?: ApprovalInboxKind;
  atrzProcCd?: string;
}

export interface ApprovalCandidate {
  empNo: string;
  empNm: string;
  jbpsNm?: string;
  roleGroupId?: string;
  roleId?: string;
  roleNm?: string;
}

export interface ApprovalCandidateSearch {
  atrzProcCd: string;
  stpNo: number;
  /** Employee number, partial match. */
  keyword?: string;
  /** Employee name, partial match. */
  empNm?: string;
  /** Session in progress: candidates from the roles snapshotted when it started. */
  atrzHstryId?: string;
}

/** Body of the module endpoints that start an approval (`POST …/approval`). */
export interface ApprovalRequestBody {
  approverEmpNo: string;
  /** ≤ 1000 characters. */
  comment?: string;
}

/** Approval stage of a process code, by its suffix (`PROC_DSPSL_MDT_RCPT` → `RCPT`). */
export type ApprovalStage = 'RCPT' | 'CTRT' | 'SIGN' | 'ANX' | 'END' | 'END_SIGN' | 'RPTP' | 'OTHER';

const STAGE_SUFFIXES: { suffix: string; stage: ApprovalStage }[] = [
  // END_SIGN before SIGN / END: the longest suffix wins.
  { suffix: '_END_SIGN', stage: 'END_SIGN' },
  { suffix: '_RCPT', stage: 'RCPT' },
  { suffix: '_CTRT', stage: 'CTRT' },
  { suffix: '_SIGN', stage: 'SIGN' },
  { suffix: '_ANX', stage: 'ANX' },
  { suffix: '_END', stage: 'END' },
  { suffix: '_RPTP', stage: 'RPTP' },
];

export function approvalStageOf(atrzProcCd?: string | null): ApprovalStage {
  const code = (atrzProcCd ?? '').trim();
  return STAGE_SUFFIXES.find(({ suffix }) => code.endsWith(suffix))?.stage ?? 'OTHER';
}

/** Title of the approval request popup per stage (VPA020100P01). */
export const APPROVAL_STAGE_LABELS: Record<ApprovalStage, string> = {
  RCPT: 'Application Approval',
  CTRT: 'Draft Contract Approval',
  SIGN: 'Signing Approval',
  ANX: 'Annex Approval',
  END: 'Termination Approval',
  END_SIGN: 'Termination Signing Approval',
  RPTP: 'Consulting Report Approval',
  OTHER: 'Approval',
};

/**
 * Step held by the approver (seed 17_seed_approval_processes.sql): `_RCPT` has 3 steps (1 receiver, 2 officer,
 * 3 approver); every other trade process has 2 (1 officer, 2 approver).
 */
export function approverStepOf(atrzProcCd: string): number {
  return approvalStageOf(atrzProcCd) === 'RCPT' ? 3 : 2;
}

/** Step of the officer in charge in an application (`_RCPT`) session. */
export const RECEIPT_OFFICER_STEP = 2;

/** Step names of the timeline. */
export const APPROVAL_STEP_LABELS: Record<string, string> = {
  RCPT: 'Receipt',
  PRCS: 'Officer in Charge',
  '1ST_ATRZ': 'Approval',
};

const BASE = '/api/v1/approvals';
const session = (atrzHstryId: string) => `${BASE}/${encodeURIComponent(atrzHstryId)}`;

/** Sessions whose current step is assigned to the signed-in employee, newest first. */
export const getApprovalInbox = (search: ApprovalInboxSearch, query: PageQuery) =>
  apiGet<PageResponse<ApprovalInboxItem>>(`${BASE}/inbox`, { ...search, ...query });

export const getApprovalInboxSummary = () => apiGet<ApprovalInboxSummary>(`${BASE}/inbox/summary`);

/** Session state and the complete steps timeline (VPA020400P01). */
export const getApprovalDetail = (atrzHstryId: string) => apiGet<ApprovalDetail>(session(atrzHstryId));

/** Active employees holding the role of a step (VPA020500P01, approver / officer selection). */
export const getApprovalCandidates = (search: ApprovalCandidateSearch) =>
  apiGet<ApprovalCandidate[]>(`${BASE}/candidates`, search, []);

/**
 * Employees holding the role of any of `stpNos` (deduplicated), e.g. every trade staff member of a process when
 * no single step fits (consultant). Employee lookup itself is guarded by User Management, so staff cannot use it.
 */
export async function getProcessStaff(
  search: Omit<ApprovalCandidateSearch, 'stpNo'> & { stpNos: number[] },
): Promise<ApiResponse<ApprovalCandidate[]>> {
  const { stpNos, ...rest } = search;
  const answers = await Promise.all(stpNos.map((stpNo) => getApprovalCandidates({ ...rest, stpNo })));
  const failed = answers.find((answer) => !answer.success);
  if (failed) return failed;
  const merged = new Map<string, ApprovalCandidate>();
  answers.forEach((answer) => (answer.data ?? []).forEach((c) => merged.set(c.empNo, merged.get(c.empNo) ?? c)));
  return { ...answers[0], data: [...merged.values()] };
}

/** Approver approves the current step (VPA020200P01). */
export const approveApproval = (atrzHstryId: string, cmntCn?: string) =>
  apiPost<ApprovalDetail>(`${session(atrzHstryId)}/approve`, { confirmed: true, cmntCn: cmntCn || undefined });

/** Approver rejects the session with a mandatory reason (VPA020300P01). */
export const rejectApproval = (atrzHstryId: string, rjctRsn: string) =>
  apiPost<ApprovalDetail>(`${session(atrzHstryId)}/reject`, { confirmed: true, rjctRsn });
