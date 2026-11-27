import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Descriptions } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { DebtorItem, DebtorSearch } from '@/api/npl/npl-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { isSameQuery } from '@/utils/query-utils';
import { useDebtor, useDebtors, useDeleteDebtors, useDownloadDebtorsExcel } from './use-debtors';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Debtor Management (menu A04040000). */
export default function DebtorManagement() {
  const { t } = useTranslation();
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [period, setPeriod] = useState<DateRange>(null);
  const [dbtrTypeCd, setDbtrTypeCd] = useState<'' | 'P' | 'O'>('');
  const [entSalsSttsYn, setEntSalsSttsYn] = useState<'' | 'Y' | 'N'>('');
  const [dbtrCd, setDbtrCd] = useState('');
  const [dbtrNm, setDbtrNm] = useState('');
  const [cicCd, setCicCd] = useState('');
  const [applied, setApplied] = useState<DebtorSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching, refetch } = useDebtors(applied, page, PAGE_SIZE);
  const { data: detail } = useDebtor(detailId);
  const deleteDebtors = useDeleteDebtors();
  const downloadExcel = useDownloadDebtorsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  /** Same query on page 1 keeps the key, so reload it explicitly (the button always searches). */
  const applySearch = (next: DebtorSearch) => {
    if (page === 1 && isSameQuery(next, applied)) void refetch();
    setApplied(next);
    setPage(1);
  };
  const handleSearch = () => {
    applySearch({
      crtFromDt: period?.[0]?.format('YYYY-MM-DD'),
      crtToDt: period?.[1]?.format('YYYY-MM-DD'),
      dbtrTypeCd: dbtrTypeCd || undefined,
      entSalsSttsYn: dbtrTypeCd === 'P' ? undefined : entSalsSttsYn || undefined,
      dbtrCd: dbtrCd.trim() || undefined,
      dbtrNm: dbtrNm.trim() || undefined,
      cicCd: cicCd.trim() || undefined,
    });
  };

  const handleReset = () => {
    setPeriod(null);
    setDbtrTypeCd('');
    setEntSalsSttsYn('');
    setDbtrCd('');
    setDbtrNm('');
    setCicCd('');
    applySearch({});
  };

  const handleDelete = () => {
    if (!selectedKeys.length) {
      toast.warning(t('messages.npl.selectAtLeastOneDebtor'));
      return;
    }
    dialog.warning({
      okCancel: true,
      content: t('messages.npl.confirmDeleteDebtors', { count: selectedKeys.length }),
      onOk: async () => {
        try {
          await deleteDebtors.mutateAsync(selectedKeys);
          toast.success(SYS_MESSAGES.deleted);
          setSelectedKeys([]);
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<DebtorItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Debtor Code',
      dataIndex: 'dbtrCd',
      width: 150,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Debtor Name', dataIndex: 'dbtrNm', width: 260 },
    { title: 'Type', dataIndex: 'dbtrTypeCd', width: 100, align: 'center', render: (v?: string) => v || '-' },
    { title: 'CIC Code', dataIndex: 'cicCd', width: 130, render: (v?: string) => v || '-' },
    { title: 'Business Reg No', dataIndex: 'brno', width: 130, render: (v?: string) => v || '-' },
    { title: 'ID No', dataIndex: 'uiiNo', width: 130, render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['NPL Info Management', 'NPL Registration', 'Debtor Management']}
        title="Debtor Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Registration Period</span>
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            <AppRadio.Group value={dbtrTypeCd} onChange={(e) => { setDbtrTypeCd(e.target.value); if (e.target.value === 'P') setEntSalsSttsYn(''); }}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="P">Individual</AppRadio>
              <AppRadio value="O">Organization</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Business Status</span>
            <AppRadio.Group value={entSalsSttsYn} disabled={dbtrTypeCd === 'P'} onChange={(e) => setEntSalsSttsYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Active</AppRadio>
              <AppRadio value="N">Inactive</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Debtor Code</span>
            <TextInput className={styles.filterInput} placeholder="Debtor Code" value={dbtrCd} onChange={(e) => setDbtrCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Debtor Name</span>
            <TextInput className={styles.filterInput} placeholder="Debtor Name" value={dbtrNm} onChange={(e) => setDbtrNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>CIC Code</span>
            <TextInput className={styles.filterInput} placeholder="CIC Code" value={cicCd} onChange={(e) => setCicCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate(applied)}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<DebtorItem> rowKey="dbtrCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <ActionButton action="deleteRow" disabled={!canWrite} onClick={handleDelete}>Delete</ActionButton>
      </div>

      <Popup open={!!detailId} width={720} title={`Debtor: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Debtor Code">{String(detail.dbtrCd ?? detailId ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Province">{String(detail.mctpvNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="District">{String(detail.distNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Institution">{String(detail.fnstNm ?? '-')}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
