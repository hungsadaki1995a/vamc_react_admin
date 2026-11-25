import { useState } from 'react';
import { Descriptions } from 'antd';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { LiveAuctionItem } from '@/api/auction/auction-api';
import { DateTimeCell, SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { errorMessage, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { useCloseLiveAuction, useLiveAuction, useLiveAuctions, useStartLiveAuction } from './use-live-auctions';
import type { LiveAuctionSearch } from './use-live-auctions';

const PAGE_SIZE = 15;

/** Live Online Auction Management (menu A06030000). */
export default function LiveAuctionManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<LiveAuctionSearch>({});
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useLiveAuctions(applied, page, PAGE_SIZE);
  const { data: detail } = useLiveAuction(detailId);
  const startLiveAuction = useStartLiveAuction();
  const closeLiveAuction = useCloseLiveAuction();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleControl = (auctnNo: string, action: 'start' | 'close') => {
    dialog.warning({
      okCancel: true,
      content: `${action === 'start' ? 'Start' : 'Close'} live auction ${auctnNo}?`,
      onOk: async () => {
        try {
          if (action === 'start') await startLiveAuction.mutateAsync(auctnNo);
          else await closeLiveAuction.mutateAsync(auctnNo);
          toast.success('Updated.');
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
          <TextInput className={styles.filterInput} placeholder="Auction no or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={() => { setApplied({ keyword: keyword.trim() || undefined }); setPage(1); }} allowClear />
        </div>
      </div>
      <div className={styles.summaryRow}><span className={styles.totalCount}>Total ({total})</span></div>
      <div className={styles.tableWrapper}>
        <DataTable<LiveAuctionItem> rowKey="auctnNo" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Popup
        open={!!detailId}
        width={720}
        title={`Live Auction: ${detailId ?? ''}`}
        onCancel={() => setDetailId(null)}
        footer={
          <div className={styles.modalFooter}>
            {canWrite && detail && (
              <>
                <ActionButton intent="secondary" appearance="filled" onClick={() => handleControl(detail.auctnNo, 'start')}>Start</ActionButton>
                <ActionButton intent="danger" onClick={() => handleControl(detail.auctnNo, 'close')}>Close</ActionButton>
              </>
            )}
            <ActionButton action="close" onClick={() => setDetailId(null)}>Close Modal</ActionButton>
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
      </Popup>
    </div>
  );
}
