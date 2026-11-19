import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import dayjs from 'dayjs';

import { getMembers, excel } from '@/api/generated/sdk.gen';
import type {
  MemberResponse,
  PageResponseMemberResponse,
  GetMembersData,
  ExcelData,
} from '@/api/generated/types.gen';
import type {
  MemberItem,
  MemberClassification,
  MemberGrade,
  MemberType,
  MemberStatus,
  MembershipType,
  MemberSearchField,
  ApprovalStatus,
  AccountStatus,
} from './member.types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface UseMembersParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  memberGradeAll?: boolean;
  selectedMemberGrades?: MemberGrade[];
  memberTypeAll?: boolean;
  selectedMemberTypes?: MemberType[];
  statusAll?: boolean;
  selectedStatuses?: MemberStatus[];
  membershipAll?: boolean;
  selectedMemberships?: MembershipType[];
  searchField?: MemberSearchField;
  searchText?: string;
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
  searchNonce?: number;
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
  if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val.replace(/\//g, '-');
  const d = dayjs(val);
  return d.isValid() ? d.format('DD-MM-YYYY') : val;
}

/**
 * Maps MemberResponse from OpenAPI to frontend MemberItem interface
 */
export function mapMemberResponseToItem(res: MemberResponse, index: number): MemberItem {
  // Classification (kept for modal compatibility)
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

  // Member Grade
  const grdUpper = (res.mbrGrdCd || '').toUpperCase();
  let memberGrade: MemberGrade = 'Temporary';
  if (res.delDt || grdUpper === 'DELETED') {
    memberGrade = 'Deleted';
  } else if (grdUpper === 'F' || grdUpper === 'FULL') {
    memberGrade = 'Full';
  } else if (grdUpper === 'G' || grdUpper === 'GENERAL') {
    memberGrade = 'General';
  } else {
    memberGrade = 'Temporary';
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

  // Approval Status (kept for modal compatibility)
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

  // Status label
  const sttsUpper = (res.sttsCd || '').toUpperCase();
  let status: MemberStatus = 'Active';
  if (sttsUpper === 'PENDING_APPROVAL') {
    status = 'Pending Approval';
  } else if (sttsUpper === 'SUPPLEMENT_REQUESTED') {
    status = 'Supplement Requested';
  } else if (sttsUpper === 'REJECTED') {
    status = 'Rejected';
  } else if (sttsUpper === 'LOCKED') {
    status = 'Locked';
  } else if (sttsUpper === 'DELETED') {
    status = 'Deleted';
  } else if (sttsUpper === 'CANCELLED') {
    status = 'Cancelled';
  } else if (sttsUpper === 'ACTIVE') {
    status = 'Active';
  } else if (accountStatus === 'Locked') {
    status = 'Locked';
  } else if (memberClassification === 'Pending (Approval)') {
    status = 'Pending Approval';
  } else if (memberClassification === 'Rejected') {
    status = 'Rejected';
  }

  // Sign-up Channel
  const chnlUpper = (res.mbrJoinChnlCd || '').toUpperCase();
  const signUpChannel = chnlUpper === 'ON' || chnlUpper === 'ONLINE'
    ? 'Online'
    : chnlUpper === 'OFF' || chnlUpper === 'OFFLINE'
      ? 'Offline'
      : '-';

  // Membership (type of currently valid period: Paid / Exempt, '-' if none)
  const payUpper = (res.mbrshpPayCd || '').toUpperCase();
  const membership = payUpper === 'PAID'
    ? 'Paid'
    : payUpper === 'EXEMPT'
      ? 'Exempt'
      : '-';

  return {
    id: res.mbrNo || res.lgnId || (res.no ? String(res.no) : `mem-${index + 1}`),
    no: res.no ?? index + 1,
    memberClassification,
    memberGrade,
    status,
    memberCode: res.mbrNo || '-',
    sgdnMemberCode: res.sgdnMbrNo || '-',
    loginId: res.lgnId || '-',
    applicationId: res.lgnId || res.atrzHstryId || '-',
    memberType,
    memberName: res.mbrNm || '-',
    approvalStatus,
    assignee: res.assigneeNm || res.assigneeEmpNo || '-',
    applicationDate: formatDate(res.aplyDt),
    receivedDate: formatDate(res.rcptDt),
    attachments: res.atchFileCnt ?? 0,
    companyName: memberType === 'Organization' ? (res.orgnzNm || '-') : '-',
    signUpChannel,
    membership,
    membershipExpiryDate: formatDate(res.mbrshpExprDt),
    approvalDate: memberGrade === 'Temporary' ? '-' : formatDate(res.aprvDt),
    paymentDeadline: formatDate(res.payDdlnDt),
    deletedDate: formatDate(res.delDt),
    retentionEndDate: formatDate(res.rtnEndDt),
    phone: res.telno || '-',
    email: res.emlAddr || '-',
    accountStatus,
  };
}

/**
 * Builds shared filter/sort query parameters from UI filter state
 */
function buildMemberFilterParams(params: UseMembersParams): NonNullable<ExcelData['query']> {
  const query: NonNullable<ExcelData['query']> = {};

  // Member Grade filter
  if (params.selectedMemberGrades && params.selectedMemberGrades.length > 0) {
    const gradeMap: Record<MemberGrade, 'T' | 'G' | 'F' | 'DELETED'> = {
      Temporary: 'T',
      General: 'G',
      Full: 'F',
      Deleted: 'DELETED',
    };
    query.mbrGrdCds = params.selectedMemberGrades.map((g) => gradeMap[g]);
  }

  // Member Type filter
  if (!params.memberTypeAll && params.selectedMemberTypes && params.selectedMemberTypes.length > 0) {
    const typeMap: Record<MemberType, 'P' | 'F' | 'O'> = {
      General: 'P',
      Foreigner: 'F',
      Organization: 'O',
    };
    query.mbrTypeCds = params.selectedMemberTypes.map((t) => typeMap[t]);
  }

  // Status filter
  if (!params.statusAll && params.selectedStatuses && params.selectedStatuses.length > 0) {
    const statusMap: Record<string, 'PENDING_APPROVAL' | 'SUPPLEMENT_REQUESTED' | 'REJECTED' | 'ACTIVE' | 'LOCKED'> = {
      'Pending Approval': 'PENDING_APPROVAL',
      'Supplement Requested': 'SUPPLEMENT_REQUESTED',
      'Rejected': 'REJECTED',
      'Active': 'ACTIVE',
      'Locked': 'LOCKED',
    };
    const mapped = params.selectedStatuses
      .map((s) => statusMap[s])
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (mapped.length > 0) {
      query.sttsCds = mapped;
    }
  }

  // Membership filter
  if (!params.membershipAll && params.selectedMemberships && params.selectedMemberships.length > 0) {
    const payMap: Record<MembershipType, 'PAID' | 'EXEMPT' | 'NONE'> = {
      Paid: 'PAID',
      Exempt: 'EXEMPT',
      None: 'NONE',
    };
    query.mbrshpPayCds = params.selectedMemberships.map((m) => payMap[m]);
  }

  // Search field + text
  if (params.searchText?.trim()) {
    query.searchField = params.searchField || 'MBR_NO';
    query.searchText = params.searchText.trim();
  }

  // Approval Period (YYYY-MM-DD)
  if (params.dateRange?.[0]) {
    query.aprvFromDt = params.dateRange[0].format('YYYY-MM-DD');
  }
  if (params.dateRange?.[1]) {
    query.aprvToDt = params.dateRange[1].format('YYYY-MM-DD');
  }

  return query;
}

/**
 * Builds GetMembersData query parameters from UI filter state
 */
export function buildMemberQueryParams(params: UseMembersParams): NonNullable<GetMembersData['query']> {
  return {
    page: params.page ?? 1,
    size: params.pageSize ?? 20,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
    ...buildMemberFilterParams(params),
  };
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
  const queryParams = buildMemberQueryParams(params);

  const queryResult = useQuery<UseMembersResult, Error>({
    queryKey: ['members', 'list', queryParams, params.searchNonce],
    queryFn: async () => {
      const response = await getMembers({
        query: queryParams,
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
      const currentPage = pageData?.page ?? queryParams.page ?? 1;
      const currentSize = pageData?.size ?? queryParams.size ?? 20;
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

/**
 * Custom hook to download member list Excel using `/api/v1/members/excel`
 */
export function useExportMembers() {
  return useMutation({
    mutationFn: async (params: UseMembersParams) => {
      const response = await excel({
        query: buildMemberFilterParams(params),
        querySerializer: springQuerySerializer,
        responseType: 'blob',
        throwOnError: true,
      });

      const fileName = `VAMC_Member_Management_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      const objectUrl = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      try {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        window.URL.revokeObjectURL(objectUrl);
      }

      return fileName;
    },
  });
}

