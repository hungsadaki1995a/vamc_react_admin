import { useState } from 'react';
import { Alert } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import {
  NOTI_CHANNEL_LABELS,
  NOTI_HISTORY_MAX_DAYS,
  NOTIFICATION_ERRORS,
} from '@/api/system/notification-api';
import type {
  NotiChannel,
  NotiHistorySearchType,
  NotificationHistoryItem,
  NotificationHistorySearch,
  YesNo,
} from '@/api/system/notification-api';
import {
  DateTimeText,
  ResultBadge,
  SysExcelButton,
  SysFilterItem,
  SysFilterPanel,
  SysNotAvailable,
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '../_shared/SysListUi';
import { API_DATE_ISO, SYS_DATE_FORMAT, SYS_PAGE_SIZE } from '../_shared/sys-constants';
import { apiErrorCode, lastDaysRange } from '../_shared/system-utils';
import { usePagedList } from '../_shared/use-paged-list';
import { useSysDialogs } from '../_shared/use-sys-dialogs';
import NotificationHistoryDetailModal from './NotificationHistoryDetailModal';
import { useDownloadNotificationHistoriesExcel, useNotificationHistories } from './use-notification-histories';
import styles from './notification-history-management.module.scss';

// Notification Send History - List (VPA09050201): view only, searched automatically on entry
// with the last 7 days (the server requires fromDt / toDt and allows at most 92 days).

interface HistoryFilter {
  period: [Dayjs, Dayjs];
  searchType: NotiHistorySearchType;
  keyword: string;
}

type DraftPeriod = [Dayjs | null, Dayjs | null] | null;

const SEARCH_TYPE_OPTIONS: { value: NotiHistorySearchType; label: string }[] = [
  { value: 'TITLE', label: 'Title' },
  { value: 'RECIPIENT', label: 'Recipient' },
];

const MESSAGES = {
  periodRequired: 'Please select the send period.',
  periodRange: `The send period can span at most ${NOTI_HISTORY_MAX_DAYS} days.`,
} as const;

function initialFilter(): HistoryFilter {
  return { period: lastDaysRange(7), searchType: 'TITLE', keyword: '' };
}

function toSearch(filter: HistoryFilter): NotificationHistorySearch {
  return {
    fromDt: filter.period[0].format(API_DATE_ISO),
    toDt: filter.period[1].format(API_DATE_ISO),
    searchType: filter.searchType,
    keyword: filter.keyword.trim(),
  };
}

/** Frame column order and alignment; No counts from 1 on the newest row of each page. */
function buildColumns(page: number): TableColumnsType<NotificationHistoryItem> {
  return [
    { title: 'No', key: 'no', width: 70, render: (_: unknown, __, index) => (page - 1) * SYS_PAGE_SIZE + index + 1 },
    // Code / Service wait for the LOG_NOTI_SNDNG schema change.
    { title: 'Code', key: 'code', align: 'center', width: 130, render: () => '-' },
    {
      title: 'Channel',
      dataIndex: 'notiMediaSe',
      key: 'notiMediaSe',
      width: 120,
      sorter: true,
      render: (v: NotiChannel) => NOTI_CHANNEL_LABELS[v] ?? v,
    },
    { title: 'Service', key: 'service', width: 160, render: () => '-' },
    { title: 'Title', dataIndex: 'notiTtl', key: 'notiTtl', sorter: true },
    { title: 'Recipient', dataIndex: 'notiRcvrId', width: 200, render: (v?: string) => v || '-' },
    {
      title: 'Send Result',
      dataIndex: 'sndngScsYn',
      key: 'sndngScsYn',
      align: 'center',
      width: 120,
      sorter: true,
      render: (v: YesNo) => <ResultBadge value={v} />,
    },
    {
      title: 'Sent At',
      dataIndex: 'notiSndngDt',
      key: 'notiSndngDt',
      width: 180,
      sorter: true,
      render: (v?: string) => <DateTimeText value={v} seconds />,
    },
  ];
}

export default function NotificationHistoryManagement() {
  const { alert } = useSysDialogs();
  const list = usePagedList<HistoryFilter>(initialFilter);
  // The period picker may be cleared while editing; the applied filter always has both dates.
  const [draftPeriod, setDraftPeriod] = useState<DraftPeriod>(list.draft.period);
  const search = toSearch(list.applied);
  const { data, isFetching, error } = useNotificationHistories(search, list.pageQuery);
  const excel = useDownloadNotificationHistoriesExcel();
  const [detailId, setDetailId] = useState<string | null>(null);
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    const [from, to] = draftPeriod ?? [null, null];
    if (!from || !to) {
      alert(MESSAGES.periodRequired);
      return;
    }
    if (to.diff(from, 'day') > NOTI_HISTORY_MAX_DAYS) {
      alert(MESSAGES.periodRange);
      return;
    }
    list.search({ period: [from, to] });
  };

  const handleReset = () => {
    list.reset();
    setDraftPeriod(initialFilter().period);
  };

  const periodError = apiErrorCode(error) === NOTIFICATION_ERRORS.period;

  return (
    <SysPage>
      <SysTitleBar
        title="Notification Send History"
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Send History']}
      />
      <SysNotAvailable title="Sends are not recorded yet">
        The backend does not write the send history yet, so the list stays empty. Code, Service and the recipient
        address wait for a schema change; Recipient shows the member / employee number.
      </SysNotAvailable>
      <SysFilterPanel>
        <SysFilterItem label="Send Period">
          <AppRangePicker
            className={styles.rangePicker}
            value={draftPeriod}
            format={SYS_DATE_FORMAT}
            placeholder={['DD-MM-YYYY', 'DD-MM-YYYY']}
            onChange={(period) => setDraftPeriod(period)}
          />
        </SysFilterItem>
        <SysFilterItem label="Search">
          <AppSelect<NotiHistorySearchType>
            value={list.draft.searchType}
            options={SEARCH_TYPE_OPTIONS}
            onChange={(searchType) => list.setDraft({ searchType })}
          />
        </SysFilterItem>
        <SysFilterItem label="Content">
          <TextInput
            value={list.draft.keyword}
            allowClear
            maxLength={100}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={handleReset} onSearch={handleSearch} loading={isFetching} />
      {periodError && <Alert type="error" showIcon title={MESSAGES.periodRange} />}
      <SysSectionHeader
        total={total}
        actions={<SysExcelButton onClick={() => excel.mutate(search)} loading={excel.isPending} />}
      />
      <SysTable<NotificationHistoryItem>
        rowKey="logId"
        columns={buildColumns(list.page)}
        dataSource={data?.content ?? []}
        loading={isFetching}
        onRowClick={(row) => setDetailId(row.logId)}
        sort={list.sort}
        onSortChange={list.setSort}
      />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {detailId && <NotificationHistoryDetailModal key={detailId} logId={detailId} onClose={() => setDetailId(null)} />}
    </SysPage>
  );
}
