import { useState } from 'react';
import { Descriptions, Input, Modal, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  closeLiveAuction,
  getLiveAuction,
  getLiveAuctions,
  startLiveAuction,
  type LiveAuctionItem,
} from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';
import { DateTimeCell, SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;

/** Live Online Auction Management (menu A07030000). */
export default function LiveAuctionManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ keyword?: string }>({});
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useApiQuery<PageResponse<LiveAuctionItem>>(
    ['auction', 'live', applied, page],
    () => getLiveAuctions(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const { data: detail } = useApiQuery<LiveAuctionItem>(
    ['auction', 'live-detail', detailId],
    () => getLiveAuction(detailId as string),
    { enabled: !!detailId },
  );

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleControl = (auctnNo: string, action: 'start' | 'close') => {
    dialog.warning({
      okCancel: true,
      content: `${action === 'start' ? 'Start' : 'Close'} live auction ${auctnNo}?`,
      onOk: async () => {
        try {
          if (action === 'start') await startLiveAuction(auctnNo);
          else await closeLiveAuction(auctnNo);
          toast.success('Updated.');
          void queryClient.invalidateQueries({ queryKey: ['auction', 'live'] });
          setDetailId(null);
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<LiveAuctionItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Auction No',
      dataIndex: 'auctnNo',
      width: 140,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Auction Name', dataIndex: 'auctnNm', width: 260 },
    { title: 'Status', dataIndex: 'auctnSttsCd', width: 110, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Highest Bid', dataIndex: 'currentHighestBid', width: 130, align: 'right', render: (v?: number) => v?.toLocaleString() ?? '-' },
    { title: 'Total Bids', dataIndex: 'totalBids', width: 90, align: 'center', render: (v?: number) => v ?? 0 },
    { title: 'Start Time', dataIndex: 'auctnBgngDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'End Time', dataIndex: 'auctnEndDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Auction Management', 'Live Online Auction Management']}
        title="Live Online Auction Management"
        onReset={() => { setKeyword(''); setApplied({}); setPage(1); }}
        onSearch={() => { setApplied({ keyword: keyword.trim() || undefined }); setPage(1); }}
      />
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Keyword</span>
          <Input className={styles.filterInput} placeholder="Auction no or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setApplied({ keyword: keyword.trim() || undefined }); setPage(1); }} allowClear />
        </div>
      </div>
      <div className={styles.summaryRow}><span className={styles.totalCount}>Total ({total})</span></div>
      <div className={styles.tableWrapper}>
        <Table<LiveAuctionItem> rowKey="auctnNo" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Modal
        open={!!detailId}
        width={720}
        centered
        title={`Live Auction: ${detailId ?? ''}`}
        onCancel={() => setDetailId(null)}
        footer={
          <div className={styles.modalFooter}>
            {canWrite && detail && (
              <>
                <button type="button" className={styles.btnDark} onClick={() => handleControl(detail.auctnNo, 'start')}>Start</button>
                <button type="button" className={styles.btnDanger} onClick={() => handleControl(detail.auctnNo, 'close')}>Close</button>
              </>
            )}
            <button type="button" className={styles.btn} onClick={() => setDetailId(null)}>Close Modal</button>
          </div>
        }
      >
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Auction No">{detail.auctnNo}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.auctnSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Highest Bid">{detail.currentHighestBid?.toLocaleString() ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Total Bids">{detail.totalBids ?? 0}</Descriptions.Item>
            <Descriptions.Item label="Winner">{detail.winnerNm || '-'}</Descriptions.Item>
            <Descriptions.Item label="Winning Amt">{detail.scsbdAmt?.toLocaleString() ?? '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
