import { useState, type CSSProperties } from 'react';
import { Input, Modal, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { CodeGroupItem, CommonCodeItem } from '@/api/system/system-operations-api';
import { FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/system-ui';
import { errorMessage, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import {
  useBatchSaveCodes,
  useCodeGroups,
  useCodes,
  useCreateCodeGroup,
  useDeleteCodeGroup,
  useDownloadCodeGroupsExcel,
  useUpdateCodeGroup,
} from './use-common-codes';
import type { CodeGroupSearch } from './use-common-codes';

const PAGE_SIZE = 15;

/** Common Code Management (menu A06030100). */
export default function CommonCodeManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<CodeGroupSearch>({});
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<CodeGroupItem | null | undefined>(undefined);
  const [codeModal, setCodeModal] = useState<CommonCodeItem | null | undefined>(undefined);

  const { data: groupsData, isFetching: groupsLoading } = useCodeGroups(applied, page, PAGE_SIZE);
  const groups = groupsData?.content ?? [];
  const total = groupsData?.totalElements ?? 0;

  const { data: codesData, isFetching: codesLoading } = useCodes(selectedGroup);
  const codes = codesData ?? [];

  const deleteGroup = useDeleteCodeGroup();
  const saveCodes = useBatchSaveCodes();
  const downloadExcel = useDownloadCodeGroupsExcel();

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

  const handleDeleteGroup = (groupCd: string) => {
    dialog.warning({
      okCancel: true,
      content: `Delete code group ${groupCd}?`,
      onOk: async () => {
        try {
          await deleteGroup.mutateAsync(groupCd);
          toast.success('Deleted.');
          if (selectedGroup === groupCd) setSelectedGroup(null);
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const handleDeleteCode = (cd: string) => {
    if (!selectedGroup) return;
    dialog.warning({
      okCancel: true,
      content: `Delete code ${cd}?`,
      onOk: async () => {
        try {
          await saveCodes.mutateAsync({ groupCd: selectedGroup, toSave: [], deleteCds: [cd] });
          toast.success('Deleted.');
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const groupColumns: TableColumnsType<CodeGroupItem> = [
    { title: 'Group Code', dataIndex: 'groupCd', width: 150 },
    {
      title: 'Group Name',
      dataIndex: 'groupNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={(e) => { e.stopPropagation(); setGroupModal(row); }}>
          {v}
        </a>
      ),
    },
    {
      title: 'Use',
      dataIndex: 'useYn',
      width: 80,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span>,
    },
    {
      title: 'Action',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={`${styles.btnDanger} ${styles.btnTiny}`} disabled={!canWrite} onClick={(e) => { e.stopPropagation(); handleDeleteGroup(row.groupCd); }}>
          Del
        </button>
      ),
    },
  ];

  const codeColumns: TableColumnsType<CommonCodeItem> = [
    { title: 'Seq', dataIndex: 'sortSeq', width: 60, align: 'center' },
    { title: 'Code', dataIndex: 'cd', width: 120 },
    {
      title: 'Code Name',
      dataIndex: 'cdNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={() => setCodeModal(row)}>
          {v}
        </a>
      ),
    },
    {
      title: 'Use',
      dataIndex: 'useYn',
      width: 70,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span>,
    },
    {
      title: 'Action',
      key: 'act',
      width: 80,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={`${styles.btnDanger} ${styles.btnTiny}`} disabled={!canWrite} onClick={() => handleDeleteCode(row.cd)}>
          Del
        </button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'Code Management', 'Common Code Management']}
        title="Common Code Management"
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
          <Input className={styles.filterInput} placeholder="Group code or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
        </div>
      </div>

      <div className={styles.twoPane}>
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Code Groups ({total})</span>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => downloadExcel.mutate(applied)}>Excel</button>
              <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => setGroupModal(null)}>Add Group</button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <Table<CodeGroupItem>
              rowKey="groupCd"
              columns={groupColumns}
              dataSource={groups}
              loading={groupsLoading}
              pagination={false}
              size="small"
              rowClassName={(r) => (r.groupCd === selectedGroup ? styles.rowSelected : '')}
              onRow={(r) => ({ onClick: () => setSelectedGroup(r.groupCd) })}
            />
          </div>
          <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>

        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Codes {selectedGroup ? `(${selectedGroup})` : ''}</span>
            <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite || !selectedGroup} onClick={() => setCodeModal(null)}>Add Code</button>
          </div>
          <div className={styles.tableWrapper}>
            <Table<CommonCodeItem>
              rowKey="cd"
              columns={codeColumns}
              dataSource={codes}
              loading={codesLoading}
              pagination={false}
              size="small"
            />
          </div>
        </div>
      </div>

      {groupModal !== undefined && (
        <GroupModal item={groupModal} canWrite={canWrite} onClose={() => setGroupModal(undefined)} />
      )}
      {codeModal !== undefined && selectedGroup && (
        <CodeModal
          groupCd={selectedGroup}
          item={codeModal}
          canWrite={canWrite}
          onClose={() => setCodeModal(undefined)}
        />
      )}
    </div>
  );
}

function GroupModal({ item, canWrite, onClose }: { item: CodeGroupItem | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [groupCd, setGroupCd] = useState(item?.groupCd ?? '');
  const [groupNm, setGroupNm] = useState(item?.groupNm ?? '');
  const [groupExpln, setGroupExpln] = useState(item?.groupExpln ?? '');
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');
  const createGroup = useCreateCodeGroup();
  const updateGroup = useUpdateCodeGroup();

  const handleSave = async () => {
    if (!groupCd.trim() || !groupNm.trim()) { toast.warning('Enter group code and name.'); return; }
    try {
      if (isCreate) {
        await createGroup.mutateAsync({ groupCd: groupCd.trim(), groupNm: groupNm.trim(), groupExpln: groupExpln.trim() || undefined });
      } else {
        await updateGroup.mutateAsync({
          groupCd: item.groupCd,
          request: { groupNm: groupNm.trim(), groupExpln: groupExpln.trim() || undefined, useYn },
        });
      }
      toast.success('Saved.');
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register Code Group' : 'Edit Code Group'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Group Code" required span="full"><Input value={groupCd} disabled={!isCreate} onChange={(e) => setGroupCd(e.target.value)} /></FormField>
        <FormField label="Group Name" required span="full"><Input value={groupNm} onChange={(e) => setGroupNm(e.target.value)} /></FormField>
        <FormField label="Description" span="full"><Input.TextArea rows={2} value={groupExpln} onChange={(e) => setGroupExpln(e.target.value)} /></FormField>
        {!isCreate && (
          <FormField label="Use" span="full">
            <Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group>
          </FormField>
        )}
      </div>
    </Modal>
  );
}

function CodeModal({ groupCd, item, canWrite, onClose }: { groupCd: string; item: CommonCodeItem | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [cd, setCd] = useState(item?.cd ?? '');
  const [cdNm, setCdNm] = useState(item?.cdNm ?? '');
  const [cdExpln, setCdExpln] = useState(item?.cdExpln ?? '');
  const [sortSeq, setSortSeq] = useState(String(item?.sortSeq ?? 1));
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');
  const saveCodes = useBatchSaveCodes();

  const handleSave = async () => {
    if (!cd.trim() || !cdNm.trim()) { toast.warning('Enter code and name.'); return; }
    try {
      await saveCodes.mutateAsync({
        groupCd,
        toSave: [{ cd: cd.trim(), cdNm: cdNm.trim(), cdExpln: cdExpln.trim() || undefined, sortSeq: Number(sortSeq) || 1, useYn }],
        deleteCds: [],
      });
      toast.success('Saved.');
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register Code' : 'Edit Code'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Code" required span="full"><Input value={cd} disabled={!isCreate} onChange={(e) => setCd(e.target.value)} /></FormField>
        <FormField label="Code Name" required span="full"><Input value={cdNm} onChange={(e) => setCdNm(e.target.value)} /></FormField>
        <FormField label="Order" span="full"><Input value={sortSeq} onChange={(e) => setSortSeq(e.target.value)} /></FormField>
        <FormField label="Description" span="full"><Input.TextArea rows={2} value={cdExpln} onChange={(e) => setCdExpln(e.target.value)} /></FormField>
        <FormField label="Use" span="full">
          <Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group>
        </FormField>
      </div>
    </Modal>
  );
}
