import { apiClient } from '@/lib/api/client';
import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// Form Management API (VPA004001 / VPA0040P01, guard menu A06010200, table FORM_MNG).
//
// ⚠️ NOT IMPLEMENTED IN THE ADMIN BACKEND YET. There is no controller / service /
//    mapper for FORM_MNG, and no upload endpoint that creates an ATCH_FILE group for
//    a form. The paths and fields below follow the planned contract in
//    `vamc-analysis-tracker/admin/07-system-operation/VPA004001.md` and `VPA0040P01.md`.
//    Re-check every signature once the backend lands.

/** COM_CD FORM_SE_CD — APFR application form, CTFR contract agreement, STFR statistical report. */
export type FormCategory = 'APFR' | 'CTFR' | 'STFR';
export type FormLang = 'VN' | 'EN';

export interface FormItem {
  formNo: string;
  langCd: FormLang;
  formNm: string;
  formSeCd: FormCategory;
  useYn: 'Y' | 'N';
  fileUnqId?: string;
  fileNm?: string;
  fileExtnNm?: string;
  fileSz?: number;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
  mdfcnByNm?: string;
}

export interface FormSearch {
  /** dd/MM/yyyy */
  crtDtFrom?: string;
  crtDtTo?: string;
  useYn?: 'Y' | 'N';
  langCd?: FormLang;
  /** LIKE */
  formNm?: string;
}

export interface FormSaveRequest {
  formNo: string;
  langCd: FormLang;
  formNm: string;
  formSeCd: FormCategory;
  useYn: 'Y' | 'N';
  /** ATCH_FILE group of the uploaded file; optional on update (keeps the current file). */
  fileUnqId?: string;
}

const BASE = '/api/v1/forms';

export const getForms = (search: FormSearch, page: number, size: number) =>
  apiGet<PageResponse<FormItem>>(BASE, { ...search, page, size });

export const getForm = (formNo: string, langCd: string) =>
  apiGet<FormItem>(`${BASE}/${encodeURIComponent(formNo)}/${langCd}`);

export const createForm = (request: FormSaveRequest) => apiPost<void>(BASE, request);

export const updateForm = (request: FormSaveRequest) =>
  apiPut<void>(`${BASE}/${encodeURIComponent(request.formNo)}/${request.langCd}`, request);

export const deleteForms = (items: Array<Pick<FormItem, 'formNo' | 'langCd'>>) =>
  apiDelete<void>(BASE, { items });

export const downloadFormFile = (form: Pick<FormItem, 'formNo' | 'langCd' | 'fileNm'>) =>
  apiDownload(
    `${BASE}/${encodeURIComponent(form.formNo)}/${form.langCd}/file`,
    form.fileNm ?? `${form.formNo}_${form.langCd}`,
  );

/** Planned shared upload — `POST /api/v1/attachments` (multipart part `file`) → fileUnqId. */
export async function uploadFormFile(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await apiClient.post<{ data?: { fileUnqId?: string } }>('/api/v1/attachments', body);
  const fileUnqId = data.data?.fileUnqId;
  if (!fileUnqId) throw new Error('Upload did not return a file id.');
  return fileUnqId;
}
