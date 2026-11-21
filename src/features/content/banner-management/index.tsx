import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Banner, BannerSearch } from '@/api/contents/banner-api';
import { DateTimeCell, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/SystemUi';
import { errorMessage, rowNumber, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import BannerModal from './BannerModal';
import { useBanners, useDeleteBanners, useDownloadBannerExcel } from './use-banners';

// Banner Management - List (VPA003201), menu A04060000.

const PAGE_SIZE = 15;
const DATE_FORMAT = 'DD/MM/YYYY';

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface FilterState {
  used: boolean;
  unused: boolean;
  keyword: string;
  period: DateRange;
}

const EMPTY_FILTER: FilterState = { used: true, unused: true, keyword: '', period: null };

export default function BannerManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [applied, setApplied] = useState<BannerSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, string = view/edit that banner. */
  const [modalBannerId, setModalBannerId] = useState<string | null | undefined>(undefined);

  const { data, isFetching, error } = useBanners(applied, page, PAGE_SIZE);
  const deleteBanners = useDeleteBanners();
  const downloadExcel = useDownloadBannerExcel();
  const banners = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      useYn: toUseYnFilter(filter.used, filter.unused),
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

  const handleExcel = () => downloadExcel.mutate(applied, { onError: (e) => toast.error(errorMessage(e)) });

  const handleDelete = () => {
    if (selectedKeys.length === 0) {
      toast.warning('Select at least one banner to delete.');
      return;
    }
    dialog.warning({
      okCancel: true,
      content: `Delete the ${selectedKeys.length} selected banner(s)?`,
      onOk: async () => {
        try {
          const response = await deleteBanners.mutateAsync(selectedKeys);
          toast.success(response.message || 'Deleted.');
          setSelectedKeys([]);
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<Banner> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_v, _row, index) => rowNumber(total, page, PAGE_SIZE, index),
    },
    {
      title: 'Usage',
      dataIndex: 'useYn',
      width: 80,
      align: 'center',
      render: (value: string) =>
        value === 'Y' ? <span className={styles.useY}>Used</span> : <span className={styles.useN}>Unused</span>,
    },
    { title: 'Order', dataIndex: 'order', width: 70, align: 'center' },
    { title: 'Position', dataIndex: 'positionId', width: 130, align: 'center' },
    { title: 'ID', dataIndex: 'bannerId', width: 290, align: 'center' },
    {
      title: 'Banner Title',
      dataIndex: 'title',
      width: 320,
      render: (value: string, row) => (
        <a className={styles.cellLink} onClick={() => setModalBannerId(row.bannerId)}>
          {value}
        </a>
      ),
    },
    {
      title: 'URL',
      key: 'linked',
      width: 110,
      align: 'center',
      render: (_v, row) =>
        row.linked === 'Y' && row.linkUrl ? (
          <a className={styles.cellLink} href={row.linkUrl} target="_blank" rel="noopener noreferrer">
            Connected
          </a>
        ) : row.linked === 'Y' ? (
          'Connected'
        ) : (
          'Disconnected'
        ),
    },
    {
      title: 'Registration Date',
      dataIndex: 'crtDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    { title: 'Registrant', dataIndex: 'crtBy', width: 110, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Modification Date',
      dataIndex: 'mdfcnDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    { title: 'Modifier', dataIndex: 'mdfcnBy', width: 110, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Content Management', 'Site Display Management', 'Banner Management']}
        title="Banner Management"
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
            <span className={styles.filterLabel}>ID/Title</span>
            <TextInput
              className={styles.filterInput}
              placeholder="Enter Banner ID or Title."
              value={filter.keyword}
              onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <AppRangePicker
              format={DATE_FORMAT}
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={filter.period}
              onChange={(dates) => setFilter((f) => ({ ...f, period: dates as DateRange }))}
              className={styles.w250}
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>
          Total ({total}){error && <span className={styles.textDanger}> — {error.message}</span>}
        </span>
        <ActionButton
          action="excelDownload"
          size="small"
          disabled={downloadExcel.isPending}
          onClick={handleExcel}
        >
          Excel Download
        </ActionButton>
      </div>

      <div className={styles.tableWrapper}>
        <DataTable<Banner>
          rowKey="bannerId"
          columns={columns}
          dataSource={banners}
          loading={isFetching}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys(keys.map(String)),
          }}
        />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <div className={styles.bottomActions}>
        <ActionButton action="deleteRow" disabled={!canWrite} onClick={handleDelete}>
          Delete
        </ActionButton>
        <ActionButton intent="secondary" appearance="filled" disabled={!canWrite} onClick={() => setModalBannerId(null)}>
          Add New
        </ActionButton>
      </div>

      {modalBannerId !== undefined && (
        <BannerModal
          bannerId={modalBannerId}
          canWrite={canWrite}
          onClose={() => setModalBannerId(undefined)}
          onSaved={() => setSelectedKeys([])}
        />
      )}
    </div>
  );
}
