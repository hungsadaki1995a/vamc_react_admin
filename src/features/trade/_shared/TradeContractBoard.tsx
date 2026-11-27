import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { codeLabel } from '@/lib/i18n/code-label';
import { formatDmy } from '@/utils/date-format';
import { errorMessage, formatAmount, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { useApprovalTargetHandoff } from '@/features/approval/_shared/approval-navigation';
import { isSameQuery } from '@/utils/query-utils';
import TradeContractPopup from './TradeContractPopup';
import type { ContractTab } from './TradeContractPopup';
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
type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function TradeContractBoard({ kind, title }: { kind: TradeContractKind; title: string }) {
  const { t } = useTranslation();
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
  const [detailTab, setDetailTab] = useState<ContractTab | undefined>(undefined);

  // Opened from Approval Management: show the contract of the inbox row on the tab of the approval.
  useApprovalTargetHandoff((item) => {
    if (!item.srvcCtrtCd || (item.tradeKind && item.tradeKind.toLowerCase() !== APP_KIND[kind])) return;
    setDetailTab(item.targetScreen === 'TERMINATION' ? 'termination' : item.targetScreen === 'CONSULTING_REPORT' ? 'report' : undefined);
    setDetailId(item.srvcCtrtCd);
  });

  const { data, isFetching, refetch } = useTradeContracts(kind, applied, page, PAGE_SIZE);
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

  /** Same query on page 1 keeps the key, so reload it explicitly (the button always searches). */
  const applySearch = (next: TradeContractSearch) => {
    if (page === 1 && isSameQuery(next, applied)) void refetch();
    setApplied(next);
    setPage(1);
  };

  const handleSearch = () => {
    applySearch({
      ctrtFromDt: period?.[0]?.format('YYYY-MM-DD'),
      ctrtToDt: period?.[1]?.format('YYYY-MM-DD'),
      ctrtSttsCds: ctrtSttsCd ? [ctrtSttsCd] : undefined,
      bndLotYn: bndLotYn || undefined,
      mbrNo: mbrNo.trim() || undefined,
      bndCd: bndCd.trim() || undefined,
      keyword: keyword.trim() || undefined,
    });
  };

  const handleReset = () => {
    setPeriod(null);
    setCtrtSttsCd('');
    setBndLotYn('');
    setMbrNo('');
    setBndCd('');
    setKeyword('');
    applySearch({});
  };

  const columns: TableColumnsType<TradeContractListItem> = [
    { title: t('trade.common.rowNo'), key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: t('trade.common.contractNo'),
      dataIndex: 'srvcCtrtNo',
      width: 180,
      render: (_v, r) => (
        <a
          className={styles.cellLink}
          onClick={() => {
            setDetailTab(undefined);
            setDetailId(r.srvcCtrtCd);
          }}
        >
          {contractNo(r)}
        </a>
      ),
    },
    {
      title: t('trade.common.kind'),
      key: 'type',
      width: 130,
      render: (_v, r) =>
        r.mstCtrtCd && r.mstCtrtCd !== r.srvcCtrtCd
          ? t('trade.contract.board.annexKind', { purpose: codeLabel('trade.annexPurposes', r.anxPrpsCd, '') })
          : t('trade.common.contract'),
    },
    { title: t('trade.common.status'), dataIndex: 'ctrtSttsNm', width: 150, align: 'center', render: (v?: string, r?: TradeContractListItem) => v || r?.ctrtSttsCd || '-' },
    { title: t('trade.common.member'), dataIndex: 'mbrNm', width: 180, render: (v?: string) => v || '-' },
    { title: t('trade.common.nplLot'), key: 'npl', width: 150, render: (_v, r) => r.bndCd || r.bndLotId || '-' },
    { title: t('trade.contract.board.conclusionDate'), dataIndex: 'ctrtCnclsDmy', width: 130, align: 'center', render: (v?: string) => formatDmy(v) },
    { title: t('trade.contract.board.endDate'), dataIndex: 'ctrtEndDmy', width: 130, align: 'center', render: (v?: string) => formatDmy(v) },
    {
      title: t('trade.contract.board.remaining'),
      dataIndex: 'remainingDays',
      width: 100,
      align: 'center',
      render: (v?: number) => (v === undefined || v === null ? '-' : <span className={v <= 30 ? styles.textDanger : undefined}>D-{v}</span>),
    },
    { title: t('trade.common.price'), dataIndex: 'prpPrc', width: 140, align: 'right', render: (v?: number, r?: TradeContractListItem) => (v === undefined ? '-' : `${formatAmount(v)} ${r?.crncCd ?? ''}`) },
    { title: t('trade.common.actualPrice'), dataIndex: 'rltrPrc', width: 140, align: 'right', render: (v?: number) => formatAmount(v) },
    { title: t('trade.common.fee'), dataIndex: 'feeAmt', width: 130, align: 'right', render: (v?: number) => formatAmount(v) },
    { title: t('trade.common.feePayment'), dataIndex: 'feeClclnMthCd', width: 160, render: (v?: string) => codeLabel('trade.feeMethods', v) },
    { title: t('trade.contract.board.feeStage'), dataIndex: 'feeStage', width: 90, align: 'center', render: (v?: string) => v || '-' },
    { title: t('trade.common.approval'), dataIndex: 'latestAtrzSttsCd', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: t('trade.common.officer'), dataIndex: 'tkcgEmpNm', width: 170, render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={[t('trade.breadcrumb.root'), t('trade.breadcrumb.contracts'), title]}
        title={title}
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            {/* Server rule (R3-02): the contract term [conclusion (draft: start / creation), end] overlaps the period. */}
            <span className={styles.filterLabel} title={t('trade.contract.board.periodHelp')}>
              {t('trade.contract.board.period')}
            </span>
            <AppRangePicker
              format="DD/MM/YYYY"
              placeholder={[t('trade.contract.board.termFrom'), t('trade.contract.board.termTo')]}
              value={period}
              onChange={(d) => setPeriod(d as DateRange)}
              className={styles.w240}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.status')}</span>
            <AppSelect
              className={styles.w150}
              value={ctrtSttsCd}
              onChange={(v) => setCtrtSttsCd(String(v ?? ''))}
              options={[{ value: '', label: t('trade.common.all') }, ...statusOptions]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.lotStatus')}</span>
            <AppRadio.Group value={bndLotYn} onChange={(e) => setBndLotYn(e.target.value)}>
              <AppRadio value="">{t('trade.common.all')}</AppRadio>
              <AppRadio value="Y">{t('trade.common.yes')}</AppRadio>
              <AppRadio value="N">{t('trade.common.no')}</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.memberCode')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.common.memberNoPlaceholder')} value={mbrNo} onChange={(e) => setMbrNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.common.nplCode')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.common.nplCode')} value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.contract.board.contractId')}</span>
            <TextInput className={styles.filterInput} placeholder={t('trade.contract.board.contractIdPlaceholder')} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>{t('trade.common.total', { n: total })}</span>
        {consulting && (
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>{t('trade.contract.board.followUp')}</span>
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
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>
          {t('trade.common.excelDownload')}
        </ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<TradeContractListItem> rowKey="srvcCtrtCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {detailId && (
        <TradeContractPopup
          key={`${detailId}-${detailTab ?? ''}`}
          kind={APP_KIND[kind]}
          srvcCtrtCd={detailId}
          initialTab={detailTab}
          title={title}
          canWrite={canWrite}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
