import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Descriptions } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import { AppRangePicker } from '@/components/inputs/AppDatePicker';
import AppSelect from '@/components/inputs/AppSelect';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { AuctionItem, AuctionSearch } from '@/api/auction/auction-api';
import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { useAuction, useAuctions, useDeleteAuctions, useDownloadAuctionsExcel } from './use-auctions';

const PAGE_SIZE = 15;
type DateRange = [Dayjs | null, Dayjs | null] | null;

/** Online Auction Notice Management (menu A06010000). */
export default function AuctionManagement() {
  const { t } = useTranslation();
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

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

  const { data, isFetching } = useAuctions(applied, page, PAGE_SIZE);
  const { data: detail } = useAuction(detailId);
  const deleteAuctions = useDeleteAuctions();
  const downloadExcel = useDownloadAuctionsExcel();

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
    if (!selectedKeys.length) {
      toast.warning(t('messages.auction.selectAtLeastOne'));
      return;
    }
    dialog.warning({
      okCancel: true,
      content: t('messages.auction.confirmDelete', { count: selectedKeys.length }),
      onOk: async () => {
        try {
          await deleteAuctions.mutateAsync(selectedKeys);
          toast.success(SYS_MESSAGES.deleted);
          setSelectedKeys([]);
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
            <AppRangePicker format="DD/MM/YYYY" value={period} onChange={(d) => setPeriod(d as DateRange)} className={styles.w240} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <AppSelect
              className={styles.w140}
              value={auctnSttsCd}
              onChange={(v) => setAuctnSttsCd(String(v ?? ''))}
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
            <AppSelect
              className={styles.w140}
              value={pbancSttsCd}
              onChange={(v) => setPbancSttsCd(String(v ?? ''))}
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
            <AppSelect
              className={styles.w140}
              value={auctnType}
              onChange={(v) => setAuctnType(String(v ?? ''))}
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
            <TextInput className={styles.filterInput} placeholder="Auction no or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate(applied)}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<AuctionItem> rowKey="auctnNo" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <ActionButton action="deleteRow" disabled={!canWrite} onClick={handleDelete}>Delete</ActionButton>
      </div>

      <Popup open={!!detailId} width={720} title={`Auction: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Auction No">{detail.auctnNo}</Descriptions.Item>
            <Descriptions.Item label="Status">{detail.auctnSttsCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Auction Name" span={2}>{detail.auctnNm}</Descriptions.Item>
            <Descriptions.Item label="NPL">{detail.bndNm || detail.bndCd || '-'}</Descriptions.Item>
            <Descriptions.Item label="Collateral">{detail.cltrAstNm || detail.cltrAstCd || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
