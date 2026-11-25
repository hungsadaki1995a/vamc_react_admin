import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, Key, ReactNode } from 'react';
import type { TableColumnsType } from 'antd';
import AppSelect from '@/components/inputs/AppSelect';
import Spinbox from '@/components/inputs/Spinbox';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { SysButton, SysSectionHeader, SysTable, UseBadge } from '@/components/common/sys-ui/SysListUi';
import type { SortState } from '@/hooks/use-paged-list';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { USE_YN_RADIO_OPTIONS } from '@/config/sys-constants';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import styles from './code-detail-grid.module.scss';

// Editable detail grid of the code screens (Common / Region / Finance):
// [Add Row] adds an empty row, [Delete Row] removes checked rows (C02 when none),
// [Save] sends added + edited rows (isNew flag) and deleted keys in one call.
// The parent remounts it (`key`) when the server rows change, so state starts from props.
// Look (frames VPA09030101 / 0201 / 0301): plain-looking cells in the shared list frame, fixed layout
// with ellipsis, sortable headers. With no master row the empty table frame is shown.

export type GridValue = string | number | null;
export type GridRecord = Record<string, GridValue>;

export interface GridColumn {
  field: string;
  title: string;
  /** `date`: read-only server timestamp (e.g. Registered Date), '-' on added rows. */
  kind: 'text' | 'number' | 'use' | 'select' | 'date';
  required?: boolean;
  /** Key column: locked on saved rows, checked for duplicates. */
  isKey?: boolean;
  width?: number | string;
  /** Shown as text only (e.g. server-generated Label Key); '-' when empty. */
  readOnly?: boolean;
  /** Header sort arrows: reorders the saved rows, added rows stay at the bottom. */
  sortable?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string | number; label: string }[];
}

export interface GridSaveRow {
  values: GridRecord;
  isNew: boolean;
}

export interface GridChanges {
  toSave: GridSaveRow[];
  /** Key values of deleted saved rows. */
  deleted: GridValue[];
}

interface GridRow {
  rowKey: string;
  isNew: boolean;
  values: GridRecord;
}

interface CodeDetailGridProps {
  title: ReactNode;
  /** No master row selected: buttons disabled, empty table frame with `emptyText`. */
  disabled: boolean;
  emptyText: string;
  canWrite: boolean;
  loading?: boolean;
  columns: GridColumn[];
  rows: GridRecord[];
  newRowDefaults: GridRecord;
  saving?: boolean;
  /** Calls the batch API; throw to keep the edits. */
  onSave: (changes: GridChanges) => Promise<void>;
  /** Server answer meaning "code already registered" (E02). */
  isDuplicateError?: (error: unknown) => boolean;
  /** Reports unsaved edits so the parent can guard row changes (C01). */
  onDirtyChange?: (dirty: boolean) => void;
  /** false: columns keep their pixel widths and the frame scrolls sideways (Finance branches). Default true: fit the panel. */
  fitWidth?: boolean;
}

interface GridSort {
  field: string;
  order: 'ascend' | 'descend';
}

type CellErrors = Record<string, Record<string, string>>;

const isBlank = (value: GridValue | undefined) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

const normalizeKey = (value: GridValue | undefined) => String(value ?? '').trim().toUpperCase();

const trimValues = (values: GridRecord): GridRecord =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));

function compareValues(a: GridValue | undefined, b: GridValue | undefined) {
  const blankA = a === null || a === undefined || a === '';
  const blankB = b === null || b === undefined || b === '';
  if (blankA || blankB) return blankA === blankB ? 0 : blankA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function sameValues(a: GridRecord, b: GridRecord, columns: GridColumn[]) {
  return columns.every((c) => (a[c.field] ?? null) === (b[c.field] ?? null));
}

export function CodeDetailGrid({
  title,
  disabled,
  emptyText,
  canWrite,
  loading,
  columns,
  rows,
  newRowDefaults,
  saving,
  onSave,
  isDuplicateError,
  onDirtyChange,
  fitWidth = true,
}: CodeDetailGridProps) {
  const { toast } = useNotify();
  const { alert } = useSysDialogs();
  const keyField = columns.find((c) => c.isKey)?.field ?? columns[0].field;

  const original = useMemo(() => new Map(rows.map((r) => [String(r[keyField]), r])), [rows, keyField]);
  const [gridRows, setGridRows] = useState<GridRow[]>(() =>
    rows.map((values) => ({ rowKey: `s-${String(values[keyField])}`, isNew: false, values })),
  );
  const [deleted, setDeleted] = useState<GridValue[]>([]);
  const [checked, setChecked] = useState<Key[]>([]);
  const [cellErrors, setCellErrors] = useState<CellErrors>({});
  const [gridError, setGridError] = useState<string>();
  const [sort, setSort] = useState<GridSort>();
  const seq = useRef(0);

  const markDirty = () => onDirtyChange?.(true);

  const updateCell = (rowKey: string, field: string, value: GridValue) => {
    setGridRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, values: { ...r.values, [field]: value } } : r)));
    setCellErrors((prev) => {
      if (!prev[rowKey]?.[field]) return prev;
      const rowErrors = { ...prev[rowKey] };
      delete rowErrors[field];
      return { ...prev, [rowKey]: rowErrors };
    });
    markDirty();
  };

  /** Saved rows in server order (sort off) or by the clicked column; added rows keep their place at the bottom. */
  const applySort = (next?: GridSort) => {
    setSort(next);
    setGridRows((prev) => {
      const saved = prev.filter((r) => !r.isNew);
      const added = prev.filter((r) => r.isNew);
      const serverOrder = new Map(rows.map((r, i) => [`s-${String(r[keyField])}`, i]));
      saved.sort((a, b) => {
        if (next) {
          const diff = compareValues(a.values[next.field], b.values[next.field]);
          if (diff !== 0) return next.order === 'ascend' ? diff : -diff;
        }
        return (serverOrder.get(a.rowKey) ?? 0) - (serverOrder.get(b.rowKey) ?? 0);
      });
      return [...saved, ...added];
    });
  };

  const handleAddRow = () => {
    seq.current += 1;
    setGridRows((prev) => [...prev, { rowKey: `n-${seq.current}`, isNew: true, values: { ...newRowDefaults } }]);
    markDirty();
  };

  const handleDeleteRow = () => {
    if (checked.length === 0) {
      alert(SYS_MESSAGES.selectToDelete('codes'));
      return;
    }
    const removed = gridRows.filter((r) => checked.includes(r.rowKey));
    // Key cells of saved rows are locked, so the value is still the stored key.
    setDeleted((prev) => [...prev, ...removed.filter((r) => !r.isNew).map((r) => r.values[keyField])]);
    setGridRows((prev) => prev.filter((r) => !checked.includes(r.rowKey)));
    setChecked([]);
    markDirty();
  };

  /** E01 / E02 checks on the client; false when any cell is marked. */
  const validate = (): boolean => {
    const errors: CellErrors = {};
    const setCell = (rowKey: string, field: string, message: string) => {
      errors[rowKey] = { ...errors[rowKey], [field]: message };
    };
    gridRows.forEach((row) => {
      columns.forEach((c) => {
        if (c.required && isBlank(row.values[c.field])) setCell(row.rowKey, c.field, SYS_MESSAGES.required);
      });
    });
    const hasRequired = Object.keys(errors).length > 0;

    const seen = new Map<string, string>();
    gridRows.forEach((row) => {
      const key = normalizeKey(row.values[keyField]);
      if (!key) return;
      const first = seen.get(key);
      if (first !== undefined) {
        setCell(row.rowKey, keyField, SYS_MESSAGES.duplicate('code'));
        const firstRow = gridRows.find((r) => r.rowKey === first);
        if (firstRow?.isNew) setCell(first, keyField, SYS_MESSAGES.duplicate('code'));
      } else {
        seen.set(key, row.rowKey);
      }
    });

    setCellErrors(errors);
    if (hasRequired) setGridError(SYS_MESSAGES.required);
    else if (Object.keys(errors).length > 0) setGridError(SYS_MESSAGES.duplicate('code'));
    else setGridError(undefined);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const toSave: GridSaveRow[] = gridRows
      .filter((row) => {
        if (row.isNew) return true;
        const source = original.get(String(row.values[keyField]));
        return !source || !sameValues(source, row.values, columns);
      })
      .map((row) => ({ values: trimValues(row.values), isNew: row.isNew }));
    if (toSave.length === 0 && deleted.length === 0) {
      toast.info(SYS_MESSAGES.saved);
      return;
    }
    try {
      await onSave({ toSave, deleted });
      onDirtyChange?.(false);
      toast.success(SYS_MESSAGES.saved);
    } catch (e) {
      if (isDuplicateError?.(e)) {
        // The server does not name the code: mark every added row.
        const errors: CellErrors = {};
        gridRows.filter((r) => r.isNew).forEach((r) => (errors[r.rowKey] = { [keyField]: SYS_MESSAGES.duplicate('code') }));
        setCellErrors(errors);
        setGridError(SYS_MESSAGES.duplicate('code'));
        return;
      }
      toast.error(errorMessage(e));
    }
  };

  const renderEditor = (column: GridColumn, row: GridRow) => {
    const value = row.values[column.field];
    const error = cellErrors[row.rowKey]?.[column.field];
    const status = error ? 'error' : undefined;
    if (column.kind === 'date') return <span className={styles.readonly}>{formatSysDateTime(typeof value === 'string' ? value : null)}</span>;
    if (column.readOnly) return <span className={styles.readonly}>{isBlank(value) ? '-' : value}</span>;
    const readOnly = !canWrite || (column.isKey && !row.isNew);
    if (readOnly) {
      if (column.kind === 'use') return <UseBadge value={value === null ? null : String(value)} />;
      if (column.kind === 'select') return column.options?.find((o) => o.value === value)?.label ?? value ?? '-';
      return <span className={styles.readonly}>{value ?? ''}</span>;
    }
    const cell = (() => {
      switch (column.kind) {
        case 'number':
          return (
            <Spinbox
              size="small"
              className={styles.control}
              status={status}
              min={column.min}
              max={column.max}
              precision={0}
              inputVariant="borderless"
              value={typeof value === 'number' ? value : null}
              onChange={(v) => updateCell(row.rowKey, column.field, typeof v === 'number' ? v : null)}
            />
          );
        case 'use':
          return (
            <AppSelect
              size="small"
              className={styles.control}
              status={status}
              options={USE_YN_RADIO_OPTIONS}
              variant="borderless"
              labelRender={({ value: v }) => <UseBadge value={v as string} />}
              suffixIcon={null}
              value={value ?? undefined}
              onChange={(v) => updateCell(row.rowKey, column.field, (v as GridValue) ?? null)}
            />
          );
        case 'select':
          return (
            <AppSelect
              size="small"
              showSearch
              optionFilterProp="label"
              className={styles.control}
              status={status}
              variant="borderless"
              options={column.options}
              value={value ?? undefined}
              placeholder="Select"
              onChange={(v) => updateCell(row.rowKey, column.field, (v as GridValue) ?? null)}
            />
          );
        default:
          return (
            <TextInput
              variant="grid"
              size="small"
              className={styles.control}
              status={status}
              inputVariant="borderless"
              title={typeof value === 'string' ? value : undefined}
              maxLength={column.maxLength}
              value={value === null || value === undefined ? '' : String(value)}
              onChange={(e) => updateCell(row.rowKey, column.field, e.target.value)}
            />
          );
      }
    })();
    return (
      <div title={error}>
        {cell}
        {error && <div className={styles.cellError}>{error}</div>}
      </div>
    );
  };

  const tableColumns: TableColumnsType<GridRow> = columns.map((column) => ({
    key: column.field,
    title: column.title,
    width: column.width,
    ellipsis: true,
    // SysTable treats `sorter: true` + `key` as a controlled sort (see `sortState`).
    sorter: column.sortable ? true : undefined,
    align: column.kind === 'date' ? 'center' : undefined,
    render: (_v, row) => renderEditor(column, row),
  }));

  const sortState: SortState | undefined = sort && { sortBy: sort.field, sortDirection: sort.order === 'ascend' ? 'ASC' : 'DESC' };

  // Fixed pixel widths + checkbox column: the table's minimum width when it does not fit the panel.
  const minWidth = fitWidth
    ? undefined
    : columns.reduce((sum, c) => sum + (typeof c.width === 'number' ? c.width : 120), canWrite ? 40 : 0);

  const header = (
    <SysSectionHeader
      title={title}
      total={disabled ? undefined : gridRows.length}
      actions={
        canWrite && (
          <>
            <SysButton disabled={disabled} onClick={handleAddRow}>
              Add Row
            </SysButton>
            <SysButton disabled={disabled} onClick={handleDeleteRow}>
              Delete Row
            </SysButton>
          </>
        )
      }
      primaryActions={
        canWrite && (
          <SysButton look="navy" disabled={disabled} loading={saving} onClick={() => void handleSave()}>
            Save
          </SysButton>
        )
      }
    />
  );

  return (
    <>
      {header}
      {gridError && <div className={styles.gridError}>{gridError}</div>}
      <SysTable<GridRow>
        fill
        className={styles.grid}
        style={minWidth ? ({ '--grid-min-width': `${minWidth}px` } as CSSProperties) : undefined}
        rowKey="rowKey"
        columns={tableColumns}
        dataSource={disabled ? [] : gridRows}
        loading={loading}
        tableLayout="fixed"
        locale={{ emptyText: <span className={styles.emptyText}>{disabled ? emptyText : ''}</span> }}
        sort={sortState}
        onSortChange={(next) =>
          applySort(next && { field: next.sortBy, order: next.sortDirection === 'ASC' ? 'ascend' : 'descend' })
        }
        rowClassName={(row) => (row.isNew ? styles.newRow : '')}
        rowSelection={
          canWrite
            ? { selectedRowKeys: checked, onChange: (keys) => setChecked(keys), columnWidth: 40, getCheckboxProps: () => ({ disabled }) }
            : undefined
        }
      />
    </>
  );
}
