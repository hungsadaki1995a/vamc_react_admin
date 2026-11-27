import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { ZaloChangeHistory } from '@/api/system/zalo-api';
import {
  changeZaloLimitRuleUse,
  createZaloLimitRule,
  deleteZaloLimitException,
  downloadZaloCostSummaryExcel,
  downloadZaloLimitRulesExcel,
  getZaloCostSummary,
  getZaloLimitExceptions,
  getZaloLimitOverview,
  getZaloLimitRuleHistory,
  getZaloLimitRules,
  getZaloPrices,
  resumeZaloChannel,
  saveZaloLimitException,
  saveZaloPrices,
  stopZaloChannel,
  updateZaloLimitRule,
} from '@/api/system/zalo-limit-api';
import type {
  CreateZaloLimitRuleRequest,
  SaveZaloPricesRequest,
  StopZaloChannelRequest,
  UpdateZaloLimitRuleRequest,
  ZaloCostSummary,
  ZaloLimitException,
  ZaloLimitExceptionRequest,
  ZaloLimitOverview,
  ZaloLimitRule,
  ZaloLimitRuleSearch,
  ZaloUnitPrice,
} from '@/api/system/zalo-limit-api';
import type { YesNo } from '@/config/sys-constants';

// Data hooks of Zalo Sending Limits (menu A09050500). Every write refreshes the whole screen: a rule, a price or the
// channel state changes the header cells, the peak usage and the cost figures together.

const ZALO_LIMIT_KEYS = {
  all: ['system', 'zalo-limits'] as const,
  overview: ['system', 'zalo-limits', 'overview'] as const,
  rules: (search: ZaloLimitRuleSearch) => ['system', 'zalo-limits', 'rules', search] as const,
  exceptions: (lmtCd: string | null) => ['system', 'zalo-limits', 'exceptions', lmtCd] as const,
  history: (lmtCd: string | null) => ['system', 'zalo-limits', 'history', lmtCd] as const,
  prices: ['system', 'zalo-limits', 'prices'] as const,
  costSummary: (month: string) => ['system', 'zalo-limits', 'cost-summary', month] as const,
};

/** Header cells: today's / this month's usage against the system rules, and the channel state. */
export function useZaloLimitOverview() {
  return useApiQuery<ZaloLimitOverview>(ZALO_LIMIT_KEYS.overview, getZaloLimitOverview);
}

/** Rules with their peak usage (not paged). */
export function useZaloLimitRules(search: ZaloLimitRuleSearch) {
  return useApiQuery<ZaloLimitRule[]>(ZALO_LIMIT_KEYS.rules(search), () => getZaloLimitRules(search), {
    placeholderData: keepPreviousData,
  });
}

/** Exceptions tab; loaded only while the tab is open. */
export function useZaloLimitExceptions(lmtCd: string | null, enabled: boolean) {
  return useApiQuery<ZaloLimitException[]>(ZALO_LIMIT_KEYS.exceptions(lmtCd), () => getZaloLimitExceptions(lmtCd as string), {
    enabled: enabled && lmtCd !== null,
  });
}

/** Change History tab; loaded only while the tab is open. */
export function useZaloLimitRuleHistory(lmtCd: string | null, enabled: boolean) {
  return useApiQuery<ZaloChangeHistory[]>(ZALO_LIMIT_KEYS.history(lmtCd), () => getZaloLimitRuleHistory(lmtCd as string), {
    enabled: enabled && lmtCd !== null,
  });
}

export function useZaloPrices() {
  return useApiQuery<ZaloUnitPrice[]>(ZALO_LIMIT_KEYS.prices, getZaloPrices);
}

/** `month` yyyyMM. */
export function useZaloCostSummary(month: string) {
  return useApiQuery<ZaloCostSummary>(ZALO_LIMIT_KEYS.costSummary(month), () => getZaloCostSummary(month), {
    placeholderData: keepPreviousData,
  });
}

export function useDownloadZaloLimitRulesExcel() {
  return useApiDownload(downloadZaloLimitRulesExcel);
}

export function useDownloadZaloCostSummaryExcel() {
  return useApiDownload(downloadZaloCostSummaryExcel);
}

export type SaveZaloLimitRuleVariables =
  | { lmtCd: null; request: CreateZaloLimitRuleRequest }
  | { lmtCd: string; request: UpdateZaloLimitRuleRequest };

/** Creates (lmtCd null; the server assigns the next LMT-###) or edits a rule. */
export function useSaveZaloLimitRule() {
  return useApiAction(
    (variables: SaveZaloLimitRuleVariables) =>
      variables.lmtCd === null ? createZaloLimitRule(variables.request) : updateZaloLimitRule(variables.lmtCd, variables.request),
    { invalidate: [ZALO_LIMIT_KEYS.all] },
  );
}

/** [Activate] / [Deactivate] of the detail panel. */
export function useChangeZaloLimitRuleUse() {
  return useApiAction(({ lmtCd, useYn }: { lmtCd: string; useYn: YesNo }) => changeZaloLimitRuleUse(lmtCd, useYn), {
    invalidate: [ZALO_LIMIT_KEYS.all],
  });
}

/** Adds or replaces the exception of one account. */
export function useSaveZaloLimitException() {
  return useApiAction(
    ({ lmtCd, request }: { lmtCd: string; request: ZaloLimitExceptionRequest }) => saveZaloLimitException(lmtCd, request),
    { invalidate: [ZALO_LIMIT_KEYS.all] },
  );
}

export function useDeleteZaloLimitException() {
  return useApiAction(({ lmtCd, trgtId }: { lmtCd: string; trgtId: string }) => deleteZaloLimitException(lmtCd, trgtId), {
    invalidate: [ZALO_LIMIT_KEYS.all],
  });
}

export function useSaveZaloPrices() {
  return useApiAction((request: SaveZaloPricesRequest) => saveZaloPrices(request), { invalidate: [ZALO_LIMIT_KEYS.all] });
}

export function useStopZaloChannel() {
  return useApiAction((request: StopZaloChannelRequest) => stopZaloChannel(request), { invalidate: [ZALO_LIMIT_KEYS.all] });
}

export function useResumeZaloChannel() {
  return useApiAction(() => resumeZaloChannel(), { invalidate: [ZALO_LIMIT_KEYS.all] });
}
