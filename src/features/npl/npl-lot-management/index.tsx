import { useState, type CSSProperties } from 'react';
import { Input, Modal, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createNplLot,
  deleteNplLot,
  downloadNplLotsExcel,
  getNplLots,
  updateNplLot,
  type NplLotItem,
  type NplLotSearch,
} from '@/api/npl/npl-api';
import type { PageResponse } from '@/api/common/api-util';
import { DateTimeCell, FormField, SysPageHeader, SysPagination } from '@/features/sys/_shared/sys-ui';
import { errorMessage, rowNumber } from '@/features/sys/_shared/sys-utils';
import styles from '@/features/sys/_shared/sys-page.module.css';

const PAGE_SIZE = 15;

/** NPL LOT Change Management (menu A03010400). */
export default function NplLotManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [bndLotNo, setBndLotNo] = useState('');
  const [bndLotNm, setBndLotNm] = useState('');
  const [applied, setApplied] = useState<NplLotSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [modalItem, setModalItem] = useState<NplLotItem | null | undefined>(undefined);

  const { data, isFetching } = useApiQuery<PageResponse<NplLotItem>>(
    ['npl', 'lots', applied, page],
    () => getNplLots(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['npl', 'lots'] });

  const handleSearch = () => {
    setApplied({
      bndLotNo: bndLotNo.trim() || undefined,
      bndLotNm: bndLotNm.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setBndLotNo('');
    setBndLotNm('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = (bndLotId: string) => {
    dialog.warning({
      okCancel: true,
      content: 'Delete this NPL LOT?',
      onOk: async () => {
        try {
          await deleteNplLot(bndLotId);
          toast.success('Deleted.');
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<NplLotItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: 'LOT No', dataIndex: 'bndLotNo', width: 150 },
    {
      title: 'LOT Name',
      dataIndex: 'bndLotNm',
      width: 280,
      render: (v: string, row) => <a className={styles.cellLink} onClick={() => setModalItem(row)}>{v}</a>,
    },
    { title: 'NPL Count', dataIndex: 'nplCnt', width: 100, align: 'center' },
    { title: 'Created At', dataIndex: 'crtDt', width: 140, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'Creator', dataIndex: 'crtByNm', width: 130, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Action',
      key: 'act',
      width: 90,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={styles.btnDanger} style={{ height: 24, padding: '0 8px', fontSize: 11 }} disabled={!canWrite} onClick={() => handleDelete(row.bndLotId)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['NPL Info Management', 'NPL Registration', 'NPL LOT Change Management']}
        title="NPL LOT Change Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />
      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>LOT ID</span>
            <Input className={styles.filterInput} placeholder="LOT No" value={bndLotNo} onChange={(e) => setBndLotNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>LOT Name</span>
            <Input className={styles.filterInput} placeholder="LOT Name" value={bndLotNm} onChange={(e) => setBndLotNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadNplLotsExcel(applied as Record<string, unknown>)}>Excel Download</button>
      </div>
      <div className={styles.tableWrapper}>
        <Table<NplLotItem> rowKey="bndLotId" columns={columns} dataSource={rows} loading={isFetching} pagination={false} size="small" scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalItem(null)}>Add New</button>
      </div>

      {modalItem !== undefined && (
        <LotModal item={modalItem} canWrite={canWrite} onClose={() => setModalItem(undefined)} onSaved={refresh} />
      )}
    </div>
  );
}

function LotModal({ item, canWrite, onClose, onSaved }: { item: NplLotItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [bndLotNo, setBndLotNo] = useState(item?.bndLotNo ?? '');
  const [bndLotNm, setBndLotNm] = useState(item?.bndLotNm ?? '');
  const [bndLotExpln, setBndLotExpln] = useState(item?.bndLotExpln ?? '');

  const handleSave = async () => {
    if (!bndLotNm.trim()) { toast.warning('Enter LOT name.'); return; }
    try {
      if (isCreate) await createNplLot({ bndLotNo: bndLotNo.trim() || undefined, bndLotNm: bndLotNm.trim(), bndLotExpln: bndLotExpln.trim() || undefined });
      else await updateNplLot(item.bndLotId, { bndLotNm: bndLotNm.trim(), bndLotExpln: bndLotExpln.trim() || undefined });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register NPL LOT' : 'Edit NPL LOT'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="LOT No" span="full"><Input value={bndLotNo} disabled={!isCreate} onChange={(e) => setBndLotNo(e.target.value)} /></FormField>
        <FormField label="LOT Name" required span="full"><Input value={bndLotNm} onChange={(e) => setBndLotNm(e.target.value)} /></FormField>
        <FormField label="Description" span="full"><Input.TextArea rows={3} value={bndLotExpln} onChange={(e) => setBndLotExpln(e.target.value)} /></FormField>
      </div>
    </Modal>
  );
}
