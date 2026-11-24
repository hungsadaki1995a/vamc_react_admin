import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  getInquiries,
  type InquiryResponse,
  type PageResponseInquiryResponse,
  type PageRequest,
  type InquirySearchRequest,
} from '@/api/contents/inquiry-api';
import type { InquiryItem } from './inquiry.types';

export const INQUIRY_KEYS = {
  all: ['contents', 'inquiries'] as const,
  details: ['inquiry-detail'] as const,
  detail: (pstNo?: string) => ['inquiry-detail', pstNo] as const,
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseInquiriesParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  answerStatus?: string; // empty string for All, 'ANSWERED', 'UNANSWERED'
  category?: string;     // empty string for All, 'CST', 'ETC', etc.
  fromDate?: string;     // 'DD/MM/YYYY'; empty = no lower bound
  toDate?: string;       // 'DD/MM/YYYY'; empty = no upper bound
  keyword?: string;      // empty string
}

export interface UseInquiriesResult {
  items: InquiryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  raw?: PageResponseInquiryResponse;
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

export function mapInquiryResponseToItem(
  res: InquiryResponse,
  index: number,
  page = 1,
  pageSize = 15,
  total = 0,
): InquiryItem {
  // Newest first: the row number counts down from the total, as in the wireframe.
  const offset = (page - 1) * pageSize + index;
  const rowNo = total > 0 ? total - offset : offset + 1;
  const typeName = res.categoryNm || res.category || '-';
  return {
    no: rowNo,
    id: res.pstNo ? String(res.pstNo) : `inq-${rowNo}`,
    pstNo: res.pstNo,
    answerStatus: res.answerStatus || 'UNANSWERED',
    status: res.answerStatus === 'ANSWERED' ? 'Completed' : 'Unanswered',
    category: res.category,
    categoryNm: typeName,
    inquiryType: typeName,
    title: res.title || '-',
    content: '',
    registeredCustomer: res.inquirerNm || res.mbrNo || '-',
    mbrNo: res.mbrNo,
    inquirerNm: res.inquirerNm,
    registrationDate: res.crtDt || '-',
    crtDt: res.crtDt,
    responseDate: res.answeredAt || null,
    answeredAt: res.answeredAt || null,
    responder: res.ansEmpNm || res.ansEmpNo || null,
    ansEmpNm: res.ansEmpNm || null,
    ansEmpNo: res.ansEmpNo,
  };
}

// ── Build Query Params ───────────────────────────────────────────────────────

export function buildInquiryQueryParams(params: UseInquiriesParams): {
  pageRequest: PageRequest;
  cond: InquirySearchRequest;
} {
  const pageRequest: PageRequest = {
    page: params.page ?? 1,
    size: params.pageSize ?? 15,
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortDirection ? { sortDirection: params.sortDirection } : {}),
  };

  const cond: InquirySearchRequest = {
    // The server defaults a missing answerStatus to UNANSWERED, so "all" must be explicit.
    answerStatus: params.answerStatus || 'ALL',
    // category is an exact match on INQRY_SE_CD — "ALL" means no filter.
    category: params.category && params.category !== 'ALL' ? params.category : undefined,
    // Design: no default registration period.
    fromDate: params.fromDate || undefined,
    toDate: params.toDate || undefined,
    keyword: params.keyword?.trim() ? params.keyword.trim() : undefined,
  };

  return { pageRequest, cond };
}

// ── Custom Hook: useInquiries ────────────────────────────────────────────────

export function useInquiries(
  params: UseInquiriesParams,
  options?: { enabled?: boolean },
): UseQueryResult<UseInquiriesResult, Error> & {
  items: InquiryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const { pageRequest, cond } = buildInquiryQueryParams(params);

  const queryResult = useQuery<UseInquiriesResult, Error>({
    queryKey: [...INQUIRY_KEYS.all, pageRequest, cond],
    queryFn: async (): Promise<UseInquiriesResult> => {
      // Errors surface to the caller — no mock fallback, so an API failure is visible.
      const response = await getInquiries({
        query: { pageRequest, cond },
        querySerializer: springQuerySerializer,
        throwOnError: true,
      });

      const pageData: PageResponseInquiryResponse | undefined = response.data?.data;
      const rawContent: InquiryResponse[] = pageData?.content ?? [];
      const currentPage = pageData?.page ?? pageRequest.page ?? 1;
      const currentSize = pageData?.size ?? pageRequest.size ?? 15;
      const total = pageData?.totalElements ?? rawContent.length;
      const items: InquiryItem[] = rawContent.map((item, idx) =>
        mapInquiryResponseToItem(item, idx, currentPage, currentSize, total),
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
