import { useState } from 'react';
import { Input, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  approveBidder,
  getBidderAuctions,
  getBiddersByAuction,
  rejectBidder,
  type AuctionItem,
  type BidderItem,
} from '@/api/auction/auction-api';
import type { PageResponse } from '@/api/common/api-utils';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { errorMessage } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;

/** Bidder Management (menu A07020000). */
export default function BidderManagement() {
  const { toast } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ keyword?: string }>({});
  const [page, setPage] = useState(1);
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [bidderPage, setBidderPage] = useState(1);

  const { data: auctData, isFetching: auctLoading } = useApiQuery<PageResponse<AuctionItem>>(
    ['auction', 'bidder-auctions', applied, page],
    () => getBidderAuctions(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const { data: bidderData, isFetching: bidderLoading } = useApiQuery<PageResponse<BidderItem>>(
    ['auction', 'bidders', selectedAuction, bidderPage],
    () => getBiddersByAuction(selectedAuction as string, bidderPage, PAGE_SIZE),
    { enabled: !!selectedAuction, placeholderData: keepPreviousData },
  );

  const auctions = auctData?.content ?? [];
  const totalAuctions = auctData?.totalElements ?? 0;
  const bidders = bidderData?.content ?? [];
  const totalBidders = bidderData?.totalElements ?? 0;

  const handleAction = async (bdrNo: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approveBidder(bdrNo);
      else await rejectBidder(bdrNo);
      toast.success('Updated.');
      void queryClient.invalidateQueries({ queryKey: ['auction', 'bidders', selectedAuction] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const auctColumns: TableColumnsType<AuctionItem> = [
    { title: 'Auction No', dataIndex: 'auctnNo', width: 130 },
    { title: 'Auction Name', dataIndex: 'auctnNm' },
    { title: 'Status', dataIndex: 'auctnSttsCd', width: 100, align: 'center' },
  ];

  const bidderColumns: TableColumnsType<BidderItem> = [
    { title: 'Bidder No', dataIndex: 'bdrNo', width: 130 },
    { title: 'Applicant', dataIndex: 'aplcntNm', width: 160 },
    { title: 'Status', dataIndex: 'qlfcSttsCd', width: 100, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Deposit', dataIndex: 'grnteAmt', width: 110, align: 'right', render: (v?: number) => v?.toLocaleString() ?? '-' },
    {
      title: 'Actions',
      key: 'act',
      width: 150,
      align: 'center',
      render: (_v, r) => (
        <div className={`${styles.actions} justify-center`}>
          <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => void handleAction(r.bdrNo, 'approve')}>Approve</button>
          <button type="button" className={`${styles.btnDanger} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => void handleAction(r.bdrNo, 'reject')}>Reject</button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['Auction Management', 'Bidder Management']}
        title="Bidder Management"
        onReset={() => { setKeyword(''); setApplied({}); setPage(1); }}
        onSearch={() => { setApplied({ keyword: keyword.trim() || undefined }); setPage(1); }}
      />
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Auction</span>
          <Input className={styles.filterInput} placeholder="Auction no or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setApplied({ keyword: keyword.trim() || undefined }); setPage(1); }} allowClear />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-4 flex-1 min-h-0">
        <div className={styles.card}>
          <span className={styles.cardTitle}>Auctions ({totalAuctions})</span>
          <div className={styles.tableWrapper}>
            <Table<AuctionItem>
              rowKey="auctnNo"
              columns={auctColumns}
              dataSource={auctions}
              loading={auctLoading}
              pagination={false}
              size="small"
              rowClassName={(r) => (r.auctnNo === selectedAuction ? styles.rowSelected : '')}
              onRow={(r) => ({ onClick: () => { setSelectedAuction(r.auctnNo); setBidderPage(1); } })}
            />
          </div>
          <SysPagination page={page} pageSize={PAGE_SIZE} total={totalAuctions} onChange={setPage} />
        </div>

        <div className={styles.card}>
          <span className={styles.cardTitle}>Bidders {selectedAuction ? `(${selectedAuction})` : ''}</span>
          <div className={styles.tableWrapper}>
            <Table<BidderItem> rowKey="bdrNo" columns={bidderColumns} dataSource={bidders} loading={bidderLoading} pagination={false} size="small" scroll={{ x: 'max-content' }} />
          </div>
          <SysPagination page={bidderPage} pageSize={PAGE_SIZE} total={totalBidders} onChange={setBidderPage} />
        </div>
      </div>
    </div>
  );
}
