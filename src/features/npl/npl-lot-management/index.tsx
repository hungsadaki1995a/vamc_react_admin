import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { TableColumnsType } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import Popup from '@/components/common/popup/Popup';
import DataTable from '@/components/common/table/DataTable';
import TextArea from '@/components/inputs/TextArea';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { NplLotItem, NplLotSearch } from '@/api/npl/npl-api';
import { DateTimeCell, FormField, SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage, rowNumber } from '@/utils/system-utils';
import styles from '@/components/common/sys-ui/system-page.module.scss';
import { isSameQuery } from '@/utils/query-utils';
import { useDeleteNplLot, useDownloadNplLotsExcel, useNplLots, useSaveNplLot } from './use-npl-lots';

const PAGE_SIZE = 15;

/** NPL LOT Change Management (menu A04050000). */
export default function NplLotManagement() {
  const { t } = useTranslation();
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [bndLotNo, setBndLotNo] = useState('');
  const [bndLotNm, setBndLotNm] = useState('');
  const [applied, setApplied] = useState<NplLotSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [modalItem, setModalItem] = useState<NplLotItem | null | undefined>(undefined);

  const { data, isFetching, refetch } = useNplLots(applied, page, PAGE_SIZE);
  const deleteNplLot = useDeleteNplLot();
  const downloadExcel = useDownloadNplLotsExcel();
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  /** Same query on page 1 keeps the key, so reload it explicitly (the button always searches). */
  const applySearch = (next: NplLotSearch) => {
    if (page === 1 && isSameQuery(next, applied)) void refetch();
    setApplied(next);
    setPage(1);
  };
  const handleSearch = () => {
    applySearch({
      bndLotNo: bndLotNo.trim() || undefined,
      bndLotNm: bndLotNm.trim() || undefined,
    });
  };

  const handleReset = () => {
    setBndLotNo('');
    setBndLotNm('');
    applySearch({});
  };

  const handleDelete = (bndLotId: string) => {
    dialog.warning({
      okCancel: true,
      content: t('messages.npl.confirmDeleteLot'),
      onOk: async () => {
        try {
          await deleteNplLot.mutateAsync(bndLotId);
          toast.success(SYS_MESSAGES.deleted);
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
        <ActionButton size="small" intent="danger" disabled={!canWrite} onClick={() => handleDelete(row.bndLotId)}>
          Delete
        </ActionButton>
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
            <TextInput className={styles.filterInput} placeholder="LOT No" value={bndLotNo} onChange={(e) => setBndLotNo(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>LOT Name</span>
            <TextInput className={styles.filterInput} placeholder="LOT Name" value={bndLotNm} onChange={(e) => setBndLotNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <ActionButton action="excelDownload" size="small" onClick={() => downloadExcel.mutate(applied)}>Excel Download</ActionButton>
      </div>
      <div className={styles.tableWrapper}>
        <DataTable<NplLotItem> rowKey="bndLotId" columns={columns} dataSource={rows} loading={isFetching} scroll={{ x: 'max-content' }} />
      </div>
      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      <div className={styles.bottomActions}>
        <ActionButton intent="secondary" appearance="filled" disabled={!canWrite} onClick={() => setModalItem(null)}>Add New</ActionButton>
      </div>

      {modalItem !== undefined && (
        <LotModal item={modalItem} canWrite={canWrite} onClose={() => setModalItem(undefined)} />
      )}
    </div>
  );
}

function LotModal({ item, canWrite, onClose }: { item: NplLotItem | null; canWrite: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const isCreate = item === null;
  const { toast } = useNotify();
  const saveNplLot = useSaveNplLot();
  const [bndLotNo, setBndLotNo] = useState(item?.bndLotNo ?? '');
  const [bndLotNm, setBndLotNm] = useState(item?.bndLotNm ?? '');
  const [bndLotExpln, setBndLotExpln] = useState(item?.bndLotExpln ?? '');

  const handleSave = async () => {
    if (!bndLotNm.trim()) {
      toast.warning(t('messages.npl.lotNameRequired'));
      return;
    }
    try {
      // The list is refetched by the hook.
      await saveNplLot.mutateAsync({
        bndLotId: isCreate ? null : item.bndLotId,
        bndLotNo: isCreate ? bndLotNo.trim() || undefined : undefined,
        bndLotNm: bndLotNm.trim(),
        bndLotExpln: bndLotExpln.trim() || undefined,
      });
      toast.success(SYS_MESSAGES.saved);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Popup open title={isCreate ? 'Register NPL LOT' : 'Edit NPL LOT'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <ActionButton action="cancel" onClick={onClose}>Cancel</ActionButton>
        <ActionButton intent="secondary" appearance="filled" disabled={!canWrite} onClick={handleSave}>Confirm</ActionButton>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="LOT No" span="full"><TextInput value={bndLotNo} disabled={!isCreate} onChange={(e) => setBndLotNo(e.target.value)} /></FormField>
        <FormField label="LOT Name" required span="full"><TextInput value={bndLotNm} onChange={(e) => setBndLotNm(e.target.value)} /></FormField>
        <FormField label="Description" span="full"><TextArea rows={3} value={bndLotExpln} onChange={(e) => setBndLotExpln(e.target.value)} /></FormField>
      </div>
    </Popup>
  );
}
