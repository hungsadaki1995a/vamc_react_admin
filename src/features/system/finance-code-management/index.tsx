import { useState, type CSSProperties } from 'react';
import { Input, Modal, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createBranch,
  createInstitution,
  deleteBranch,
  deleteInstitution,
  downloadInstitutionsExcel,
  getBranchesByInstitution,
  getInstitutions,
  updateBranch,
  updateInstitution,
  type BranchItem,
  type InstitutionItem,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';
import { FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/system-ui';
import { errorMessage, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;

/** Finance Code Management (menu A06030300). */
export default function FinanceCodeManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ useYn?: 'Y' | 'N'; keyword?: string }>({});
  const [page, setPage] = useState(1);
  const [selectedInst, setSelectedInst] = useState<string | null>(null);
  const [instModal, setInstModal] = useState<InstitutionItem | null | undefined>(undefined);
  const [branchModal, setBranchModal] = useState<BranchItem | null | undefined>(undefined);

  const { data: instData, isFetching: instLoading } = useApiQuery<PageResponse<InstitutionItem>>(
    ['sys', 'institutions', applied, page],
    () => getInstitutions(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const institutions = instData?.content ?? [];
  const total = instData?.totalElements ?? 0;

  const { data: branchData, isFetching: branchLoading } = useApiQuery<BranchItem[]>(
    ['sys', 'branches', selectedInst],
    () => getBranchesByInstitution(selectedInst as string),
    { enabled: !!selectedInst },
  );
  const branches = branchData ?? [];

  const handleSearch = () => {
    setApplied({ useYn: toUseYnFilter(used, unused), keyword: keyword.trim() || undefined });
    setPage(1);
  };

  const handleReset = () => {
    setUsed(true);
    setUnused(true);
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const handleDeleteInst = (fnstCd: string) => {
    dialog.warning({
      okCancel: true,
      content: `Delete institution ${fnstCd}?`,
      onOk: async () => {
        try {
          await deleteInstitution(fnstCd);
          toast.success('Deleted.');
          if (selectedInst === fnstCd) setSelectedInst(null);
          void queryClient.invalidateQueries({ queryKey: ['sys', 'institutions'] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const handleDeleteBranch = (fnstBrnchCd: string) => {
    dialog.warning({
      okCancel: true,
      content: `Delete branch ${fnstBrnchCd}?`,
      onOk: async () => {
        try {
          await deleteBranch(fnstBrnchCd);
          toast.success('Deleted.');
          void queryClient.invalidateQueries({ queryKey: ['sys', 'branches', selectedInst] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const instColumns: TableColumnsType<InstitutionItem> = [
    { title: 'Code', dataIndex: 'fnstCd', width: 100, align: 'center' },
    {
      title: 'Institution Name',
      dataIndex: 'fnstNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={(e) => { e.stopPropagation(); setInstModal(row); }}>
          {v}
        </a>
      ),
    },
    { title: 'Abbr', dataIndex: 'fnstAbbrNm', width: 90, align: 'center', render: (v?: string) => v || '-' },
    { title: 'Use', dataIndex: 'useYn', width: 65, align: 'center', render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span> },
    {
      title: 'Action',
      key: 'act',
      width: 65,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={styles.btnDanger} style={{ height: 24, padding: '0 8px', fontSize: 11 }} disabled={!canWrite} onClick={(e) => { e.stopPropagation(); handleDeleteInst(row.fnstCd); }}>
          Del
        </button>
      ),
    },
  ];

  const branchColumns: TableColumnsType<BranchItem> = [
    { title: 'Code', dataIndex: 'fnstBrnchCd', width: 110, align: 'center' },
    {
      title: 'Branch Name',
      dataIndex: 'fnstBrnchNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={() => setBranchModal(row)}>
          {v}
        </a>
      ),
    },
    { title: 'Use', dataIndex: 'useYn', width: 65, align: 'center', render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span> },
    {
      title: 'Action',
      key: 'act',
      width: 65,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={styles.btnDanger} style={{ height: 24, padding: '0 8px', fontSize: 11 }} disabled={!canWrite} onClick={() => handleDeleteBranch(row.fnstBrnchCd)}>
          Del
        </button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'Code Management', 'Finance Code Management']}
        title="Finance Code Management"
        onReset={handleReset}
        onSearch={handleSearch}
      />

      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Usage Status</span>
          <UseYnChecks yes={used} no={unused} onChange={(y, n) => { setUsed(y); setUnused(n); }} allLabel="All" yesLabel="Used" noLabel="Unused" />
        </div>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Keyword</span>
          <Input className={styles.filterInput} placeholder="Institution code or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Institutions ({total})</span>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadInstitutionsExcel(applied)}>Excel</button>
              <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => setInstModal(null)}>Add Institution</button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <Table<InstitutionItem>
              rowKey="fnstCd"
              columns={instColumns}
              dataSource={institutions}
              loading={instLoading}
              pagination={false}
              size="small"
              rowClassName={(r) => (r.fnstCd === selectedInst ? styles.rowSelected : '')}
              onRow={(r) => ({ onClick: () => setSelectedInst(r.fnstCd) })}
            />
          </div>
          <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>

        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Branches {selectedInst ? `(${selectedInst})` : ''}</span>
            <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite || !selectedInst} onClick={() => setBranchModal(null)}>Add Branch</button>
          </div>
          <div className={styles.tableWrapper}>
            <Table<BranchItem>
              rowKey="fnstBrnchCd"
              columns={branchColumns}
              dataSource={branches}
              loading={branchLoading}
              pagination={false}
              size="small"
            />
          </div>
        </div>
      </div>

      {instModal !== undefined && (
        <InstModal item={instModal} canWrite={canWrite} onClose={() => setInstModal(undefined)} onSaved={() => void queryClient.invalidateQueries({ queryKey: ['sys', 'institutions'] })} />
      )}
      {branchModal !== undefined && selectedInst && (
        <BranchModal fnstCd={selectedInst} item={branchModal} canWrite={canWrite} onClose={() => setBranchModal(undefined)} onSaved={() => void queryClient.invalidateQueries({ queryKey: ['sys', 'branches', selectedInst] })} />
      )}
    </div>
  );
}

function InstModal({ item, canWrite, onClose, onSaved }: { item: InstitutionItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [fnstCd, setFnstCd] = useState(item?.fnstCd ?? '');
  const [fnstNm, setFnstNm] = useState(item?.fnstNm ?? '');
  const [fnstAbbrNm, setFnstAbbrNm] = useState(item?.fnstAbbrNm ?? '');
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const handleSave = async () => {
    if (!fnstCd.trim() || !fnstNm.trim()) { toast.warning('Enter institution code and name.'); return; }
    try {
      if (isCreate) await createInstitution({ fnstCd: fnstCd.trim(), fnstNm: fnstNm.trim(), fnstAbbrNm: fnstAbbrNm.trim() || undefined, useYn });
      else await updateInstitution(item.fnstCd, { fnstNm: fnstNm.trim(), fnstAbbrNm: fnstAbbrNm.trim() || undefined, useYn });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register Institution' : 'Edit Institution'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Code" required span="full"><Input value={fnstCd} disabled={!isCreate} onChange={(e) => setFnstCd(e.target.value)} /></FormField>
        <FormField label="Name" required span="full"><Input value={fnstNm} onChange={(e) => setFnstNm(e.target.value)} /></FormField>
        <FormField label="Abbr Name" span="full"><Input value={fnstAbbrNm} onChange={(e) => setFnstAbbrNm(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}

function BranchModal({ fnstCd, item, canWrite, onClose, onSaved }: { fnstCd: string; item: BranchItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [fnstBrnchCd, setFnstBrnchCd] = useState(item?.fnstBrnchCd ?? '');
  const [fnstBrnchNm, setFnstBrnchNm] = useState(item?.fnstBrnchNm ?? '');
  const [fnstBrnchAddr, setFnstBrnchAddr] = useState(item?.fnstBrnchAddr ?? '');
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const handleSave = async () => {
    if (!fnstBrnchCd.trim() || !fnstBrnchNm.trim()) { toast.warning('Enter branch code and name.'); return; }
    try {
      if (isCreate) await createBranch({ fnstBrnchCd: fnstBrnchCd.trim(), fnstCd, fnstBrnchNm: fnstBrnchNm.trim(), fnstBrnchAddr: fnstBrnchAddr.trim() || undefined, useYn });
      else await updateBranch(item.fnstBrnchCd, { fnstCd, fnstBrnchNm: fnstBrnchNm.trim(), fnstBrnchAddr: fnstBrnchAddr.trim() || undefined, useYn });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register Branch' : 'Edit Branch'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Branch Code" required span="full"><Input value={fnstBrnchCd} disabled={!isCreate} onChange={(e) => setFnstBrnchCd(e.target.value)} /></FormField>
        <FormField label="Branch Name" required span="full"><Input value={fnstBrnchNm} onChange={(e) => setFnstBrnchNm(e.target.value)} /></FormField>
        <FormField label="Address" span="full"><Input value={fnstBrnchAddr} onChange={(e) => setFnstBrnchAddr(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}
