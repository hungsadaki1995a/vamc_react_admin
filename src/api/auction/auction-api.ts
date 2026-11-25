import { apiDelete, apiDownload, apiGet, apiPost } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Auction Notice Management (A06010000) ────────────────────────────────────
export interface AuctionItem {
  auctnNo: string;
  auctnCycl?: number;
  auctnNm: string;
  auctnType?: string;
  auctnBidType?: string;
  auctnSttsCd?: string;
  pbancSttsCd?: string;
  picNm?: string;
  expsrYn?: 'Y' | 'N';
  bndCd?: string;
  bndNm?: string;
  cltrAstCd?: string;
  cltrAstNm?: string;
}

export interface AuctionSearch {
  auctnFromDate?: string;
  auctnToDate?: string;
  auctnSttsCd?: string;
  pbancSttsCd?: string;
  auctnType?: string;
  keyword?: string;
}

export const getAuctions = (search: AuctionSearch, page: number, size: number) =>
  apiGet<PageResponse<AuctionItem>>('/api/v1/auctions', { ...search, page, size });
export const getAuction = (auctnNo: string) => apiGet<AuctionItem>(`/api/v1/auctions/${auctnNo}`);
export const deleteAuctions = (auctnNos: string[]) => apiDelete<void>('/api/v1/auctions', { auctnNos });
export const downloadAuctionsExcel = (search: Record<string, unknown>) =>
  apiDownload('/api/v1/auctions/excel', 'auctions.xlsx', search);

// ── Bidder Management (A06020000) ────────────────────────────────────────────
export interface BidderItem {
  bdrNo: string;
  auctnNo: string;
  mbrNo?: string;
  aplcntNm: string;
  aplcntTelno?: string;
  aplcntEmlAddr?: string;
  dcmntRcptSttsCd?: string;
  gramtPrcsSeCd?: string;
  grnteAmt?: number;
  qlfcSttsCd?: string;
}

export const getBidderAuctions = (search: { keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<AuctionItem>>('/api/v1/bidders/auctions', { ...search, page, size });
export const getBiddersByAuction = (auctnNo: string, page: number, size: number) =>
  apiGet<PageResponse<BidderItem>>(`/api/v1/bidders/auctions/${auctnNo}/bidders`, { page, size });
export const approveBidder = (bdrNo: string) => apiPost<void>(`/api/v1/bidders/${bdrNo}/approve`, {});
export const rejectBidder = (bdrNo: string, reason?: string) =>
  apiPost<void>(`/api/v1/bidders/${bdrNo}/reject`, { reason });

// ── Live Online Auction Management (A06030000) ───────────────────────────────
export interface LiveAuctionItem {
  auctnNo: string;
  auctnCycl?: number;
  auctnNm: string;
  auctnSttsCd?: string;
  currentHighestBid?: number;
  totalBids?: number;
  lowstBidPrc?: number;
  participatingCount?: number;
  registeredCount?: number;
  auctnBgngDt?: string;
  auctnEndDt?: string;
  winnerNm?: string;
  scsbdAmt?: number;
}

export const getLiveAuctions = (search: { keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<LiveAuctionItem>>('/api/v1/live-auctions', { ...search, page, size });
export const getLiveAuction = (auctnNo: string) => apiGet<LiveAuctionItem>(`/api/v1/live-auctions/${auctnNo}`);
export const startLiveAuction = (auctnNo: string) => apiPost<void>(`/api/v1/live-auctions/${auctnNo}/start`, {});
export const closeLiveAuction = (auctnNo: string) => apiPost<void>(`/api/v1/live-auctions/${auctnNo}/close`, {});
