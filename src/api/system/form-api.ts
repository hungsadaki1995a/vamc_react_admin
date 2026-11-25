import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse, SortDirection } from '@/api/common/api-utils';

// Form Management API (VPA09010201 / VPA090102P01, guard menu A09010200, table FORM_MNG).

export type FormLang = 'VN' | 'EN';
export type YesNo = 'Y' | 'N';

export interface FormItem {
  /** 4 digits, primary key. */
  formNo: string;
  useYn: YesNo;
  langCd: FormLang;
  formNm: string;
  /** https URL of a docx / xlsx / pdf file; null for a seeded form whose URL is not supplied yet. */
  fileUrl: string | null;
  /** APFR application, CTFR contract, STFR statistical report (not on the v0.8 screen). */
  formSeCd?: string | null;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface FormSearch {
  useYn?: YesNo | '';
  langCd?: FormLang | '';
  /** Partial match. */
  formNm?: string;
}

export interface FormSaveRequest {
  formNo: string;
  langCd: FormLang;
  useYn: YesNo;
  /** Up to 100 characters. */
  formNm: string;
  /** `^https://\S+\.(docx|xlsx|pdf)$` (case-insensitive). */
  fileUrl: string;
}

export interface FormSort {
  sortBy?: string;
  sortDirection?: SortDirection;
}

/** FRM001 not found, FRM002 duplicate form no. (E02), FRM003 invalid file URL (E03). */
export const FORM_ERRORS = { notFound: 'FRM001', duplicate: 'FRM002', invalidUrl: 'FRM003' } as const;

const BASE = '/api/v1/platform/forms';

export const getForms = (search: FormSearch, query: PageQuery) =>
  apiGet<PageResponse<FormItem>>(BASE, { ...search, ...query });

export const getForm = (formNo: string) => apiGet<FormItem>(`${BASE}/${encodeURIComponent(formNo)}`);

export const createForm = (request: FormSaveRequest) => apiPost<FormItem>(BASE, request);

/** The form number cannot be changed: the path wins over the body. */
export const updateForm = (request: FormSaveRequest) =>
  apiPut<FormItem>(`${BASE}/${encodeURIComponent(request.formNo)}`, request);

/** Same filters and sort as the list. */
export const downloadFormExcel = (search: FormSearch, sort: FormSort) =>
  apiDownload(`${BASE}/excel`, 'forms.xlsx', { ...search, ...sort });
