import { useState } from 'react';
import { Input, Radio, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { FormField, UseFlag } from '../_shared/SystemUi';
import styles from '../_shared/system-page.module.css';

// One column of User Group Management (VPA004601): a list of { id, name, use }
// rows with its own New/Edit form. Used for both "User Group" and "Group Role".

export interface CodeNameItem {
  id: string;
  name: string;
  useYn: 'Y' | 'N';
}

export interface CodeNameCardLabels {
  title: string;
  formTitle: string;
  id: string;
  name: string;
  use: string;
  idPlaceholder: string;
  namePlaceholder: string;
  reset: string;
  delete: string;
  save: string;
  /** Shown instead of the list while the parent selection is missing. */
  emptyHint?: string;
}

interface CodeNameCardProps {
  labels: CodeNameCardLabels;
  items: CodeNameItem[];
  loading?: boolean;
  /** Parent not selected yet → list and form are disabled. */
  disabled?: boolean;
  canWrite: boolean;
  idMaxLength: number;
  selectedId: string | null;
  onSelect: (item: CodeNameItem | null) => void;
  /** Resolves true when the save succeeded (the form is then cleared). */
  onSave: (item: CodeNameItem, isEdit: boolean) => Promise<boolean>;
  onDelete: (item: CodeNameItem) => void;
}

const EMPTY: CodeNameItem = { id: '', name: '', useYn: 'N' };

export default function CodeNameCard({
  labels,
  items,
  loading,
  disabled = false,
  canWrite,
  idMaxLength,
  selectedId,
  onSelect,
  onSave,
  onDelete,
}: CodeNameCardProps) {
  const [form, setForm] = useState<CodeNameItem>(EMPTY);
  const [saving, setSaving] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const isEdit = selected !== null;
  const locked = disabled || !canWrite;

  // Keep the form in step with the selection without an effect.
  const [syncedId, setSyncedId] = useState<string | null>(null);
  if (syncedId !== selectedId) {
    setSyncedId(selectedId);
    setForm(selected ?? EMPTY);
  }

  const handleReset = () => {
    onSelect(null);
    setForm(EMPTY);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await onSave({ ...form, id: form.id.trim(), name: form.name.trim() }, isEdit);
      if (ok && !isEdit) setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<CodeNameItem> = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      align: 'center',
      render: (_v, _row, index) => items.length - index,
    },
    { title: labels.id, dataIndex: 'id', width: 90, align: 'center' },
    { title: labels.name, dataIndex: 'name', align: 'center' },
    {
      title: labels.use,
      dataIndex: 'useYn',
      width: 60,
      align: 'center',
      render: (value: string) => <UseFlag value={value} />,
    },
  ];

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{labels.title}</h2>
      <span className={styles.totalCount}>Total ({items.length})</span>

      <div className={styles.cardBody}>
        <div className={`${styles.tableWrapper} ${styles.rowClickable}`}>
          <Table<CodeNameItem>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ y: 260 }}
            locale={{ emptyText: ' ' }}
            rowClassName={(row) => (row.id === selectedId ? 'rowSelected' : '')}
            onRow={(row) => ({ onClick: () => onSelect(row) })}
          />
        </div>
        {disabled && labels.emptyHint && <div className={styles.cardEmpty}>{labels.emptyHint}</div>}
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formPanelHeader}>
          <span className={styles.formPanelTitle}>{labels.formTitle}</span>
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled={disabled} onClick={handleReset}>
            {labels.reset}
          </button>
        </div>
        <div className={`${styles.formGrid} [--form-cols:1]`}>
          <FormField label={labels.id} required>
            <Input
              placeholder={labels.idPlaceholder}
              value={form.id}
              maxLength={idMaxLength}
              disabled={locked || isEdit}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toUpperCase() }))}
            />
          </FormField>
          <FormField label={labels.name} required>
            <Input
              placeholder={labels.namePlaceholder}
              value={form.name}
              maxLength={100}
              disabled={locked}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label={labels.use}>
            <Radio.Group
              value={form.useYn}
              disabled={locked}
              onChange={(e) => setForm((f) => ({ ...f, useYn: e.target.value as 'Y' | 'N' }))}
              options={[
                { value: 'Y', label: 'Y' },
                { value: 'N', label: 'N' },
              ]}
            />
          </FormField>
        </div>
        <div className={`${styles.bottomActions} mt-2.5!`}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSmall}`}
            disabled={locked || !selected}
            onClick={() => selected && onDelete(selected)}
          >
            {labels.delete}
          </button>
          <button
            type="button"
            className={`${styles.btnDark} ${styles.btnSmall}`}
            disabled={locked || saving}
            onClick={handleSave}
          >
            {labels.save}
          </button>
        </div>
      </div>
    </section>
  );
}
