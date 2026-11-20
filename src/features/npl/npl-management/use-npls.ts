import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { getNpl, getNpls } from '@/api/npl/npl-api';
import type { NplItem, NplSearch } from '@/api/npl/npl-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of NPL Management — the screen never calls the API itself.

const NPL_KEYS = {
  all: ['npl', 'npls'] as const,
  list: (search: NplSearch, page: number, size: number) => ['npl', 'npls', 'list', search, page, size] as const,
  detail: (bndCd: string | null) => ['npl', 'npls', 'detail', bndCd] as const,
};

/** Paged NPL list. */
export function useNpls(search: NplSearch, page: number, size: number) {
  return useApiQuery<PageResponse<NplItem>>(NPL_KEYS.list(search, page, size), () => getNpls(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One NPL; skipped while `bndCd` is empty. */
export function useNpl(bndCd: string | null) {
  return useApiQuery<NplItem>(NPL_KEYS.detail(bndCd), () => getNpl(bndCd as string), { enabled: !!bndCd });
}
