import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDateTime, formatDmy } from '@/utils/date-format';
import { formatAmount, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { isSameQuery } from '@/utils/query-utils';
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

const STATUS_CODES: TradeApplicationStatus[] = ['RCPT', 'PRCS', 'DCIN', 'DCOK', 'CMPL', 'CNCL'];
const STAGE_CODES: TradeApprovalStage[] = ['NOT_RECEIVED', 'PROCESSING', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'];

/** Officer filter: every employee holding the processing role (GET /employees/lookup?roleId=PRCS). */
const OFFICER_SOURCE = { type: 'employees', roleId: 'PRCS' } as const;

export default function TradeApplicationBoard({ kind, title }: { kind: TradeAppKind; title: string }) {
  const { t } = useTranslation();
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

  const { data, isFetching, refetch } = useTradeApplications(kind, applied, page, PAGE_SIZE);
  const downloadExcel = useDownloadTradeApplicationsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  /** Same query on page 1 keeps the key, so reload it explicitly (the button always searches). */
  const applySearch = (next: TradeApplicationSearch) => {
    if (page === 1 && isSameQuery(next, applied)) void refetch();
    setApplied(next);
    setPage(1);
  };

  const handleSearch = () => {
    applySearch({
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
    applySearch({});
  };

  const statusOptions = [
    { value: '', label: t('trade.common.all') },
    ...STATUS_CODES.map((value) => ({ value, label: codeLabel('trade.applicationStatus', value) })),
  ];
  const stageOptions = [
    { value: '', label: t('trade.common.all') },
    ...STAGE_CODES.map((value) => ({ value, label: codeLabel('trade.approvalStages', value) })),
  ];

  const columns: TableColumnsType<TradeApplicationListItem> = [
    { title: t('trade.common.rowNo'), key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: t('trade.common.status'), dataIndex: 'srvcPrcsSttsNm', width: 140, align: 'center', render: (v?: string, r?: TradeApplicationListItem) => v || r?.srvcPrcsSttsCd || '-' },
    {
      title: t('trade.common.applicationNo'),
      dataIndex: 'srvcAplyNo',
      width: 260,
      render: (_v, r) => (
        <span className={styles.inline}>
          <a className={styles.cellLink} onClick={() => setDetailId(r.srvcAplyId)}>
            {applicationNo(r)}
          </a>
          {r.activePurchaseCtrtCd && (
            // Receipt / approval request will be refused while that contract runs (409 TRD021).
            <span title={t('trade.application.board.contractRunningTitle', { no: r.activePurchaseCtrtNo || r.activePurchaseCtrtCd })}>
              <StatusBadge color="red">{t('trade.application.board.contractRunning')}</StatusBadge>
            </span>
          )}
        </span>
      ),
    },
    { title: t('trade.application.board.applicationDate'), dataIndex: 'srvcAplyDmy', width: 120, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: t('trade.application.board.channel'), dataIndex: 'aplyPathCd', width: 80, align: 'center', render: (v?: string) => (v === 'MANL' || v === 'WEB' ? codeLabel('trade.channels', v) : '-') },
    { title: t('trade.common.member'), dataIndex: 'mbrNm', width: 180, render: (v?: string, r?: TradeApplicationListItem) => (v ? `${v} (${r?.mbrNo ?? ''})` : (r?.mbrNo ?? '-')) },
    { title: t('trade.common.creditor'), dataIndex: 'crdtrNm', width: 160, render: (v?: string) => v || '-' },
    {
      title: t('trade.common.nplLot'),
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
            title: t('trade.common.consultingType'),
            dataIndex: 'cnsltDmndSeCd',
            width: 190,
            render: (v?: string) => consultingCodes.find((c) => c.value === v)?.label ?? v ?? '-',
          },
        ]
      : [
          { title: t('trade.common.currency'), dataIndex: 'crncCd', width: 80, align: 'center' as const, render: (v?: string) => v || '-' },
          { title: t('trade.common.principalBalance'), dataIndex: 'totPrnBlnc', width: 140, align: 'right' as const, render: (v?: number) => formatAmount(v) },
          { title: t('trade.common.appraisedValue'), dataIndex: 'totEvlAmt', width: 140, align: 'right' as const, render: (v?: number) => formatAmount(v) },
          {
            title: kind === 'sale' ? t('trade.common.desiredPrice') : t('trade.common.proposedPrice'),
            dataIndex: 'prpDsplPrc',
            width: 140,
            align: 'right' as const,
            render: (v?: number) => formatAmount(v),
          },
        ]),
    { title: t('trade.application.board.receiptDate'), dataIndex: 'rcptDt', width: 140, align: 'center', render: (v?: string) => formatDateTime(v) },
    { title: t('trade.common.receiver'), dataIndex: 'rcptEmpNm', width: 160, render: (v?: string) => v || '-' },
    { title: t('trade.common.officer'), dataIndex: 'tkcgEmpNm', width: 170, render: (v?: string) => v || '-' },
    { title: t('trade.common.approvalStage'), dataIndex: 'approvalStage', width: 120, align: 'center', render: (v?: string) => codeLabel('trade.approvalStages', v) },
    { title: t('trade.common.contractNo'), dataIndex: 'srvcCtrtNo', width: 160, render: (v?: string, r?: TradeApplicationListItem) => v || r?.srvcCtrtCd || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[t('trade.breadcrumb.root'), t('trade.breadcrumb.applications'), title]}
        title={title}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.application.board.period')}</span>
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.status')}</span>
            <AppSelect className={styles.w150} value={sttsCd} onChange={(v) => setSttsCd((v ?? '') as TradeApplicationStatus | '')} options={statusOptions} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.approvalStage')}</span>
            <AppSelect className={styles.w150} value={stage} onChange={(v) => setStage((v ?? '') as TradeApprovalStage | '')} options={stageOptions} />
          </div>
          {kind !== 'consulting' && (
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>{t('trade.common.lotStatus')}</span>
              <AppRadio.Group value={bndLotYn} onChange={(e) => setBndLotYn(e.target.value)}>
                <AppRadio value="">{t('trade.common.all')}</AppRadio>
                <AppRadio value="Y">{t('trade.common.yes')}</AppRadio>
                <AppRadio value="N">{t('trade.common.no')}</AppRadio>
              </AppRadio.Group>
            </div>
          )}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.memberCode')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.common.memberNoPlaceholder')} value={mbrNo} onChange={(e) => setMbrNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.nplCode')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.common.nplCode')} value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.officer')}</span>
            <div className={styles.w240}>
              <EmployeePickField value={tkcgEmpNo} onChange={setTkcgEmpNo} source={OFFICER_SOURCE} placeholder={t('trade.common.anyOfficer')} searchTitle={t('trade.common.officerSearch')} />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.keyword')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.application.board.keywordPlaceholder')} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>{t('trade.common.total', { n: total })}</span>
        <span className={styles.actions}>
          {canWrite && (
            <ActionButton action="register" size="small" onClick={() => setForm('new')}>
              {t('trade.common.addNew')}
            </ActionButton>
          )}
          <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>
            {t('trade.common.excelDownload')}
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
