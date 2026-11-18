import { memo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

interface StatusDotCellRendererParams extends ICellRendererParams {
  /** status code → color mapping (required). Defaults to '#d4d4d4' when unmatched. */
  colorMap: Record<string, string>;
}

/**
 * AG Grid cell renderer — displays a status dot.
 *
 * Receives colorMap via cellRendererParams to support per-screen status code schemes.
 *
 * @example
 * // PMS301013SC (P/I/C/D codes):
 * cellRenderer: StatusDotCellRenderer,
 * cellRendererParams: {
 *   colorMap: { P: '#d4d4d4', I: '#44c7ff', C: '#32c968', D: '#FF9500' },
 * },
 *
 * // Numeric code screen:
 * cellRendererParams: {
 *   colorMap: { '0': '#d4d4d4', '1': '#44c7ff', '2': '#32c968', '9': '#FF9500' },
 * },
 */
function StatusDotCellRendererBase({
  value,
  colorMap,
}: StatusDotCellRendererParams) {
  if (value == null) return null;

  const key = String(value);
  const color = colorMap?.[key] ?? '#d4d4d4';

  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Prevents unnecessary re-renders of unchanged cells to reduce flicker during scroll/data refresh.
 * Since the grid uses getRowId-based immutable data mode, value changes are always detected as new references.
 */
export const StatusDotCellRenderer = memo(StatusDotCellRendererBase);
StatusDotCellRenderer.displayName = 'StatusDotCellRenderer';
