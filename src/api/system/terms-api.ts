import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Terms & Policies (A06010700) ─────────────────────────────────────────────
export interface TermsPolicyItem {
  termsId: string;
  type: string;
  version: string;
  effectiveDate?: string;
  title: string;
  titleEn?: string;
  published: 'Y' | 'N';
  current?: boolean;
  editable?: boolean;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface TermsPolicyDetail extends TermsPolicyItem {
  content?: string;
  contentEn?: string;
}

export interface TermsPolicySearch {
  type?: string;
  published?: 'Y' | 'N';
  keyword?: string;
}

export interface TermsPolicyRequest {
  type?: string;
  version: string;
  effectiveDate?: string;
  title: string;
  titleEn?: string;
  content?: string;
  contentEn?: string;
  published?: 'Y' | 'N';
}

const TERMS_BASE = '/api/v1/contents/terms-policies';
export const getTermsPolicies = (search: TermsPolicySearch, page: number, size: number) =>
  apiGet<PageResponse<TermsPolicyItem>>(TERMS_BASE, { ...search, page, size });
export const getTermsPolicy = (termsId: string) => apiGet<TermsPolicyDetail>(`${TERMS_BASE}/${termsId}`);
export const createTermsPolicy = (req: TermsPolicyRequest) => apiPost<TermsPolicyDetail>(TERMS_BASE, req);
export const updateTermsPolicy = (termsId: string, req: TermsPolicyRequest) =>
  apiPut<TermsPolicyDetail>(`${TERMS_BASE}/${termsId}`, req);
export const publishTermsPolicies = (termsIds: string[], published: 'Y' | 'N') =>
  apiPatch<number>(`${TERMS_BASE}/publish`, { termsIds, published });
export const deleteTermsPolicies = (termsIds: string[]) => apiDelete<number>(TERMS_BASE, { termsIds });
