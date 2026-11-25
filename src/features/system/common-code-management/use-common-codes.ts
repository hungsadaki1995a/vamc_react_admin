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
import type { SortDirection } from '@/api/common/api-utils';
import type { ApiResponse } from '@/lib/api/types';

// Data hooks of Common Code Management (menu A09030100).

const COMMON_CODE_KEYS = {
  groups: ['system', 'common-codes', 'groups'] as const,
  groupList: (search: CodeGroupSearch, sort?: GroupSort) => ['system', 'common-codes', 'groups', search, sort] as const,
  codes: ['system', 'common-codes', 'codes'] as const,
  codeList: (groupCd: string | null) => ['system', 'common-codes', 'codes', groupCd] as const,
};

interface GroupSort {
  sortBy: string;
  sortDirection: SortDirection;
}

/** Server page size limit (PageRequest @Max(100)). */
const GROUP_FETCH_SIZE = 100;

/** Every group matching the filter (no pager in the design): reads the paged API page by page, server sort kept. */
async function fetchAllCodeGroups(search: CodeGroupSearch, sort?: GroupSort): Promise<ApiResponse<CodeGroupItem[]>> {
  const all: CodeGroupItem[] = [];
  for (let page = 1; ; page += 1) {
    const res = await getCodeGroups(search, { page, size: GROUP_FETCH_SIZE, ...sort });
    if (!res.success || !res.data) return { ...res, data: null };
    all.push(...res.data.content);
    if (res.data.content.length < GROUP_FETCH_SIZE || all.length >= res.data.totalElements) return { ...res, data: all };
  }
}

export function useCodeGroups(search: CodeGroupSearch, sort?: GroupSort) {
  return useApiQuery<CodeGroupItem[]>(COMMON_CODE_KEYS.groupList(search, sort), () => fetchAllCodeGroups(search, sort), {
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
