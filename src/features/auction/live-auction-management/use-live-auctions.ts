import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { closeLiveAuction, getLiveAuction, getLiveAuctions, startLiveAuction } from '@/api/auction/auction-api';
import type { LiveAuctionItem } from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Live Online Auction Management — the screen never calls the API itself.

export interface LiveAuctionSearch {
  keyword?: string;
}

const LIVE_AUCTION_KEYS = {
  all: ['auction', 'live-auctions'] as const,
  lists: ['auction', 'live-auctions', 'list'] as const,
  list: (search: LiveAuctionSearch, page: number, size: number) =>
    ['auction', 'live-auctions', 'list', search, page, size] as const,
  detail: (auctnNo: string | null) => ['auction', 'live-auctions', 'detail', auctnNo] as const,
};

/** Paged live auction list. */
export function useLiveAuctions(search: LiveAuctionSearch, page: number, size: number) {
  return useApiQuery<PageResponse<LiveAuctionItem>>(
    LIVE_AUCTION_KEYS.list(search, page, size),
    () => getLiveAuctions(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One live auction; skipped while `auctnNo` is empty. */
export function useLiveAuction(auctnNo: string | null) {
  return useApiQuery<LiveAuctionItem>(LIVE_AUCTION_KEYS.detail(auctnNo), () => getLiveAuction(auctnNo as string), {
    enabled: !!auctnNo,
  });
}

// Only the lists are refetched: the detail popup closes right after the action.
export function useStartLiveAuction() {
  return useApiAction(startLiveAuction, { invalidate: [LIVE_AUCTION_KEYS.lists] });
}

export function useCloseLiveAuction() {
  return useApiAction(closeLiveAuction, { invalidate: [LIVE_AUCTION_KEYS.lists] });
}
