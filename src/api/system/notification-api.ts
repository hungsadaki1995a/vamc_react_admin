import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Notification Message (A09050100) and Notification Send History (A09050200) APIs, v0.8 model.

export type YesNo = 'Y' | 'N';
/** Channel; the design shows MAIL as EMAIL and ZALO as ZALO_ZNS. PUSH is legacy. */
export type NotiChannel = 'MAIL' | 'ZALO' | 'PUSH';
/** MBR = User, EMP = Admin. */
export type NotiRecipientType = 'MBR' | 'EMP';
/** Legacy processing type (optional, kept for old templates). */
export type NotiProcessType = 'RCPT' | 'PRCS' | '1ST_ATRZ' | '2ND_ATRZ' | 'CMPTN';
export type NotiLang = 'VN' | 'EN';

/** Design labels of the channel / recipient type codes. */
export const NOTI_CHANNEL_LABELS: Record<NotiChannel, string> = { MAIL: 'EMAIL', ZALO: 'ZALO_ZNS', PUSH: 'PUSH' };
export const NOTI_RECIPIENT_LABELS: Record<NotiRecipientType, string> = { MBR: 'User', EMP: 'Admin' };

// ── Notification Message ─────────────────────────────────────────────────────

export interface NotificationMessageItem {
  notiMsgId: string;
  useYn: YesNo;
  /** No.: CODEnnnn-E / CODEnnnn-Z, same as the Code of the send history; null for legacy rows. */
  notiTmplCd?: string;
  /** Service Type (free text). */
  notiSrvcNm?: string;
  menuCd?: string;
  menuNm?: string;
  notiMediaSe: NotiChannel;
  prcsSttsCd?: NotiProcessType;
  notiRcvrSeCd?: NotiRecipientType;
  roleGroupId?: string;
  /** Name of the recipient user group (EMP only). */
  roleGroupNm?: string;
  roleId?: string;
  langCd?: NotiLang;
  notiTtl: string;
  /** Detail only. */
  notiCn?: string;
  /** Remarks, detail only. */
  noteCn?: string;
  /** Always true since v0.8 (active templates can be edited). */
  editable?: boolean;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface NotificationMessageSearch {
  /** Bound to `List<String>` on the server; a single value is sent as `useYns=Y`. */
  useYns?: YesNo | '';
  notiMediaSe?: NotiChannel | '';
  notiRcvrSeCd?: NotiRecipientType | '';
  /** Partial match on No. or Service Type. */
  keyword?: string;
}

/** Body of POST / PUT. The No. is assigned by the server; menuCd / prcsSttsCd / langCd are legacy and optional. */
export interface NotificationMessageRequest {
  useYn: YesNo;
  /** ≤ 100 */
  notiSrvcNm: string;
  /** MAIL or ZALO for new templates. */
  notiMediaSe: NotiChannel;
  notiRcvrSeCd: NotiRecipientType;
  /** Required for EMP (must exist, NTF006); dropped by the server for MBR. */
  roleGroupId?: string;
  /** ≤ 256; only listed variables (NTF007). */
  notiTtl: string;
  notiCn: string;
  /** Remarks ≤ 1000, not sent. */
  noteCn?: string;
}

/** Variable of the [Insert Variable] buttons; secret ones are masked as ****** in the send history. */
export interface NotificationVariable {
  name: string;
  placeholder: string;
  description: string;
  secret: boolean;
}

/**
 * NTF001 not found, NTF002 in use (DELETE), NTF003 legacy duplicate, NTF004 history not found, NTF005 period,
 * NTF006 unknown user group, NTF007 unknown variable, NTF008 no number left, NTF009 recipient search not configured.
 */
export const NOTIFICATION_ERRORS = {
  notFound: 'NTF001',
  inUse: 'NTF002',
  duplicate: 'NTF003',
  historyNotFound: 'NTF004',
  period: 'NTF005',
  roleGroupNotFound: 'NTF006',
  unknownVariable: 'NTF007',
  codeExhausted: 'NTF008',
  recipientSearchUnavailable: 'NTF009',
} as const;

const NOTI_MSG_BASE = '/api/v1/notification-messages';

/** Server sort fields: useYn, notiTmplCd (default ASC), notiSrvcNm, notiMediaSe, notiRcvrSeCd, roleGroupNm, notiTtl. */
export const getNotificationMessages = (search: NotificationMessageSearch, query: PageQuery) =>
  apiGet<PageResponse<NotificationMessageItem>>(NOTI_MSG_BASE, { ...search, ...query });

export const getNotificationMessage = (id: string) =>
  apiGet<NotificationMessageItem>(`${NOTI_MSG_BASE}/${encodeURIComponent(id)}`);

export const getNotificationVariables = () => apiGet<NotificationVariable[]>(`${NOTI_MSG_BASE}/variables`);

export const downloadNotificationMessagesExcel = (search: NotificationMessageSearch, query: PageQuery) =>
  apiDownload(`${NOTI_MSG_BASE}/excel`, 'notification-messages.xlsx', { ...search, sortBy: query.sortBy, sortDirection: query.sortDirection });

export const createNotificationMessage = (request: NotificationMessageRequest) =>
  apiPost<NotificationMessageItem>(NOTI_MSG_BASE, request);

/** Also while in use (v0.8); `useYn` in the body is applied. */
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
  /** Template No.; null when the mail was not sent from a template. */
  notiTmplCd?: string;
  /** Template service type, or the internal mail key. */
  notiSrvcNm?: string;
  notiMediaSe: NotiChannel;
  notiTtl: string;
  notiRcvrSeCd?: NotiRecipientType;
  /** Member / employee number; null for a shared mailbox. */
  notiRcvrId?: string;
  /** E-mail address or phone, masked by the server. */
  notiRcvrAddr?: string;
  notiSndngDt?: string;
  sndngScsYn: YesNo;
  /** Detail only; content as sent, secrets masked (******). */
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

/** Server sort fields: notiTmplCd, notiSrvcNm, notiMediaSe, notiTtl, sndngScsYn (default sent at DESC). RECIPIENT search is an exact match. */
export const getNotificationHistories = (search: NotificationHistorySearch, query: PageQuery) =>
  apiGet<PageResponse<NotificationHistoryItem>>(NOTI_HIST_BASE, { ...search, ...query });

export const getNotificationHistory = (logId: string) =>
  apiGet<NotificationHistoryItem>(`${NOTI_HIST_BASE}/${encodeURIComponent(logId)}`);

export const downloadNotificationHistoriesExcel = (search: NotificationHistorySearch) =>
  apiDownload(`${NOTI_HIST_BASE}/excel`, 'notification-history.xlsx', search);
