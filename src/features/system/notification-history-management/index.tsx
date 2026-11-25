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
  SysPage,
  SysPager,
  SysSearchActions,
  SysSectionHeader,
  SysTable,
  SysTitleBar,
} from '@/components/common/sys-ui/SysListUi';
import { API_DATE_ISO, SYS_DATE_FORMAT, SYS_PAGE_SIZE } from '@/config/sys-constants';
import { apiErrorCode, lastDaysRange } from '@/utils/system-utils';
import { usePagedList } from '@/hooks/use-paged-list';
import type { SortState } from '@/hooks/use-paged-list';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
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
  recipientUnavailable: 'Recipient search is not configured on the server.',
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

/**
 * Frame column order and alignment. No counts from 1 on the newest row; sorting No descending lists the oldest
 * first and counts down from the total.
 */
function buildColumns(page: number, total: number, sort?: SortState): TableColumnsType<NotificationHistoryItem> {
  const descendingNo = sort?.sortBy === 'no' && sort.sortDirection === 'DESC';
  const rowNo = (index: number) => {
    const position = (page - 1) * SYS_PAGE_SIZE + index;
    return descendingNo ? total - position : position + 1;
  };
  return [
    { title: 'No', key: 'no', width: 60, sorter: true, render: (_: unknown, __, index) => rowNo(index) },
    {
      title: 'Code',
      dataIndex: 'notiTmplCd',
      key: 'notiTmplCd',
      align: 'center',
      width: 120,
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
      title: 'Service',
      dataIndex: 'notiSrvcNm',
      key: 'notiSrvcNm',
      width: 160,
      ellipsis: true,
      sorter: true,
      render: (v?: string) => v || '-',
    },
    { title: 'Title', dataIndex: 'notiTtl', key: 'notiTtl', sorter: true, ellipsis: true },
    {
      title: 'Recipient',
      dataIndex: 'notiRcvrAddr',
      key: 'notiRcvrAddr',
      width: 170,
      ellipsis: true,
      sorter: true,
      render: (v?: string) => v || '-',
    },
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
      width: 160,
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
  const recipientError = apiErrorCode(error) === NOTIFICATION_ERRORS.recipientSearchUnavailable;

  return (
    <SysPage>
      <SysTitleBar
        title="Notification Send History"
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Send History']}
      />
      <SysFilterPanel>
        <SysFilterItem label="Send Period">
          <AppRangePicker
            className={styles.rangePicker}
            value={draftPeriod}
            format={SYS_DATE_FORMAT}
            separator="~"
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
            placeholder={list.draft.searchType === 'RECIPIENT' ? 'Full e-mail address or phone number' : undefined}
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={handleSearch}
          />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={handleReset} onSearch={handleSearch} loading={isFetching} />
      {periodError && <Alert type="error" showIcon title={MESSAGES.periodRange} />}
      {recipientError && <Alert type="error" showIcon title={MESSAGES.recipientUnavailable} />}
      <SysSectionHeader
        total={total}
        actions={<SysExcelButton onClick={() => excel.mutate(search)} loading={excel.isPending} />}
      />
      <SysTable<NotificationHistoryItem>
        rowKey="logId"
        className={styles.listTable}
        fill
        columns={buildColumns(list.page, total, list.sort)}
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
