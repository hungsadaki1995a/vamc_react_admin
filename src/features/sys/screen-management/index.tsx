import { useState, type CSSProperties } from 'react';
import { Input, InputNumber, Modal, Radio, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createScreen,
  deleteScreens,
  downloadScreensExcel,
  getProgramOptions,
  getScreens,
  updateScreen,
  type ProgramItem,
  type ScreenItem,
  type ScreenSearch,
} from '@/api/sys/program-screen-api';
import type { PageResponse } from '@/api/common/api-util';
import { DateTimeCell, FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/sys/_shared/sys-ui';
import { errorMessage, rowNumber, toUseYnFilter } from '@/features/sys/_shared/sys-utils';
import styles from '@/features/sys/_shared/sys-page.module.css';

const PAGE_SIZE = 15;

/** Screen Management (VPA005201 / VPA0052P01, menu A06040200). */
export default function ScreenManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [prgrmCd, setPrgrmCd] = useState('');
  const [scrnId, setScrnId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<ScreenSearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalItem, setModalItem] = useState<ScreenItem | null | undefined>(undefined);

  const { data, isFetching } = useApiQuery<PageResponse<ScreenItem>>(
    ['sys', 'screens', applied, page],
    () => getScreens(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const refresh = () => {
    setSelectedKeys([]);
    void queryClient.invalidateQueries({ queryKey: ['sys', 'screens'] });
  };

  const handleSearch = () => {
    setApplied({
      useYn: toUseYnFilter(used, unused),
      prgrmCd: prgrmCd.trim() || undefined,
      scrnId: scrnId.trim() || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setUsed(true);
    setUnused(true);
    setPrgrmCd('');
    setScrnId('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const handleDelete = () => {
    if (!selectedKeys.length) { toast.warning('Select at least one screen.'); return; }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected screen(s)?`,
      onOk: async () => {
        try {
          await deleteScreens(selectedKeys);
          toast.success('Deleted.');
          refresh();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<ScreenItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    {
      title: 'Use',
      dataIndex: 'useYn',
      width: 80,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v === 'Y' ? 'Used' : 'Unused'}</span>,
    },
    { title: 'Program Code', dataIndex: 'prgrmCd', width: 140, align: 'center' },
    {
      title: 'Screen ID',
      dataIndex: 'scrnId',
      width: 170,
      render: (v: string, row) => <a className={styles.cellLink} onClick={() => setModalItem(row)}>{v}</a>,
    },
    { title: 'Order', dataIndex: 'scrnSeq', width: 70, align: 'center' },
    { title: 'Program Name', dataIndex: 'prgrmNm', width: 200, render: (v?: string) => v || '-' },
    { title: 'Description', dataIndex: 'scrnExpln', width: 240, render: (v?: string) => v || '-' },
    { title: 'Registration Date', dataIndex: 'crtDt', width: 130, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
    { title: 'Registered By', dataIndex: 'crtByNm', width: 120, align: 'center', render: (v?: string) => v || '-' },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'System Management', 'Screen Management']}
        title="Screen Management"
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
            <span className={styles.filterLabel}>Program Code</span>
            <Input className={styles.filterInput} value={prgrmCd} onChange={(e) => setPrgrmCd(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Screen ID</span>
            <Input className={styles.filterInput} value={scrnId} onChange={(e) => setScrnId(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Screen Name / Desc</span>
            <Input className={styles.filterInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadScreensExcel(applied)}>Excel Download</button>
      </div>

      <div className={styles.tableWrapper}>
        <Table<ScreenItem>
          rowKey="scrnId"
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
        <ScreenModal item={modalItem} canWrite={canWrite} onClose={() => setModalItem(undefined)} onSaved={refresh} />
      )}
    </div>
  );
}

function ScreenModal({ item, canWrite, onClose, onSaved }: { item: ScreenItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [scrnId, setScrnId] = useState(item?.scrnId ?? '');
  const [prgrmCd, setPrgrmCd] = useState(item?.prgrmCd ?? '');
  const [scrnExpln, setScrnExpln] = useState(item?.scrnExpln ?? '');
  const [scrnSeq, setScrnSeq] = useState<number>(item?.scrnSeq ?? 1);
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const { data: programOptions } = useApiQuery<ProgramItem[]>(
    ['sys', 'program-options'],
    () => getProgramOptions('Y'),
  );

  const handleSave = async () => {
    if (!scrnId.trim() || !prgrmCd.trim()) {
      toast.warning('Enter Screen ID and Program Code.');
      return;
    }
    try {
      const req = {
        scrnId: scrnId.trim(),
        prgrmCd: prgrmCd.trim(),
        scrnExpln: scrnExpln.trim() || undefined,
        scrnSeq,
        useYn,
      };
      if (isCreate) await createScreen(req);
      else await updateScreen(item.scrnId, req);
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open width={760} centered title={isCreate ? 'Register Screen' : 'Edit Screen'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Screen ID" required><Input value={scrnId} disabled={!isCreate} maxLength={20} placeholder="e.g. AD_SYS_040200" onChange={(e) => setScrnId(e.target.value)} /></FormField>
        <FormField label="Program Code" required>
          <Select
            showSearch
            style={{ width: '100%' }}
            value={prgrmCd || undefined}
            placeholder="Select program"
            onChange={setPrgrmCd}
            options={(programOptions ?? []).map((p) => ({ value: p.prgrmCd, label: `${p.prgrmCd} (${p.prgrmNm})` }))}
          />
        </FormField>
        <FormField label="Order" required><InputNumber min={0} max={99} value={scrnSeq} onChange={(v) => setScrnSeq(v ?? 1)} /></FormField>
        <FormField label="Use" required>
          <Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Used</Radio><Radio value="N">Unused</Radio></Radio.Group>
        </FormField>
        <FormField label="Description" span="full"><Input.TextArea rows={3} value={scrnExpln} maxLength={4000} onChange={(e) => setScrnExpln(e.target.value)} /></FormField>
      </div>
    </Modal>
  );
}
