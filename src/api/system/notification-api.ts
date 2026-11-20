import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Notification Message & History (A06060100, A06060200) ────────────────────
export interface NotificationMessageItem {
  notiMsgId: string;
  useYn: 'Y' | 'N';
  menuCd?: string;
  menuNm?: string;
  notiMediaSe: string;
  prcsSttsCd?: string;
  notiRcvrSeCd?: string;
  roleGroupId?: string;
  roleId?: string;
  langCd?: string;
  notiTtl: string;
  notiCn: string;
  editable?: boolean;
  crtDt?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnByNm?: string;
}

export interface NotificationHistoryItem {
  no?: number;
  logId: string;
  notiMediaSe: string;
  notiTtl: string;
  notiRcvrSeCd?: string;
  notiRcvrId?: string;
  notiSndngDt?: string;
  sndngScsYn: 'Y' | 'N';
  notiCn?: string;
  failRsn?: string;
}

const NOTI_MSG_BASE = '/api/v1/notification-messages';
const NOTI_HIST_BASE = '/api/v1/notification-histories';
export const getNotificationMessages = (
  search: { crtFromDt?: string; crtToDt?: string; prcsSttsCd?: string; notiTtl?: string },
  page: number,
  size: number,
) => apiGet<PageResponse<NotificationMessageItem>>(NOTI_MSG_BASE, { ...search, page, size });
export const getNotificationMessage = (id: string) => apiGet<NotificationMessageItem>(`${NOTI_MSG_BASE}/${id}`);
export const createNotificationMessage = (req: Partial<NotificationMessageItem>) =>
  apiPost<NotificationMessageItem>(NOTI_MSG_BASE, req);
export const updateNotificationMessage = (id: string, req: Partial<NotificationMessageItem>) =>
  apiPut<NotificationMessageItem>(`${NOTI_MSG_BASE}/${id}`, req);
export const toggleNotificationMessageUse = (id: string, useYn: 'Y' | 'N') =>
  apiPatch<void>(`${NOTI_MSG_BASE}/${id}/use`, { useYn });
export const deleteNotificationMessages = (notiMsgIds: string[]) =>
  apiDelete<void>(NOTI_MSG_BASE, { notiMsgIds });

export const getNotificationHistories = (
  search: { fromDt?: string; toDt?: string; keyword?: string; notiMediaSe?: string; sndngScsYn?: string },
  page: number,
  size: number,
) => apiGet<PageResponse<NotificationHistoryItem>>(NOTI_HIST_BASE, { ...search, page, size });
export const downloadNotificationHistoriesExcel = (search: Record<string, unknown>) =>
  apiDownload(`${NOTI_HIST_BASE}/excel`, 'notification-history.xlsx', search);
