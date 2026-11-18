import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createBranch,
  createInstitution,
  deleteBranch,
  deleteInstitution,
  downloadInstitutionsExcel,
  getBranchesByInstitution,
  getInstitutions,
  updateBranch,
  updateInstitution,
} from '@/api/system/system-operations-api';
import type { BranchItem, InstitutionItem } from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Finance Code Management (menu A06030300).

export interface InstitutionSearch {
  useYn?: 'Y' | 'N';
  keyword?: string;
}

const INSTITUTION_KEYS = {
  all: ['system', 'institutions'] as const,
  institutions: ['system', 'institutions', 'institutions'] as const,
  list: (search: InstitutionSearch, page: number, size: number) =>
    ['system', 'institutions', 'institutions', 'list', search, page, size] as const,
  branches: ['system', 'institutions', 'branches'] as const,
  branchList: (fnstCd: string | null) => ['system', 'institutions', 'branches', fnstCd] as const,
};

/** Paged financial institution list. */
export function useInstitutions(search: InstitutionSearch, page: number, size: number) {
  return useApiQuery<PageResponse<InstitutionItem>>(
    INSTITUTION_KEYS.list(search, page, size),
    () => getInstitutions(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** Branches of one institution; skipped while no institution is selected. */
export function useBranches(fnstCd: string | null) {
  return useApiQuery<BranchItem[]>(INSTITUTION_KEYS.branchList(fnstCd), () => getBranchesByInstitution(fnstCd as string), {
    enabled: !!fnstCd,
  });
}

export function useDownloadInstitutionsExcel() {
  return useApiDownload(downloadInstitutionsExcel);
}

export interface SaveInstitutionVariables {
  /** null = register. */
  fnstCd: string | null;
  request: Partial<InstitutionItem>;
}

/** Registers or edits an institution. */
export function useSaveInstitution() {
  return useApiAction(
    ({ fnstCd, request }: SaveInstitutionVariables) =>
      fnstCd === null ? createInstitution(request) : updateInstitution(fnstCd, request),
    { invalidate: [INSTITUTION_KEYS.institutions] },
  );
}

export function useDeleteInstitution() {
  return useApiAction(deleteInstitution, { invalidate: [INSTITUTION_KEYS.institutions] });
}

export interface SaveBranchVariables {
  /** null = register. */
  fnstBrnchCd: string | null;
  request: Partial<BranchItem>;
}

/** Registers or edits a branch. */
export function useSaveBranch() {
  return useApiAction(
    ({ fnstBrnchCd, request }: SaveBranchVariables) =>
      fnstBrnchCd === null ? createBranch(request) : updateBranch(fnstBrnchCd, request),
    { invalidate: [INSTITUTION_KEYS.branches] },
  );
}

export function useDeleteBranch() {
  return useApiAction(deleteBranch, { invalidate: [INSTITUTION_KEYS.branches] });
}
