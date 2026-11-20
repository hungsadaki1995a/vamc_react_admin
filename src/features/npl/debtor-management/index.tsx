import { useState } from 'react';
import { DatePicker, Descriptions, Input, Modal, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { DebtorItem, DebtorSearch } from '@/api/npl/npl-api';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { useDebtor, useDebtors, useDeleteDebtors, useDownloadDebtorsExcel } from './use-debtors';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Debtor Management (menu A03010300). */
export default function DebtorManagement() {
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

  const { data, isFetching } = useDebtors(applied, page, PAGE_SIZE);
  const { data: detail } = useDebtor(detailId);
  const deleteDebtors = useDeleteDebtors();
  const downloadExcel = useDownloadDebtorsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      crtFromDt: period?.[0]?.format('YYYY-MM-DD'),
      crtToDt: period?.[1]?.format('YYYY-MM-DD'),
      dbtrTypeCd: dbtrTypeCd || undefined,
      entSalsSttsYn: dbtrTypeCd === 'P' ? undefined : entSalsSttsYn || undefined,
      dbtrCd: dbtrCd.trim() || undefined,
      dbtrNm: dbtrNm.trim() || undefined,
      cicCd: cicCd.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setDbtrTypeCd('');
    setEntSalsSttsYn('');
    setDbtrCd('');
    setDbtrNm('');
    setCicCd('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = () => {
    if (!selectedKeys.length) { toast.warning('Select at least one debtor.'); return; }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected debtor(s)?`,
      onOk: async () => {
        try {
          await deleteDebtors.mutateAsync(selectedKeys);
          toast.success('Deleted.');
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
            <DatePicker.RangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            <Radio.Group value={dbtrTypeCd} onChange={(e) => { setDbtrTypeCd(e.target.value); if (e.target.value === 'P') setEntSalsSttsYn(''); }}>
              <Radio value="">All</Radio>
              <Radio value="P">Individual</Radio>
              <Radio value="O">Organization</Radio>
            </Radio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Business Status</span>
            <Radio.Group value={entSalsSttsYn} disabled={dbtrTypeCd === 'P'} onChange={(e) => setEntSalsSttsYn(e.target.value)}>
              <Radio value="">All</Radio>
              <Radio value="Y">Active</Radio>
              <Radio value="N">Inactive</Radio>
            </Radio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Debtor Code</span>
            <Input className={styles.filterInput} placeholder="Debtor Code" value={dbtrCd} onChange={(e) => setDbtrCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Debtor Name</span>
            <Input className={styles.filterInput} placeholder="Debtor Name" value={dbtrNm} onChange={(e) => setDbtrNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>CIC Code</span>
            <Input className={styles.filterInput} placeholder="CIC Code" value={cicCd} onChange={(e) => setCicCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => downloadExcel.mutate(applied)}>Excel Download</button>
      </div>
      <div className={styles.tableWrapper}>
        <Table<DebtorItem> rowKey="dbtrCd" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnDanger} disabled={!canWrite} onClick={handleDelete}>Delete</button>
      </div>

      <Modal open={!!detailId} width={720} centered title={`Debtor: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<button type="button" className={styles.btn} onClick={() => setDetailId(null)}>Close</button>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Debtor Code">{String(detail.dbtrCd ?? detailId ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Province">{String(detail.mctpvNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="District">{String(detail.distNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Institution">{String(detail.fnstNm ?? '-')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
