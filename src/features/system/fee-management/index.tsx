import { useState } from 'react';
import { DatePicker, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import { useScreenLabel } from '@/hooks/use-screen-label';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { Fee, FeeCategory, FeeSearch } from '@/api/system/fee-api';
import { DateTimeCell, SysPageHeader, SysPagination, UseFlag, UseYnChecks } from '../_shared/system-ui';
import { errorMessage, formatAmount, rowNumber, toUseYnFilter } from '../_shared/system-utils';
import styles from '../_shared/system-page.module.scss';
import FeeModal from './fee-modal';
import { useDeleteFees, useDownloadFeeExcel, useFees } from './use-fees';

// Fee Management - List (VPA004101), menu A06010300.

const PAGE_SIZE = 10;
const DATE_FORMAT = 'DD/MM/YYYY';

type DateRange = [Dayjs | null, Dayjs | null] | null;

interface FilterState {
  period: DateRange;
  used: boolean;
  unused: boolean;
  category: FeeCategory | '';
  keyword: string;
}

const EMPTY_FILTER: FilterState = { period: null, used: true, unused: true, category: '', keyword: '' };

export default function FeeManagement() {
  const { toast, dialog } = useNotify();
  const { tvt, tvb, tvh, tsg, tsm } = useScreenLabel();
  const { canWrite } = useMenuPermission();

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [applied, setApplied] = useState<FeeSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  /** undefined = closed, null = register, string = view/edit that fee. */
  const [modalFeeId, setModalFeeId] = useState<string | null | undefined>(undefined);

  const categoryOptions = [
    { value: 'ANFE', label: tvt('catAnnual', 'Annual Fee') },
    { value: 'CNSLT', label: tvt('catConsulting', 'Consulting') },
    { value: 'MDT', label: tvt('catBrokerage', 'Brokerage') },
  ];
  const categoryName = (fee: Fee) =>
    categoryOptions.find((o) => o.value === fee.category)?.label ?? fee.categoryNm ?? fee.category;

  const { data, isFetching } = useFees(applied, page, PAGE_SIZE);
  const deleteFees = useDeleteFees();
  const downloadExcel = useDownloadFeeExcel();
  const fees = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      fromDate: filter.period?.[0]?.format(DATE_FORMAT),
      toDate: filter.period?.[1]?.format(DATE_FORMAT),
      useYn: toUseYnFilter(filter.used, filter.unused),
      category: filter.category || undefined,
      keyword: filter.keyword.trim() || undefined,
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

  const handleExcel = () =>
    downloadExcel.mutate(applied, { onError: (error) => toast.error(errorMessage(error)) });

  const handleDelete = () => {
    if (selectedKeys.length === 0) {
      toast.warning(tsm('selectToDelete', 'Select at least one fee item to delete.'));
      return;
    }
    dialog.warning({
      okCancel: true,
      content: tsm('confirmDelete', 'Delete the selected fee item(s)? Items in use cannot be deleted.'),
      onOk: async () => {
        try {
          const response = await deleteFees.mutateAsync(selectedKeys);
          toast.success(response.message || tsm('deleted', 'Deleted.'));
          setSelectedKeys([]);
        } catch (error) {
          toast.error(errorMessage(error));
        }
      },
    });
  };

  const columns: TableColumnsType<Fee> = [
    {
      title: tsg('no', 'No'),
      key: 'no',
      width: 60,
      align: 'center',
      render: (_v, _row, index) => rowNumber(total, page, PAGE_SIZE, index),
    },
    {
      title: tsg('useYn', 'Use'),
      dataIndex: 'useYn',
      width: 60,
      align: 'center',
      render: (value: string) => <UseFlag value={value} />,
    },
    { title: tsg('feeId', 'Fee Code'), dataIndex: 'feeId', width: 120, align: 'center' },
    {
      title: tsg('category', 'Fee Category'),
      key: 'category',
      width: 110,
      align: 'center',
      render: (_v, row) => categoryName(row),
    },
    { title: tsg('order', 'Order'), dataIndex: 'order', width: 60, align: 'center' },
    { title: tsg('name', 'Item Name'), dataIndex: 'name', width: 160, align: 'center' },
    {
      title: tsg('description', 'Fee item details'),
      dataIndex: 'description',
      width: 320,
      render: (value: string | undefined, row) => (
        <a className={styles.cellLink} onClick={() => setModalFeeId(row.feeId)}>
          {value || row.name}
        </a>
      ),
    },
    {
      title: tsg('method', 'Method'),
      key: 'method',
      width: 100,
      align: 'center',
      render: (_v, row) =>
        row.method === 'FXAMT' ? tvt('methodFixed', 'Fixed Amount') : tvt('methodRate', 'Rate'),
    },
    { title: tsg('currency', 'Currency'), dataIndex: 'currency', width: 70, align: 'center' },
    {
      title: tsg('fee', 'Fee'),
      key: 'fee',
      width: 110,
      align: 'right',
      render: (_v, row) => (row.method === 'TRF' ? `${row.rate ?? '-'} %` : formatAmount(row.fee)),
    },
    {
      title: tsg('minAmount', 'Minimum Applicable Amount'),
      dataIndex: 'minAmount',
      width: 130,
      align: 'right',
      render: (value?: number) => formatAmount(value),
    },
    {
      title: tsg('crtDt', 'Registration Date'),
      dataIndex: 'crtDt',
      width: 110,
      align: 'center',
      render: (value?: string) => <DateTimeCell value={value} />,
    },
    {
      title: tsg('crtBy', 'Registrant'),
      key: 'crtBy',
      width: 110,
      align: 'center',
      render: (_v, row) => row.crtByNm || row.crtBy || '-',
    },
  ];

  const title = tvh('page', 'Fee Management');

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[
          tvt('bcSystem', 'System Operations Management'),
          tvt('bcPlatform', 'Platform Management'),
          title,
        ]}
        title={title}
        resetLabel={tvb('reset', 'Reset')}
        searchLabel={tvb('search', 'Search')}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('period', 'Registration Period')}</span>
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              placeholder={['dd/mm/yyyy', 'dd/mm/yyyy']}
              value={filter.period}
              onChange={(dates) => setFilter((f) => ({ ...f, period: dates as DateRange }))}
              className={styles.w250}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('status', 'Status')}</span>
            <UseYnChecks
              yes={filter.used}
              no={filter.unused}
              onChange={(used, unused) => setFilter((f) => ({ ...f, used, unused }))}
              allLabel={tvt('all', 'ALL')}
              yesLabel={tvt('used', 'Used')}
              noLabel={tvt('unused', 'Unused')}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('category', 'Category')}</span>
            <Select
              className={styles.w180}
              value={filter.category}
              onChange={(category) => setFilter((f) => ({ ...f, category }))}
              options={[{ value: '', label: tvt('all', 'ALL') }, ...categoryOptions]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{tvt('keyword', 'Item/Content')}</span>
            <Input
              className={styles.filterInput}
              placeholder={tvt('phKeyword', 'Enter item or content')}
              value={filter.keyword}
              onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSmall}`}
          disabled={downloadExcel.isPending}
          onClick={handleExcel}
        >
          {tvb('excel', 'Excel Download')}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <Table<Fee>
          rowKey="feeId"
          columns={columns}
          dataSource={fees}
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
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={handleDelete}>
          {tvb('delete', 'Delete')}
        </button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalFeeId(null)}>
          {tvb('addNew', 'Add New')}
        </button>
      </div>

      {modalFeeId !== undefined && (
        <FeeModal feeId={modalFeeId} canWrite={canWrite} onClose={() => setModalFeeId(undefined)} onSaved={() => setSelectedKeys([])} />
      )}
    </div>
  );
}
