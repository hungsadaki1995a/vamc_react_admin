import { useMemo } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiDownload, useApiTask } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  createNotificationMessage,
  downloadNotificationMessagesExcel,
  getNotificationMessage,
  getNotificationMessages,
  getNotificationVariables,
  updateNotificationMessage,
} from '@/api/system/notification-api';
import type {
  NotificationMessageItem,
  NotificationMessageRequest,
  NotificationMessageSearch,
  NotificationVariable,
} from '@/api/system/notification-api';
import { getRoleGroups } from '@/api/system/role-group-api';
import type { RoleGroup } from '@/api/system/role-group-api';
import { FALLBACK_TEMPLATE_VARIABLES, HIDDEN_ROLE_GROUP_IDS } from './notification-message-constants';

// Data hooks of Notification Message Management (VPA09050101 / VPA090501P01).

const NOTIFICATION_MESSAGE_KEYS = {
  all: ['system', 'notification-messages'] as const,
  list: (search: NotificationMessageSearch, query: PageQuery) =>
    ['system', 'notification-messages', 'list', search, query] as const,
  detail: (id: string | null) => ['system', 'notification-messages', 'detail', id] as const,
  roleGroups: ['system', 'notification-messages', 'role-groups'] as const,
  variables: ['system', 'notification-messages', 'variables'] as const,
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
      options: list
        .filter((group) => !HIDDEN_ROLE_GROUP_IDS.includes(group.roleGroupId))
        .map((group) => ({ value: group.roleGroupId, label: group.roleGroupNm })),
      nameOf: (id?: string) => list.find((group) => group.roleGroupId === id)?.roleGroupNm,
      loading: query.isFetching,
    };
  }, [groups, query.isFetching]);
}

/** Variables of the [Insert Variable] buttons (server list; the frame's three until it loads). */
export function useTemplateVariables(): readonly NotificationVariable[] {
  const { data } = useApiQuery<NotificationVariable[]>(NOTIFICATION_MESSAGE_KEYS.variables, getNotificationVariables, {
    staleTime: 30 * 60 * 1000,
  });
  return data ?? FALLBACK_TEMPLATE_VARIABLES;
}

/** [Excel Download] of the searched list. */
export function useDownloadNotificationMessagesExcel() {
  return useApiDownload(({ search, query }: { search: NotificationMessageSearch; query: PageQuery }) =>
    downloadNotificationMessagesExcel(search, query),
  );
}

export interface SaveNotificationMessageVariables {
  /** null = register. */
  current: NotificationMessageItem | null;
  request: NotificationMessageRequest;
}

/** Registers or edits a template; active templates are edited directly (v0.8). */
export function useSaveNotificationMessage() {
  return useApiTask(
    ({ current, request }: SaveNotificationMessageVariables) =>
      current === null ? createNotificationMessage(request) : updateNotificationMessage(current.notiMsgId, request),
    { invalidate: [NOTIFICATION_MESSAGE_KEYS.all] },
  );
}
