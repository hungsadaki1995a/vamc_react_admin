import { useState, type CSSProperties } from 'react';
import { Input, InputNumber, Modal, Radio, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { ProgramItem, ProgramSearch } from '@/api/system/program-screen-api';
import { DateTimeCell, FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/system-ui';
import { errorMessage, rowNumber, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import { useDeletePrograms, useDownloadProgramsExcel, usePrograms, useSaveProgram } from './use-programs';

const PAGE_SIZE = 15;

/** Program Management (VPA005101 / VPA0051P01, menu A06040100). */
export default function ProgramManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [prgrmSeCd, setPrgrmSeCd] = useState('');
  const [prgrmCd, setPrgrmCd] = useState('');
  const [prgrmNm, setPrgrmNm] = useState('');
  const [applied, setApplied] = useState<ProgramSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<ProgramItem | null | undefined>(undefined);

  const { data, isFetching } = usePrograms(applied, page, PAGE_SIZE);
  const deletePrograms = useDeletePrograms();
  const downloadExcel = useDownloadProgramsExcel();
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  // The list itself is refetched by the write hooks.
  const clearSelection = () => setSelectedKeys([]);

  const handleSearch = () => {
    setApplied({
      useYn: toUseYnFilter(used, unused),
      prgrmSeCd: prgrmSeCd || undefined,
      prgrmCd: prgrmCd.trim() || undefined,
      prgrmNm: prgrmNm.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setUsed(true);
    setUnused(true);
    setPrgrmSeCd('');
    setPrgrmCd('');
    setPrgrmNm('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = () => {
    if (!selectedKeys.length) { toast.warning('Select at least one program.'); return; }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected program(s)?`,
      onOk: async () => {
        try {
          await deletePrograms.mutateAsync(selectedKeys);
          toast.success('Deleted.');
          clearSelection();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<ProgramItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Use',
      dataIndex: 'useYn',
      width: 80,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v === 'Y' ? 'Used' : 'Unused'}</span>,
    },
    { title: 'Category', dataIndex: 'prgrmSeCd', width: 100, align: 'center' },
    { title: 'Menu Code', dataIndex: 'menuCd', width: 120, align: 'center' },
    {
      title: 'Program Code',
      dataIndex: 'prgrmCd',
      width: 150,
      render: (v: string, row) => <a className={styles.cellLink} onClick={() => setModalItem(row)}>{v}</a>,
    },
    { title: 'Order', dataIndex: 'prgrmSeq', width: 70, align: 'center' },
    { title: 'Program Name', dataIndex: 'prgrmNm', width: 220 },
    { title: 'Description', dataIndex: 'prgrmExpln', width: 240, render: (v?: string) => v || '-' },
    { title: 'Registration Date', dataIndex: 'crtDt', width: 130, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'Registered By', dataIndex: 'crtByNm', width: 120, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'System Management', 'Program Management']}
        title="Program Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Use</span>
            <UseYnChecks yes={used} no={unused} onChange={(y, n) => { setUsed(y); setUnused(n); }} allLabel="All" yesLabel="Used" noLabel="Unused" />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Category</span>
            <Select className={styles.w130} value={prgrmSeCd} onChange={setPrgrmSeCd} options={[{ value: '', label: 'All' }, { value: 'PAGE', label: 'PAGE' }, { value: 'POPUP', label: 'POPUP' }]} />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Program Code</span>
            <Input className={styles.filterInput} value={prgrmCd} onChange={(e) => setPrgrmCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Program Name</span>
            <Input className={styles.filterInput} value={prgrmNm} onChange={(e) => setPrgrmNm(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => downloadExcel.mutate(applied)}>Excel Download</button>
      </div>

      <div className={styles.tableWrapper}>
        <Table<ProgramItem>
          rowKey="prgrmCd"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: (k) => setSelectedKeys(k.map(String)) }}
        />
      </div>

      <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      <div className={styles.bottomActions}>
        <button type="button" className={styles.btnDanger} disabled={!canWrite} onClick={handleDelete}>Delete</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalItem(null)}>Add New</button>
      </div>

      {modalItem !== undefined && (
        <ProgramModal item={modalItem} canWrite={canWrite} onClose={() => setModalItem(undefined)} onSaved={clearSelection} />
      )}
    </div>
  );
}

function ProgramModal({ item, canWrite, onClose, onSaved }: { item: ProgramItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [prgrmCd, setPrgrmCd] = useState(item?.prgrmCd ?? '');
  const [menuCd, setMenuCd] = useState(item?.menuCd ?? '');
  const [prgrmSeCd, setPrgrmSeCd] = useState(item?.prgrmSeCd ?? 'PAGE');
  const [prgrmNm, setPrgrmNm] = useState(item?.prgrmNm ?? '');
  const [prgrmExpln, setPrgrmExpln] = useState(item?.prgrmExpln ?? '');
  const [prgrmSeq, setPrgrmSeq] = useState<number>(item?.prgrmSeq ?? 1);
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');
  const saveProgram = useSaveProgram();

  const handleSave = async () => {
    if (!prgrmCd.trim() || !menuCd.trim() || !prgrmNm.trim()) {
      toast.warning('Enter Program Code, Menu Code, and Program Name.');
      return;
    }
    try {
      const req = {
        prgrmCd: prgrmCd.trim(),
        menuCd: menuCd.trim(),
        prgrmSeCd,
        prgrmNm: prgrmNm.trim(),
        prgrmExpln: prgrmExpln.trim() || undefined,
        prgrmSeq,
        useYn,
      };
      await saveProgram.mutateAsync({ prgrmCd: isCreate ? null : item.prgrmCd, request: req });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open width={760} centered title={isCreate ? 'Register Program' : 'Edit Program'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Program Code" required><Input value={prgrmCd} disabled={!isCreate} maxLength={12} onChange={(e) => setPrgrmCd(e.target.value)} /></FormField>
        <FormField label="Menu Code" required><Input value={menuCd} maxLength={9} placeholder="e.g. A06040100" onChange={(e) => setMenuCd(e.target.value)} /></FormField>
        <FormField label="Category" required>
          <Select className={styles.wFull} value={prgrmSeCd} disabled={!isCreate} onChange={setPrgrmSeCd} options={[{ value: 'PAGE', label: 'PAGE' }, { value: 'POPUP', label: 'POPUP' }]} />
        </FormField>
        <FormField label="Order" required><InputNumber min={0} max={99} value={prgrmSeq} onChange={(v) => setPrgrmSeq(v ?? 1)} /></FormField>
        <FormField label="Use" required span="full">
          <Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Used</Radio><Radio value="N">Unused</Radio></Radio.Group>
        </FormField>
        <FormField label="Program Name" required span="full"><Input value={prgrmNm} maxLength={100} onChange={(e) => setPrgrmNm(e.target.value)} /></FormField>
        <FormField label="Description" span="full"><Input.TextArea rows={3} value={prgrmExpln} maxLength={4000} onChange={(e) => setPrgrmExpln(e.target.value)} /></FormField>
      </div>
    </Modal>
  );
}
