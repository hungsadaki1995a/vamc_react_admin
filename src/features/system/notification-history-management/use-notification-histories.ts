import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiDownload } from '@/hooks/use-api-action';
import { downloadNotificationHistoriesExcel, getNotificationHistories } from '@/api/system/system-operations-api';
import type { NotificationHistoryItem } from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Notification Send History (menu A06060200).

export interface NotificationHistorySearch {
  fromDt?: string;
  toDt?: string;
  notiMediaSe?: string;
  sndngScsYn?: string;
  keyword?: string;
}

const NOTIFICATION_HISTORY_KEYS = {
  all: ['system', 'notification-histories'] as const,
  list: (search: NotificationHistorySearch, page: number, size: number) =>
    ['system', 'notification-histories', 'list', search, page, size] as const,
};

export function useNotificationHistories(search: NotificationHistorySearch, page: number, size: number) {
  return useApiQuery<PageResponse<NotificationHistoryItem>>(
    NOTIFICATION_HISTORY_KEYS.list(search, page, size),
    () => getNotificationHistories(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

export function useDownloadNotificationHistoriesExcel() {
  return useApiDownload((search: NotificationHistorySearch) => downloadNotificationHistoriesExcel({ ...search }));
}
