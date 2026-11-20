import { useState } from 'react';
import { DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import {
  downloadNotificationHistoriesExcel,
  getNotificationHistories,
  type NotificationHistoryItem,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Notification Send History (menu A06060200). */
export default function NotificationHistoryManagement() {
  const [period, setPeriod] = useState<DateRange>(null);
  const [notiMediaSe, setNotiMediaSe] = useState('');
  const [sndngScsYn, setSndngScsYn] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ fromDt?: string; toDt?: string; notiMediaSe?: string; sndngScsYn?: string; keyword?: string }>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);

  const { data, isFetching } = useApiQuery<PageResponse<NotificationHistoryItem>>(
    ['sys', 'noti-histories', applied, page],
    () => getNotificationHistories(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      fromDt: period?.[0]?.format('YYYY-MM-DD'),
      toDt: period?.[1]?.format('YYYY-MM-DD'),
      notiMediaSe: notiMediaSe || undefined,
      sndngScsYn: sndngScsYn || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setNotiMediaSe('');
    setSndngScsYn('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const columns: TableColumnsType<NotificationHistoryItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: 'Media', dataIndex: 'notiMediaSe', width: 90, align: 'center' },
    { title: 'Title', dataIndex: 'notiTtl', width: 280 },
    { title: 'Receiver', dataIndex: 'notiRcvrId', width: 180 },
    {
      title: 'Status',
      dataIndex: 'sndngScsYn',
      width: 90,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v === 'Y' ? 'Success' : 'Failed'}</span>,
    },
    { title: 'Sent At', dataIndex: 'notiSndngDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'Fail Reason', dataIndex: 'failRsn', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'Notification Management', 'Notification Send History']}
        title="Notification Send History"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Period</span>
            <DatePicker.RangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className="w-[240px]" />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Media</span>
            <Select className="w-[130px]" value={notiMediaSe} onChange={setNotiMediaSe} options={[{ value: '', label: 'All' }, { value: 'EMAIL', label: 'EMAIL' }, { value: 'SMS', label: 'SMS' }, { value: 'PUSH', label: 'PUSH' }]} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Result</span>
            <Select className="w-[130px]" value={sndngScsYn} onChange={setSndngScsYn} options={[{ value: '', label: 'All' }, { value: 'Y', label: 'Success' }, { value: 'N', label: 'Failed' }]} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <Input className={styles.filterInput} placeholder="Title or receiver" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadNotificationHistoriesExcel(applied)}>
          Excel Download
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <Table<NotificationHistoryItem> rowKey="logId" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  );
}
