import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  changeSloganUse,
  createSlogan,
  deleteSlogans,
  getSlogan,
  getSlogans,
  updateSlogan,
} from '@/api/contents/site-display-api';
import type { SloganRequest, SiteDisplaySearch } from '@/api/contents/site-display-api';
import type { Post, PostDetail } from '@/api/contents/post-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Slogan Management (menu A07060300) — the screen never calls the API itself.

const SLOGAN_KEYS = {
  all: ['contents', 'slogans'] as const,
  list: (search: SiteDisplaySearch, page: number, size: number) =>
    ['contents', 'slogans', 'list', search, page, size] as const,
  detail: (sloganId: string | null) => ['contents', 'slogans', 'detail', sloganId] as const,
};

/** Paged slogan list. */
export function useSlogans(search: SiteDisplaySearch, page: number, size: number) {
  return useApiQuery<PageResponse<Post>>(SLOGAN_KEYS.list(search, page, size), () => getSlogans(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One slogan; skipped while `sloganId` is null (register mode). */
export function useSlogan(sloganId: string | null) {
  return useApiQuery<PostDetail>(SLOGAN_KEYS.detail(sloganId), () => getSlogan(sloganId as string), {
    enabled: sloganId !== null,
    gcTime: 0,
  });
}

export interface ChangeSloganUseVariables {
  ids: string[];
  useYn: 'Y' | 'N';
}

/** Bulk use / unuse. */
export function useChangeSloganUse() {
  return useApiAction(({ ids, useYn }: ChangeSloganUseVariables) => changeSloganUse(ids, useYn), {
    invalidate: [SLOGAN_KEYS.all],
  });
}

export function useDeleteSlogans() {
  return useApiAction(deleteSlogans, { invalidate: [SLOGAN_KEYS.all] });
}

export interface SaveSloganVariables {
  /** null = register. */
  sloganId: string | null;
  request: SloganRequest;
}

/** Registers / edits a slogan. */
export function useSaveSlogan() {
  return useApiTask(
    ({ sloganId, request }: SaveSloganVariables) =>
      sloganId === null ? createSlogan(request) : updateSlogan(sloganId, request),
    { invalidate: [SLOGAN_KEYS.all] },
  );
}
