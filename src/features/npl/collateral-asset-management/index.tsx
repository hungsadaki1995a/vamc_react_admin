import { useState } from 'react';
import { Descriptions } from 'antd';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import AppRadio from '@/components/inputs/AppRadio';
import TextInput from '@/components/inputs/TextInput';
import type { CollateralAssetItem, CollateralSearch } from '@/api/npl/npl-api';
import { SysPageHeader, SysPagination } from '@/features/system/_shared/SystemUi';
import { rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { useCollateralAsset, useCollateralAssets, useDownloadCollateralAssetsExcel } from './use-collateral-assets';

const PAGE_SIZE = 15;

/** Collateral Asset Management (menu A04030000). */
export default function CollateralAssetManagement() {
  const [expsrYn, setExpsrYn] = useState<'' | 'Y' | 'N'>('');
  const [notarYn, setNotarYn] = useState<'' | 'Y' | 'N'>('');
  const [cltrAstCd, setCltrAstCd] = useState('');
  const [cltrAstNm, setCltrAstNm] = useState('');
  const [applied, setApplied] = useState<CollateralSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching } = useCollateralAssets(applied, page, PAGE_SIZE);
  const { data: detail } = useCollateralAsset(detailId);
  const downloadExcel = useDownloadCollateralAssetsExcel();

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const handleSearch = () => {
    setApplied({
      expsrYn: expsrYn || undefined,
      notarYn: notarYn || undefined,
      cltrAstCd: cltrAstCd.trim() || undefined,
      cltrAstNm: cltrAstNm.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setExpsrYn('');
    setNotarYn('');
    setCltrAstCd('');
    setCltrAstNm('');
    setApplied({});
    setPage(1);
  };

  const columns: TableColumnsType<CollateralAssetItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Asset Code',
      dataIndex: 'cltrAstCd',
      width: 150,
      render: (v: string) => <a className={styles.cellLink} onClick={() => setDetailId(v)}>{v}</a>,
    },
    { title: 'Asset Name', dataIndex: 'cltrAstNm', width: 280 },
    { title: 'Type', dataIndex: 'cltrAstTypeNm', width: 140, render: (v?: string) => v || '-' },
    { title: 'Rep NPL', dataIndex: 'rprsBndCd', width: 140, render: (v?: string) => v || '-' },
    { title: 'NPL Count', dataIndex: 'bndCnt', width: 90, align: 'center' },
    {
      title: 'Displayed',
      dataIndex: 'expsrYn',
      width: 90,
      align: 'center',
      render: (v?: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v ?? 'N'}</span>,
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['NPL Info Management', 'NPL Registration', 'Collateral Asset Management']}
        title="Collateral Asset Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Displayed</span>
            <AppRadio.Group value={expsrYn} onChange={(e) => setExpsrYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Y</AppRadio>
              <AppRadio value="N">N</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Notarized</span>
            <AppRadio.Group value={notarYn} onChange={(e) => setNotarYn(e.target.value)}>
              <AppRadio value="">All</AppRadio>
              <AppRadio value="Y">Y</AppRadio>
              <AppRadio value="N">N</AppRadio>
            </AppRadio.Group>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Asset Code</span>
            <TextInput className={styles.filterInput} placeholder="Asset Code" value={cltrAstCd} onChange={(e) => setCltrAstCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Asset Name</span>
            <TextInput className={styles.filterInput} placeholder="Asset Name" value={cltrAstNm} onChange={(e) => setCltrAstNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate(applied)}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<CollateralAssetItem> rowKey="cltrAstCd" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <Popup open={!!detailId} width={760} title={`Collateral Asset: ${detailId ?? ''}`} onCancel={() => setDetailId(null)} footer={<ActionButton action="close" onClick={() => setDetailId(null)}>Close</ActionButton>}>
        {detail && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Asset Code">{String(detail.cltrAstCd ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Type">{String(detail.cltrAstTypeCd ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Name (VI)" span={2}>{String(detail.cltrAstNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Name (EN)" span={2}>{String(detail.cltrAstEngNm ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Contract No">{String(detail.cltrCtrtNo ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="Contract Date">{String(detail.ctrtDmy ?? '-')}</Descriptions.Item>
          </Descriptions>
        )}
      </Popup>
    </div>
  );
}
