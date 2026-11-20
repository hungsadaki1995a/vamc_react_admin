import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  downloadTradeApplicationsExcel,
  getTradeApplication,
  getTradeApplications,
  receiptTradeApplication,
} from '@/api/trade/trade-api';
import type { TradeAppKind, TradeApplicationItem, TradeApplicationSearch } from '@/api/trade/trade-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of the trade application board — the board never calls the API itself.

const TRADE_APPLICATION_KEYS = {
  all: ['trade', 'applications'] as const,
  lists: ['trade', 'applications', 'list'] as const,
  list: (kind: TradeAppKind, search: TradeApplicationSearch, page: number, size: number) =>
    ['trade', 'applications', 'list', kind, search, page, size] as const,
  detail: (kind: TradeAppKind, id: string | null) => ['trade', 'applications', 'detail', kind, id] as const,
};

/** Paged service application list of one kind. */
export function useTradeApplications(kind: TradeAppKind, search: TradeApplicationSearch, page: number, size: number) {
  return useApiQuery<PageResponse<TradeApplicationItem>>(
    TRADE_APPLICATION_KEYS.list(kind, search, page, size),
    () => getTradeApplications(kind, search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One service application; skipped while `id` is empty. */
export function useTradeApplication(kind: TradeAppKind, id: string | null) {
  return useApiQuery<TradeApplicationItem>(
    TRADE_APPLICATION_KEYS.detail(kind, id),
    () => getTradeApplication(kind, id as string),
    { enabled: !!id },
  );
}

export interface ReceiptTradeApplicationVariables {
  kind: TradeAppKind;
  id: string;
}

// Only the lists are refetched: the detail popup closes right after the receipt.
export function useReceiptTradeApplication() {
  return useApiAction(({ kind, id }: ReceiptTradeApplicationVariables) => receiptTradeApplication(kind, id), {
    invalidate: [TRADE_APPLICATION_KEYS.lists],
  });
}

export interface DownloadTradeApplicationsExcelVariables {
  kind: TradeAppKind;
  search: TradeApplicationSearch;
}

export function useDownloadTradeApplicationsExcel() {
  return useApiDownload(({ kind, search }: DownloadTradeApplicationsExcelVariables) =>
    downloadTradeApplicationsExcel(kind, search as Record<string, unknown>),
  );
}
