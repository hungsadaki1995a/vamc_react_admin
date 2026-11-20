import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  batchSaveCodes,
  createCodeGroup,
  deleteCodeGroup,
  downloadCodeGroupsExcel,
  getCodeGroups,
  getCodesByGroup,
  updateCodeGroup,
} from '@/api/system/code-group-api';
import type { CodeGroupItem, CommonCodeItem } from '@/api/system/code-group-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Common Code Management (menu A06030100).

export interface CodeGroupSearch {
  useYn?: 'Y' | 'N';
  keyword?: string;
}

const COMMON_CODE_KEYS = {
  all: ['system', 'common-codes'] as const,
  groups: ['system', 'common-codes', 'groups'] as const,
  groupList: (search: CodeGroupSearch, page: number, size: number) =>
    ['system', 'common-codes', 'groups', 'list', search, page, size] as const,
  codes: ['system', 'common-codes', 'codes'] as const,
  codeList: (groupCd: string | null) => ['system', 'common-codes', 'codes', groupCd] as const,
};

/** Paged code group list. */
export function useCodeGroups(search: CodeGroupSearch, page: number, size: number) {
  return useApiQuery<PageResponse<CodeGroupItem>>(
    COMMON_CODE_KEYS.groupList(search, page, size),
    () => getCodeGroups(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** Codes of one group; skipped while no group is selected. */
export function useCodes(groupCd: string | null) {
  return useApiQuery<CommonCodeItem[]>(COMMON_CODE_KEYS.codeList(groupCd), () => getCodesByGroup(groupCd as string), {
    enabled: !!groupCd,
  });
}

export function useDownloadCodeGroupsExcel() {
  return useApiDownload(downloadCodeGroupsExcel);
}

export function useCreateCodeGroup() {
  return useApiAction(createCodeGroup, { invalidate: [COMMON_CODE_KEYS.groups] });
}

export interface UpdateCodeGroupVariables {
  groupCd: string;
  request: { groupNm: string; groupExpln?: string; useYn: 'Y' | 'N' };
}

export function useUpdateCodeGroup() {
  return useApiAction(({ groupCd, request }: UpdateCodeGroupVariables) => updateCodeGroup(groupCd, request), {
    invalidate: [COMMON_CODE_KEYS.groups],
  });
}

export function useDeleteCodeGroup() {
  return useApiAction(deleteCodeGroup, { invalidate: [COMMON_CODE_KEYS.groups] });
}

export interface BatchSaveCodesVariables {
  groupCd: string;
  toSave: Partial<CommonCodeItem>[];
  deleteCds: string[];
}

/** Upserts and / or deletes codes of one group in a single call. */
export function useBatchSaveCodes() {
  return useApiAction(
    ({ groupCd, toSave, deleteCds }: BatchSaveCodesVariables) => batchSaveCodes(groupCd, toSave, deleteCds),
    { invalidate: [COMMON_CODE_KEYS.codes] },
  );
}
