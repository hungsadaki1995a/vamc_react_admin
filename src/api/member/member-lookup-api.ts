import { apiGet } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Member lookup for pickers in other screens (trade manual registration VPA050101P01 / 050102P01 / 050103P01) —
// MemberController (/api/v1/members). Personal data comes masked from the server.

export interface MemberLookup {
  mbrNo: string;
  mbrNm?: string;
  /** P individual, O organisation, F foreign. */
  mbrTypeCd?: string;
  mbrTypeNm?: string;
  /** S = active. */
  mbrSttsCd?: string;
  mbrSttsNm?: string;
  orgnzNm?: string;
  telno?: string;
  emlAddr?: string;
  sgdnMbrNo?: string;
  mbrGrdCd?: string;
}

export interface MemberLookupSearch {
  mbrNo?: string;
  mbrNm?: string;
  /** MBR_STTS_CD filter; `S` = active (only active members may apply). */
  mbrSttsCds?: string[];
}

/** Member status that may submit a trade application (TradeApplicationMapper.countActiveMember). */
export const ACTIVE_MEMBER_STATUS = 'S';

export const searchMembers = (search: MemberLookupSearch, query: PageQuery) =>
  apiGet<PageResponse<MemberLookup>>('/api/v1/members', { ...search, ...query });

export const getMemberLookup = (mbrNo: string) => apiGet<MemberLookup>(`/api/v1/members/${encodeURIComponent(mbrNo)}`);
