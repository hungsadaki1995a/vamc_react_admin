import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';

import {
  getInquiries,
  type InquiryResponse,
  type PageResponseInquiryResponse,
  type PageRequest,
  type InquirySearchRequest,
} from '@/api/contents/inquiryApi';
import type { InquiryItem } from './inquiry.types';
import { initialInquiryData } from './inquiry.mock';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseInquiriesParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  answerStatus?: string; // empty string for All, 'ANSWERED', 'UNANSWERED'
  category?: string;     // empty string for All, 'CST', 'ETC', etc.
  fromDate?: string;     // 'DD/MM/YYYY' (default 30 days from today)
  toDate?: string;       // 'DD/MM/YYYY' (default current day)
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

export function mapInquiryResponseToItem(res: InquiryResponse, index: number, page = 1, pageSize = 15): InquiryItem {
  const rowNo = (page - 1) * pageSize + index + 1;
  return {
    no: rowNo,
    id: res.pstNo ? String(res.pstNo) : `inq-${rowNo}`,
    pstNo: res.pstNo,
    answerStatus: res.answerStatus || 'UNANSWERED',
    status: res.answerStatus === 'ANSWERED' ? 'Completed' : 'Unanswered',
    category: res.category,
    categoryNm: res.categoryNm || (res.category === 'CST' ? 'Consulting' : 'General'),
    inquiryType: (res.categoryNm || res.category === 'CST' ? 'Consulting' : 'General'),
    title: res.title || "The user's inquiry will be displayed.",
    content: res.title || '',
    registeredCustomer: res.inquirerNm || res.mbrNo || 'Member ID',
    mbrNo: res.mbrNo,
    inquirerNm: res.inquirerNm,
    registrationDate: res.crtDt || dayjs().format('DD/MM/YYYY HH:mm:ss'),
    crtDt: res.crtDt,
    responseDate: res.answeredAt || null,
    answeredAt: res.answeredAt || null,
    responder: res.ansEmpNm || (res.ansEmpNo ? `Emp #${res.ansEmpNo}` : null),
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
    answerStatus: params.answerStatus ? params.answerStatus : undefined,
    category: params.category ? params.category : undefined,
    fromDate: params.fromDate || dayjs().subtract(30, 'day').format('DD/MM/YYYY'),
    toDate: params.toDate || dayjs().format('DD/MM/YYYY'),
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
    queryKey: ['contents', 'inquiries', pageRequest, cond],
    queryFn: async (): Promise<UseInquiriesResult> => {
      try {
        const response = await getInquiries({
          query: {
            pageRequest,
            cond,
          },
          querySerializer: springQuerySerializer,
          throwOnError: true,
        });

        if (response.data?.status && response.data.status >= 400) {
          throw new Error(response.data.message || 'Failed to fetch inquiries');
        }

        const pageData: PageResponseInquiryResponse | undefined = response.data?.data;
        const rawContent: InquiryResponse[] = pageData?.content
          ?? (Array.isArray(pageData) ? pageData : []);

        const currentPage = pageData?.page ?? pageRequest.page ?? 1;
        const currentSize = pageData?.size ?? pageRequest.size ?? 15;
        const items: InquiryItem[] = rawContent.map((item, idx) =>
          mapInquiryResponseToItem(item, idx, currentPage, currentSize)
        );
        const total = pageData?.totalElements ?? items.length;
        const totalPages = pageData?.totalPages ?? Math.ceil(total / (currentSize || 1));

        return {
          items,
          total,
          page: currentPage,
          pageSize: currentSize,
          totalPages,
          raw: pageData,
        };
      } catch (err) {
        // Fallback for development if API is unreachable
        console.warn('getInquiries API call failed or offline, falling back to mock data:', err);
        const currentPage = pageRequest.page ?? 1;
        const currentSize = pageRequest.size ?? 15;

        let filtered = [...initialInquiryData];
        if (cond.answerStatus && cond.answerStatus !== 'ALL') {
          const targetStatus = cond.answerStatus === 'ANSWERED' ? 'Completed' : 'Unanswered';
          filtered = filtered.filter(
            (item) => item.status === targetStatus || item.answerStatus === cond.answerStatus
          );
        }

        if (cond.category && cond.category !== 'ALL') {
          const targetType = cond.category === 'CST' ? 'Consulting' : 'General';
          filtered = filtered.filter(
            (item) => item.inquiryType === targetType || item.category === cond.category
          );
        }

        const total = filtered.length;
        const start = (currentPage - 1) * currentSize;
        const pagedMock: InquiryItem[] = filtered.slice(start, start + currentSize).map((item, idx) => ({
          ...item,
          no: start + idx + 1,
          answerStatus: item.status === 'Completed' ? 'ANSWERED' : 'UNANSWERED',
          categoryNm: item.inquiryType,
          category: item.inquiryType === 'Consulting' ? 'CST' : 'ETC',
          crtDt: item.registrationDate,
          answeredAt: item.responseDate,
          ansEmpNm: item.responder,
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
