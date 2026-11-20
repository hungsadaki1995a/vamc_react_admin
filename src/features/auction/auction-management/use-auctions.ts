import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { deleteAuctions, downloadAuctionsExcel, getAuction, getAuctions } from '@/api/auction/auction-api';
import type { AuctionItem, AuctionSearch } from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Online Auction Notice Management — the screen never calls the API itself.

const AUCTION_KEYS = {
  all: ['auction', 'auctions'] as const,
  lists: ['auction', 'auctions', 'list'] as const,
  list: (search: AuctionSearch, page: number, size: number) =>
    ['auction', 'auctions', 'list', search, page, size] as const,
  detail: (auctnNo: string | null) => ['auction', 'auctions', 'detail', auctnNo] as const,
};

/** Paged auction list. */
export function useAuctions(search: AuctionSearch, page: number, size: number) {
  return useApiQuery<PageResponse<AuctionItem>>(AUCTION_KEYS.list(search, page, size), () => getAuctions(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One auction; skipped while `auctnNo` is empty. */
export function useAuction(auctnNo: string | null) {
  return useApiQuery<AuctionItem>(AUCTION_KEYS.detail(auctnNo), () => getAuction(auctnNo as string), {
    enabled: !!auctnNo,
  });
}

export function useDeleteAuctions() {
  return useApiAction(deleteAuctions, { invalidate: [AUCTION_KEYS.lists] });
}

export function useDownloadAuctionsExcel() {
  return useApiDownload((search: AuctionSearch) => downloadAuctionsExcel(search as Record<string, unknown>));
}
