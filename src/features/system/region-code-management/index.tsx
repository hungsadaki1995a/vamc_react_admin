import { useState, type CSSProperties } from 'react';
import { Input, Modal, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type { DistrictItem, ProvinceItem } from '@/api/system/system-operations-api';
import { FormField, SysPageHeader, SysPagination, UseYnChecks } from '@/features/system/_shared/system-ui';
import { errorMessage, toUseYnFilter } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import {
  useDeleteDistrict,
  useDeleteProvince,
  useDistricts,
  useDownloadProvincesExcel,
  useProvinces,
  useSaveDistrict,
  useSaveProvince,
} from './use-regions';
import type { ProvinceSearch } from './use-regions';

const PAGE_SIZE = 15;

/** Region Code Management (menu A06030200). */
export default function RegionCodeManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [used, setUsed] = useState(true);
  const [unused, setUnused] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<ProvinceSearch>({});
  const [page, setPage] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [provinceModal, setProvinceModal] = useState<ProvinceItem | null | undefined>(undefined);
  const [districtModal, setDistrictModal] = useState<DistrictItem | null | undefined>(undefined);

  const { data: provData, isFetching: provLoading } = useProvinces(applied, page, PAGE_SIZE);
  const provinces = provData?.content ?? [];
  const total = provData?.totalElements ?? 0;

  const { data: distData, isFetching: distLoading } = useDistricts(selectedProvince);
  const districts = distData ?? [];

  const deleteProvince = useDeleteProvince();
  const deleteDistrict = useDeleteDistrict();
  const downloadExcel = useDownloadProvincesExcel();

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
          await deleteProvince.mutateAsync(mctpvCd);
          toast.success('Deleted.');
          if (selectedProvince === mctpvCd) setSelectedProvince(null);
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
          await deleteDistrict.mutateAsync(distCd);
          toast.success('Deleted.');
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
        <button type="button" className={`${styles.btnDanger} ${styles.btnTiny}`} disabled={!canWrite} onClick={(e) => { e.stopPropagation(); handleDeleteProvince(row.mctpvCd); }}>
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
        <button type="button" className={`${styles.btnDanger} ${styles.btnTiny}`} disabled={!canWrite} onClick={() => handleDeleteDistrict(row.distCd)}>
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

      <div className={styles.twoPane}>
        <div className={styles.card}>
          <div className={styles.summaryRow}>
            <span className={styles.cardTitle}>Provinces ({total})</span>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => downloadExcel.mutate(applied)}>Excel</button>
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
        <ProvinceModal item={provinceModal} canWrite={canWrite} onClose={() => setProvinceModal(undefined)} />
      )}
      {districtModal !== undefined && selectedProvince && (
        <DistrictModal mctpvCd={selectedProvince} item={districtModal} canWrite={canWrite} onClose={() => setDistrictModal(undefined)} />
      )}
    </div>
  );
}

function ProvinceModal({ item, canWrite, onClose }: { item: ProvinceItem | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [mctpvCd, setMctpvCd] = useState(item?.mctpvCd ?? '');
  const [mctpvNm, setMctpvNm] = useState(item?.mctpvNm ?? '');
  const [sortSeq, setSortSeq] = useState(String(item?.sortSeq ?? 1));
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');
  const saveProvince = useSaveProvince();

  const handleSave = async () => {
    if (!mctpvCd.trim() || !mctpvNm.trim()) { toast.warning('Enter province code and name.'); return; }
    try {
      await saveProvince.mutateAsync(
        isCreate
          ? { mctpvCd: null, request: { mctpvCd: mctpvCd.trim(), mctpvNm: mctpvNm.trim(), sortSeq: Number(sortSeq) || 1, useYn } }
          : { mctpvCd: item.mctpvCd, request: { mctpvNm: mctpvNm.trim(), sortSeq: Number(sortSeq) || 1, useYn } },
      );
      toast.success('Saved.');
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
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="Province Code" required span="full"><Input value={mctpvCd} disabled={!isCreate} onChange={(e) => setMctpvCd(e.target.value)} /></FormField>
        <FormField label="Province Name" required span="full"><Input value={mctpvNm} onChange={(e) => setMctpvNm(e.target.value)} /></FormField>
        <FormField label="Order" span="full"><Input value={sortSeq} onChange={(e) => setSortSeq(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}

function DistrictModal({ mctpvCd, item, canWrite, onClose }: { mctpvCd: string; item: DistrictItem | null; canWrite: boolean; onClose: () => void }) {
  const isCreate = item === null;
  const { toast } = useNotify();
  const [distCd, setDistCd] = useState(item?.distCd ?? '');
  const [distNm, setDistNm] = useState(item?.distNm ?? '');
  const [sortSeq, setSortSeq] = useState(String(item?.sortSeq ?? 1));
  const [useYn, setUseYn] = useState<'Y' | 'N'>(item?.useYn ?? 'Y');
  const saveDistrict = useSaveDistrict();

  const handleSave = async () => {
    if (!distCd.trim() || !distNm.trim()) { toast.warning('Enter district code and name.'); return; }
    try {
      await saveDistrict.mutateAsync(
        isCreate
          ? { distCd: null, request: { distCd: distCd.trim(), mctpvCd, distNm: distNm.trim(), sortSeq: Number(sortSeq) || 1, useYn } }
          : { distCd: item.distCd, request: { mctpvCd, distNm: distNm.trim(), sortSeq: Number(sortSeq) || 1, useYn } },
      );
      toast.success('Saved.');
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
      <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
        <FormField label="District Code" required span="full"><Input value={distCd} disabled={!isCreate} onChange={(e) => setDistCd(e.target.value)} /></FormField>
        <FormField label="District Name" required span="full"><Input value={distNm} onChange={(e) => setDistNm(e.target.value)} /></FormField>
        <FormField label="Order" span="full"><Input value={sortSeq} onChange={(e) => setSortSeq(e.target.value)} /></FormField>
        <FormField label="Use" span="full"><Radio.Group value={useYn} onChange={(e) => setUseYn(e.target.value)}><Radio value="Y">Y</Radio><Radio value="N">N</Radio></Radio.Group></FormField>
      </div>
    </Modal>
  );
}
