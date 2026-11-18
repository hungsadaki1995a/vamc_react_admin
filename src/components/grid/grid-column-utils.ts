import type { CellClassParams, CellClassRules, ColDef, EditableCallbackParams } from 'ag-grid-community';

/**
 * cellClassRules that adds `ds-cell-editable` class to editable cells.
 * cursor:text on hover is handled in global.css.
 * Because colDef.editable has defaultColDef merged in, grid-level editable is also reflected,
 * and functional (row-conditional) editable is re-evaluated when row data changes.
 */
export const editableCellClassRules: CellClassRules = {
  'ds-cell-editable': (params: CellClassParams) => {
    const { editable } = params.colDef;
    return typeof editable === 'function'
      ? editable(params as unknown as EditableCallbackParams)
      : editable === true;
  },
};

export const centerCell = { textAlign: 'center' } as const;
export const rightCell = { textAlign: 'right' } as const;

export function formatDate(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  return text;
}

export function formatNumber(value: unknown): string {
  if (value == null || value === '') return '';
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value);
}

export function rowNumberColumn<TData = Record<string, unknown>>(headerName = 'No'): ColDef<TData> {
  return {
    headerName,
    valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
    width: 64,
    minWidth: 64,
    maxWidth: 72,
    pinned: 'left',
    cellStyle: centerCell,
  };
}

export function dateColumn<TData = Record<string, unknown>>(
  field: string,
  headerName: string,
  width = 118,
): ColDef<TData> {
  return {
    field: field as ColDef<TData>['field'],
    headerName,
    width,
    valueFormatter: ({ value }) => formatDate(value),
    cellStyle: centerCell,
  };
}

export function numberColumn<TData = Record<string, unknown>>(
  field: string,
  headerName: string,
  width = 100,
): ColDef<TData> {
  return {
    field: field as ColDef<TData>['field'],
    headerName,
    width,
    valueFormatter: ({ value }) => formatNumber(value),
    cellStyle: rightCell,
  };
}
