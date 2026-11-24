import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// ── Terms & Policies (A09010700) ─────────────────────────────────────────────
/** TRMS = Terms of Use, PRVC = Privacy Policy. */
export type TermsType = 'TRMS' | 'PRVC';
/** Derived by the server from the effective date. */
export type TermsStatus = 'SCHEDULED' | 'IN_EFFECT' | 'PREVIOUS';

export interface TermsPolicyItem {
  termsId: string;
  type: TermsType;
  /** Server-generated. */
  version?: string;
  /** yyyy-MM-dd */
  effectiveDate: string;
  status: TermsStatus;
  /** Registered languages, e.g. ['VN', 'EN']. */
  languages?: string[];
  hasEn?: boolean;
  editable?: boolean;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
}

export interface TermsPolicyDetail extends TermsPolicyItem {
  content?: string;
  contentEn?: string;
}

/** Empty string = All (dropped from the query). */
export interface TermsPolicySearch {
  type?: TermsType | '';
  status?: TermsStatus | '';
}

export interface CreateTermsPolicyRequest {
  type: TermsType;
  /** yyyy-MM-dd, from tomorrow (TRM007), unique per type (TRM003). */
  effectiveDate: string;
  content: string;
  contentEn?: string;
}

/** Scheduled versions only (TRM004); the type cannot change. Blank contentEn removes English. */
export interface UpdateTermsPolicyRequest {
  effectiveDate: string;
  content: string;
  contentEn?: string;
}

const TERMS_BASE = '/api/v1/contents/terms-policies';
export const getTermsPolicies = (search: TermsPolicySearch, page: PageQuery) =>
  apiGet<PageResponse<TermsPolicyItem>>(TERMS_BASE, { ...search, ...page });
export const getTermsPolicy = (termsId: string) =>
  apiGet<TermsPolicyDetail>(`${TERMS_BASE}/${encodeURIComponent(termsId)}`);
export const createTermsPolicy = (req: CreateTermsPolicyRequest) => apiPost<TermsPolicyDetail>(TERMS_BASE, req);
export const updateTermsPolicy = (termsId: string, req: UpdateTermsPolicyRequest) =>
  apiPut<TermsPolicyDetail>(`${TERMS_BASE}/${encodeURIComponent(termsId)}`, req);
/** Scheduled versions only (TRM008). */
export const deleteTermsPolicies = (termsIds: string[]) => apiDelete<number>(TERMS_BASE, { termsIds });
