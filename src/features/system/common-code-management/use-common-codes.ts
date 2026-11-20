import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  batchSaveCodes,
  createCodeGroup,
  downloadCodeGroupsExcel,
  getCodeGroups,
  getCodesByGroup,
  updateCodeGroup,
} from '@/api/system/code-group-api';
import type {
  BatchSaveCodesRequest,
  CodeGroupItem,
  CodeGroupSearch,
  CommonCodeItem,
  UpdateCodeGroupRequest,
} from '@/api/system/code-group-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Common Code Management (menu A06030100).

const COMMON_CODE_KEYS = {
  groups: ['system', 'common-codes', 'groups'] as const,
  groupList: (search: CodeGroupSearch, page: PageQuery) => ['system', 'common-codes', 'groups', search, page] as const,
  codes: ['system', 'common-codes', 'codes'] as const,
  codeList: (groupCd: string | null) => ['system', 'common-codes', 'codes', groupCd] as const,
};

/** Paged code group list (20 rows). */
export function useCodeGroups(search: CodeGroupSearch, page: PageQuery) {
  return useApiQuery<PageResponse<CodeGroupItem>>(COMMON_CODE_KEYS.groupList(search, page), () => getCodeGroups(search, page), {
    placeholderData: keepPreviousData,
  });
}

/** Codes of one group; skipped while no group is selected. No focus refetch: it would reset unsaved grid edits. */
export function useCodes(groupCd: string | null) {
  return useApiQuery<CommonCodeItem[]>(COMMON_CODE_KEYS.codeList(groupCd), () => getCodesByGroup(groupCd as string), {
    enabled: !!groupCd,
    refetchOnWindowFocus: false,
  });
}

export function useDownloadCodeGroupsExcel() {
  return useApiDownload(downloadCodeGroupsExcel);
}

export function useCreateCodeGroup() {
  return useApiAction(createCodeGroup, { invalidate: [COMMON_CODE_KEYS.groups] });
}

export function useUpdateCodeGroup() {
  return useApiAction(
    ({ groupCd, request }: { groupCd: string; request: UpdateCodeGroupRequest }) => updateCodeGroup(groupCd, request),
    { invalidate: [COMMON_CODE_KEYS.groups] },
  );
}

/** Grid [Save]: added / edited rows and deletes in one call. */
export function useBatchSaveCodes() {
  return useApiAction(
    ({ groupCd, request }: { groupCd: string; request: BatchSaveCodesRequest }) => batchSaveCodes(groupCd, request),
    { invalidate: [COMMON_CODE_KEYS.codes, COMMON_CODE_KEYS.groups] },
  );
}
