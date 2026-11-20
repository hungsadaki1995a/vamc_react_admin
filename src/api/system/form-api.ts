import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Form Management API (VPA09010201 / VPA090102P01, guard menu A06010200, table FORM_MNG).
//
// NOT IMPLEMENTED IN THE ADMIN BACKEND YET: no controller exists and FORM_MNG has no URL column
// (waits for the FORM_FILE_URL DDL). Paths and fields follow the planned contract in
// `vamc-analysis-tracker/admin/07-system-operation/figma-v08/01-platform.md` §2.4.
// The screen checks FORM_API_AVAILABLE and never calls these functions while it is false.

/** Flip to true once `/api/v1/platform/forms` is deployed. TODO(api) */
export const FORM_API_AVAILABLE = false;

export type FormLang = 'VN' | 'EN';
export type YesNo = 'Y' | 'N';

export interface FormItem {
  /** 4 digits, primary key. */
  formNo: string;
  useYn: YesNo;
  langCd: FormLang;
  formNm: string;
  /** https URL of a docx / xlsx / pdf file. */
  fileUrl: string;
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

/** Planned error codes: FRM001 not found, FRM002 duplicate form no. (E02), FRM003 invalid URL (E03). */
export const FORM_ERRORS = { notFound: 'FRM001', duplicate: 'FRM002', invalidUrl: 'FRM003' } as const;

const BASE = '/api/v1/platform/forms';

// TODO(api) GET /platform/forms
export const getForms = (search: FormSearch, query: PageQuery) =>
  apiGet<PageResponse<FormItem>>(BASE, { ...search, ...query });

// TODO(api) GET /platform/forms/{formNo}
export const getForm = (formNo: string) => apiGet<FormItem>(`${BASE}/${encodeURIComponent(formNo)}`);

// TODO(api) POST /platform/forms
export const createForm = (request: FormSaveRequest) => apiPost<FormItem>(BASE, request);

// TODO(api) PUT /platform/forms/{formNo}
export const updateForm = (request: FormSaveRequest) =>
  apiPut<FormItem>(`${BASE}/${encodeURIComponent(request.formNo)}`, request);

// TODO(api) GET /platform/forms/excel
export const downloadFormExcel = (search: FormSearch) => apiDownload(`${BASE}/excel`, 'forms.xlsx', search);
