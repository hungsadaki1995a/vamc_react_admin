import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { changeZaloAutoRefresh, getZaloConnection, refreshZaloToken, testZaloConnection } from '@/api/system/zalo-connection-api';
import type { ZaloConnection } from '@/api/system/zalo-connection-api';
import type { YesNo } from '@/config/sys-constants';

// Data hooks of Zalo OA Connection (menu A09050600).

const ZALO_CONNECTION_KEYS = {
  all: ['system', 'zalo-connection'] as const,
};

/** Configuration, token expiry and the connection log; never a token or secret value. */
export function useZaloConnection() {
  return useApiQuery<ZaloConnection>(ZALO_CONNECTION_KEYS.all, getZaloConnection);
}

/** Live: calls the OA info API and logs the result; demo: nothing is called. */
export function useTestZaloConnection() {
  return useApiAction(() => testZaloConnection(), { invalidate: [ZALO_CONNECTION_KEYS.all] });
}

export function useRefreshZaloToken() {
  return useApiAction(() => refreshZaloToken(), { invalidate: [ZALO_CONNECTION_KEYS.all] });
}

export function useChangeZaloAutoRefresh() {
  return useApiAction((autoRfrshYn: YesNo) => changeZaloAutoRefresh(autoRfrshYn), { invalidate: [ZALO_CONNECTION_KEYS.all] });
}
