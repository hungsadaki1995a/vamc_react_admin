import { keepPreviousData } from '@tanstack/react-query';
import { useApiAction } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  createAboutHistory,
  deleteAboutHistory,
  getAboutHistories,
  getAboutHistory,
  updateAboutHistory,
} from '@/api/contents/about-page-api';
import type { AboutHistory, AboutHistoryRequest } from '@/api/contents/about-page-api';

// Data hooks of History Management (VPA07100201 / VPA071002P01) — the screen never calls the API itself.

const HISTORY_KEYS = {
  all: ['contents', 'about-pages', 'history'] as const,
  list: (query: PageQuery) => ['contents', 'about-pages', 'history', 'list', query] as const,
  detail: (pstNo: string | null) => ['contents', 'about-pages', 'history', 'detail', pstNo] as const,
};

/** Paged history list (default sort: year ascending, as on the user timeline). */
export function useAboutHistories(query: PageQuery) {
  return useApiQuery<PageResponse<AboutHistory>>(HISTORY_KEYS.list(query), () => getAboutHistories(query), {
    placeholderData: keepPreviousData,
  });
}

/** One item for the edit popup; skipped while `pstNo` is null (register). */
export function useAboutHistory(pstNo: string | null) {
  return useApiQuery<AboutHistory>(HISTORY_KEYS.detail(pstNo), () => getAboutHistory(pstNo as string), {
    enabled: pstNo !== null,
    gcTime: 0,
  });
}

export interface SaveAboutHistoryVariables {
  /** null = register. */
  pstNo: string | null;
  request: AboutHistoryRequest;
}

/** [Register] / [Edit]. */
export function useSaveAboutHistory() {
  return useApiAction(
    ({ pstNo, request }: SaveAboutHistoryVariables) =>
      pstNo === null ? createAboutHistory(request) : updateAboutHistory(pstNo, request),
    { invalidate: [HISTORY_KEYS.all] },
  );
}

/** [Delete] after the C01 confirmation. */
export function useDeleteAboutHistory() {
  return useApiAction(deleteAboutHistory, { invalidate: [HISTORY_KEYS.all] });
}
