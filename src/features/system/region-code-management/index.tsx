import { useState } from 'react';
import { Input, Modal, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import {
  createDistrict,
  createProvince,
  deleteDistrict,
  deleteProvince,
  downloadProvincesExcel,
  getDistrictsByProvince,
  getProvinces,
  updateDistrict,
  updateProvince,
  type DistrictItem,
  type ProvinceItem,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';
import { FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/SystemUi';
import { errorMessage, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.css';

const PAGE_SIZE = 15;

/** Region Code Management (menu A06030200). */
export default function RegionCodeManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();
  const queryClient = useQueryClient();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<{ useYn?: 'Y' | 'N'; keyword?: string }>({});
  const [page, setPage] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [provinceModal, setProvinceModal] = useState<ProvinceItem | null | undefined>(undefined);
  const [districtModal, setDistrictModal] = useState<DistrictItem | null | undefined>(undefined);

  const { data: provData, isFetching: provLoading } = useApiQuery<PageResponse<ProvinceItem>>(
    ['sys', 'provinces', applied, page],
    () => getProvinces(applied, page, PAGE_SIZE),
    { placeholderData: keepPreviousData },
  );
  const provinces = provData?.content ?? [];
  const total = provData?.totalElements ?? 0;

  const { data: distData, isFetching: distLoading } = useApiQuery<DistrictItem[]>(
    ['sys', 'districts', selectedProvince],
    () => getDistrictsByProvince(selectedProvince as string),
    { enabled: !!selectedProvince },
  );
  const districts = distData ?? [];

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

  const handleDeleteProvince = (mctpvCd: string) => {
    dialog.warning({
      okCancel: true,
      content: `Delete province ${mctpvCd}?`,
      onOk: async () => {
        try {
          await deleteProvince(mctpvCd);
          toast.success('Deleted.');
          if (selectedProvince === mctpvCd) setSelectedProvince(null);
          void queryClient.invalidateQueries({ queryKey: ['sys', 'provinces'] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const handleDeleteDistrict = (distCd: string) => {
    dialog.warning({
      okCancel: true,
      content: `Delete district ${distCd}?`,
      onOk: async () => {
        try {
          await deleteDistrict(distCd);
          toast.success('Deleted.');
          void queryClient.invalidateQueries({ queryKey: ['sys', 'districts', selectedProvince] });
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const provColumns: TableColumnsType<ProvinceItem> = [
    { title: 'Code', dataIndex: 'mctpvCd', width: 100, align: 'center' },
    {
      title: 'Province Name',
      dataIndex: 'mctpvNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={(e) => { e.stopPropagation(); setProvinceModal(row); }}>
          {v}
        </a>
      ),
    },
    { title: 'Use', dataIndex: 'useYn', width: 70, align: 'center', render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span> },
    {
      title: 'Action',
      key: 'act',
      width: 70,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={`${styles.btnDanger} h-6! px-2! text-[11px]!`} disabled={!canWrite} onClick={(e) => { e.stopPropagation(); handleDeleteProvince(row.mctpvCd); }}>
          Del
        </button>
      ),
    },
  ];

  const distColumns: TableColumnsType<DistrictItem> = [
    { title: 'Code', dataIndex: 'distCd', width: 100, align: 'center' },
    {
      title: 'District Name',
      dataIndex: 'distNm',
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={() => setDistrictModal(row)}>
          {v}
        </a>
      ),
    },
    { title: 'Use', dataIndex: 'useYn', width: 70, align: 'center', render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v}</span> },
    {
      title: 'Action',
      key: 'act',
      width: 70,
      align: 'center',
      render: (_v, row) => (
        <button type="button" className={`${styles.btnDanger} h-6! px-2! text-[11px]!`} disabled={!canWrite} onClick={() => handleDeleteDistrict(row.distCd)}>
          Del
        </button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'Code Management', 'Region Code Management']}
        title="Region Code Management"
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
          <Input className={styles.filterInput} placeholder="Province code or name" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} allowClear />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Provinces ({total})</span>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => void downloadProvincesExcel(applied)}>Excel</button>
              <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite} onClick={() => setProvinceModal(null)}>Add Province</button>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <Table<ProvinceItem>
              rowKey="mctpvCd"
              columns={provColumns}
              dataSource={provinces}
              loading={provLoading}
              pagination={false}
              size="small"
              rowClassName={(r) => (r.mctpvCd === selectedProvince ? styles.rowSelected : '')}
              onRow={(r) => ({ onClick: () => setSelectedProvince(r.mctpvCd) })}
            />
          </div>
          <SysPagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>

        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Districts {selectedProvince ? `(${selectedProvince})` : ''}</span>
            <button type="button" className={`${styles.btnDark} ${styles.btnSmall}`} disabled={!canWrite || !selectedProvince} onClick={() => setDistrictModal(null)}>Add District</button>
          </div>
          <div className={styles.tableWrapper}>
            <Table<DistrictItem>
              rowKey="distCd"
              columns={distColumns}
              dataSource={districts}
              loading={distLoading}
              pagination={false}
              size="small"
            />
          </div>
        </div>
      </div>

      {provinceModal !== undefined && (
        <ProvinceModal item={provinceModal} canWrite={canWrite} onClose={() => setProvinceModal(undefined)} onSaved={() => void queryClient.invalidateQueries({ queryKey: ['sys', 'provinces'] })} />
      )}
      {districtModal !== undefined && selectedProvince && (
        <DistrictModal mctpvCd={selectedProvince} item={districtModal} canWrite={canWrite} onClose={() => setDistrictModal(undefined)} onSaved={() => void queryClient.invalidateQueries({ queryKey: ['sys', 'districts', selectedProvince] })} />
      )}
    </div>
  );
}

function ProvinceModal({ item, canWrite, onClose, onSaved }: { item: ProvinceItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [mctpvCd, setMctpvCd] = useState(item?.mctpvCd ?? '');
  const [mctpvNm, setMctpvNm] = useState(item?.mctpvNm ?? '');
  const [sortSeq, setSortSeq] = useState(String(item?.sortSeq ?? 1));
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const handleSave = async () => {
    if (!mctpvCd.trim() || !mctpvNm.trim()) { toast.warning('Enter province code and name.'); return; }
    try {
      if (isCreate) await createProvince({ mctpvCd: mctpvCd.trim(), mctpvNm: mctpvNm.trim(), sortSeq: Number(sortSeq) || 1, useYn });
      else await updateProvince(item.mctpvCd, { mctpvNm: mctpvNm.trim(), sortSeq: Number(sortSeq) || 1, useYn });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register Province' : 'Edit Province'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={`${styles.formGrid} [--form-cols:2]`}>
        <FormField label="Province Code" required span="full"><Input value={mctpvCd} disabled={!isCreate} onChange={(e) => setMctpvCd(e.target.value)} /></FormField>
        <FormField label="Province Name" required span="full"><Input value={mctpvNm} onChange={(e) => setMctpvNm(e.target.value)} /></FormField>
        <FormField label="Order" span="full"><Input value={sortSeq} onChange={(e) => setSortSeq(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}

function DistrictModal({ mctpvCd, item, canWrite, onClose, onSaved }: { mctpvCd: string; item: DistrictItem | null; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [distCd, setDistCd] = useState(item?.distCd ?? '');
  const [distNm, setDistNm] = useState(item?.distNm ?? '');
  const [sortSeq, setSortSeq] = useState(String(item?.sortSeq ?? 1));
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');

  const handleSave = async () => {
    if (!distCd.trim() || !distNm.trim()) { toast.warning('Enter district code and name.'); return; }
    try {
      if (isCreate) await createDistrict({ distCd: distCd.trim(), mctpvCd, distNm: distNm.trim(), sortSeq: Number(sortSeq) || 1, useYn });
      else await updateDistrict(item.distCd, { mctpvCd, distNm: distNm.trim(), sortSeq: Number(sortSeq) || 1, useYn });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal open centered title={isCreate ? 'Register District' : 'Edit District'} onCancel={onClose} footer={
      <div className={styles.modalFooter}>
        <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={handleSave}>Confirm</button>
      </div>
    }>
      <div className={`${styles.formGrid} [--form-cols:2]`}>
        <FormField label="District Code" required span="full"><Input value={distCd} disabled={!isCreate} onChange={(e) => setDistCd(e.target.value)} /></FormField>
        <FormField label="District Name" required span="full"><Input value={distNm} onChange={(e) => setDistNm(e.target.value)} /></FormField>
        <FormField label="Order" span="full"><Input value={sortSeq} onChange={(e) => setSortSeq(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}
