import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import i18n from '@/lib/i18n';
import type { ZaloMsgType } from '@/api/system/zalo-api';
import type {
  CreateZaloLimitRuleRequest,
  UpdateZaloLimitRuleRequest,
  ZaloLimitAction,
  ZaloLimitMeasure,
  ZaloLimitMsgType,
  ZaloLimitPeriod,
  ZaloLimitRule,
  ZaloLimitScope,
} from '@/api/system/zalo-limit-api';
import { API_DATE_ISO } from '@/config/sys-constants';
import { codeLabel } from '@/lib/i18n/code-label';

// Shared helpers of Zalo Sending Limits (menu A09050500): code lists, number texts, the rule form and its explanation.

export const LIMIT_SCOPES: ZaloLimitScope[] = ['SYSTEM', 'RECIPIENT', 'SENDER'];
export const LIMIT_MSG_TYPES: ZaloLimitMsgType[] = ['ALL', 'ZNS', 'INVITE', 'OTP', 'STATUS', 'TEST', 'OA'];
/** Order of the Unit Prices / By Message Type rows. */
export const PRICE_TYPES: ZaloMsgType[] = ['INVITE', 'OTP', 'STATUS', 'TEST', 'OA'];
/** Highest unit price accepted by the server. */
export const MAX_UNIT_PRICE = 100_000;
export const MAX_LIMIT_VALUE = 999_999_999_999;
/** Warning colour of the header cells when the rule's own threshold is unknown. */
export const DEFAULT_WARN_RT = 80;

/** `1,234` (en-US grouping as in the design); `-` when empty. */
export function num(value?: number | null): string {
  return value === undefined || value === null ? '-' : Number(value).toLocaleString('en-US');
}

/** Usage in percent of a limit, rounded and capped at 100 (design "Peak Usage"); 0 when there is no limit. */
export function usagePct(used: number, limit?: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used * 100) / limit));
}

/** Colour level of a usage: over (≥ 100 %), warn (≥ warn threshold) or normal. */
export function usageLevel(pct: number, warnRt = DEFAULT_WARN_RT): 'over' | 'warn' | 'normal' {
  if (pct >= 100) return 'over';
  if (pct >= warnRt) return 'warn';
  return 'normal';
}

/** "Messages" / "₫" unit of a rule value. */
export function unitText(measure: ZaloLimitMeasure): string {
  return i18n.t(measure === 'COST' ? 'zalo.limits.units.cost' : 'zalo.limits.units.count');
}

/** Limit as shown in the list: "2,000" or "1,500,000 ₫". */
export function limitText(value: number | null | undefined, measure: ZaloLimitMeasure): string {
  return measure === 'COST' ? `${num(value)} ₫` : num(value);
}

/** Message type label of a price row: "Link invitation". */
export function priceTypeLabel(type: ZaloMsgType): string {
  return codeLabel('zalo.limitMsgTypes', type);
}

/** Channel of a price type: OA messages go to the OA, all others are ZNS. */
export function priceChannel(type: ZaloMsgType): string {
  return type === 'OA' ? 'OA' : 'ZNS';
}

/** Edit state of the rule form (General tab and the New / Copy popup). */
export interface RuleFormState {
  lmtScopeCd: ZaloLimitScope;
  zaloMsgTypeCd: ZaloLimitMsgType;
  lmtPrdCd: ZaloLimitPeriod;
  lmtMsrCd: ZaloLimitMeasure;
  lmtVal: number | null;
  warnRt: number | null;
  excdActCd: ZaloLimitAction;
  efctBgngDt: Dayjs | null;
  /** Null = open-ended. */
  efctEndDt: Dayjs | null;
  lmtExpln: string;
}

export type RuleFieldKey = 'lmtScopeCd' | 'zaloMsgTypeCd' | 'lmtVal' | 'warnRt' | 'efctBgngDt' | 'efctEndDt' | 'lmtExpln';

function toDay(value?: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/** Form state of a rule; a blank New starts today as a system-wide daily message limit. */
export function toRuleForm(rule: ZaloLimitRule | null): RuleFormState {
  if (!rule) {
    return {
      lmtScopeCd: 'SYSTEM',
      zaloMsgTypeCd: 'ALL',
      lmtPrdCd: 'DAY',
      lmtMsrCd: 'COUNT',
      lmtVal: null,
      warnRt: DEFAULT_WARN_RT,
      excdActCd: 'BLOCK',
      efctBgngDt: dayjs().startOf('day'),
      efctEndDt: null,
      lmtExpln: '',
    };
  }
  return {
    lmtScopeCd: rule.lmtScopeCd,
    zaloMsgTypeCd: rule.zaloMsgTypeCd,
    lmtPrdCd: rule.lmtPrdCd,
    lmtMsrCd: rule.lmtMsrCd,
    lmtVal: rule.lmtVal,
    warnRt: rule.warnRt,
    excdActCd: rule.excdActCd,
    efctBgngDt: toDay(rule.efctBgngDt),
    efctEndDt: toDay(rule.efctEndDt),
    lmtExpln: rule.lmtExpln ?? '',
  };
}

const isoDate = (value: Dayjs | null) => (value ? value.format(API_DATE_ISO) : null);

/** Unsaved edits of the General tab. */
export function isRuleDirty(values: RuleFormState, rule: ZaloLimitRule): boolean {
  const saved = toRuleForm(rule);
  return (
    values.lmtPrdCd !== saved.lmtPrdCd ||
    values.lmtMsrCd !== saved.lmtMsrCd ||
    values.lmtVal !== saved.lmtVal ||
    values.warnRt !== saved.warnRt ||
    values.excdActCd !== saved.excdActCd ||
    isoDate(values.efctBgngDt) !== isoDate(saved.efctBgngDt) ||
    isoDate(values.efctEndDt) !== isoDate(saved.efctEndDt) ||
    values.lmtExpln.trim() !== saved.lmtExpln.trim()
  );
}

/** Client checks before a save; the server repeats them (ZAL024). */
export function ruleFormErrors(values: RuleFormState): Partial<Record<RuleFieldKey, string>> {
  const errors: Partial<Record<RuleFieldKey, string>> = {};
  const required = i18n.t('messages.zalo.limits.required');
  if (values.lmtVal === null) errors.lmtVal = required;
  if (values.warnRt === null) errors.warnRt = required;
  else if (values.warnRt < 1 || values.warnRt > 100) errors.warnRt = i18n.t('messages.zalo.limits.warnRange');
  if (!values.efctBgngDt) errors.efctBgngDt = required;
  else if (values.efctEndDt && values.efctEndDt.isBefore(values.efctBgngDt, 'day')) {
    errors.efctEndDt = i18n.t('messages.zalo.limits.endBeforeStart');
  }
  if (values.lmtMsrCd === 'COST' && values.zaloMsgTypeCd === 'OA') errors.lmtVal = i18n.t('messages.zalo.limits.oaNoCost');
  return errors;
}

export function toUpdateRequest(values: RuleFormState): UpdateZaloLimitRuleRequest {
  return {
    lmtPrdCd: values.lmtPrdCd,
    lmtMsrCd: values.lmtMsrCd,
    lmtVal: values.lmtVal ?? 0,
    warnRt: values.warnRt ?? DEFAULT_WARN_RT,
    excdActCd: values.excdActCd,
    efctBgngDt: isoDate(values.efctBgngDt) ?? '',
    efctEndDt: isoDate(values.efctEndDt),
    lmtExpln: values.lmtExpln.trim(),
  };
}

export function toCreateRequest(values: RuleFormState): CreateZaloLimitRuleRequest {
  return { ...toUpdateRequest(values), lmtScopeCd: values.lmtScopeCd, zaloMsgTypeCd: values.zaloMsgTypeCd };
}

/** Value at which a warning is raised: ceil(limit × warn %). */
export function warnAtValue(values: Pick<RuleFormState, 'lmtVal' | 'warnRt'>): number {
  return Math.ceil(((values.lmtVal ?? 0) * (values.warnRt ?? 0)) / 100);
}

/**
 * One-line explanation under the rule (design `explain`), e.g. "Whole system · all messages: at most 2,000 messages
 * per day. A warning is raised at 1,600 messages; above the limit the send is blocked and logged as failed with LMT-001."
 */
export function ruleExplanation(values: RuleFormState, lmtCd: string): string {
  const cost = values.lmtMsrCd === 'COST';
  const params = {
    scope: codeLabel('zalo.limitScopes', values.lmtScopeCd),
    type: codeLabel('zalo.limitMsgTypes', values.zaloMsgTypeCd).toLowerCase(),
    limit: limitText(values.lmtVal ?? 0, values.lmtMsrCd),
    period: codeLabel('zalo.limitPeriodUnits', values.lmtPrdCd),
    warnAt: num(warnAtValue(values)),
    unit: unitText(values.lmtMsrCd),
    code: lmtCd,
  };
  const head = i18n.t(cost ? 'zalo.limits.explain.headCost' : 'zalo.limits.explain.headCount', params);
  if (values.excdActCd === 'WARN') return `${head} ${i18n.t('zalo.limits.explain.warnOnly', params)}`;
  return `${head} ${i18n.t(cost ? 'zalo.limits.explain.blockCost' : 'zalo.limits.explain.block', params)}`;
}
