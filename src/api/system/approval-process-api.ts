import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Approval Process Management (menu A09040500) — ApprovalProcessController (`/api/v1/approval-processes`).
// A process is an ordered list of steps; each step is held by employees of one role.
// Sessions in progress keep the steps they started with (ATRZ_STP_HSTRY): editing a process only
// affects sessions started afterwards.

export type YesNo = 'Y' | 'N';

export interface ApprovalProcessItem {
  atrzProcId: string;
  /** e.g. PROC_MBR_JOIN; referenced by the backend code, fixed after registration. */
  atrzProcCd: string;
  atrzProcNm: string;
  useYn: YesNo;
  stepCount?: number;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface ApprovalProcessStep {
  atrzStpId?: string;
  stpNo: number;
  stpNm: string;
  roleGroupId: string;
  roleGroupNm?: string;
  roleId: string;
  roleNm?: string;
  /** Step to return to on rejection; lower than `stpNo`. */
  rjctStpNo?: number | null;
}

export interface ApprovalProcessDetail extends ApprovalProcessItem {
  steps: ApprovalProcessStep[];
}

/** Empty string = All (dropped from the query). */
export interface ApprovalProcessSearch {
  /** Process code or name, partial match. */
  keyword?: string;
  useYn?: YesNo | '';
}

export interface ApprovalProcessStepRequest {
  /** 1..N in order, no gap (PRC003). */
  stpNo: number;
  stpNm: string;
  roleGroupId: string;
  roleId: string;
  rjctStpNo?: number;
}

export interface CreateApprovalProcessRequest {
  /** `^[A-Z0-9_]+$`, max 30, unique (PRC002). */
  atrzProcCd: string;
  atrzProcNm: string;
  useYn: YesNo;
  steps: ApprovalProcessStepRequest[];
}

/** The code cannot change; the steps are replaced as a whole. */
export interface UpdateApprovalProcessRequest {
  atrzProcNm: string;
  useYn: YesNo;
  steps: ApprovalProcessStepRequest[];
}

/** Business error codes of the process API. */
export const APPROVAL_PROCESS_ERRORS = {
  notFound: 'PRC001',
  duplicateCode: 'PRC002',
  invalidStepOrder: 'PRC003',
  invalidRejectStep: 'PRC004',
  invalidRole: 'PRC005',
  inUse: 'PRC006',
} as const;

const BASE = '/api/v1/approval-processes';
const one = (atrzProcId: string) => `${BASE}/${encodeURIComponent(atrzProcId)}`;

export const getApprovalProcesses = (search: ApprovalProcessSearch, page: PageQuery) =>
  apiGet<PageResponse<ApprovalProcessItem>>(BASE, { ...search, ...page });
export const getApprovalProcess = (atrzProcId: string) => apiGet<ApprovalProcessDetail>(one(atrzProcId));
export const createApprovalProcess = (request: CreateApprovalProcessRequest) =>
  apiPost<ApprovalProcessDetail>(BASE, request);
export const updateApprovalProcess = (atrzProcId: string, request: UpdateApprovalProcessRequest) =>
  apiPut<ApprovalProcessDetail>(one(atrzProcId), request);
export const updateApprovalProcessStatus = (atrzProcId: string, useYn: YesNo) =>
  apiPatch<void>(`${one(atrzProcId)}/status`, { useYn });
/** Refused with PRC006 once a session used the process: deactivate it instead. */
export const deleteApprovalProcess = (atrzProcId: string) => apiDelete<void>(one(atrzProcId));
