import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { getExchangeRates, syncExchangeRates } from '@/api/system/exchange-rate-api';
import type { ExchangeRateItem } from '@/api/system/exchange-rate-api';

// Data hooks of Exchange Rate Management (menu A06010500).

const EXCHANGE_RATE_KEYS = {
  all: ['system', 'exchange-rates'] as const,
  list: (displayedOnly: boolean) => ['system', 'exchange-rates', 'list', displayedOnly] as const,
};

export function useExchangeRates(displayedOnly: boolean) {
  return useApiQuery<ExchangeRateItem[]>(EXCHANGE_RATE_KEYS.list(displayedOnly), () => getExchangeRates(displayedOnly));
}

/** Pulls the latest rates from Vietcombank, then reloads the list. */
export function useSyncExchangeRates() {
  return useApiAction(syncExchangeRates, { invalidate: [EXCHANGE_RATE_KEYS.all] });
}
