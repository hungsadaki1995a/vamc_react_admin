import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
  getFaqs,
  type PostResponse,
  type PageResponsePostResponse,
  type PageRequest,
  type PostSearchRequest,
} from '@/api/contents/faqApi';
import type { FaqItem } from './faq.types';
import { initialFaqData } from './faq.mock';

// ── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_FAQ_CATEGORY = 'FAQS';
export const DEFAULT_FAQ_FROM_DATE = '01/10/2026';
export const getDefaultFaqToDate = () => dayjs().format('DD/MM/YYYY');

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseFaqsParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  category?: string;  // Default: 'FAQS'
  fromDate?: string;  // Default: '01/10/2026'
  toDate?: string;    // Default: current day ('DD/MM/YYYY')
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
    statusLabel: publishedFlag === 'Y' ? 'Posted' : 'Not Posted',
    displayOrder: res.displayOrder ?? index + 1,
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

  // Required API params:
  // 1. category is FAQS
  // 2. fromDate is 01/10/2026
  // 3. toDate is current day
  const cond: PostSearchRequest = {
    category: params.category || DEFAULT_FAQ_CATEGORY,
    fromDate: params.fromDate || DEFAULT_FAQ_FROM_DATE,
    toDate: params.toDate || getDefaultFaqToDate(),
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
    queryKey: ['contents', 'faqs', pageRequest, cond],
    queryFn: async (): Promise<UseFaqsResult> => {
      try {
        const response = await getFaqs({
          query: {
            pageRequest,
            cond,
          },
          querySerializer: springQuerySerializer,
          throwOnError: true,
        });

        if (response.data?.status && response.data.status >= 400) {
          throw new Error(response.data.message || 'Failed to fetch FAQs');
        }

        const pageData: PageResponsePostResponse | undefined = response.data?.data;
        const rawContent: PostResponse[] =
          pageData?.content ?? (Array.isArray(pageData) ? pageData : []);

        const currentPage = pageData?.page ?? pageRequest.page ?? 1;
        const currentSize = pageData?.size ?? pageRequest.size ?? 15;
        const total = pageData?.totalElements ?? rawContent.length;
        const totalPages = pageData?.totalPages ?? Math.ceil(total / (currentSize || 1));
        const items: FaqItem[] = rawContent.map((item, idx) =>
          mapFaqResponseToItem(item, idx, currentPage, currentSize, total),
        );

        return {
          items,
          total,
          page: currentPage,
          pageSize: currentSize,
          totalPages,
          raw: pageData,
        };
      } catch (err) {
        console.warn('getFaqs API call failed or offline, falling back to mock data:', err);
        const currentPage = pageRequest.page ?? 1;
        const currentSize = pageRequest.size ?? 15;

        let filtered = [...initialFaqData];

        if (cond.published && cond.published !== 'ALL') {
          filtered = filtered.filter((item) => item.published === cond.published);
        }

        if (cond.category && cond.category !== 'ALL' && cond.category !== DEFAULT_FAQ_CATEGORY) {
          const catUpper = cond.category.toUpperCase();
          filtered = filtered.filter(
            (item) =>
              (item.category && item.category.toUpperCase() === catUpper) ||
              (item.categoryNm && item.categoryNm.toUpperCase() === catUpper),
          );
        }

        if (cond.keyword) {
          const kw = cond.keyword.toLowerCase();
          filtered = filtered.filter(
            (item) =>
              item.title.toLowerCase().includes(kw) ||
              (item.pstNo && item.pstNo.toLowerCase().includes(kw)) ||
              (item.content && item.content.toLowerCase().includes(kw)),
          );
        }

        const total = filtered.length;
        const start = (currentPage - 1) * currentSize;
        const pagedMock: FaqItem[] = filtered.slice(start, start + currentSize).map((item, idx) => ({
          ...item,
          no: item.no ?? (total - start - idx),
        }));

        return {
          items: pagedMock,
          total,
          page: currentPage,
          pageSize: currentSize,
          totalPages: Math.ceil(total / currentSize),
        };
      }
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

