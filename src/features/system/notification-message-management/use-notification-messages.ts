import { useMemo } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiTask } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  changeNotificationMessageUse,
  createNotificationMessage,
  getNotificationMessage,
  getNotificationMessages,
  updateNotificationMessage,
} from '@/api/system/notification-api';
import type {
  NotificationMessageItem,
  NotificationMessageRequest,
  NotificationMessageSearch,
} from '@/api/system/notification-api';
import { getRoleGroups } from '@/api/system/role-group-api';
import type { RoleGroup } from '@/api/system/role-group-api';

// Data hooks of Notification Message Management (VPA09050101 / VPA090501P01).

const NOTIFICATION_MESSAGE_KEYS = {
  all: ['system', 'notification-messages'] as const,
  list: (search: NotificationMessageSearch, query: PageQuery) =>
    ['system', 'notification-messages', 'list', search, query] as const,
  detail: (id: string | null) => ['system', 'notification-messages', 'detail', id] as const,
  roleGroups: ['system', 'notification-messages', 'role-groups'] as const,
};

export function useNotificationMessages(search: NotificationMessageSearch, query: PageQuery) {
  return useApiQuery<PageResponse<NotificationMessageItem>>(
    NOTIFICATION_MESSAGE_KEYS.list(search, query),
    () => getNotificationMessages(search, query),
    { placeholderData: keepPreviousData },
  );
}

/** Template with its content for the edit popup; skipped while `id` is null (register). */
export function useNotificationMessage(id: string | null) {
  return useApiQuery<NotificationMessageItem>(
    NOTIFICATION_MESSAGE_KEYS.detail(id),
    () => getNotificationMessage(id as string),
    { enabled: id !== null, gcTime: 0 },
  );
}

/** Active staff groups (Recipient select) and an id → name lookup for the list. */
export function useRecipientGroups() {
  const query = useApiQuery<RoleGroup[]>(NOTIFICATION_MESSAGE_KEYS.roleGroups, () => getRoleGroups({ useYn: 'Y' }), {
    staleTime: 5 * 60 * 1000,
  });
  const groups = query.data;
  return useMemo(() => {
    const list = groups ?? [];
    return {
      options: list.map((group) => ({ value: group.roleGroupId, label: group.roleGroupNm })),
      nameOf: (id?: string) => list.find((group) => group.roleGroupId === id)?.roleGroupNm,
      loading: query.isFetching,
    };
  }, [groups, query.isFetching]);
}

export interface SaveNotificationMessageVariables {
  /** null = register. */
  current: NotificationMessageItem | null;
  request: NotificationMessageRequest;
}

/**
 * Registers or edits a template. The API only edits a template that is not in use (NTF002), while v0.8
 * allows free edit: an active template is switched off, saved with the chosen Use, and switched back
 * on if the save fails.
 */
export function useSaveNotificationMessage() {
  return useApiTask(
    async ({ current, request }: SaveNotificationMessageVariables) => {
      if (current === null) return createNotificationMessage(request);
      const wasActive = current.useYn === 'Y';
      if (wasActive) await changeNotificationMessageUse(current.notiMsgId, 'N');
      try {
        return await updateNotificationMessage(current.notiMsgId, request);
      } catch (error) {
        if (wasActive) await changeNotificationMessageUse(current.notiMsgId, 'Y').catch(() => undefined);
        throw error;
      }
    },
    { invalidate: [NOTIFICATION_MESSAGE_KEYS.all] },
  );
}
