import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// ── Common Code (A09030100) ──────────────────────────────────────────────────
export type YesNo = 'Y' | 'N';

export interface CodeGroupItem {
  groupCd: string;
  groupNm: string;
  groupExpln?: string;
  useYn: YesNo;
  lblCd?: string;
  codeCount?: number;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface CommonCodeItem {
  groupCd: string;
  cd: string;
  cdNm: string;
  cdExpln?: string;
  sortSeq?: number;
  useYn: YesNo;
  lblCd?: string;
  crtDt?: string;
}

/** Group list filter (partial match on both). */
export interface CodeGroupSearch {
  groupCd?: string;
  groupNm?: string;
  useYn?: YesNo;
}

export interface CreateCodeGroupRequest {
  groupCd: string;
  groupNm: string;
  groupExpln?: string;
  useYn: YesNo;
}

export interface UpdateCodeGroupRequest {
  groupNm: string;
  groupExpln?: string;
  useYn: YesNo;
}

/** One grid row; `isNew=true` makes the server reject an existing code (COD004). */
export interface SaveCodeItem {
  cd: string;
  cdNm: string;
  cdExpln?: string;
  sortSeq?: number;
  useYn: YesNo;
  lblCd?: string;
  isNew: boolean;
}

export interface BatchSaveCodesRequest {
  toSave: SaveCodeItem[];
  deleteCodes: string[];
}

const CODE_BASE = '/api/v1/common-codes';

export const getCodeGroups = (search: CodeGroupSearch, page: PageQuery) =>
  apiGet<PageResponse<CodeGroupItem>>(`${CODE_BASE}/groups`, { ...search, ...page });
export const downloadCodeGroupsExcel = (search: CodeGroupSearch) =>
  apiDownload(`${CODE_BASE}/groups/excel`, 'code-groups.xlsx', search);
/** Errors: 409 CODE_GROUP_DUPLICATED duplicate group code. */
export const createCodeGroup = (req: CreateCodeGroupRequest) => apiPost<CodeGroupItem>(`${CODE_BASE}/groups`, req);
export const updateCodeGroup = (groupCd: string, req: UpdateCodeGroupRequest) =>
  apiPut<CodeGroupItem>(`${CODE_BASE}/groups/${encodeURIComponent(groupCd)}`, req);
export const getCodesByGroup = (groupCd: string) =>
  apiGet<CommonCodeItem[]>(`${CODE_BASE}/groups/${encodeURIComponent(groupCd)}/codes`, undefined, []);
/** Saves added / edited rows and deletes in one call. Errors: COD004 duplicate code (409). */
export const batchSaveCodes = (groupCd: string, req: BatchSaveCodesRequest) =>
  apiPost<CommonCodeItem[]>(`${CODE_BASE}/groups/${encodeURIComponent(groupCd)}/codes/batch`, req);
