import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { getExchangeRateStatus, syncExchangeRates } from '@/api/system/exchange-rate-api';
import type { ExchangeRateStatus } from '@/api/system/exchange-rate-api';

// Data hooks of Exchange Rate Management (menu A06010500).

const EXCHANGE_RATE_KEYS = {
  all: ['system', 'exchange-rates'] as const,
  status: ['system', 'exchange-rates', 'status'] as const,
};

/** Sync status, rates shown to users and the latest 5 runs. */
export function useExchangeRateStatus() {
  return useApiQuery<ExchangeRateStatus>(EXCHANGE_RATE_KEYS.status, getExchangeRateStatus);
}

/**
 * [Sync Now]: the response is the new status, written straight into the cache.
 * The status is refetched after a failure too, so the Failed run shows up.
 */
export function useSyncExchangeRates() {
  const queryClient = useQueryClient();
  const action = useApiAction(syncExchangeRates);
  return {
    ...action,
    sync: async () => {
      try {
        const response = await action.mutateAsync();
        if (response.data) queryClient.setQueryData(EXCHANGE_RATE_KEYS.status, response.data);
      } finally {
        void queryClient.invalidateQueries({ queryKey: EXCHANGE_RATE_KEYS.all });
      }
    },
  };
}
