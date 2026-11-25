import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { useApiTask } from '@/hooks/use-api-action';
import {
  deleteFaqs,
  getFaqs,
  type PostResponse,
  type PageResponsePostResponse,
  type PageRequest,
  type PostSearchRequest,
} from '@/api/contents/faq-api';
import type { FaqItem } from './faq.types';

// ── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_FAQ_CATEGORY = 'FAQS';

export const FAQ_KEYS = {
  all: ['contents', 'faqs'] as const,
  details: ['faq-detail'] as const,
  detail: (pstNo?: string) => ['faq-detail', pstNo] as const,
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseFaqsParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  category?: string;  // FAQ_CTGRY_CD code; empty or 'ALL' = every category
  fromDate?: string;  // 'DD/MM/YYYY'; empty = no lower bound
  toDate?: string;    // 'DD/MM/YYYY'; empty = no upper bound
  published?: string; // '' for All, 'Y' for Posted, 'N' for Not Posted
  keyword?: string;   // optional search keyword
}

export interface UseFaqsResult {
  items: FaqItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  raw?: PageResponsePostResponse;
}

// ── Spring MVC Query Serializer ──────────────────────────────────────────────

export const springQuerySerializer = (queryParams: unknown): string => {
  if (!queryParams || typeof queryParams !== 'object') return '';
  const searchParams = new URLSearchParams();

  const appendParam = (key: string, val: unknown) => {
    if (val === undefined || val === null || val === '') return;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      });
    } else {
      searchParams.append(key, String(val));
    }
  };

  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subVal] of Object.entries(value)) {
        appendParam(subKey, subVal);
      }
    } else {
      appendParam(key, value);
    }
  }

  return searchParams.toString();
};

// ── Helper Mappers ───────────────────────────────────────────────────────────

export function mapFaqResponseToItem(
  res: PostResponse,
  index: number,
  page = 1,
  pageSize = 15,
  total?: number,
): FaqItem {
  const rowNo = total && total > 0
    ? total - ((page - 1) * pageSize + index)
    : (page - 1) * pageSize + index + 1;
  const publishedFlag = res.published || 'N';
  return {
    no: rowNo,
    id: res.pstNo ? String(res.pstNo) : `faq-${rowNo}`,
    pstNo: res.pstNo,
    category: res.category || DEFAULT_FAQ_CATEGORY,
    categoryNm: res.categoryNm || res.category || DEFAULT_FAQ_CATEGORY,
    title: res.title || '-',
    published: publishedFlag,
    statusLabel: publishedFlag === 'Y' ? 'Published' : 'Unpublished',
    displayOrder: res.displayOrder ?? undefined,
    hasEnglish: res.hasEnglish,
    viewCount: res.viewCount ?? 0,
    crtDt: res.crtDt || '-',
    crtBy: res.crtBy,
    crtByNm: res.crtByNm || res.crtBy || '-',
    mdfcnDt: res.mdfcnDt || null,
    mdfcnBy: res.mdfcnBy || null,
    mdfcnByNm: res.mdfcnByNm || res.mdfcnBy || null,
  };
}

// ── Build Query Params ───────────────────────────────────────────────────────

export function buildFaqQueryParams(params: UseFaqsParams): {
  pageRequest: PageRequest;
  cond: PostSearchRequest;
} {
  const pageRequest: PageRequest = {
    page: params.page ?? 1,
    size: params.pageSize ?? 15,
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortDirection ? { sortDirection: params.sortDirection } : {}),
  };

  // Search conditions:
  // 1. category: one FAQ_CTGRY_CD code, or none for all categories
  // 2. fromDate / toDate: registration period, only when the user picks one
  const cond: PostSearchRequest = {
    // category is an exact match on FAQ_CTGRY_CD — leave it out to list every category.
    ...(params.category && params.category !== 'ALL' ? { category: params.category } : {}),
    ...(params.fromDate ? { fromDate: params.fromDate } : {}),
    ...(params.toDate ? { toDate: params.toDate } : {}),
    ...(params.published && params.published !== 'ALL' ? { published: params.published } : {}),
    ...(params.keyword?.trim() ? { keyword: params.keyword.trim() } : {}),
  };

  return { pageRequest, cond };
}

// ── Custom Hook: useFaqs ─────────────────────────────────────────────────────

export function useFaqs(
  params: UseFaqsParams,
  options?: { enabled?: boolean },
): UseQueryResult<UseFaqsResult, Error> & {
  items: FaqItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const { pageRequest, cond } = buildFaqQueryParams(params);

  const queryResult = useQuery<UseFaqsResult, Error>({
    queryKey: [...FAQ_KEYS.all, pageRequest, cond],
    queryFn: async (): Promise<UseFaqsResult> => {
      // Errors surface to the caller — no mock fallback, so an API failure is visible.
      const response = await getFaqs({
        query: { pageRequest, cond },
        querySerializer: springQuerySerializer,
        throwOnError: true,
      });

      const pageData: PageResponsePostResponse | undefined = response.data?.data;
      const rawContent: PostResponse[] = pageData?.content ?? [];
      const currentPage = pageData?.page ?? pageRequest.page ?? 1;
      const currentSize = pageData?.size ?? pageRequest.size ?? 15;
      const total = pageData?.totalElements ?? rawContent.length;
      const items: FaqItem[] = rawContent.map((item, idx) =>
        mapFaqResponseToItem(item, idx, currentPage, currentSize, total),
      );

      return {
        items,
        total,
        page: currentPage,
        pageSize: currentSize,
        totalPages: pageData?.totalPages ?? Math.ceil(total / (currentSize || 1)),
        raw: pageData,
      };
    },
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });

  return {
    ...queryResult,
    items: queryResult.data?.items ?? [],
    total: queryResult.data?.total ?? 0,
    page: queryResult.data?.page ?? (params.page ?? 1),
    pageSize: queryResult.data?.pageSize ?? (params.pageSize ?? 15),
    totalPages: queryResult.data?.totalPages ?? 0,
  };
}


// ── Custom Hook: useDeleteFaqs ───────────────────────────────────────────────

/** Deletes the given FAQs (pstNos) and refreshes the list. */
export function useDeleteFaqs() {
  return useApiTask((pstNos: string[]) => deleteFaqs({ body: { pstNos }, throwOnError: true }), {
    invalidate: [FAQ_KEYS.all],
  });
}
