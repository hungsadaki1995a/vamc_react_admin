import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  approveApproval,
  getApprovalCandidates,
  getApprovalDetail,
  getProcessStaff,
  rejectApproval,
} from '@/api/common/approval-api';
import type { ApprovalCandidate, ApprovalCandidateSearch, ApprovalDetail } from '@/api/common/approval-api';
import { lookupEmployees } from '@/api/system/employee-api';
import type { EmployeeLookup, EmployeeLookupSearch } from '@/api/system/employee-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of the common approval popups (VPA020100P01–0500P01) and the inbox (VPA10000001).

export const APPROVAL_KEYS = {
  all: ['approval'] as const,
  inbox: ['approval', 'inbox'] as const,
  detail: (atrzHstryId: string | null) => ['approval', 'detail', atrzHstryId] as const,
  candidates: (search: ApprovalCandidateSearch | null) => ['approval', 'candidates', search] as const,
  employees: (search: EmployeeLookupSearch, query: PageQuery) => ['approval', 'employees', search, query] as const,
};

/**
 * A decision changes the session and its target (application, contract, member), so every screen that may show
 * it is refetched: trade boards (`['trade', …]`) and the member list hooks.
 */
export const AFTER_DECISION = [APPROVAL_KEYS.all, ['trade'], ['member'], ['members'], ['memberDetail']];

/** Session state and steps timeline; skipped while `atrzHstryId` is null. */
export function useApprovalDetail(atrzHstryId: string | null) {
  return useApiQuery<ApprovalDetail>(APPROVAL_KEYS.detail(atrzHstryId), () => getApprovalDetail(atrzHstryId as string), {
    enabled: !!atrzHstryId,
  });
}

/** Employees eligible for a process step; skipped while `search` is null. */
export function useApprovalCandidates(search: ApprovalCandidateSearch | null) {
  return useApiQuery<ApprovalCandidate[]>(
    APPROVAL_KEYS.candidates(search),
    () => getApprovalCandidates(search as ApprovalCandidateSearch),
    { enabled: search !== null, staleTime: 60 * 1000 },
  );
}

/** Employees holding any of several steps of a process; skipped while `search` is null. */
export function useProcessStaff(search: (Omit<ApprovalCandidateSearch, 'stpNo'> & { stpNos: number[] }) | null) {
  return useApiQuery<ApprovalCandidate[]>(['approval', 'process-staff', search], () => getProcessStaff(search as NonNullable<typeof search>), {
    enabled: search !== null,
    staleTime: 60 * 1000,
  });
}

/** Every employee (paged), for filters that are not tied to a process step; skipped while disabled. */
export function useEmployeeDirectory(search: EmployeeLookupSearch, query: PageQuery, enabled: boolean) {
  return useApiQuery<PageResponse<EmployeeLookup>>(
    APPROVAL_KEYS.employees(search, query),
    () => lookupEmployees(search, query),
    { enabled, placeholderData: keepPreviousData },
  );
}

export function useApproveApproval() {
  return useApiAction(
    ({ atrzHstryId, cmntCn }: { atrzHstryId: string; cmntCn: string }) => approveApproval(atrzHstryId, cmntCn.trim()),
    { invalidate: AFTER_DECISION },
  );
}

export function useRejectApproval() {
  return useApiAction(
    ({ atrzHstryId, rjctRsn }: { atrzHstryId: string; rjctRsn: string }) => rejectApproval(atrzHstryId, rjctRsn.trim()),
    { invalidate: AFTER_DECISION },
  );
}
