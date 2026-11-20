import { apiGet, apiPost } from '@/api/common/api-utils';

// ── Exchange Rate Management (A06010500) ─────────────────────────────────────

export interface ExchangeRateItem {
  currencyCode: string;
  currencyName?: string;
  cashBuy?: number | null;
  transferBuy?: number | null;
  sell?: number | null;
  displayed?: string;
  inUse?: string;
  referenceDateTime?: string;
  lastModifiedAt?: string;
}

/** One run of the exchange-rate-sync batch. */
export interface ExchangeRateRun {
  startedAt?: string;
  finishedAt?: string;
  /** SUCCESS / FAILED / RUNNING. */
  result?: string;
  /** SCHEDULED / MANUAL. */
  triggerType?: string;
  /** AUTO for scheduled runs, otherwise the admin ID. */
  runBy?: string;
}

export interface ExchangeRateSchedule {
  /** Spring cron; absent when not configured. */
  cron?: string;
  zone?: string;
  enabled: boolean;
}

export interface ExchangeRateStatus {
  source?: string;
  /** Base date/time of the last successfully received rates. */
  baseDateTime?: string;
  lastRun?: ExchangeRateRun | null;
  schedule?: ExchangeRateSchedule | null;
  /** [Sync Now] allowed (System Admin only). */
  canSync: boolean;
  /** Rates shown to users (displayed and in use). */
  rates?: ExchangeRateItem[];
  /** Up to 5 latest runs, newest first. */
  recentRuns?: ExchangeRateRun[];
}

const BASE = '/api/v1/platform/exchange-rates';

export const getExchangeRateStatus = () => apiGet<ExchangeRateStatus>(`${BASE}/status`);

/** Receives rates now and returns the new status; 409 BAT007 while running, 503 EXR001 when the source fails. */
export const syncExchangeRates = () => apiPost<ExchangeRateStatus>(`${BASE}/sync`);
