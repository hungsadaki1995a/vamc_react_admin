import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  createForm,
  deleteForms,
  downloadFormFile,
  getForms,
  updateForm,
  uploadFormFile,
} from '@/api/system/form-api';
import type { FormItem, FormSaveRequest, FormSearch } from '@/api/system/form-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Form Management (VPA004001 / VPA0040P01).

const FORM_KEYS = {
  all: ['system', 'forms'] as const,
  list: (search: FormSearch, page: number, size: number) => ['system', 'forms', 'list', search, page, size] as const,
};

/** Paged form list. */
export function useForms(search: FormSearch, page: number, size: number) {
  return useApiQuery<PageResponse<FormItem>>(FORM_KEYS.list(search, page, size), () => getForms(search, page, size), {
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useDeleteForms() {
  return useApiAction(deleteForms, { invalidate: [FORM_KEYS.all] });
}

export interface SaveFormVariables {
  isCreate: boolean;
  /** Form row without the file reference. */
  request: Omit<FormSaveRequest, 'fileUnqId'>;
  /** New file to attach; omitted keeps the stored one. */
  file?: File | null;
}

/** Uploads the file (if any), then registers / edits the form row referencing it. */
export function useSaveForm() {
  return useApiTask(
    async ({ isCreate, request, file }: SaveFormVariables) => {
      const fileUnqId = file ? await uploadFormFile(file) : undefined;
      const body = { ...request, fileUnqId };
      return isCreate ? createForm(body) : updateForm(body);
    },
    { invalidate: [FORM_KEYS.all] },
  );
}

export function useDownloadFormFile() {
  return useApiTask(downloadFormFile);
}
