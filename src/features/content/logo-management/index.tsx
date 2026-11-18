import { useState } from 'react';
import { DatePicker, Input, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  changeLogoUse,
  deleteLogos,
  getLogos,
} from '@/api/contents/site-display-api';
import type { SiteDisplaySearch } from '@/api/contents/site-display-api';
import type { Post } from '@/api/contents/post-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/system-ui';
import { errorMessage, rowNumber, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';
import LogoModal from './logo-modal';

// Logo Management - List (menu A04110200).

const PAGE_SIZE = 15;
const DATE_FORMAT = 'DD/MM/YYYY';

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface FilterState {
  used: boolean;
  unused: boolean;
  tag: string;
  keyword: string;
  period: DateRange;
}

const EMPTY_FILTER: FilterState = { used: true, unused: true, tag: '', keyword: '', period: null };

export default function LogoManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [applied, setApplied] = useState<SiteDisplaySearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, string = view/edit that logo. */
  const [modalLogoId, setModalLogoId] = useState<string | null | undefined>(undefined);

  const { data, isFetching, error } = useApiQuery<PageResponse<Post>>(
    ['contents', 'logos', applied, page],
    () => getLogos(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['contents', 'logos'] });
  };

  const handleSearch = () => {
    setApplied({
      published: toUseYnFilter(filter.used, filter.unused),
      tag: filter.tag.trim() || undefined,
      keyword: filter.keyword.trim() || undefined,
      fromDate: filter.period?.[0]?.format(DATE_FORMAT),
      toDate: filter.period?.[1]?.format(DATE_FORMAT),
    });
    setPage(1);
    setSelectedKeys([]);
  };

  const handleReset = () => {
    setFilter(EMPTY_FILTER);
    setApplied({});
    setPage(1);
    setSelectedKeys([]);
  };

  const handleBatchUse = async (useYn: 'Y' | 'N') => {
    if (selectedKeys.length === 0) {
      toast.warning('Select at least one logo.');
      return;
    }
    try {
      const response = await changeLogoUse(selectedKeys, useYn);
      toast.success(response.message || 'Updated.');
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (selectedKeys.length === 0) {
      toast.warning('Select at least one logo to delete.');
      return;
    }
    dialog.warning({
      okCancel: true,
      content: `Delete the ${selectedKeys.length} selected logo(s)?`,
      onOk: async () => {
        try {
          const response = await deleteLogos(selectedKeys);
          toast.success(response.message || 'Deleted.');
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<Post> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_v, _row, index) => rowNumber(total, page, PAGE_SIZE, index),
    },
    {
      title: 'Usage',
      dataIndex: 'published',
      width: 90,
      align: 'center',
      render: (value: string) =>
        value === 'Y' ? <span className={styles.useY}>Used</span> : <span className={styles.useN}>Unused</span>,
    },
    { title: 'Position', dataIndex: 'tag', width: 130, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Logo Name',
      dataIndex: 'title',
      width: 320,
      render: (value: string, row) => (
        <a className={styles.cellLink} onClick={() => setModalLogoId(row.pstNo)}>
          {value}
        </a>
      ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'crtDt',
      width: 130,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    { title: 'Registrant', dataIndex: 'crtBy', width: 120, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Modification Date',
      dataIndex: 'mdfcnDt',
      width: 130,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    { title: 'Modifier', dataIndex: 'mdfcnBy', width: 120, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Content Management', 'Site Display Management', 'Logo Management']}
        title="Logo Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Usage Status</span>
            <UseYnChecks
              yes={filter.used}
              no={filter.unused}
              onChange={(used, unused) => setFilter((f) => ({ ...f, used, unused }))}
              allLabel="All"
              yesLabel="Used"
              noLabel="Not Used"
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Position</span>
            <Input
              className={styles.filterInput}
              placeholder="HEADER, FOOTER..."
              value={filter.tag}
              onChange={(e) => setFilter((f) => ({ ...f, tag: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <Input
              className={styles.filterInput}
              placeholder="Enter Logo ID or Name."
              value={filter.keyword}
              onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={filter.period}
              onChange={(dates) => setFilter((f) => ({ ...f, period: dates as DateRange }))}
              style={{ width: 250 }}
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>
          Total ({total}){error && <span className={styles.textDanger}> — {error.message}</span>}
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <Table<Post>
          rowKey="pstNo"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys.map(String)),
          }}
        />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <div className={styles.bottomActions}>
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={() => handleBatchUse('Y')}>
          Use
        </button>
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={() => handleBatchUse('N')}>
          Unuse
        </button>
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={handleDelete}>
          Delete
        </button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalLogoId(null)}>
          Add New
        </button>
      </div>

      {modalLogoId !== undefined && (
        <LogoModal
          logoId={modalLogoId}
          canWrite={canWrite}
          onClose={() => setModalLogoId(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
