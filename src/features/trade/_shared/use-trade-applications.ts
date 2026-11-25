import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  changeTradeApplicationOfficer,
  downloadTradeApplicationsExcel,
  getTradeApplication,
  getTradeApplications,
  receiptTradeApplication,
  requestTradeApplicationApproval,
} from '@/api/trade/trade-api';
import type {
  TradeAppKind,
  TradeApplicationDetail,
  TradeApplicationListItem,
  TradeApplicationSearch,
} from '@/api/trade/trade-api';
import type { ApprovalRequestBody } from '@/api/common/approval-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of the trade application board — the board never calls the API itself.

export const TRADE_APPLICATION_KEYS = {
  all: ['trade', 'applications'] as const,
  list: (kind: TradeAppKind, search: TradeApplicationSearch, page: number, size: number) =>
    ['trade', 'applications', 'list', kind, search, page, size] as const,
  detail: (kind: TradeAppKind, id: string | null) => ['trade', 'applications', 'detail', kind, id] as const,
};

/** A write changes the row, the detail and the approval inbox (common approval hooks). */
export const AFTER_WRITE = [TRADE_APPLICATION_KEYS.all, ['approval']];

/** Paged service application list of one kind. */
export function useTradeApplications(kind: TradeAppKind, search: TradeApplicationSearch, page: number, size: number) {
  return useApiQuery<PageResponse<TradeApplicationListItem>>(
    TRADE_APPLICATION_KEYS.list(kind, search, page, size),
    () => getTradeApplications(kind, search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One service application; skipped while `id` is empty. */
export function useTradeApplication(kind: TradeAppKind, id: string | null) {
  return useApiQuery<TradeApplicationDetail>(
    TRADE_APPLICATION_KEYS.detail(kind, id),
    () => getTradeApplication(kind, id as string),
    { enabled: !!id },
  );
}

export interface TradeApplicationOfficerVariables {
  kind: TradeAppKind;
  id: string;
  tkcgEmpNo: string;
}

/** I7 / M7: receipt with the officer in charge (RCPT → PRCS). */
export function useReceiptTradeApplication() {
  return useApiAction(({ kind, id, tkcgEmpNo }: TradeApplicationOfficerVariables) => receiptTradeApplication(kind, id, tkcgEmpNo), {
    invalidate: AFTER_WRITE,
  });
}

/** Officer change (PUT /{id}/officer). */
export function useChangeTradeApplicationOfficer() {
  return useApiAction(
    ({ kind, id, tkcgEmpNo }: TradeApplicationOfficerVariables) => changeTradeApplicationOfficer(kind, id, tkcgEmpNo),
    { invalidate: AFTER_WRITE },
  );
}

/** I11-3: the officer asks for the receipt approval. */
export function useRequestTradeApplicationApproval() {
  return useApiAction(
    ({ kind, id, body }: { kind: TradeAppKind; id: string; body: ApprovalRequestBody }) =>
      requestTradeApplicationApproval(kind, id, body),
    { invalidate: AFTER_WRITE },
  );
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
