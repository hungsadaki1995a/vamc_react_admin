import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Common Code (A06030100) ──────────────────────────────────────────────────
export interface CodeGroupItem {
  groupCd: string;
  groupNm: string;
  groupExpln?: string;
  useYn: 'Y' | 'N';
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
  useYn: 'Y' | 'N';
  lblCd?: string;
}

const CODE_BASE = '/api/v1/common-codes';
export const getCodeGroups = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<CodeGroupItem>>(`${CODE_BASE}/groups`, { ...search, page, size });
export const downloadCodeGroupsExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${CODE_BASE}/groups/excel`, 'code-groups.xlsx', search);
export const createCodeGroup = (req: { groupCd: string; groupNm: string; groupExpln?: string }) =>
  apiPost<CodeGroupItem>(`${CODE_BASE}/groups`, req);
export const updateCodeGroup = (groupCd: string, req: { groupNm: string; groupExpln?: string; useYn: 'Y' | 'N' }) =>
  apiPut<CodeGroupItem>(`${CODE_BASE}/groups/${groupCd}`, req);
export const deleteCodeGroup = (groupCd: string) => apiDelete<void>(`${CODE_BASE}/groups/${groupCd}`);
export const getCodesByGroup = (groupCd: string) => apiGet<CommonCodeItem[]>(`${CODE_BASE}/groups/${groupCd}/codes`);
export const batchSaveCodes = (groupCd: string, toSave: Partial<CommonCodeItem>[], deleteCds: string[]) =>
  apiPost<void>(`${CODE_BASE}/groups/${groupCd}/codes/batch`, { toSave, deleteCds });
