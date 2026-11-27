import { useMemo, useState } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
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
} from '@/components/common/sys-ui/SysListUi';
import { ALL, SYS_PAGE_SIZE, USE_YN_FILTER_OPTIONS } from '@/config/sys-constants';
import { usePagedList } from '@/hooks/use-paged-list';
import { CHANNEL_FILTER_OPTIONS, RECIPIENT_TYPE_FILTER_OPTIONS } from './notification-message-constants';
import NotificationMessageModal from './NotificationMessageModal';
import { useDownloadNotificationMessagesExcel, useNotificationMessages } from './use-notification-messages';
import styles from './notification-message-management.module.scss';

// Notification Message Management - List (VPA09050101), v0.8 model.

interface MessageFilter {
  useYn: YesNo | '';
  channel: NotiChannel | '';
  recipientType: NotiRecipientType | '';
  no: string;
}

const INITIAL_FILTER: MessageFilter = { useYn: ALL, channel: ALL, recipientType: ALL, no: '' };

function toSearch(filter: MessageFilter): NotificationMessageSearch {
  return {
    useYns: filter.useYn,
    notiMediaSe: filter.channel,
    notiRcvrSeCd: filter.recipientType,
    keyword: filter.no.trim(),
  };
}

/** Popup state: closed, register (null) or edit (template id). */
type ModalState = { notiMsgId: string | null } | null;

export default function NotificationMessageManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<MessageFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching, refetch } = useNotificationMessages(search, list.pageQuery);
  const excel = useDownloadNotificationMessagesExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  const columns = useMemo<TableColumnsType<NotificationMessageItem>>(
    () => [
      {
        title: 'Use',
        dataIndex: 'useYn',
        key: 'useYn',
        align: 'center',
        width: 80,
        sorter: true,
        render: (v: YesNo) => <UseBadge value={v} />,
      },
      {
        title: 'No.',
        dataIndex: 'notiTmplCd',
        key: 'notiTmplCd',
        width: 130,
        sorter: true,
        render: (v?: string) => v || '-',
      },
      {
        title: 'Service Type',
        dataIndex: 'notiSrvcNm',
        key: 'notiSrvcNm',
        width: 160,
        ellipsis: true,
        sorter: true,
        render: (v?: string) => v || '-',
      },
      {
        title: 'Channel',
        dataIndex: 'notiMediaSe',
        key: 'notiMediaSe',
        width: 100,
        sorter: true,
        render: (v: NotiChannel) => NOTI_CHANNEL_LABELS[v] ?? v,
      },
      {
        title: 'Recipient Type',
        dataIndex: 'notiRcvrSeCd',
        key: 'notiRcvrSeCd',
        width: 120,
        sorter: true,
        render: (v?: NotiRecipientType) => (v ? NOTI_RECIPIENT_LABELS[v] : '-'),
      },
      {
        title: 'Recipient',
        dataIndex: 'roleGroupNm',
        key: 'roleGroupNm',
        width: 150,
        ellipsis: true,
        sorter: true,
        render: (v: string | undefined, row) => (row.notiRcvrSeCd === 'EMP' ? (v ?? row.roleGroupId ?? '-') : '-'),
      },
      {
        title: 'Title Template',
        dataIndex: 'notiTtl',
        key: 'notiTtl',
        sorter: true,
        ellipsis: true,
      },
    ],
    [],
  );

  return (
    <SysPage>
      <SysTitleBar
        title="Notification Message Management"
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Message Management']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Use">
          <AppSelect<YesNo | ''> value={list.draft.useYn} options={USE_YN_FILTER_OPTIONS} onChange={(useYn) => list.setDraft({ useYn })} />
        </SysFilterItem>
        <SysFilterItem label="Channel">
          <AppSelect<NotiChannel | ''>
            value={list.draft.channel}
            options={CHANNEL_FILTER_OPTIONS}
            onChange={(channel) => list.setDraft({ channel })}
          />
        </SysFilterItem>
        <SysFilterItem label="Recipient Type">
          <AppSelect<NotiRecipientType | ''>
            value={list.draft.recipientType}
            options={RECIPIENT_TYPE_FILTER_OPTIONS}
            onChange={(recipientType) => list.setDraft({ recipientType })}
          />
        </SysFilterItem>
        <SysFilterItem label="No.">
          <TextInput
            value={list.draft.no}
            placeholder="No. or Service Type"
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ no: e.target.value })}
            onPressEnter={() => { if (!list.search()) void refetch(); }}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={() => { if (!list.reset()) void refetch(); }} onSearch={() => { if (!list.search()) void refetch(); }} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={
          <SysExcelButton onClick={() => excel.mutate({ search, query: list.pageQuery })} loading={excel.isPending} />
        }
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
        className={styles.listTable}
        fill
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
