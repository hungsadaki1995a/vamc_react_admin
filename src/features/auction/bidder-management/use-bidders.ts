import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { approveBidder, getBidderAuctions, getBiddersByAuction, rejectBidder } from '@/api/auction/auction-api';
import type { AuctionItem, BidderItem } from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Bidder Management — the screen never calls the API itself.

export interface BidderAuctionSearch {
  keyword?: string;
}

const BIDDER_KEYS = {
  all: ['auction', 'bidders'] as const,
  auctions: (search: BidderAuctionSearch, page: number, size: number) =>
    ['auction', 'bidder-auctions', 'list', search, page, size] as const,
  list: (auctnNo: string | null, page: number, size: number) => ['auction', 'bidders', 'list', auctnNo, page, size] as const,
};

/** Paged auctions shown in the left pane. */
export function useBidderAuctions(search: BidderAuctionSearch, page: number, size: number) {
  return useApiQuery<PageResponse<AuctionItem>>(
    BIDDER_KEYS.auctions(search, page, size),
    () => getBidderAuctions(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** Paged bidders of one auction; skipped while no auction is selected. */
export function useBidders(auctnNo: string | null, page: number, size: number) {
  return useApiQuery<PageResponse<BidderItem>>(
    BIDDER_KEYS.list(auctnNo, page, size),
    () => getBiddersByAuction(auctnNo as string, page, size),
    { enabled: !!auctnNo, placeholderData: keepPreviousData },
  );
}

export function useApproveBidder() {
  return useApiAction(approveBidder, { invalidate: [BIDDER_KEYS.all] });
}

export function useRejectBidder() {
  return useApiAction((bdrNo: string) => rejectBidder(bdrNo), { invalidate: [BIDDER_KEYS.all] });
}
