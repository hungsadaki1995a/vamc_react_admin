import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { YesNo } from './code-group-api';

// ── Finance Institutions (A09030300) ─────────────────────────────────────────
export interface InstitutionItem {
  fnstId?: number;
  /** Institution code 1–999. */
  fnstCd: number;
  fnstNm: string;
  fnstAbbrNm?: string;
  useYn: YesNo;
  branchCount?: number;
  crtDt?: string;
  crtBy?: string;
}

export interface BranchItem {
  fnstBrnchId?: number;
  fnstCd: number;
  fnstBrnchCd: number;
  fnstBrnchNm: string;
  fnstSlsbrNm?: string;
  fnstBrnchAddr?: string;
  /** FNST_BRNCH_CLSF_CD code. */
  fnstBrnchClsfCd?: string;
  /** GSO administrative (province) code. */
  admdstCd?: number;
  useYn: YesNo;
}

export interface InstitutionSearch {
  fnstCd?: string;
  fnstNm?: string;
  useYn?: YesNo;
}

export interface CreateInstitutionRequest {
  fnstCd: number;
  fnstNm: string;
  fnstAbbrNm?: string;
  useYn: YesNo;
}

export interface UpdateInstitutionRequest {
  fnstNm: string;
  fnstAbbrNm?: string;
  useYn: YesNo;
}

/** One grid row; `isNew=true` makes the server reject an existing code (COD007). */
export interface SaveBranchItem {
  fnstBrnchCd: number;
  fnstBrnchNm: string;
  fnstSlsbrNm?: string;
  fnstBrnchAddr?: string;
  fnstBrnchClsfCd: string;
  admdstCd: number;
  useYn: YesNo;
  isNew: boolean;
}

export interface BatchSaveBranchesRequest {
  toSave: SaveBranchItem[];
  deleteFnstBrnchCds: number[];
}

const INST_BASE = '/api/v1/institutions';

export const getInstitutions = (search: InstitutionSearch, page: PageQuery) =>
  apiGet<PageResponse<InstitutionItem>>(INST_BASE, { ...search, ...page });
export const downloadInstitutionsExcel = (search: InstitutionSearch) =>
  apiDownload(`${INST_BASE}/excel`, 'institutions.xlsx', search);
/** Errors: 409 (no code) duplicate institution code. */
export const createInstitution = (req: CreateInstitutionRequest) => apiPost<InstitutionItem>(INST_BASE, req);
export const updateInstitution = (fnstCd: number, req: UpdateInstitutionRequest) =>
  apiPut<InstitutionItem>(`${INST_BASE}/${fnstCd}`, req);
export const getBranchesByInstitution = (fnstCd: number) =>
  apiGet<BranchItem[]>(`${INST_BASE}/${fnstCd}/branches`, undefined, []);
/** Errors: COD007 duplicate (409), 400 repeated code / invalid classification / invalid admdstCd. */
export const batchSaveBranches = (fnstCd: number, req: BatchSaveBranchesRequest) =>
  apiPost<BranchItem[]>(`${INST_BASE}/${fnstCd}/branches/batch`, req);
