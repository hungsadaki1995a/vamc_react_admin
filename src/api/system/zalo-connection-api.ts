import { apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { YesNo } from '@/config/sys-constants';

// Zalo OA Connection API — ZaloConnectionController (/api/v1/zalo/connection, menu A09050600). Table ZALO_CFG_INFO.
// Tokens and the app secret never leave the server: only expiry dates and a `secretConfigured` flag are returned.

/** DEMO = nothing reaches Zalo, LIVE = real sending (`zalo.enabled`). */
export type ZaloMode = 'DEMO' | 'LIVE';

export interface ZaloConnectionLog {
  at: string;
  /** EMP_NO, `SYSTEM` or `ZALO`. */
  by?: string;
  /** Connection test, Token refresh, Webhook, Automatic refresh… */
  event: string;
  /** OK or Failed. */
  result?: string;
  detail?: string;
}

export interface ZaloConnection {
  mode: ZaloMode;
  /** LIVE with a stored access token that has not expired. */
  connected: boolean;
  oaId?: string | null;
  oaName?: string | null;
  /** Not a secret. */
  appId?: string | null;
  secretConfigured: boolean;
  followLink?: string | null;
  /** Null until deployed. */
  webhookUrl?: string | null;
  signatureCheck: boolean;
  eventsHandled: string[];
  accessTokenExprDt?: string | null;
  refreshTokenExprDt?: string | null;
  autoRfrshYn: YesNo;
  lstRfrshDt?: string | null;
  lstWbhkDt?: string | null;
  lstWbhkEvtNm?: string | null;
  /** Newest first (20). */
  logs: ZaloConnectionLog[];
}

export interface ZaloConnectionAction {
  /** A call was made to Zalo (false in demo mode). */
  performed: boolean;
  ok: boolean;
  mode: ZaloMode;
  message?: string;
  elapsedMs: number;
}

const CONNECTION = '/api/v1/zalo/connection';

export const getZaloConnection = () => apiGet<ZaloConnection>(CONNECTION);

/** DEMO: nothing is called or logged. */
export const testZaloConnection = () => apiPost<ZaloConnectionAction>(`${CONNECTION}/test`);

/** `performed` is false until the live integration. */
export const refreshZaloToken = () => apiPost<ZaloConnectionAction>(`${CONNECTION}/token/refresh`);

export const changeZaloAutoRefresh = (autoRfrshYn: YesNo) =>
  apiPut<ZaloConnection>(`${CONNECTION}/auto-refresh`, { autoRfrshYn });
