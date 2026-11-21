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
import type { TradeContractItem, TradeContractKind, TradeContractSearch } from '@/api/trade/trade-api';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { useDownloadTradeContractsExcel, useTradeContract, useTradeContracts } from './use-trade-contracts';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function TradeContractBoard({ kind, title }: { kind: TradeContractKind; title: string }) {
  const [period, setPeriod] = useState<DateRange>(null);
  const [ctrtSttsCd, setCtrtSttsCd] = useState('');
  const [bndLotYn, setBndLotYn] = useState<'' | 'Y' | 'N'>('');
  const [mbrNo, setMbrNo] = useState('');
  const [bndCd, setBndCd] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<TradeContractSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useTradeContracts(kind, applied, page, PAGE_SIZE);
  const { data: detail } = useTradeContract(kind, detailId);
  const downloadExcel = useDownloadTradeContractsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      ctrtFromDt: period?.[0]?.format('YYYYMMDD'),
      ctrtToDt: period?.[1]?.format('YYYYMMDD'),
      ctrtSttsCds: ctrtSttsCd ? [ctrtSttsCd] : undefined,
      bndLotYn: bndLotYn || undefined,
      mbrNo: mbrNo.trim() || undefined,
      bndCd: bndCd.trim() || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setCtrtSttsCd('');
    setBndLotYn('');
    setMbrNo('');
    setBndCd('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const columns: TableColumnsType<TradeContractItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Contract Code',
      dataIndex: 'srvcCtrtCd',
      width: 170,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Status', dataIndex: 'ctrtSttsNm', width: 150, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Member', dataIndex: 'mbrNm', width: 200, render: (v?: string) => v || '-' },
    { title: 'NPL / LOT', key: 'npl', width: 150, render: (_v, r) => r.bndCd || r.bndLotId || '-' },
    { title: 'Conclusion Date', dataIndex: 'ctrtCnclsDmy', width: 130, align: 'center', render: (v?: string) => v || '-' },
    { title: 'End Date', dataIndex: 'ctrtEndDmy', width: 130, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Remaining Days', dataIndex: 'remainingDays', width: 120, align: 'center', render: (v?: number) => v ?? '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Trade Management', 'Contract Management', title]}
        title={title}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Contract Period</span>
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <AppSelect
              className={styles.w150}
              value={ctrtSttsCd}
              onChange={(v) => setCtrtSttsCd(String(v ?? ''))}
              options={[
                { value: '', label: 'All' },
                { value: 'DRFT', label: 'Draft' },
                { value: 'CNCLD', label: 'Concluded' },
                { value: 'TRMNT', label: 'Terminated' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>LOT Status</span>
            <AppRadio.Group value={bndLotYn} onChange={(e) => setBndLotYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Yes</AppRadio>
              <AppRadio value="N">No</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Member Code</span>
            <TextInput className={styles.filterInput} placeholder="Member No" value={mbrNo} onChange={(e) => setMbrNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>NPL Code</span>
            <TextInput className={styles.filterInput} placeholder="NPL Code" value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Contract ID</span>
            <TextInput className={styles.filterInput} placeholder="Contract ID or keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<TradeContractItem> rowKey="srvcCtrtCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Popup open={!!detailId} width={720} title={`${title} — ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Contract Code">{detail.srvcCtrtCd}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.ctrtSttsNm || detail.ctrtSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Member">{detail.mbrNm || '-'}</Descriptions.Item>
            <Descriptions.Item label="Officer">{detail.tkcgEmpNm || '-'}</Descriptions.Item>
            <Descriptions.Item label="Conclusion Date">{detail.ctrtCnclsDmy || '-'}</Descriptions.Item>
            <Descriptions.Item label="End Date">{detail.ctrtEndDmy || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
