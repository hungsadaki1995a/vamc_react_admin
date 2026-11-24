import { useCallback } from 'react';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { useLabelStore } from '@/stores/label-store';
import type { ApiResponse } from '@/lib/api/types';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  createLabel,
  DEFAULT_LANG_CD,
  deleteLabel,
  downloadLabelsExcel,
  getLabelDetail,
  getLabelLanguages,
  getLabels,
  reloadLabelCache,
  updateLabel,
  uploadLabelsExcel,
} from '@/api/system/label-management-api';
import type {
  CreateLabelRequest,
  LabelCacheReloadResult,
  LabelDetail,
  LabelKey,
  LabelLanguage,
  LabelListItem,
  LabelSaveRequest,
  LabelSearch,
} from '@/api/system/label-management-api';

// Data hooks of i18n Label Management (menu A09040300).

const LABEL_KEYS = {
  all: ['system', 'labels'] as const,
  languages: ['system', 'labels', 'languages'] as const,
  list: (search: LabelSearch, page: PageQuery) => ['system', 'labels', 'list', search, page] as const,
  detail: (key: LabelKey | null) => ['system', 'labels', 'detail', key] as const,
};

/** Active languages, Tiếng Việt (default) first, then the server order. */
export function useLabelLanguages() {
  return useApiQuery<LabelLanguage[]>(
    LABEL_KEYS.languages,
    async () => {
      const response = await getLabelLanguages();
      const active = (response.data ?? [])
        .filter((lang) => lang.useYn === 'Y')
        .sort((a, b) => {
          if (a.langCd === DEFAULT_LANG_CD) return -1;
          if (b.langCd === DEFAULT_LANG_CD) return 1;
          return (a.sortSeq ?? 0) - (b.sortSeq ?? 0);
        });
      return { ...response, data: active };
    },
    { staleTime: 5 * 60 * 1000 },
  );
}

export function useLabels(search: LabelSearch, page: PageQuery) {
  return useApiQuery<PageResponse<LabelListItem>>(LABEL_KEYS.list(search, page), () => getLabels(search, page), {
    placeholderData: keepPreviousData,
  });
}

/** Text by Language of the selected label. */
export function useLabelDetail(key: LabelKey | null) {
  return useApiQuery<LabelDetail>(LABEL_KEYS.detail(key), () => getLabelDetail(key as LabelKey), {
    enabled: key !== null,
  });
}

/** After a write: refetch list / detail and reload this app's label map. */
function useAfterLabelWrite() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: LABEL_KEYS.all });
    void useLabelStore.getState().invalidateLabelCache();
  }, [queryClient]);
}

function useLabelAction<TData, TVariables = void>(action: (variables: TVariables) => Promise<ApiResponse<TData>>) {
  const afterWrite = useAfterLabelWrite();
  const mutation = useApiAction<TData, TVariables>(action);
  const { mutateAsync } = mutation;
  const run = useCallback(
    async (variables: TVariables) => {
      const response = await mutateAsync(variables);
      afterWrite();
      return response;
    },
    [mutateAsync, afterWrite],
  );
  return { run, isPending: mutation.isPending };
}

export const useCreateLabel = () => useLabelAction((body: CreateLabelRequest) => createLabel(body));

/** Description-only edit (popup) or text save (Text by Language). */
export const useUpdateLabel = () => useLabelAction((body: LabelSaveRequest) => updateLabel(body));

export const useDeleteLabel = () => useLabelAction((key: LabelKey) => deleteLabel(key));

export const useUploadLabelsExcel = () => useLabelAction((file: File) => uploadLabelsExcel(file));

export const useReloadLabelCache = () => useLabelAction<LabelCacheReloadResult, void>(() => reloadLabelCache());

export function useDownloadLabels() {
  return useApiDownload((search: LabelSearch) => downloadLabelsExcel(search));
}
