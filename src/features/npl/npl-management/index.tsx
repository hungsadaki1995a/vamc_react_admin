import { useState } from 'react';
import { Descriptions } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import type { NplItem, NplSearch } from '@/api/npl/npl-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { useNpl, useNpls } from './use-npls';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** NPL Management (menu A04020000). */
export default function NplManagement() {
  const [period, setPeriod] = useState<DateRange>(null);
  const [expsrYn, setExpsrYn] = useState<'' | 'Y' | 'N'>('');
  const [lotYn, setLotYn] = useState<'' | 'Y' | 'N'>('');
  const [bndSttsCd, setBndSttsCd] = useState('');
  const [bndCd, setBndCd] = useState('');
  const [bndNm, setBndNm] = useState('');
  const [dbtrCd, setDbtrCd] = useState('');
  const [applied, setApplied] = useState<NplSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useNpls(applied, page, PAGE_SIZE);
  const { data: detail } = useNpl(detailId);

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      loanFromDt: period?.[0]?.format('YYYYMMDD'),
      loanToDt: period?.[1]?.format('YYYYMMDD'),
      expsrYn: expsrYn || undefined,
      lotYn: lotYn || undefined,
      bndSttsCds: bndSttsCd ? [bndSttsCd] : undefined,
      bndCd: bndCd.trim() || undefined,
      bndNm: bndNm.trim() || undefined,
      dbtrCd: dbtrCd.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setExpsrYn('');
    setLotYn('');
    setBndSttsCd('');
    setBndCd('');
    setBndNm('');
    setDbtrCd('');
    setApplied({});
    setPage(1);
  };

  const columns: TableColumnsType<NplItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'NPL Code',
      dataIndex: 'bndCd',
      width: 150,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'NPL Name', dataIndex: 'bndNm', width: 260 },
    { title: 'LOT No', dataIndex: 'bndLotNo', width: 120, render: (v?: string) => v || '-' },
    { title: 'Status', dataIndex: 'bndSttsCd', width: 100, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Displayed',
      dataIndex: 'expsrYn',
      width: 90,
      align: 'center',
      render: (v?: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v ?? 'N'}</span>,
    },
    { title: 'Loan Exec', dataIndex: 'loanExcnDmy', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Loan Maturity', dataIndex: 'loanMtryDmy', width: 110, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['NPL Info Management', 'NPL Registration', 'NPL Management']}
        title="NPL Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Loan Period</span>
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <AppSelect
              className={styles.w140}
              value={bndSttsCd}
              onChange={(v) => setBndSttsCd(String(v ?? ''))}
              options={[
                { value: '', label: 'All' },
                { value: '01', label: 'Registered' },
                { value: '02', label: 'On Sale' },
                { value: '03', label: 'Sold' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Displayed</span>
            <AppRadio.Group value={expsrYn} onChange={(e) => setExpsrYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Y</AppRadio>
              <AppRadio value="N">N</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>LOT</span>
            <AppRadio.Group value={lotYn} onChange={(e) => setLotYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Y</AppRadio>
              <AppRadio value="N">N</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>NPL Code</span>
            <TextInput className={styles.filterInput} placeholder="NPL Code" value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>NPL Name</span>
            <TextInput className={styles.filterInput} placeholder="NPL Name" value={bndNm} onChange={(e) => setBndNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Debtor Code</span>
            <TextInput className={styles.filterInput} placeholder="Debtor Code" value={dbtrCd} onChange={(e) => setDbtrCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}><span className={styles.totalCount}>Total ({total})</span></div>
      <div className={styles.tableWrapper}>
        <DataTable<NplItem> rowKey="bndCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Popup open={!!detailId} width={760} title={`NPL Detail: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="NPL Code">{detail.bndCd}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.bndSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="NPL Name" span={2}>{detail.bndNm}</Descriptions.Item>
            <Descriptions.Item label="NPL Name (EN)" span={2}>{detail.bndEngNm || '-'}</Descriptions.Item>
            <Descriptions.Item label="Currency">{detail.crncCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Evaluated Amt">{detail.bndEvlAmt?.toLocaleString() ?? '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
