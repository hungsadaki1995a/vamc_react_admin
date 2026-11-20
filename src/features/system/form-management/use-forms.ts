import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  FORM_API_AVAILABLE,
  createForm,
  downloadFormExcel,
  getForms,
  updateForm,
} from '@/api/system/form-api';
import type { FormItem, FormSaveRequest, FormSearch } from '@/api/system/form-api';

// Data hooks of Form Management (VPA09010201 / VPA090102P01).
// The backend has no form API yet: queries stay disabled while FORM_API_AVAILABLE is false.

const FORM_KEYS = {
  all: ['system', 'forms'] as const,
  list: (search: FormSearch, query: PageQuery) => ['system', 'forms', 'list', search, query] as const,
};

/** Paged form list (20 rows). */
export function useForms(search: FormSearch, query: PageQuery) {
  return useApiQuery<PageResponse<FormItem>>(FORM_KEYS.list(search, query), () => getForms(search, query), {
    enabled: FORM_API_AVAILABLE,
    placeholderData: keepPreviousData,
  });
}

export interface SaveFormVariables {
  isCreate: boolean;
  request: FormSaveRequest;
}

/** Registers or edits a form. */
export function useSaveForm() {
  return useApiAction(
    ({ isCreate, request }: SaveFormVariables) => (isCreate ? createForm(request) : updateForm(request)),
    { invalidate: [FORM_KEYS.all] },
  );
}

/** [Excel Download] of the searched list. */
export function useDownloadFormExcel() {
  return useApiDownload((search: FormSearch) => downloadFormExcel(search));
}
