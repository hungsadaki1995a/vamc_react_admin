import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { getAdditionalConsultingSetting, setAdditionalConsultingSetting } from '@/api/trade/trade-contract-api';
import { downloadTradeContractsExcel, getTradeContract, getTradeContracts } from '@/api/trade/trade-api';
import type { TradeContractDetail, TradeContractListItem, TradeContractKind, TradeContractSearch } from '@/api/trade/trade-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of the trade contract board — the board never calls the API itself.

const TRADE_CONTRACT_KEYS = {
  all: ['trade', 'contracts'] as const,
  list: (kind: TradeContractKind, search: TradeContractSearch, page: number, size: number) =>
    ['trade', 'contracts', 'list', kind, search, page, size] as const,
  detail: (kind: TradeContractKind, id: string | null) => ['trade', 'contracts', 'detail', kind, id] as const,
};

/** Paged contract list of one kind. */
export function useTradeContracts(kind: TradeContractKind, search: TradeContractSearch, page: number, size: number) {
  return useApiQuery<PageResponse<TradeContractListItem>>(
    TRADE_CONTRACT_KEYS.list(kind, search, page, size),
    () => getTradeContracts(kind, search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One contract; skipped while `id` is empty. */
export function useTradeContract(kind: TradeContractKind, id: string | null) {
  return useApiQuery<TradeContractDetail>(
    TRADE_CONTRACT_KEYS.detail(kind, id),
    () => getTradeContract(kind, id as string),
    { enabled: !!id },
  );
}

export interface DownloadTradeContractsExcelVariables {
  kind: TradeContractKind;
  search: TradeContractSearch;
}

export function useDownloadTradeContractsExcel() {
  return useApiDownload(({ kind, search }: DownloadTradeContractsExcelVariables) =>
    downloadTradeContractsExcel(kind, search as Record<string, unknown>),
  );
}

/** Follow-up consulting switch (consulting board only); skipped while disabled. */
export function useAdditionalConsultingSetting(enabled: boolean) {
  return useApiQuery<boolean>(['trade', 'contracts', 'settings', 'additional-consulting'], getAdditionalConsultingSetting, { enabled });
}

export function useSetAdditionalConsultingSetting() {
  return useApiAction((value: boolean) => setAdditionalConsultingSetting(value), {
    invalidate: [['trade', 'contracts', 'settings', 'additional-consulting']],
  });
}
