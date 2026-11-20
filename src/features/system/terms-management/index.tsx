import { useState, type CSSProperties } from 'react';
import { Input, Modal, Radio, Select, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNotify } from '@/hooks/use-notify';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import type {
  TermsPolicyDetail,
  TermsPolicyItem,
  TermsPolicyRequest,
  TermsPolicySearch,
} from '@/api/system/terms-api';
import { DateTimeCell, FormField, SysPageHeader, SysPagination } from '@/features/system/_shared/system-ui';
import { errorMessage, rowNumber } from '@/features/system/_shared/system-utils';
import styles from '@/features/system/_shared/system-page.module.scss';
import {
  useDeleteTermsPolicies,
  usePublishTermsPolicies,
  useSaveTermsPolicy,
  useTermsPolicies,
  useTermsPolicy,
} from './use-terms-policies';

const PAGE_SIZE = 15;

/** Terms Management (menu A06010700). */
export default function TermsManagement() {
  const { toast, dialog } = useNotify();
  const { canWrite } = useMenuPermission();

  const [type, setType] = useState('');
  const [published, setPublished] = useState<'Y' | 'N' | ''>('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState<TermsPolicySearch>({});
  const [page, setPage] = useState(1);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [modalId, setModalId] = useState<string | null | undefined>(undefined);

  const { data, isFetching } = useTermsPolicies(applied, page, PAGE_SIZE);
  const publishTerms = usePublishTermsPolicies();
  const deleteTerms = useDeleteTermsPolicies();
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  // The list itself is refetched by the write hooks.
  const clearSelection = () => setSelectedKeys([]);

  const handleSearch = () => {
    setApplied({
      type: type || undefined,
      published: published || undefined,
      keyword: keyword.trim() || undefined,
    });
    setPage(1);
  };

  const handleReset = () => {
    setType('');
    setPublished('');
    setKeyword('');
    setApplied({});
    setPage(1);
  };

  const handlePublish = async (pub: 'Y' | 'N') => {
    if (!selectedKeys.length) {
      toast.warning('Select at least one item.');
      return;
    }
    try {
      await publishTerms.mutateAsync({ termsIds: selectedKeys, published: pub });
      toast.success('Updated.');
      clearSelection();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const handleDelete = () => {
    if (!selectedKeys.length) {
      toast.warning('Select at least one item to delete.');
      return;
    }
    dialog.warning({
      okCancel: true,
      content: `Delete ${selectedKeys.length} selected item(s)?`,
      onOk: async () => {
        try {
          await deleteTerms.mutateAsync(selectedKeys);
          toast.success('Deleted.');
          clearSelection();
        } catch (e) {
          toast.error(errorMessage(e));
        }
      },
    });
  };

  const columns: TableColumnsType<TermsPolicyItem> = [
    { title: 'No', key: 'no', width: 60, align: 'center', render: (_v, _r, i) => rowNumber(total, page, PAGE_SIZE, i) },
    { title: 'Type', dataIndex: 'type', width: 130, align: 'center' },
    { title: 'Version', dataIndex: 'version', width: 90, align: 'center' },
    {
      title: 'Title',
      dataIndex: 'title',
      width: 300,
      render: (v: string, row) => (
        <a className={styles.cellLink} onClick={() => setModalId(row.termsId)}>
          {v}
        </a>
      ),
    },
    { title: 'Effective Date', dataIndex: 'effectiveDate', width: 120, align: 'center', render: (v?: string) => v || '-' },
    {
      title: 'Published',
      dataIndex: 'published',
      width: 100,
      align: 'center',
      render: (v: string) => <span className={v === 'Y' ? styles.useY : styles.useN}>{v === 'Y' ? 'Used' : 'Unused'}</span>,
    },
    { title: 'Registration Date', dataIndex: 'crtDt', width: 130, align: 'center', render: (v?: string) => <DateTimeCell value={v} /> },
  ];

  return (
    <div className={styles.container}>
      <SysPageHeader
        breadcrumb={['System Operation Management', 'NPL Platform Management', 'Terms Management']}
        title="Terms Management"
        onReset={handleReset}
        onSearch={handleSearch}
        filterCollapsed={filterCollapsed}
        onToggleFilter={() => setFilterCollapsed((v) => !v)}
      />

      {!filterCollapsed && (
        <div className={styles.filterCard}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            <Select
              className={styles.w180}
              value={type}
              onChange={setType}
              options={[
                { value: '', label: 'All' },
                { value: 'TERMS_OF_USE', label: 'Terms of Use' },
                { value: 'PRIVACY_POLICY', label: 'Privacy Policy' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Published</span>
            <Select
              className={styles.w140}
              value={published}
              onChange={(v) => setPublished(v as 'Y' | 'N' | '')}
              options={[
                { value: '', label: 'All' },
                { value: 'Y', label: 'Published' },
                { value: 'N', label: 'Unpublished' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Keyword</span>
            <Input
              className={styles.filterInput}
              placeholder="Title or version"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>
      )}

      <div className={styles.summaryRow}>
        <span className={styles.totalCount}>Total ({total})</span>
      </div>

      <div className={styles.tableWrapper}>
        <Table<TermsPolicyItem>
          rowKey="termsId"
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
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={() => handlePublish('Y')}>Publish</button>
        <button type="button" className={styles.btn} disabled={!canWrite} onClick={() => handlePublish('N')}>Unpublish</button>
        <button type="button" className={styles.btnDanger} disabled={!canWrite} onClick={handleDelete}>Delete</button>
        <button type="button" className={styles.btnDark} disabled={!canWrite} onClick={() => setModalId(null)}>Add New</button>
      </div>

      {modalId !== undefined && (
        <TermsModal termsId={modalId} canWrite={canWrite} onClose={() => setModalId(undefined)} onSaved={clearSelection} />
      )}
    </div>
  );
}

function TermsModal({
  termsId,
  canWrite,
  onClose,
  onSaved,
}: {
  termsId: string | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isCreate = termsId === null;
  const { toast } = useNotify();
  const { data: detail, isFetching } = useTermsPolicy(termsId);
  const saveTerms = useSaveTermsPolicy();

  const [form, setForm] = useState<TermsPolicyRequest>({
    type: 'TERMS_OF_USE',
    version: '',
    effectiveDate: '',
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    published: 'N',
  });

  // Fill the form when the detail arrives — adjusted during render, not in an effect.
  const [loadedDetail, setLoadedDetail] = useState<TermsPolicyDetail | undefined>(undefined);
  if (detail && detail !== loadedDetail) {
    setLoadedDetail(detail);
    setForm({
      type: detail.type,
      version: detail.version,
      effectiveDate: detail.effectiveDate ?? '',
      title: detail.title,
      titleEn: detail.titleEn ?? '',
      content: detail.content ?? '',
      contentEn: detail.contentEn ?? '',
      published: detail.published,
    });
  }

  const handleSave = async () => {
    if (!form.version.trim() || !form.title.trim()) {
      toast.warning('Enter version and title.');
      return;
    }
    try {
      await saveTerms.mutateAsync({ termsId, request: form });
      toast.success('Saved.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal
      open
      width={860}
      centered
      title={isCreate ? 'Register Terms' : 'Edit Terms'}
      onCancel={onClose}
      footer={
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.btnDark} disabled={!canWrite || saveTerms.isPending} onClick={handleSave}>Confirm</button>
        </div>
      }
    >
      <Spin spinning={isFetching}>
        <div className={styles.formGrid} style={{ '--form-cols': 2 } as CSSProperties}>
          <FormField label="Type" required>
            <Select
              className={styles.wFull}
              value={form.type}
              disabled={!isCreate || !canWrite}
              onChange={(type) => setForm((p) => ({ ...p, type }))}
              options={[
                { value: 'TERMS_OF_USE', label: 'Terms of Use' },
                { value: 'PRIVACY_POLICY', label: 'Privacy Policy' },
              ]}
            />
          </FormField>
          <FormField label="Version" required>
            <Input value={form.version} disabled={!canWrite} placeholder="e.g. 1.0" onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))} />
          </FormField>
          <FormField label="Effective Date">
            <Input value={form.effectiveDate} disabled={!canWrite} placeholder="YYYY-MM-DD" onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))} />
          </FormField>
          <FormField label="Published">
            <Radio.Group value={form.published} disabled={!isCreate || !canWrite} onChange={(e) => setForm((p) => ({ ...p, published: e.target.value }))}>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </FormField>
          <FormField label="Title (VI)" required span="full">
            <Input value={form.title} disabled={!canWrite} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </FormField>
          <FormField label="Title (EN)" span="full">
            <Input value={form.titleEn} disabled={!canWrite} onChange={(e) => setForm((p) => ({ ...p, titleEn: e.target.value }))} />
          </FormField>
          <FormField label="Content (VI)" span="full">
            <Input.TextArea rows={5} value={form.content} disabled={!canWrite} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
          </FormField>
          <FormField label="Content (EN)" span="full">
            <Input.TextArea rows={5} value={form.contentEn} disabled={!canWrite} onChange={(e) => setForm((p) => ({ ...p, contentEn: e.target.value }))} />
          </FormField>
        </div>
      </Spin>
    </Modal>
  );
}
