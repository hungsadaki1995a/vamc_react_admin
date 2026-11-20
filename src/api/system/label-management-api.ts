import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// ── i18n Label Management (menu A06040300 / screen SYS050301SC) ──────────────
// A label is identified by (SCRN_ID, LBL_SE_CD, LBL_CD); LBL_CD is the label key as stored.
// App-wide label lookup (`/api/lbl/bulk`) stays in `@/api/common/label-bulk-api`.

/** Default language: required, shown on user screens when another language is empty. */
export const DEFAULT_LANG_CD = 'VN';

/** Screen ID of labels with the Common scope. */
export const COMMON_SCREEN_ID = 'COM';

export interface LabelKey {
  scrnId: string;
  lblSeCd: string;
  lblCd: string;
}

export interface LabelTranslation {
  langCd: string;
  langNm?: string;
  trslLtr?: string | null;
  mdfcnDt?: string;
}

export interface LabelListItem extends LabelKey {
  /** W / A — not returned until the SYS_SE_CD column exists. */
  sysSeCd?: string | null;
  /** B = Business, C = Common (SCRN_ID = COM). */
  scopeCd: 'B' | 'C' | string;
  lblKey: string;
  lblExpln?: string;
  useYn?: string;
  /** Number of active languages with empty text. */
  missingCnt: number;
  mdfcnDt?: string;
  mdfcnBy?: string;
  translations: LabelTranslation[];
}

export interface LabelDetail extends LabelKey {
  useYn?: string;
  lblExpln?: string;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
  translations: LabelTranslation[];
}

export interface LabelSearch {
  /** W / A; any value returns an empty page until the schema change. */
  sysSeCd?: string;
  /** Partial match on the label key. */
  lblKey?: string;
  /** Partial match on description and text of every language. */
  keyword?: string;
  /** Only labels with at least one empty language. */
  missingOnly?: boolean;
}

export interface LabelSaveRequest extends LabelKey {
  lblExpln?: string;
  /** Omit to keep stored texts (description-only edit); a blank non-default text removes that language. */
  translations?: { langCd: string; trslLtr: string }[];
}

export interface LabelLanguage {
  langCd: string;
  langNm: string;
  useYn: string;
  sortSeq?: number;
}

export interface LabelCacheReloadResult {
  caches: string[];
  reloadedAt?: string;
}

export interface LabelExcelRowError {
  row: number;
  col?: string;
  header?: string;
  value?: string;
  message: string;
}

/** Upload result; `success=false` means nothing was saved (header or row errors). */
export interface LabelExcelUploadResult {
  success: boolean;
  totalRows: number;
  failRows: number;
  errors?: LabelExcelRowError[];
}

const BASE = '/api/v1/labels';

export const getLabels = (search: LabelSearch, page: PageQuery) =>
  apiGet<PageResponse<LabelListItem>>(BASE, { ...search, missingOnly: search.missingOnly || undefined, ...page });

export const getLabelDetail = (key: LabelKey) => apiGet<LabelDetail>(`${BASE}/detail`, key);

/** 409 LBL002 duplicate, 400 LBL004 menu screen, LBL005 / LBL006 only when translations are sent. */
export const createLabel = (body: LabelSaveRequest) => apiPost<LabelDetail>(BASE, body);

/** Null fields keep stored values; 400 LBL005 empty default text, LBL006 variables differ. */
export const updateLabel = (body: LabelSaveRequest) => apiPut<LabelDetail>(BASE, body);

/** Clears the admin label caches (the client app expires its own). */
export const reloadLabelCache = () => apiPost<LabelCacheReloadResult>(`${BASE}/cache/reload`);

export const downloadLabelsExcel = (search: LabelSearch) =>
  apiDownload(`${BASE}/excel`, 'labels.xlsx', { ...search, missingOnly: search.missingOnly || undefined });

/** Bulk text edit from the downloaded layout; 400 LBL007 (> 10,000 rows) / LBL008 (> 5 MB). */
export const uploadLabelsExcel = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return apiPost<LabelExcelUploadResult>(`${BASE}/excel/upload`, form);
};

/** All languages (including unused ones). */
export const getLabelLanguages = () => apiGet<LabelLanguage[]>('/api/v1/languages');

/**
 * Deletes a label and its translations.
 * TODO(api): no v1 delete endpoint exists yet — uses the legacy `DELETE /api/lbl`.
 */
export async function deleteLabel(key: LabelKey): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<{ status?: number; message?: string }>('/api/lbl', { params: key });
  return { status: data.status, success: data.status === 200, message: data.message ?? '', data: null };
}
