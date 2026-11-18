import { apiDownload, apiGet, apiPost } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

export type TradeAppKind = 'purchase' | 'sale' | 'consulting';
export type TradeContractKind = 'purchase-brokerage-contracts' | 'sale-brokerage-contracts' | 'consulting-contracts';

export interface TradeApplicationItem {
  srvcAplyId: string;
  srvcPrcsSttsCd?: string;
  srvcPrcsSttsNm?: string;
  approvalStage?: string;
  srvcAplyDmy?: string;
  aplyPathCd?: string;
  mbrNo?: string;
  mbrNm?: string;
  bndCd?: string;
  bndLotId?: string;
  bndLotNm?: string;
  availableAction?: string;
}

export interface TradeContractItem {
  srvcCtrtCd: string;
  ctrtSeCd?: string;
  ctrtSttsCd?: string;
  ctrtSttsNm?: string;
  srvcAplyId?: string;
  mbrNo?: string;
  mbrNm?: string;
  bndCd?: string;
  bndLotId?: string;
  ctrtCnclsDmy?: string;
  ctrtEndDmy?: string;
  remainingDays?: number;
  tkcgEmpNm?: string;
}

export interface TradeApplicationSearch {
  aplyFromDt?: string;
  aplyToDt?: string;
  sttsCds?: string[];
  bndLotYn?: 'Y' | 'N';
  mbrNo?: string;
  bndCd?: string;
  keyword?: string;
}

export interface TradeContractSearch {
  ctrtFromDt?: string;
  ctrtToDt?: string;
  ctrtSttsCds?: string[];
  bndLotYn?: 'Y' | 'N';
  mbrNo?: string;
  bndCd?: string;
  keyword?: string;
}

export const getTradeApplications = (
  kind: TradeAppKind,
  search: TradeApplicationSearch,
  page: number,
  size: number,
) => apiGet<PageResponse<TradeApplicationItem>>(`/api/v1/service-applications/${kind}`, { ...search, page, size });

export const getTradeApplication = (kind: TradeAppKind, id: string) =>
  apiGet<TradeApplicationItem>(`/api/v1/service-applications/${kind}/${id}`);

export const receiptTradeApplication = (kind: TradeAppKind, id: string) =>
  apiPost<void>(`/api/v1/service-applications/${kind}/${id}/receipt`, {});

export const downloadTradeApplicationsExcel = (kind: TradeAppKind, search: Record<string, unknown>) =>
  apiDownload(`/api/v1/service-applications/${kind}/excel`, `${kind}-applications.xlsx`, search);

export const getTradeContracts = (
  kind: TradeContractKind,
  search: TradeContractSearch,
  page: number,
  size: number,
) => apiGet<PageResponse<TradeContractItem>>(`/api/v1/${kind}`, { ...search, page, size });

export const getTradeContract = (kind: TradeContractKind, id: string) =>
  apiGet<TradeContractItem>(`/api/v1/${kind}/${id}`);

export const downloadTradeContractsExcel = (kind: TradeContractKind, search: Record<string, unknown>) =>
  apiDownload(`/api/v1/${kind}/excel`, `${kind}.xlsx`, search);
