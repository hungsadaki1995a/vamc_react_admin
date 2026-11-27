import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { YesNo } from '@/config/sys-constants';
import type { ZaloChangeHistory, ZaloMsgType } from './zalo-api';

// Zalo Sending Limits API — ZaloLimitController (/api/v1/zalo/limits, menu A09050500). Tables ZALO_SNDNG_LMT,
// ZALO_SNDNG_LMT_EXCP, ZALO_MSG_UNTPRC, ZALO_CHNL_STTS. Amounts are VND excluding VAT; dates `YYYY-MM-DD`.

export type ZaloLimitScope = 'SYSTEM' | 'RECIPIENT' | 'SENDER';
/** ALL = every message, ZNS = every paid type (not OA). */
export type ZaloLimitMsgType = 'ALL' | 'ZNS' | ZaloMsgType;
export type ZaloLimitPeriod = 'DAY' | 'MONTH';
/** COUNT = messages, COST = VND. */
export type ZaloLimitMeasure = 'COUNT' | 'COST';
/** BLOCK = not sent, WARN = sent and logged. */
export type ZaloLimitAction = 'BLOCK' | 'WARN';
/** ALL = every message, ZNS = paid messages only (OA messages keep going). */
export type ZaloStopScope = 'ALL' | 'ZNS';
export type ZaloResumeMethod = 'MANUAL' | 'HOUR' | 'DAY';

export interface ZaloLimitRule {
  lmtCd: string;
  lmtScopeCd: ZaloLimitScope;
  zaloMsgTypeCd: ZaloLimitMsgType;
  lmtPrdCd: ZaloLimitPeriod;
  lmtMsrCd: ZaloLimitMeasure;
  lmtVal: number;
  /** Percent of the limit, 1–100. */
  warnRt: number;
  excdActCd: ZaloLimitAction;
  efctBgngDt: string;
  /** Null = open-ended. */
  efctEndDt?: string | null;
  lmtExpln?: string | null;
  useYn: YesNo;
  /** Peak usage in the current period. */
  usedVal: number;
  /** Peak usage in percent of the limit, at most 100. */
  usedPct: number;
  atWarning: boolean;
  excpCount: number;
  crtDt?: string;
  crtBy?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface ZaloLimitRuleSearch {
  lmtScopeCd?: ZaloLimitScope | '';
  zaloMsgTypeCd?: ZaloLimitMsgType | '';
  useYn?: YesNo | '';
  /** Rules in effect on this date. */
  efctDt?: string;
}

/** Edit body; scope and message type cannot change after creation. */
export interface UpdateZaloLimitRuleRequest {
  lmtPrdCd: ZaloLimitPeriod;
  lmtMsrCd: ZaloLimitMeasure;
  /** 0 – 999,999,999,999. */
  lmtVal: number;
  warnRt: number;
  excdActCd: ZaloLimitAction;
  efctBgngDt: string;
  efctEndDt?: string | null;
  /** ≤ 500 */
  lmtExpln?: string;
  useYn?: YesNo;
}

export interface CreateZaloLimitRuleRequest extends UpdateZaloLimitRuleRequest {
  lmtScopeCd: ZaloLimitScope;
  zaloMsgTypeCd: ZaloLimitMsgType;
}

/** Per-account limit of a SENDER (EMP_NO) or RECIPIENT (MBR_NO / EMP_NO) rule. */
export interface ZaloLimitException {
  lmtCd: string;
  trgtId: string;
  excpLmtVal: number;
  /** Null = open-ended. */
  expryDt?: string | null;
  excpRsn: string;
  /** The rule limit applies again. */
  expired: boolean;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface ZaloLimitExceptionRequest {
  /** ≤ 10 */
  trgtId: string;
  excpLmtVal: number;
  expryDt?: string | null;
  /** ≤ 500 */
  excpRsn: string;
}

export interface ZaloChannel {
  /** Y = stopped. */
  stopYn: YesNo;
  stopScopeCd?: ZaloStopScope | null;
  /** Y = verification codes keep going while stopped. */
  otpKeepYn?: YesNo | null;
  rsmptMthdCd?: ZaloResumeMethod | null;
  /** Planned automatic resume. */
  rsmptPrnmntDt?: string | null;
  stopRsn?: string | null;
  stopDt?: string | null;
  stopBy?: string | null;
  rsmptDt?: string | null;
  /** `SYSTEM` for an automatic resume. */
  rsmptBy?: string | null;
  /** Sendings held since the last stop (logged as failed, never resent). */
  heldCount: number;
}

export interface StopZaloChannelRequest {
  stopScopeCd: ZaloStopScope;
  otpKeepYn: YesNo;
  rsmptMthdCd: ZaloResumeMethod;
  /** ≤ 200 */
  stopRsn: string;
}

/** Header cells of the screen; a limit is null when no active SYSTEM rule sets it. */
export interface ZaloLimitOverview {
  sentToday: number;
  dayCountLimit?: number | null;
  dayCountLmtCd?: string | null;
  costToday: number;
  costDayLimit?: number | null;
  costDayLmtCd?: string | null;
  costMonth: number;
  costMonthLimit?: number | null;
  costMonthLmtCd?: string | null;
  channel: ZaloChannel;
}

export interface ZaloUnitPrice {
  zaloMsgTypeCd: ZaloMsgType;
  /** Null when no price is set. */
  untprc?: number | null;
  aplyBgngDt?: string | null;
  sentThisMonth: number;
  amountThisMonth: number;
  /** Template codes of this type (TEST: any template). */
  templates: string[];
}

export interface SaveZaloPricesRequest {
  aplyBgngDt: string;
  /** OA must stay 0 (ZAL023). */
  items: { zaloMsgTypeCd: ZaloMsgType; untprc: number }[];
}

export interface ZaloTypeCost {
  zaloMsgTypeCd: ZaloMsgType;
  sent: number;
  untprc?: number | null;
  amount: number;
}

export interface ZaloSenderCost {
  /** EMP_NO; `SYSTEM` = automatic sendings. */
  sndrId: string;
  sent: number;
  amount: number;
  /** Percent of the spent amount, one decimal. */
  sharePct: number;
}

export interface ZaloCostSummary {
  /** yyyyMM */
  month: string;
  budget?: number | null;
  budgetLmtCd?: string | null;
  spent: number;
  remaining?: number | null;
  projected: number;
  byType: ZaloTypeCost[];
  topSenders: ZaloSenderCost[];
}

const LIMITS = '/api/v1/zalo/limits';
const RULES = `${LIMITS}/rules`;
const rulePath = (lmtCd: string) => `${RULES}/${encodeURIComponent(lmtCd)}`;

/** Not paged (a handful of rules). */
export const getZaloLimitRules = (search: ZaloLimitRuleSearch) => apiGet<ZaloLimitRule[]>(RULES, search);

export const downloadZaloLimitRulesExcel = (search: ZaloLimitRuleSearch) =>
  apiDownload(`${RULES}/excel`, 'zalo-limit-rules.xlsx', search);

export const getZaloLimitRule = (lmtCd: string) => apiGet<ZaloLimitRule>(rulePath(lmtCd));

/** The server assigns the next LMT-### code. */
export const createZaloLimitRule = (request: CreateZaloLimitRuleRequest) => apiPost<ZaloLimitRule>(RULES, request);

export const updateZaloLimitRule = (lmtCd: string, request: UpdateZaloLimitRuleRequest) =>
  apiPut<ZaloLimitRule>(rulePath(lmtCd), request);

export const changeZaloLimitRuleUse = (lmtCd: string, useYn: YesNo) =>
  apiPatch<ZaloLimitRule>(`${rulePath(lmtCd)}/use`, { useYn });

export const getZaloLimitExceptions = (lmtCd: string) => apiGet<ZaloLimitException[]>(`${rulePath(lmtCd)}/exceptions`);

/** Adds or replaces the exception of one account. */
export const saveZaloLimitException = (lmtCd: string, request: ZaloLimitExceptionRequest) =>
  apiPost<ZaloLimitException>(`${rulePath(lmtCd)}/exceptions`, request);

export const deleteZaloLimitException = (lmtCd: string, trgtId: string) =>
  apiDelete<void>(`${rulePath(lmtCd)}/exceptions/${encodeURIComponent(trgtId)}`);

export const getZaloLimitRuleHistory = (lmtCd: string) => apiGet<ZaloChangeHistory[]>(`${rulePath(lmtCd)}/history`);

export const getZaloLimitOverview = () => apiGet<ZaloLimitOverview>(`${LIMITS}/overview`);

export const getZaloPrices = () => apiGet<ZaloUnitPrice[]>(`${LIMITS}/prices`);

export const saveZaloPrices = (request: SaveZaloPricesRequest) => apiPut<ZaloUnitPrice[]>(`${LIMITS}/prices`, request);

/** `month` yyyyMM, default the current month. */
export const getZaloCostSummary = (month?: string) => apiGet<ZaloCostSummary>(`${LIMITS}/cost-summary`, { month });

export const downloadZaloCostSummaryExcel = (month?: string) =>
  apiDownload(`${LIMITS}/cost-summary/excel`, `zalo-cost-${month ?? 'month'}.xlsx`, { month });

export const getZaloChannel = () => apiGet<ZaloChannel>(`${LIMITS}/channel`);

/** 409 ZAL021 when already stopped. */
export const stopZaloChannel = (request: StopZaloChannelRequest) => apiPost<ZaloChannel>(`${LIMITS}/channel/stop`, request);

/** 409 ZAL022 when sending. */
export const resumeZaloChannel = () => apiPost<ZaloChannel>(`${LIMITS}/channel/resume`);
