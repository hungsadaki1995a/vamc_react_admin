import { apiGet } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { ApiResponse } from '@/lib/api/types';

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

/** Parts of GET /api/v1/members/{mbrNo} (MemberDetailResponse) read by the lookup. */
interface MemberDetailParts {
  basic?: { mbrNo?: string; mbrTypeCd?: string; mbrTypeNm?: string; mbrSttsCd?: string; mbrSttsNm?: string; sgdnMbrCd?: string; mbrGrdCd?: string };
  account?: { intlTelnoNtnNo?: string; telno?: string; emlAddr?: string };
  identity?: { fullNm?: string };
  corporate?: { orgnzNm?: string };
}

/** Member data for display in other screens (name, type, masked contact), flattened from the member detail. */
export async function getMemberLookup(mbrNo: string): Promise<ApiResponse<MemberLookup>> {
  const response = await apiGet<MemberDetailParts>(`/api/v1/members/${encodeURIComponent(mbrNo)}`);
  const detail = response.data;
  if (!detail) return { ...response, data: null };
  const { basic, account, identity, corporate } = detail;
  return {
    ...response,
    data: {
      mbrNo: basic?.mbrNo ?? mbrNo,
      mbrNm: identity?.fullNm ?? corporate?.orgnzNm,
      mbrTypeCd: basic?.mbrTypeCd,
      mbrTypeNm: basic?.mbrTypeNm,
      mbrSttsCd: basic?.mbrSttsCd,
      mbrSttsNm: basic?.mbrSttsNm,
      orgnzNm: corporate?.orgnzNm,
      telno: account?.telno ? [account.intlTelnoNtnNo, account.telno].filter(Boolean).join(' ') : undefined,
      emlAddr: account?.emlAddr,
      sgdnMbrNo: basic?.sgdnMbrCd,
      mbrGrdCd: basic?.mbrGrdCd,
    },
  };
}
