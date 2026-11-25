import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import { createForm, downloadFormExcel, getForms, updateForm } from '@/api/system/form-api';
import type { FormItem, FormSaveRequest, FormSearch, FormSort } from '@/api/system/form-api';

// Data hooks of Form Management (VPA09010201 / VPA090102P01).

const FORM_KEYS = {
  all: ['system', 'forms'] as const,
  list: (search: FormSearch, query: PageQuery) => ['system', 'forms', 'list', search, query] as const,
};

/** Paged form list (20 rows; default server order is the form number unless `sortBy` is set). */
export function useForms(search: FormSearch, query: PageQuery) {
  return useApiQuery<PageResponse<FormItem>>(FORM_KEYS.list(search, query), () => getForms(search, query), {
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

/** [Excel Download] of the searched list in the current sort. */
export function useDownloadFormExcel() {
  return useApiDownload(({ search, sort }: { search: FormSearch; sort: FormSort }) => downloadFormExcel(search, sort));
}
