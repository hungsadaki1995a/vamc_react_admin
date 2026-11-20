import { useState } from 'react';
import { DatePicker, Descriptions, Input, Modal, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  deleteAuctions,
  downloadAuctionsExcel,
  getAuction,
  getAuctions,
  type AuctionItem,
  type AuctionSearch,
} from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Online Auction Notice Management (menu A07010000). */
export default function AuctionManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState<DateRange>(null);
  const [auctnSttsCd, setAuctnSttsCd] = useState('');
  const [pbancSttsCd, setPbancSttsCd] = useState('');
  const [auctnType, setAuctnType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<AuctionSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useApiQuery<PageResponse<AuctionItem>>(
    ['auction', 'list', applied, page],
    () => getAuctions(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const { data: detail } = useApiQuery<AuctionItem>(
    ['auction', 'detail', detailId],
    () => getAuction(detailId as string),
    { enabled: !!detailId },
  );

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      auctnFromDate: period?.[0]?.format('YYYY-MM-DD'),
      auctnToDate: period?.[1]?.format('YYYY-MM-DD'),
      auctnSttsCd: auctnSttsCd || undefined,
      pbancSttsCd: pbancSttsCd || undefined,
      auctnType: auctnType || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setPeriod(null);
    setAuctnSttsCd('');
    setPbancSttsCd('');
    setAuctnType('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = () => {
    if (!selectedKeys.length) { toast.warning('Select at least one auction.'); return; }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected auction(s)?`,
      onOk: async () => {
        try {
          await deleteAuctions(selectedKeys);
          toast.success('Deleted.');
          setSelectedKeys([]);
          void queryClient.invalidateQueries({ queryKey: ['auction', 'list'] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<AuctionItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Auction No',
      dataIndex: 'auctnNo',
      width: 150,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Auction Name', dataIndex: 'auctnNm', width: 280 },
    { title: 'Cycle', dataIndex: 'auctnCycl', width: 70, align: 'center' },
    { title: 'Status', dataIndex: 'auctnSttsCd', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: 'NPL / Asset', key: 'target', width: 180, render: (_v, r) => r.bndNm || r.cltrAstNm || '-' },
    { title: 'PIC', dataIndex: 'picNm', width: 120, render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Auction Management', 'Online Auction Notice Management']}
        title="Online Auction Notice Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Auction Period</span>
            <DatePicker.RangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className="w-[240px]" />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <Select
              className="w-[140px]"
              value={auctnSttsCd}
              onChange={setAuctnSttsCd}
              options={[
                { value: '', label: 'All' },
                { value: 'RD', label: 'Ready' },
                { value: 'AN', label: 'Announced' },
                { value: 'IP', label: 'In Progress' },
                { value: 'CL', label: 'Closed' },
                { value: 'AW', label: 'Awarded' },
                { value: 'FL', label: 'Failed' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Approval Status</span>
            <Select
              className="w-[140px]"
              value={pbancSttsCd}
              onChange={setPbancSttsCd}
              options={[
                { value: '', label: 'All' },
                { value: 'NA', label: 'Not Requested' },
                { value: 'RQ', label: 'Requested' },
                { value: 'AP', label: 'Approved' },
                { value: 'RJ', label: 'Rejected' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Method</span>
            <Select
              className="w-[140px]"
              value={auctnType}
              onChange={setAuctnType}
              options={[
                { value: '', label: 'All' },
                { value: 'GN', label: 'General' },
                { value: 'PX', label: 'Fixed Price' },
                { value: 'SB', label: 'Sealed Bid' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Search Term</span>
            <Input className={styles.filterInput} placeholder="Auction no or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadAuctionsExcel(applied as Record<string, unknown>)}>Excel Download</button>
      </div>
      <div className={styles.tableWrapper}>
        <Table<AuctionItem> rowKey="auctnNo" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnDanger} disabled={!canWrite} onClick={handleDelete}>Delete</button>
      </div>

      <Modal open={!!detailId} width={720} centered title={`Auction: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<button type="button" className={styles.btn} onClick={() => setDetailId(null)}>Close</button>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Auction No">{detail.auctnNo}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.auctnSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Auction Name" span={2}>{detail.auctnNm}</Descriptions.Item>
            <Descriptions.Item label="NPL">{detail.bndNm || detail.bndCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Collateral">{detail.cltrAstNm || detail.cltrAstCd || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
