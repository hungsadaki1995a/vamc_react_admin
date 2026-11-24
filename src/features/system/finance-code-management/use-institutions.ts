import { useMemo } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  batchSaveBranches,
  createInstitution,
  downloadInstitutionsExcel,
  getBranchesByInstitution,
  getInstitutions,
  updateInstitution,
} from '@/api/system/institution-api';
import type {
  BatchSaveBranchesRequest,
  BranchItem,
  InstitutionItem,
  InstitutionSearch,
  UpdateInstitutionRequest,
} from '@/api/system/institution-api';
import { getActiveProvinces } from '@/api/system/location-api';
import type { ProvinceItem } from '@/api/system/location-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Finance Code Management (menu A09030300).

const FINANCE_KEYS = {
  institutions: ['system', 'institutions'] as const,
  institutionList: (search: InstitutionSearch, page: PageQuery) => ['system', 'institutions', 'list', search, page] as const,
  branches: ['system', 'institutions', 'branches'] as const,
  branchList: (fnstCd: number | null) => ['system', 'institutions', 'branches', fnstCd] as const,
  provinces: ['system', 'institutions', 'admin-units'] as const,
};

export function useInstitutions(search: InstitutionSearch, page: PageQuery) {
  return useApiQuery<PageResponse<InstitutionItem>>(
    FINANCE_KEYS.institutionList(search, page),
    () => getInstitutions(search, page),
    { placeholderData: keepPreviousData },
  );
}

/** Branches of one institution; no focus refetch so unsaved grid edits survive. */
export function useBranches(fnstCd: number | null) {
  return useApiQuery<BranchItem[]>(FINANCE_KEYS.branchList(fnstCd), () => getBranchesByInstitution(fnstCd as number), {
    enabled: fnstCd !== null,
    refetchOnWindowFocus: false,
  });
}

/** Administrative unit options (active provinces, value = GSO code). */
export function useAdminUnitOptions() {
  const { data = [] } = useApiQuery<ProvinceItem[]>(FINANCE_KEYS.provinces, getActiveProvinces, {
    staleTime: 5 * 60 * 1000,
  });
  return useMemo(
    () =>
      [...data]
        .sort((a, b) => a.admdstCd - b.admdstCd)
        .map((p) => ({ value: p.admdstCd, label: `${p.admdstCd} ${p.mctpvNm}` })),
    [data],
  );
}

export function useDownloadInstitutionsExcel() {
  return useApiDownload(downloadInstitutionsExcel);
}

export function useCreateInstitution() {
  return useApiAction(createInstitution, { invalidate: [FINANCE_KEYS.institutions] });
}

export function useUpdateInstitution() {
  return useApiAction(
    ({ fnstCd, request }: { fnstCd: number; request: UpdateInstitutionRequest }) => updateInstitution(fnstCd, request),
    { invalidate: [FINANCE_KEYS.institutions] },
  );
}

export function useBatchSaveBranches() {
  return useApiAction(
    ({ fnstCd, request }: { fnstCd: number; request: BatchSaveBranchesRequest }) => batchSaveBranches(fnstCd, request),
    { invalidate: [FINANCE_KEYS.institutions] },
  );
}
