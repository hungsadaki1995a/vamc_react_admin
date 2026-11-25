import { useCallback, useMemo, useState } from 'react';
import type { PageQuery, SortDirection } from '@/api/common/api-utils';
import { SYS_PAGE_SIZE } from '@/config/sys-constants';

// Search / paging / sort state of a v0.8 list screen.
// The filter panel edits `draft`; [Search] copies it to `applied` and returns to page 1.
// Page moves keep the applied filter and the sort ("Search conditions and sort are kept").

export interface SortState {
  sortBy: string;
  sortDirection: SortDirection;
}

export interface PagedListState<F> {
  /** Values bound to the filter inputs. */
  draft: F;
  /** Values of the last [Search] — build the query from these. */
  applied: F;
  page: number;
  sort?: SortState;
  /** `page` / `size` / `sortBy` / `sortDirection` for the list call. */
  pageQuery: PageQuery;
  setDraft: (patch: Partial<F>) => void;
  /** [Search]: applies the draft (optionally patched first) and goes to page 1. */
  search: (patch?: Partial<F>) => void;
  /** [Reset]: restores the initial filter, page 1, default sort. */
  reset: () => void;
  setPage: (page: number) => void;
  setSort: (sort?: SortState) => void;
}

/**
 * @param initialFilter value or factory (e.g. a default date range computed on mount).
 * @example
 * const list = usePagedList<FormFilter>({ useYn: '', langCd: '', formNm: '' });
 * const { data } = useForms(toFormSearch(list.applied), list.pageQuery);
 */
export function usePagedList<F>(
  initialFilter: F | (() => F),
  { pageSize = SYS_PAGE_SIZE, defaultSort }: { pageSize?: number; defaultSort?: SortState } = {},
): PagedListState<F> {
  const [initial] = useState(initialFilter);
  const [draft, setDraftState] = useState<F>(initial);
  const [applied, setApplied] = useState<F>(initial);
  const [page, setPage] = useState(1);
  const [sort, setSortState] = useState<SortState | undefined>(defaultSort);

  const setDraft = useCallback((patch: Partial<F>) => setDraftState((prev) => ({ ...prev, ...patch })), []);

  const search = useCallback(
    (patch?: Partial<F>) => {
      const next = patch ? { ...draft, ...patch } : draft;
      if (patch) setDraftState(next);
      setApplied(next);
      setPage(1);
    },
    [draft],
  );

  const reset = useCallback(() => {
    setDraftState(initial);
    setApplied(initial);
    setPage(1);
    setSortState(defaultSort);
  }, [initial, defaultSort]);

  const setSort = useCallback((next?: SortState) => {
    setSortState(next);
    setPage(1);
  }, []);

  const pageQuery = useMemo<PageQuery>(
    () => ({ page, size: pageSize, sortBy: sort?.sortBy, sortDirection: sort?.sortDirection }),
    [page, pageSize, sort],
  );

  return { draft, applied, page, sort, pageQuery, setDraft, search, reset, setPage, setSort };
}
