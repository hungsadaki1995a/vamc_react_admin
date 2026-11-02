import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getMembers } from '@/api/generated/sdk.gen';
import type {
  MemberResponse,
  PageResponseMemberResponse,
  PageRequest,
  MemberSearchRequest,
} from '@/api/generated/types.gen';
import type {
  MemberItem,
  MemberClassification,
  MemberType,
  ApprovalStatus,
  AccountStatus,
} from './member.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseMembersParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  classificationAll?: boolean;
  selectedClassifications?: MemberClassification[];
  memberTypeAll?: boolean;
  selectedMemberTypes?: MemberType[];
  accountStatusAll?: boolean;
  selectedAccountStatuses?: AccountStatus[];
  approvalStatusAll?: boolean;
  selectedApprovalStatuses?: ApprovalStatus[];
  memberName?: string;
  companyName?: string;
  memberCode?: string;
  phoneNumber?: string;
  email?: string;
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

export interface UseMembersResult {
  items: MemberItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  raw?: PageResponseMemberResponse;
}

// ── Query Serializer for Spring MVC ──────────────────────────────────────────

/**
 * Custom query serializer to flatten nested objects (pageRequest, searchRequest)
 * into standard Spring MVC `@ModelAttribute` query parameters:
 * e.g. `page=1&size=20&mbrNm=John&mbrClsCds=VERIFIED`
 */
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

function formatDate(val?: string): string {
  if (!val) return '-';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
  const d = dayjs(val);
  return d.isValid() ? d.format('DD/MM/YYYY') : val;
}

/**
 * Maps MemberResponse from OpenAPI to frontend MemberItem interface
 */
export function mapMemberResponseToItem(res: MemberResponse, index: number): MemberItem {
  // Classification
  const clsUpper = (res.mbrClsCd || '').toUpperCase();
  let memberClassification: MemberClassification = 'Verified';
  if (clsUpper.includes('APPROVAL') || clsUpper === 'PENDING_APPROVAL') {
    memberClassification = 'Pending (Approval)';
  } else if (clsUpper.includes('PAYMENT') || clsUpper === 'PENDING_PAYMENT') {
    memberClassification = 'Pending (Payment)';
  } else if (clsUpper.includes('REJECT') || clsUpper === 'REJECTED') {
    memberClassification = 'Rejected';
  } else if (clsUpper.includes('VERIF') || clsUpper === 'VERIFIED') {
    memberClassification = 'Verified';
  }

  // Member Type
  const typeUpper = (res.mbrTypeCd || res.mbrTypeNm || '').toUpperCase();
  let memberType: MemberType = 'General';
  if (typeUpper === 'F' || typeUpper.includes('FOREIGN')) {
    memberType = 'Foreigner';
  } else if (typeUpper === 'O' || typeUpper.includes('ORGANIZ')) {
    memberType = 'Organization';
  } else {
    memberType = 'General';
  }

  // Approval Status
  const stageUpper = (res.atrzStage || '').toUpperCase();
  let approvalStatus: ApprovalStatus = 'Not Received';
  if (stageUpper.includes('REQUEST') || stageUpper === 'REQUESTED' || stageUpper === 'SUPPLEMENT_REQUESTED') {
    approvalStatus = 'Requested';
  } else if (stageUpper.includes('PROGRESS') || stageUpper === 'IN_PROGRESS') {
    approvalStatus = 'In Progress';
  } else if (stageUpper.includes('APPROV') || stageUpper === 'APPROVED') {
    approvalStatus = 'Approved';
  } else if (stageUpper.includes('REJECT') || stageUpper === 'REJECTED') {
    approvalStatus = 'Rejected';
  } else {
    approvalStatus = 'Not Received';
  }

  // Account Status
  const acntUpper = (res.acntSttsCd || '').toUpperCase();
  const accountStatus: AccountStatus = acntUpper.includes('LOCK') ? 'Locked' : 'Active';

  return {
    id: res.mbrNo || res.lgnId || (res.no ? String(res.no) : `mem-${index + 1}`),
    no: res.no ?? index + 1,
    memberClassification,
    memberCode: res.mbrNo || '-',
    applicationId: res.lgnId || res.atrzHstryId || '-',
    memberType,
    memberName: res.mbrNm || '-',
    approvalStatus,
    assignee: res.assigneeNm || res.assigneeEmpNo || '-',
    applicationDate: formatDate(res.aplyDt),
    receivedDate: formatDate(res.rcptDt),
    attachments: res.atchFileCnt ?? 0,
    companyName: res.orgnzNm || '-',
    approvalDate: formatDate(res.aprvDt),
    phone: res.telno || '-',
    email: res.emlAddr || '-',
    accountStatus,
  };
}

/**
 * Builds Spring PageRequest & MemberSearchRequest query parameters from UI filter state
 */
export function buildMemberQueryParams(params: UseMembersParams): {
  pageRequest: PageRequest;
  searchRequest: MemberSearchRequest;
} {
  const pageRequest: PageRequest = {
    page: params.page ?? 1,
    size: params.pageSize ?? 20,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
  };

  const searchRequest: MemberSearchRequest = {};

  // Classification filter
  if (!params.classificationAll && params.selectedClassifications && params.selectedClassifications.length > 0) {
    const classMap: Record<MemberClassification, string> = {
      'Pending (Approval)': 'PENDING_APPROVAL',
      'Pending (Payment)': 'PENDING_PAYMENT',
      'Verified': 'VERIFIED',
      'Rejected': 'REJECTED',
    };
    searchRequest.mbrClsCds = params.selectedClassifications.map((c) => classMap[c] || c);
  }

  // Member Type filter
  if (!params.memberTypeAll && params.selectedMemberTypes && params.selectedMemberTypes.length > 0) {
    const typeMap: Record<MemberType, string> = {
      General: 'P',
      Foreigner: 'F',
      Organization: 'O',
    };
    searchRequest.mbrTypeCds = params.selectedMemberTypes.map((t) => typeMap[t] || t);
  }

  // Account Status filter
  if (!params.accountStatusAll && params.selectedAccountStatuses && params.selectedAccountStatuses.length > 0) {
    const acntMap: Record<AccountStatus, string> = {
      Active: 'ACTIVE',
      Locked: 'LOCKED',
    };
    searchRequest.acntSttsCds = params.selectedAccountStatuses.map((s) => acntMap[s] || s);
  }

  // Approval Status filter
  if (!params.approvalStatusAll && params.selectedApprovalStatuses && params.selectedApprovalStatuses.length > 0) {
    const approvalMap: Record<ApprovalStatus, string> = {
      'Not Received': 'NOT_RECEIVED',
      'Requested': 'REQUESTED',
      'In Progress': 'IN_PROGRESS',
      'Approved': 'APPROVED',
      'Rejected': 'REJECTED',
    };
    searchRequest.atrzStages = params.selectedApprovalStatuses.map((s) => approvalMap[s] || s);
  }

  // Text filters
  if (params.memberName?.trim()) {
    searchRequest.mbrNm = params.memberName.trim();
  }
  if (params.companyName?.trim()) {
    searchRequest.orgnzNm = params.companyName.trim();
  }
  if (params.memberCode?.trim()) {
    searchRequest.mbrNo = params.memberCode.trim();
  }
  if (params.phoneNumber?.trim()) {
    searchRequest.telno = params.phoneNumber.trim();
  }
  if (params.email?.trim()) {
    searchRequest.emlAddr = params.email.trim();
  }

  // Date Range filter (YYYY-MM-DD)
  if (params.dateRange?.[0] && params.dateRange?.[1]) {
    searchRequest.regFromDt = params.dateRange[0].format('YYYY-MM-DD');
    searchRequest.regToDt = params.dateRange[1].format('YYYY-MM-DD');
  }

  return { pageRequest, searchRequest };
}

// ── Custom Hook: useMembers ──────────────────────────────────────────────────

/**
 * Custom hook to fetch member list using `getMembers` API from generated SDK.
 */
export function useMembers(
  params: UseMembersParams,
  options?: { enabled?: boolean },
): UseQueryResult<UseMembersResult, Error> & {
  items: MemberItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const { pageRequest, searchRequest } = buildMemberQueryParams(params);

  const queryResult = useQuery<UseMembersResult, Error>({
    queryKey: ['members', 'list', pageRequest, searchRequest],
    queryFn: async () => {
      const response = await getMembers({
        query: {
          pageRequest,
          searchRequest,
        },
        querySerializer: springQuerySerializer,
        throwOnError: true,
      });

      if (response.data?.status && response.data.status >= 400) {
        throw new Error(response.data.message || 'Failed to fetch members');
      }

      const pageData: PageResponseMemberResponse | undefined = response.data?.data;
      const rawContent: MemberResponse[] = pageData?.content
        ?? (Array.isArray(pageData) ? pageData : []);

      const items: MemberItem[] = rawContent.map((m, idx) => mapMemberResponseToItem(m, idx));
      const total = pageData?.totalElements ?? items.length;
      const currentPage = pageData?.page ?? pageRequest.page ?? 1;
      const currentSize = pageData?.size ?? pageRequest.size ?? 20;
      const totalPages = pageData?.totalPages ?? Math.ceil(total / (currentSize || 1));

      return {
        items,
        total,
        page: currentPage,
        pageSize: currentSize,
        totalPages,
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
    pageSize: queryResult.data?.pageSize ?? (params.pageSize ?? 20),
    totalPages: queryResult.data?.totalPages ?? 0,
  };
}

