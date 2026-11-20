import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createNotificationMessage,
  deleteNotificationMessages,
  getNotificationMessages,
  toggleNotificationMessageUse,
  updateNotificationMessage,
} from '@/api/system/notification-api';
import type { NotificationMessageItem } from '@/api/system/notification-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Notification Message Management (menu A06060100).

export interface NotificationMessageSearch {
  crtFromDt?: string;
  crtToDt?: string;
  prcsSttsCd?: string;
  notiTtl?: string;
}

const NOTIFICATION_MESSAGE_KEYS = {
  all: ['system', 'notification-messages'] as const,
  list: (search: NotificationMessageSearch, page: number, size: number) =>
    ['system', 'notification-messages', 'list', search, page, size] as const,
};

export function useNotificationMessages(search: NotificationMessageSearch, page: number, size: number) {
  return useApiQuery<PageResponse<NotificationMessageItem>>(
    NOTIFICATION_MESSAGE_KEYS.list(search, page, size),
    () => getNotificationMessages(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

export function useDeleteNotificationMessages() {
  return useApiAction(deleteNotificationMessages, { invalidate: [NOTIFICATION_MESSAGE_KEYS.all] });
}

export interface ToggleNotificationMessageUseVariables {
  notiMsgId: string;
  useYn: 'Y' | 'N';
}

export function useToggleNotificationMessageUse() {
  return useApiAction(
    ({ notiMsgId, useYn }: ToggleNotificationMessageUseVariables) => toggleNotificationMessageUse(notiMsgId, useYn),
    { invalidate: [NOTIFICATION_MESSAGE_KEYS.all] },
  );
}

export interface SaveNotificationMessageVariables {
  /** null = register. */
  notiMsgId: string | null;
  request: Partial<NotificationMessageItem>;
}

/** Registers or edits a notification message. */
export function useSaveNotificationMessage() {
  return useApiAction(
    ({ notiMsgId, request }: SaveNotificationMessageVariables) =>
      notiMsgId === null ? createNotificationMessage(request) : updateNotificationMessage(notiMsgId, request),
    { invalidate: [NOTIFICATION_MESSAGE_KEYS.all] },
  );
}
