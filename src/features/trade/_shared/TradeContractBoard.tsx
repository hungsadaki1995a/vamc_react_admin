import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import AppSwitch from '@/components/inputs/AppSwitch';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { contractNo } from '@/api/trade/trade-api';
import type { TradeAppKind, TradeContractListItem, TradeContractKind, TradeContractSearch } from '@/api/trade/trade-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import TradeContractPopup from './TradeContractPopup';
import {
  useAdditionalConsultingSetting,
  useDownloadTradeContractsExcel,
  useSetAdditionalConsultingSetting,
  useTradeContracts,
} from './use-trade-contracts';

const PAGE_SIZE = 15;
const CONTRACT_STATUS_GROUP = 'CTRT_STTS_CD';
const APP_KIND: Record<TradeContractKind, TradeAppKind> = {
  'sale-brokerage-contracts': 'sale',
  'purchase-brokerage-contracts': 'purchase',
  'consulting-contracts': 'consulting',
};
const FEE_METHODS: Record<string, string> = { LUMP: '① Full after signing', AFTR: '② After the sale', STAG: '③ Advance + balance' };
const ANNEX_PURPOSES: Record<string, string> = { EXTN: 'Extension', PRCE: 'Price', POST: 'After sale', ETC: 'Other' };
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
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const consulting = kind === 'consulting-contracts';
  const { data: followUpEnabled } = useAdditionalConsultingSetting(consulting);
  const setFollowUp = useSetAdditionalConsultingSetting();
  const downloadExcel = useDownloadTradeContractsExcel();
  // CTRT_STTS_CD: PREPR, DRFAPR, SGNWT, SGNCP, PROGS, ENDING, CMPTN, CNCLN.
  const statusOptions = useCommonCodes(CONTRACT_STATUS_GROUP);

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      ctrtFromDt: period?.[0]?.format('YYYY-MM-DD'),
      ctrtToDt: period?.[1]?.format('YYYY-MM-DD'),
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

  const columns: TableColumnsType<TradeContractListItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Contract No.',
      dataIndex: 'srvcCtrtNo',
      width: 180,
      render: (_v, r) => (
        <a className={styles.cellLink} onClick={() => setDetailId(r.srvcCtrtCd)}>
          {contractNo(r)}
        </a>
      ),
    },
    {
      title: 'Kind',
      key: 'type',
      width: 130,
      render: (_v, r) => (r.mstCtrtCd && r.mstCtrtCd !== r.srvcCtrtCd ? `ㄴAnnex ${ANNEX_PURPOSES[r.anxPrpsCd ?? ''] ?? ''}` : 'Contract'),
    },
    { title: 'Status', dataIndex: 'ctrtSttsNm', width: 150, align: 'center', render: (v?: string, r?: TradeContractListItem) => v || r?.ctrtSttsCd || '-' },
    { title: 'Member', dataIndex: 'mbrNm', width: 180, render: (v?: string) => v || '-' },
    { title: 'NPL / LOT', key: 'npl', width: 150, render: (_v, r) => r.bndCd || r.bndLotId || '-' },
    { title: 'Conclusion Date', dataIndex: 'ctrtCnclsDmy', width: 130, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: 'End Date', dataIndex: 'ctrtEndDmy', width: 130, align: 'center', render: (v?: string) => formatDmy(v) },
    {
      title: 'Remaining',
      dataIndex: 'remainingDays',
      width: 100,
      align: 'center',
      render: (v?: number) => (v === undefined || v === null ? '-' : <span className={v <= 30 ? styles.textDanger : undefined}>D-{v}</span>),
    },
    { title: 'Price', dataIndex: 'prpPrc', width: 140, align: 'right', render: (v?: number, r?: TradeContractListItem) => (v === undefined ? '-' : `${formatAmount(v)} ${r?.crncCd ?? ''}`) },
    { title: 'Actual Price', dataIndex: 'rltrPrc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
    { title: 'Fee', dataIndex: 'feeAmt', width: 130, align: 'right', render: (v?: number) => formatAmount(v) },
    { title: 'Fee Payment', dataIndex: 'feeClclnMthCd', width: 160, render: (v?: string) => (v && FEE_METHODS[v]) || v || '-' },
    { title: 'Fee Stage', dataIndex: 'feeStage', width: 90, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Approval', dataIndex: 'latestAtrzSttsCd', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Officer', dataIndex: 'tkcgEmpNm', width: 170, render: (v?: string) => v || '-' },
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
              options={[{ value: '', label: 'All' }, ...statusOptions]}
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
            <TextInput className={styles.filterInput} placeholder="Contract No. or keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        {consulting && (
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>Follow-up consulting requests</span>
            <AppSwitch
              checked={!!followUpEnabled}
              disabled={!canWrite}
              loading={setFollowUp.isPending}
              onChange={(value) =>
                setFollowUp.mutateAsync(value).catch((error: unknown) => toast.error(errorMessage(error)))
              }
            />
          </label>
        )}
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<TradeContractListItem> rowKey="srvcCtrtCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {detailId && (
        <TradeContractPopup kind={APP_KIND[kind]} srvcCtrtCd={detailId} title={title} canWrite={canWrite} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
