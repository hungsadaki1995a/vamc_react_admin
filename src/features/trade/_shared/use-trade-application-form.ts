import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import { createTradeApplication, updateTradeApplication } from '@/api/trade/trade-api';
import type { SaveTradeApplicationRequest, TradeAppKind } from '@/api/trade/trade-api';
import { uploadTradeFiles } from '@/api/trade/trade-file-api';
import { getMemberLookup, searchMembers } from '@/api/member/member-lookup-api';
import type { MemberLookup, MemberLookupSearch } from '@/api/member/member-lookup-api';
import { getCollateralAssets, getNplLots, getNpls } from '@/api/npl/npl-api';
import type { CollateralAssetItem, CollateralSearch, NplItem, NplLotItem, NplSearch } from '@/api/npl/npl-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import { AFTER_WRITE } from './use-trade-applications';

// Data hooks of the manual registration / edit form (VPA050101P01 / 050102P01 / 050103P01, manual steps 3–7).

const FORM_KEYS = {
  members: (search: MemberLookupSearch, query: PageQuery) => ['trade', 'form', 'members', search, query] as const,
  member: (mbrNo: string | null) => ['trade', 'form', 'member', mbrNo] as const,
  npls: (search: NplSearch, query: PageQuery) => ['trade', 'form', 'npls', search, query] as const,
  lots: (search: { bndLotNo?: string; bndLotNm?: string }, query: PageQuery) => ['trade', 'form', 'lots', search, query] as const,
  collaterals: (search: CollateralSearch, query: PageQuery) => ['trade', 'form', 'collaterals', search, query] as const,
};

export function useMemberSearch(search: MemberLookupSearch, query: PageQuery) {
  return useApiQuery<PageResponse<MemberLookup>>(FORM_KEYS.members(search, query), () => searchMembers(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** Member data shown read-only once picked (never re-typed); skipped while `mbrNo` is null. */
export function useMemberLookup(mbrNo: string | null) {
  return useApiQuery<MemberLookup>(FORM_KEYS.member(mbrNo), () => getMemberLookup(mbrNo as string), { enabled: !!mbrNo });
}

export function useNplSearch(search: NplSearch, query: PageQuery, enabled: boolean) {
  return useApiQuery<PageResponse<NplItem>>(FORM_KEYS.npls(search, query), () => getNpls(search, query.page, query.size), {
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useNplLotSearch(search: { bndLotNo?: string; bndLotNm?: string }, query: PageQuery, enabled: boolean) {
  return useApiQuery<PageResponse<NplLotItem>>(FORM_KEYS.lots(search, query), () => getNplLots(search, query.page, query.size), {
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** Listed collaterals for the consulting target (GET /api/v1/collateral-assets). */
export function useCollateralSearch(search: CollateralSearch, query: PageQuery) {
  return useApiQuery<PageResponse<CollateralAssetItem>>(
    FORM_KEYS.collaterals(search, query),
    () => getCollateralAssets(search, query.page, query.size),
    { placeholderData: keepPreviousData },
  );
}

/** Scans uploaded with the form (scope `application`); appends to `fileUnqId` when given. */
export function useUploadFormScans() {
  return useApiTask(({ kind, files, fileUnqId }: { kind: TradeAppKind; files: File[]; fileUnqId?: string }) =>
    uploadTradeFiles(kind, 'application', files, fileUnqId),
  );
}

/** Create (`id` null) or edit. */
export function useSaveTradeApplication() {
  return useApiAction<{ srvcAplyId: string }, { kind: TradeAppKind; id: string | null; body: SaveTradeApplicationRequest }>(
    ({ kind, id, body }) =>
      id ? updateTradeApplication(kind, id, body) : createTradeApplication(kind, body),
    { invalidate: AFTER_WRITE },
  );
}
