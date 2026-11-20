import { useMemo, useState } from 'react';
import { Alert, Input, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { NOTI_CHANNEL_LABELS, NOTI_RECIPIENT_LABELS } from '@/api/system/notification-api';
import type {
  NotiChannel,
  NotiRecipientType,
  NotificationMessageItem,
  NotificationMessageSearch,
  YesNo,
} from '@/api/system/notification-api';
import {
  SysButton,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
  UseBadge,
} from '../_shared/sys-list-ui';
import { ALL, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '../_shared/sys-constants';
import { usePagedList } from '../_shared/use-paged-list';
import { CHANNEL_FILTER_OPTIONS, RECIPIENT_TYPE_FILTER_OPTIONS } from './notification-message-constants';
import NotificationMessageModal from './notification-message-modal';
import { useNotificationMessages, useRecipientGroups } from './use-notification-messages';
import styles from './notification-message-management.module.scss';

// Notification Message Management - List (VPA09050101), v0.8 model.
// Only the Use filter reaches the server for now; Channel / Recipient Type / No. filters, Excel, No. and
// Service Type wait for the NOTI_MSG_MNG schema change and are shown disabled.

interface MessageFilter {
  useYn: YesNo | '';
  channel: NotiChannel | '';
  recipientType: NotiRecipientType | '';
  no: string;
}

const INITIAL_FILTER: MessageFilter = { useYn: ALL, channel: ALL, recipientType: ALL, no: '' };

function toSearch(filter: MessageFilter): NotificationMessageSearch {
  // TODO(api): send channel / recipient type / No. once the server filters on them.
  return { useYns: filter.useYn };
}

/** Popup state: closed, register (null) or edit (template id). */
type ModalState = { notiMsgId: string | null } | null;

export default function NotificationMessageManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<MessageFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useNotificationMessages(search, list.pageQuery);
  const recipients = useRecipientGroups();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  const columns = useMemo<TableColumnsType<NotificationMessageItem>>(
    () => [
      { title: 'Use', dataIndex: 'useYn', align: 'center', width: 100, render: (v: YesNo) => <UseBadge value={v} /> },
      // No. / Service Type wait for the schema change.
      { title: 'No.', key: 'no', align: 'center', width: 90, render: () => '-' },
      { title: 'Service Type', key: 'serviceType', align: 'center', width: 140, render: () => '-' },
      {
        title: 'Channel',
        dataIndex: 'notiMediaSe',
        key: 'notiMediaSe',
        align: 'center',
        width: 120,
        sorter: true,
        render: (v: NotiChannel) => NOTI_CHANNEL_LABELS[v] ?? v,
      },
      {
        title: 'Recipient Type',
        dataIndex: 'notiRcvrSeCd',
        align: 'center',
        width: 130,
        render: (v?: NotiRecipientType) => (v ? NOTI_RECIPIENT_LABELS[v] : '-'),
      },
      {
        title: 'Recipient',
        dataIndex: 'roleGroupId',
        align: 'center',
        width: 180,
        render: (v: string | undefined, row) =>
          row.notiRcvrSeCd === 'EMP' && v ? (recipients.nameOf(v) ?? v) : '-',
      },
      {
        title: 'Title Template',
        dataIndex: 'notiTtl',
        key: 'notiTtl',
        sorter: true,
        render: (v: string) => <span className={styles.titleCell}>{v}</span>,
      },
    ],
    [recipients],
  );

  return (
    <SysPage>
      <SysTitleBar
        title="Notification Message Management"
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Message Management']}
      />
      <Alert
        type="warning"
        showIcon
        title="Partly available"
        description="No., Service Type, Remarks, the Channel / Recipient Type / No. filters and Excel Download wait for a schema change. Only the Use filter is applied for now."
      />
      <SysFilterPanel columns={4}>
        <SysFilterItem label="Use">
          <Select value={list.draft.useYn} options={USE_YN_FILTER_OPTIONS} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label="Channel">
          <Select
            value={list.draft.channel}
            options={CHANNEL_FILTER_OPTIONS}
            disabled
            onChange={(channel) => list.setDraft({ channel })}
          />
        </SysFilterItem>
        <SysFilterItem label="Recipient Type">
          <Select
            value={list.draft.recipientType}
            options={RECIPIENT_TYPE_FILTER_OPTIONS}
            disabled
            onChange={(recipientType) => list.setDraft({ recipientType })}
          />
        </SysFilterItem>
        <SysFilterItem label="No.">
          <Input
            value={list.draft.no}
            placeholder="No. or Service Type"
            disabled
            onChange={(e) => list.setDraft({ no: e.target.value })}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        total={total}
        // TODO(api): no Excel endpoint for notification messages yet.
        actions={<SysExcelButton onClick={() => undefined} disabled />}
        primaryActions={
          canWrite && (
            <SysButton look="navy" onClick={() => setModal({ notiMsgId: null })}>
              New
            </SysButton>
          )
        }
      />
      <SysTable<NotificationMessageItem>
        rowKey="notiMsgId"
        columns={columns}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(row) => setModal({ notiMsgId: row.notiMsgId })}
        sort={list.sort}
        onSortChange={list.setSort}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && (
        <NotificationMessageModal
          key={modal.notiMsgId ?? 'new'}
          notiMsgId={modal.notiMsgId}
          canWrite={canWrite}
          onClose={() => setModal(null)}
        />
      )}
    </SysPage>
  );
}
