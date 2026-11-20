import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Finance Institutions (A06030300) ─────────────────────────────────────────
export interface InstitutionItem {
  fnstId?: string;
  fnstCd: string;
  fnstNm: string;
  fnstAbbrNm?: string;
  useYn: 'Y' | 'N';
  branchCount?: number;
  crtDt?: string;
  crtBy?: string;
}

export interface BranchItem {
  fnstBrnchId?: string;
  fnstCd: string;
  fnstBrnchCd: string;
  fnstBrnchNm: string;
  fnstSlsbrNm?: string;
  fnstBrnchAddr?: string;
  fnstBrnchClsfCd?: string;
  admdstCd?: string;
  useYn: 'Y' | 'N';
}

const INST_BASE = '/api/v1/institutions';
export const getInstitutions = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<InstitutionItem>>(INST_BASE, { ...search, page, size });
export const downloadInstitutionsExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${INST_BASE}/excel`, 'institutions.xlsx', search);
export const createInstitution = (req: Partial<InstitutionItem>) => apiPost<InstitutionItem>(INST_BASE, req);
export const updateInstitution = (fnstCd: string, req: Partial<InstitutionItem>) =>
  apiPut<InstitutionItem>(`${INST_BASE}/${fnstCd}`, req);
export const deleteInstitution = (fnstCd: string) => apiDelete<void>(`${INST_BASE}/${fnstCd}`);
export const getBranchesByInstitution = (fnstCd: string) => apiGet<BranchItem[]>(`${INST_BASE}/${fnstCd}/branches`);
export const createBranch = (req: Partial<BranchItem>) => apiPost<BranchItem>(`${INST_BASE}/branches`, req);
export const updateBranch = (fnstBrnchCd: string, req: Partial<BranchItem>) =>
  apiPut<BranchItem>(`${INST_BASE}/branches/${fnstBrnchCd}`, req);
export const deleteBranch = (fnstBrnchCd: string) => apiDelete<void>(`${INST_BASE}/branches/${fnstBrnchCd}`);
