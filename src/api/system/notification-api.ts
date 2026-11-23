import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Notification Message (A06060100) and Notification Send History (A06060200) APIs.
// v0.8 fields without a backend column yet (template No., Service Type, Remarks, send Code / Service,
// recipient address) wait for the NOTI_MSG_MNG / LOG_NOTI_SNDNG DDL and are not sent.

export type YesNo = 'Y' | 'N';
/** Channel; the design shows MAIL as EMAIL and ZALO as ZALO_ZNS. PUSH is legacy. */
export type NotiChannel = 'MAIL' | 'ZALO' | 'PUSH';
/** MBR = User, EMP = Admin. */
export type NotiRecipientType = 'MBR' | 'EMP';
/** Legacy processing type, still required by the API. */
export type NotiProcessType = 'RCPT' | 'PRCS' | '1ST_ATRZ' | '2ND_ATRZ' | 'CMPTN';
export type NotiLang = 'VN' | 'EN';

/** Design labels of the channel / recipient type codes. */
export const NOTI_CHANNEL_LABELS: Record<NotiChannel, string> = { MAIL: 'EMAIL', ZALO: 'ZALO_ZNS', PUSH: 'PUSH' };
export const NOTI_RECIPIENT_LABELS: Record<NotiRecipientType, string> = { MBR: 'User', EMP: 'Admin' };

// ── Notification Message ─────────────────────────────────────────────────────

export interface NotificationMessageItem {
  notiMsgId: string;
  useYn: YesNo;
  menuCd?: string;
  menuNm?: string;
  notiMediaSe: NotiChannel;
  prcsSttsCd?: NotiProcessType;
  notiRcvrSeCd?: NotiRecipientType;
  roleGroupId?: string;
  roleId?: string;
  langCd?: NotiLang;
  notiTtl: string;
  /** Detail only. */
  notiCn?: string;
  /** True only while not in use. */
  editable?: boolean;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface NotificationMessageSearch {
  /** Bound to `List<String>` on the server; a single value is sent as `useYns=Y`. */
  useYns?: YesNo | '';
  /** Partial match on the title. */
  notiTtl?: string;
}

/** Body of POST / PUT — every field the current API validates. */
export interface NotificationMessageRequest {
  useYn: YesNo;
  /** `^A\d{8}$` (legacy, until the schema change). */
  menuCd: string;
  notiMediaSe: NotiChannel;
  /** Legacy, until the schema change. */
  prcsSttsCd: NotiProcessType;
  notiRcvrSeCd: NotiRecipientType;
  /** Required for EMP; dropped by the server for MBR. */
  roleGroupId?: string;
  /** Legacy, until the schema change. */
  langCd: NotiLang;
  /** ≤ 256 */
  notiTtl: string;
  notiCn: string;
}

/** NTF001 not found, NTF002 in use (PUT / DELETE), NTF003 another active template has the same key, NTF005 period. */
export const NOTIFICATION_ERRORS = {
  notFound: 'NTF001',
  inUse: 'NTF002',
  duplicate: 'NTF003',
  historyNotFound: 'NTF004',
  period: 'NTF005',
} as const;

const NOTI_MSG_BASE = '/api/v1/notification-messages';

/** Server sort fields: notiMediaSe, notiTtl, menuCd, prcsSttsCd, mdfcnDt (default crtDt DESC). */
export const getNotificationMessages = (search: NotificationMessageSearch, query: PageQuery) =>
  apiGet<PageResponse<NotificationMessageItem>>(NOTI_MSG_BASE, { ...search, ...query });

export const getNotificationMessage = (id: string) =>
  apiGet<NotificationMessageItem>(`${NOTI_MSG_BASE}/${encodeURIComponent(id)}`);

export const createNotificationMessage = (request: NotificationMessageRequest) =>
  apiPost<NotificationMessageItem>(NOTI_MSG_BASE, request);

/** Only while useYn = N (NTF002 otherwise); `useYn` in the body is applied. */
export const updateNotificationMessage = (id: string, request: NotificationMessageRequest) =>
  apiPut<NotificationMessageItem>(`${NOTI_MSG_BASE}/${encodeURIComponent(id)}`, request);

export const changeNotificationMessageUse = (id: string, useYn: YesNo) =>
  apiPatch<NotificationMessageItem>(`${NOTI_MSG_BASE}/${encodeURIComponent(id)}/use`, { useYn });

/** Not on the v0.8 screen; kept for API completeness. */
export const deleteNotificationMessages = (notiMsgIds: string[]) => apiDelete<number>(NOTI_MSG_BASE, { notiMsgIds });

// ── Notification Send History ────────────────────────────────────────────────

export type NotiHistorySearchType = 'TITLE' | 'RECIPIENT' | 'CONTENT';

export interface NotificationHistoryItem {
  no?: number;
  logId: string;
  notiMediaSe: NotiChannel;
  notiTtl: string;
  notiRcvrSeCd?: NotiRecipientType;
  /** Member / employee number (the address column waits for the schema change). */
  notiRcvrId?: string;
  notiSndngDt?: string;
  sndngScsYn: YesNo;
  /** Detail only. */
  notiCn?: string;
  /** Detail only. */
  failRsn?: string;
}

export interface NotificationHistorySearch {
  /** yyyy-MM-dd, required. */
  fromDt: string;
  /** yyyy-MM-dd inclusive, required; at most 92 days after fromDt (NTF005). */
  toDt: string;
  searchType?: NotiHistorySearchType;
  keyword?: string;
}

/** Longest period the server accepts. */
export const NOTI_HISTORY_MAX_DAYS = 92;

const NOTI_HIST_BASE = '/api/v1/notification-histories';

/** Server sort fields: notiMediaSe, notiTtl, sndngScsYn (default sent at DESC). */
export const getNotificationHistories = (search: NotificationHistorySearch, query: PageQuery) =>
  apiGet<PageResponse<NotificationHistoryItem>>(NOTI_HIST_BASE, { ...search, ...query });

export const getNotificationHistory = (logId: string) =>
  apiGet<NotificationHistoryItem>(`${NOTI_HIST_BASE}/${encodeURIComponent(logId)}`);

export const downloadNotificationHistoriesExcel = (search: NotificationHistorySearch) =>
  apiDownload(`${NOTI_HIST_BASE}/excel`, 'notification-history.xlsx', search);
