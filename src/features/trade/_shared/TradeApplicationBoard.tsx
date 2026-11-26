import { useState } from 'react';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import StatusBadge from '@/components/common/badge/StatusBadge';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppRadio from '@/components/inputs/AppRadio';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useCommonCodes } from '@/hooks/use-common-codes';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type {
  TradeAppKind,
  TradeApplicationDetail,
  TradeApplicationListItem,
  TradeApplicationSearch,
  TradeApplicationStatus,
  TradeApprovalStage,
} from '@/api/trade/trade-api';
import { applicationNo } from '@/api/trade/trade-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { EmployeePickField } from '@/features/approval/_shared/ApprovalParts';
import { useApprovalTargetHandoff } from '@/features/approval/_shared/approval-navigation';
import { formatDateTime, formatDmy } from '@/utils/date-format';
import { formatAmount, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import TradeApplicationForm from './TradeApplicationForm';
import TradeApplicationPopup from './TradeApplicationPopup';
import { useDownloadTradeApplicationsExcel, useTradeApplications } from './use-trade-applications';

// Trade application board (VPA05010101 purchase / 05010201 sale / 05010301 consulting): filters and columns of
// plan §2.1, [Add New] (manual registration, WP3) and the processing popup (WP2). [Delete] of the design has no
// API (F5 HOLD) and is not shown.

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;
/** Form: null closed, `new` Add New, or the application being edited. */
type FormState = null | 'new' | TradeApplicationDetail;

const STATUS_OPTIONS: { value: TradeApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'RCPT', label: 'Submitted' },
  { value: 'PRCS', label: 'Processing' },
  { value: 'DCIN', label: 'Docs Incomplete' },
  { value: 'DCOK', label: 'Docs Complete' },
  { value: 'CMPL', label: 'Completed' },
  { value: 'CNCL', label: 'Cancelled' },
];

const STAGE_OPTIONS: { value: TradeApprovalStage | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'NOT_RECEIVED', label: 'Not Received' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'IN_APPROVAL', label: 'In Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/** Officer filter: every employee holding the processing role (GET /employees/lookup?roleId=PRCS). */
const OFFICER_SOURCE = { type: 'employees', roleId: 'PRCS' } as const;

const STAGE_LABELS = Object.fromEntries(STAGE_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

export default function TradeApplicationBoard({ kind, title }: { kind: TradeAppKind; title: string }) {
  const { canWrite } = useMenuPermission();
  const consultingCodes = useCommonCodes(kind === 'consulting' ? 'CNSLT_DMND_SE_CD' : null);

  const [period, setPeriod] = useState<DateRange>(null);
  const [sttsCd, setSttsCd] = useState<TradeApplicationStatus | ''>('');
  const [stage, setStage] = useState<TradeApprovalStage | ''>('');
  const [bndLotYn, setBndLotYn] = useState<'' | 'Y' | 'N'>('');
  const [mbrNo, setMbrNo] = useState('');
  const [bndCd, setBndCd] = useState('');
  const [keyword, setKeyword] = useState('');
  const [tkcgEmpNo, setTkcgEmpNo] = useState('');
  const [applied, setApplied] = useState<TradeApplicationSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);

  // Opened from Approval Management: show the application of the inbox row.
  useApprovalTargetHandoff((item) => {
    if (item.srvcAplyId && (!item.tradeKind || item.tradeKind.toLowerCase() === kind)) {
      setForm(null);
      setDetailId(item.srvcAplyId);
    }
  });

  const { data, isFetching } = useTradeApplications(kind, applied, page, PAGE_SIZE);
  const downloadExcel = useDownloadTradeApplicationsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      aplyFromDt: period?.[0]?.format('YYYY-MM-DD'),
      aplyToDt: period?.[1]?.format('YYYY-MM-DD'),
      sttsCds: sttsCd ? [sttsCd] : undefined,
      approvalStages: stage ? [stage] : undefined,
      bndLotYn: bndLotYn || undefined,
      mbrNo: mbrNo.trim() || undefined,
      bndCd: bndCd.trim() || undefined,
      keyword: keyword.trim() || undefined,
      tkcgEmpNo: tkcgEmpNo || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setSttsCd('');
    setStage('');
    setBndLotYn('');
    setMbrNo('');
    setBndCd('');
    setKeyword('');
    setTkcgEmpNo('');
    setApplied({});
    setPage(1);
  };

  const columns: TableColumnsType<TradeApplicationListItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: 'Status', dataIndex: 'srvcPrcsSttsNm', width: 140, align: 'center', render: (v?: string, r?: TradeApplicationListItem) => v || r?.srvcPrcsSttsCd || '-' },
    {
      title: 'Application No.',
      dataIndex: 'srvcAplyNo',
      width: 260,
      render: (_v, r) => (
        <span className={styles.inline}>
          <a className={styles.cellLink} onClick={() => setDetailId(r.srvcAplyId)}>
            {applicationNo(r)}
          </a>
          {r.activePurchaseCtrtCd && (
            // Receipt / approval request will be refused while that contract runs (409 TRD021).
            <span title={`Purchase contract ${r.activePurchaseCtrtNo || r.activePurchaseCtrtCd} is running for the same NPL / LOT`}>
              <StatusBadge color="red">Contract running</StatusBadge>
            </span>
          )}
        </span>
      ),
    },
    { title: 'Application Date', dataIndex: 'srvcAplyDmy', width: 120, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: 'Channel', dataIndex: 'aplyPathCd', width: 80, align: 'center', render: (v?: string) => (v === 'MANL' ? 'Manual' : v === 'WEB' ? 'Web' : '-') },
    { title: 'Member', dataIndex: 'mbrNm', width: 180, render: (v?: string, r?: TradeApplicationListItem) => (v ? `${v} (${r?.mbrNo ?? ''})` : (r?.mbrNo ?? '-')) },
    { title: 'Creditor', dataIndex: 'crdtrNm', width: 160, render: (v?: string) => v || '-' },
    {
      title: 'NPL / LOT',
      key: 'npl',
      width: 170,
      render: (_v, r) => {
        const label = r.bndLotYn === 'Y' ? r.bndLotNm || r.bndLotId : r.bndCd;
        return label ? `${label}${r.bndCnt && r.bndCnt > 1 ? ` (${r.bndCnt})` : ''}` : '-';
      },
    },
    ...(kind === 'consulting'
      ? [
          {
            title: 'Consulting Type',
            dataIndex: 'cnsltDmndSeCd',
            width: 190,
            render: (v?: string) => consultingCodes.find((c) => c.value === v)?.label ?? v ?? '-',
          },
        ]
      : [
          { title: 'Currency', dataIndex: 'crncCd', width: 80, align: 'center' as const, render: (v?: string) => v || '-' },
          { title: 'Principal Balance', dataIndex: 'totPrnBlnc', width: 140, align: 'right' as const, render: (v?: number) => formatAmount(v) },
          { title: 'Appraised Value', dataIndex: 'totEvlAmt', width: 140, align: 'right' as const, render: (v?: number) => formatAmount(v) },
          {
            title: kind === 'sale' ? 'Desired Price' : 'Proposed Price',
            dataIndex: 'prpDsplPrc',
            width: 140,
            align: 'right' as const,
            render: (v?: number) => formatAmount(v),
          },
        ]),
    { title: 'Receipt Date', dataIndex: 'rcptDt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: 'Receiver', dataIndex: 'rcptEmpNm', width: 160, render: (v?: string) => v || '-' },
    { title: 'Officer', dataIndex: 'tkcgEmpNm', width: 170, render: (v?: string) => v || '-' },
    { title: 'Approval Stage', dataIndex: 'approvalStage', width: 120, align: 'center', render: (v?: string) => (v && STAGE_LABELS[v]) || v || '-' },
    { title: 'Contract No.', dataIndex: 'srvcCtrtNo', width: 160, render: (v?: string, r?: TradeApplicationListItem) => v || r?.srvcCtrtCd || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Trade Management', 'Application Management', title]}
        title={title}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Application Period</span>
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <AppSelect className={styles.w150} value={sttsCd} onChange={(v) => setSttsCd((v ?? '') as TradeApplicationStatus | '')} options={STATUS_OPTIONS} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Approval Stage</span>
            <AppSelect className={styles.w150} value={stage} onChange={(v) => setStage((v ?? '') as TradeApprovalStage | '')} options={STAGE_OPTIONS} />
          </div>
          {kind !== 'consulting' && (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>LOT Status</span>
              <AppRadio.Group value={bndLotYn} onChange={(e) => setBndLotYn(e.target.value)}>
                <AppRadio value="">All</AppRadio>
                <AppRadio value="Y">Yes</AppRadio>
                <AppRadio value="N">No</AppRadio>
              </AppRadio.Group>
            </div>
          )}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Member Code</span>
            <TextInput className={styles.filterInput} placeholder="Member No" value={mbrNo} onChange={(e) => setMbrNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>NPL Code</span>
            <TextInput className={styles.filterInput} placeholder="NPL Code" value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Officer</span>
            <div className={styles.w240}>
              <EmployeePickField value={tkcgEmpNo} onChange={setTkcgEmpNo} source={OFFICER_SOURCE} placeholder="Any officer" searchTitle="Officer Search" />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <TextInput className={styles.filterInput} placeholder="Application No., name..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <span className={styles.actions}>
          {canWrite && (
            <ActionButton action="register" size="small" onClick={() => setForm('new')}>
              Add New
            </ActionButton>
          )}
          <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>
            Excel Download
          </ActionButton>
        </span>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<TradeApplicationListItem> rowKey="srvcAplyId" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {detailId && !form && (
        <TradeApplicationPopup
          kind={kind}
          srvcAplyId={detailId}
          title={title}
          canWrite={canWrite}
          onClose={() => setDetailId(null)}
          onEdit={(detail) => setForm(detail)}
        />
      )}
      {form && (
        <TradeApplicationForm
          kind={kind}
          detail={form === 'new' ? null : form}
          onClose={() => setForm(null)}
          onSaved={(id) => {
            setForm(null);
            setDetailId(id || null);
          }}
        />
      )}
    </div>
  );
}
