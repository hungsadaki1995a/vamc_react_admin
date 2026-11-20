import { apiGet, apiPost } from '@/api/common/api-utils';

// ── Exchange Rate (A06010500) ────────────────────────────────────────────────
export interface ExchangeRateItem {
  currencyCode: string;
  currencyName: string;
  cashBuy?: number | string | null;
  transferBuy?: number | string | null;
  sell?: number | string | null;
  displayed: string | boolean;
  inUse: string | boolean;
  referenceDateTime?: string;
  lastModifiedAt?: string;
}

export const getExchangeRates = (displayedOnly = false) =>
  apiGet<ExchangeRateItem[]>('/api/v1/contents/service-guides/exchange-rates', { displayedOnly });

export const syncExchangeRates = () =>
  apiPost<{ total?: number; success?: number; fail?: number }>('/api/v1/contents/service-guides/exchange-rates/sync', {});
