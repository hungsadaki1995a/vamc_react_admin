import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  downloadNotificationHistoriesExcel,
  getNotificationHistories,
  getNotificationHistory,
} from '@/api/system/notification-api';
import type { NotificationHistoryItem, NotificationHistorySearch } from '@/api/system/notification-api';

// Data hooks of Notification Send History (VPA09050201 / VPA090502P01).

const NOTIFICATION_HISTORY_KEYS = {
  all: ['system', 'notification-histories'] as const,
  list: (search: NotificationHistorySearch, query: PageQuery) =>
    ['system', 'notification-histories', 'list', search, query] as const,
  detail: (logId: string) => ['system', 'notification-histories', 'detail', logId] as const,
};

/** Paged send history; `fromDt` / `toDt` are always set (the server rejects a call without them). */
export function useNotificationHistories(search: NotificationHistorySearch, query: PageQuery) {
  return useApiQuery<PageResponse<NotificationHistoryItem>>(
    NOTIFICATION_HISTORY_KEYS.list(search, query),
    () => getNotificationHistories(search, query),
    { placeholderData: keepPreviousData },
  );
}

/** One sent notification with its content and failure reason. */
export function useNotificationHistory(logId: string) {
  return useApiQuery<NotificationHistoryItem>(NOTIFICATION_HISTORY_KEYS.detail(logId), () => getNotificationHistory(logId), {
    gcTime: 0,
  });
}

/** [Excel Download] of the searched list. */
export function useDownloadNotificationHistoriesExcel() {
  return useApiDownload((search: NotificationHistorySearch) => downloadNotificationHistoriesExcel(search));
}
