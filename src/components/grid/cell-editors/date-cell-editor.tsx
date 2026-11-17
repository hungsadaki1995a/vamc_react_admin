import { useCallback } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { CustomCellEditorProps } from 'ag-grid-react';
import type { ICellRendererParams } from 'ag-grid-community';

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface DateCellEditorProps extends CustomCellEditorProps {
  /** Date format for display and value storage. Defaults to 'YYYY-MM-DD'. */
  format?: string;
}

/**
 * AG Grid in-cell editor — renders Ant Design DatePicker.
 *
 * @example
 * {
 *   field: 'startDt',
 *   headerName: '시작일',
 *   editable: true,
 *   cellRenderer: DateCellRenderer,
 *   cellEditor: DateCellEditor,
 * }
 */
export default function DateCellEditor({
  value,
  onValueChange,
  stopEditing,
  format = 'YYYY-MM-DD',
}: DateCellEditorProps) {
  const handleChange = useCallback(
    (_: unknown, dateString: string | null) => {
      onValueChange(dateString || null);
      stopEditing();
    },
    [onValueChange, stopEditing],
  );

  return (
    <DatePicker
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      format={format}
      autoFocus
      open
      style={{ width: '100%' }}
    />
  );
}

// ── Cell Renderer ─────────────────────────────────────────────────────────────

interface DateCellRendererParams extends ICellRendererParams {
  /** Date format for display. Defaults to 'YYYY-MM-DD'. */
  format?: string;
}

/**
 * AG Grid cell renderer — displays a formatted date string.
 *
 * @example
 * {
 *   field: 'startDt',
 *   headerName: '시작일',
 *   editable: true,
 *   cellRenderer: DateCellRenderer,
 *   cellRendererParams: { format: 'YYYY.MM.DD' },
 *   cellEditor: DateCellEditor,
 * }
 */
export function DateCellRenderer({ value, format = 'YYYY-MM-DD' }: DateCellRendererParams) {
  if (!value) return <span />;
  const d = dayjs(value);
  return <span>{d.isValid() ? d.format(format) : value}</span>;
}
