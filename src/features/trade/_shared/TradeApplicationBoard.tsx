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
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { TradeAppKind, TradeApplicationItem, TradeApplicationSearch } from '@/api/trade/trade-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { errorMessage, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import {
  useDownloadTradeApplicationsExcel,
  useReceiptTradeApplication,
  useTradeApplication,
  useTradeApplications,
} from './use-trade-applications';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function TradeApplicationBoard({ kind, title }: { kind: TradeAppKind; title: string }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { canWrite } = useMenuPermission();

  const [period, setPeriod] = useState<DateRange>(null);
  const [sttsCd, setSttsCd] = useState('');
  const [bndLotYn, setBndLotYn] = useState<'' | 'Y' | 'N'>('');
  const [mbrNo, setMbrNo] = useState('');
  const [bndCd, setBndCd] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<TradeApplicationSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useTradeApplications(kind, applied, page, PAGE_SIZE);
  const { data: detail } = useTradeApplication(kind, detailId);
  const receiptApplication = useReceiptTradeApplication();
  const downloadExcel = useDownloadTradeApplicationsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      aplyFromDt: period?.[0]?.format('YYYY-MM-DD'),
      aplyToDt: period?.[1]?.format('YYYY-MM-DD'),
      sttsCds: sttsCd ? [sttsCd] : undefined,
      bndLotYn: bndLotYn || undefined,
      mbrNo: mbrNo.trim() || undefined,
      bndCd: bndCd.trim() || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setSttsCd('');
    setBndLotYn('');
    setMbrNo('');
    setBndCd('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const handleReceipt = async (id: string) => {
    try {
      await receiptApplication.mutateAsync({ kind, id });
      toast.success(t('messages.trade.received'));
      setDetailId(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const columns: TableColumnsType<TradeApplicationItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Application ID',
      dataIndex: 'srvcAplyId',
      width: 170,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Status', dataIndex: 'srvcPrcsSttsNm', width: 150, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Applicant', dataIndex: 'mbrNm', width: 200, render: (v?: string) => v || '-' },
    { title: 'NPL / LOT', key: 'npl', width: 160, render: (_v, r) => r.bndCd || r.bndLotNm || '-' },
    { title: 'Application Date', dataIndex: 'srvcAplyDmy', width: 130, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Approval Stage', dataIndex: 'approvalStage', width: 140, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Trade Management', 'Service Application Management', title]}
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
            <AppSelect
              className={styles.w150}
              value={sttsCd}
              onChange={(v) => setSttsCd(String(v ?? ''))}
              options={[
                { value: '', label: 'All' },
                { value: 'RCPT', label: 'Submitted' },
                { value: 'PRCS', label: 'Processing' },
                { value: 'DCIN', label: 'Docs Incomplete' },
                { value: 'DCOK', label: 'Docs Complete' },
                { value: 'CMPL', label: 'Completed' },
                { value: 'CNCL', label: 'Cancelled' },
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
            <span className={styles.filterLabel}>Keyword</span>
            <TextInput className={styles.filterInput} placeholder="Application ID, name..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate({ kind, search: applied })}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<TradeApplicationItem> rowKey="srvcAplyId" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Popup
        open={!!detailId}
        width={720}
        title={`${title} — ${detailId ?? ''}`}
        onCancel={() => setDetailId(null)}
        footer={
          <div className={styles.modalFooter}>
            {canWrite && detail?.srvcPrcsSttsCd === 'RCPT' && (
              <ActionButton intent="secondary" appearance="filled" onClick={() => void handleReceipt(detail.srvcAplyId)}>Receipt</ActionButton>
            )}
            <ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>
          </div>
        }
      >
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Application ID">{detail.srvcAplyId}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.srvcPrcsSttsNm || detail.srvcPrcsSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Applicant">{detail.mbrNm || '-'}</Descriptions.Item>
            <Descriptions.Item label="Member No">{detail.mbrNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="NPL / LOT">{detail.bndCd || detail.bndLotId || '-'}</Descriptions.Item>
            <Descriptions.Item label="Application Date">{detail.srvcAplyDmy || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
