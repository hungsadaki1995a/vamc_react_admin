import { useRef } from 'react';
import { InputNumber } from 'antd';
import type { CustomCellEditorProps } from 'ag-grid-react';
import type { ICellRendererParams } from 'ag-grid-community';

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface NumberCellEditorProps extends CustomCellEditorProps {
  min?: number;
  max?: number;
  /** Decimal precision (step). e.g. 0.01 for 2 decimal places */
  precision?: number;
  suffix?: string;
}

/**
 * AG Grid in-cell editor — renders Ant Design InputNumber.
 *
 * @example
 * {
 *   field: 'progRate',
 *   headerName: '진척률',
 *   editable: true,
 *   cellRenderer: NumberCellRenderer,
 *   cellRendererParams: { suffix: '%' },
 *   cellEditor: NumberCellEditor,
 *   cellEditorParams: { min: 0, max: 100, precision: 2, suffix: '%' },
 * }
 */
export default function NumberCellEditor({
  value,
  onValueChange,
  stopEditing,
  min,
  max,
  precision = 0,
  suffix,
}: NumberCellEditorProps) {
  const committed = useRef(false);

  const handleChange = (v: number | null) => {
    onValueChange(v);
  };

  const handleBlur = () => {
    if (!committed.current) stopEditing();
  };

  const handlePressEnter = () => {
    committed.current = true;
    stopEditing();
  };

  return (
    <InputNumber
      value={value ?? undefined}
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handlePressEnter}
      min={min}
      max={max}
      precision={precision}
      suffix={suffix}
      controls={false}
      autoFocus
      style={{ width: '100%' }}
    />
  );
}

// ── Cell Renderer ─────────────────────────────────────────────────────────────

interface NumberCellRendererParams extends ICellRendererParams {
  suffix?: string;
  prefix?: string;
  precision?: number;
}

/**
 * AG Grid cell renderer — displays a number with optional suffix/prefix.
 *
 * @example
 * {
 *   field: 'progRate',
 *   cellRenderer: NumberCellRenderer,
 *   cellRendererParams: { suffix: '%', precision: 1 },
 * }
 */
export function NumberCellRenderer({
  value,
  suffix,
  prefix,
  precision,
}: NumberCellRendererParams) {
  if (value === null || value === undefined || value === '') return <span style={{ display: 'block', width: '100%' }} />;
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return <span style={{ display: 'block', width: '100%', textAlign: 'right' }}>{String(value)}</span>;
  const formatted = precision !== undefined ? num.toFixed(precision) : String(num);
  return (
    <span style={{ display: 'block', width: '100%', textAlign: 'right' }}>
      {prefix ?? ''}
      {formatted}
      {suffix ?? ''}
    </span>
  );
}
