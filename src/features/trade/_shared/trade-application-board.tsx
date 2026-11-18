import { useState } from 'react';
import { DatePicker, Descriptions, Input, Modal, Radio, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { TradeAppKind, TradeApplicationItem, TradeApplicationSearch } from '@/api/trade/trade-api';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/system-ui';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import {
  useDownloadTradeApplicationsExcel,
  useReceiptTradeApplication,
  useTradeApplication,
  useTradeApplications,
} from './use-trade-applications';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

export default function TradeApplicationBoard({ kind, title }: { kind: TradeAppKind; title: string }) {
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
      toast.success('Received.');
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
            <DatePicker.RangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <Select
              className={styles.w150}
              value={sttsCd}
              onChange={setSttsCd}
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
            <Radio.Group value={bndLotYn} onChange={(e) => setBndLotYn(e.target.value)}>
              <Radio value="">All</Radio>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Member Code</span>
            <Input className={styles.filterInput} placeholder="Member No" value={mbrNo} onChange={(e) => setMbrNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>NPL Code</span>
            <Input className={styles.filterInput} placeholder="NPL Code" value={bndCd} onChange={(e) => setBndCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <Input className={styles.filterInput} placeholder="Application ID, name..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => downloadExcel.mutate({ kind, search: applied })}>Excel Download</button>
      </div>
      <div className={styles.tableWrapper}>
        <Table<TradeApplicationItem> rowKey="srvcAplyId" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Modal
        open={!!detailId}
        width={720}
        centered
        title={`${title} — ${detailId ?? ''}`}
        onCancel={() => setDetailId(null)}
        footer={
          <div className={styles.modalFooter}>
            {canWrite && detail?.srvcPrcsSttsCd === 'RCPT' && (
              <button type="button" className={styles.btnDark} onClick={() => void handleReceipt(detail.srvcAplyId)}>Receipt</button>
            )}
            <button type="button" className={styles.btn} onClick={() => setDetailId(null)}>Close</button>
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
      </Modal>
    </div>
  );
}
