import type { ColDef, ColGroupDef } from 'ag-grid-community';
import type { ExcelColumnDef } from '@/types/excel';

/**
 * Derives Excel column headers from AG Grid columnDefs.
 *
 * - Flat column  : uses headerName directly
 * - Grouped column: concatenates group headerName + child headerName
 * - Falls back to baseColumns[].header if the field is not found in columnDefs
 *
 * Intended use: pass the result to useExcel({ columns }) so that
 * download/upload headers always match the grid's current display language.
 *
 * @param columnDefs  AG Grid column/group definitions (from useMemo in the component)
 * @param baseColumns Static ExcelColumnDef array that defines key, width, format, required, etc.
 */
export function buildExcelColumnsFromGrid<T>(
  columnDefs: (ColDef<T> | ColGroupDef<T>)[],
  baseColumns: ExcelColumnDef[],
): ExcelColumnDef[] {
  const headerMap: Record<string, string> = {};

  for (const col of columnDefs) {
    if ('children' in col) {
      const groupName = col.headerName ?? '';
      for (const child of col.children ?? []) {
        if ('field' in child && child.field) {
          headerMap[child.field] = groupName + ((child as ColDef<T>).headerName ?? '');
        }
      }
    } else if ('field' in col && col.field) {
      headerMap[col.field] = col.headerName ?? '';
    }
  }

  return baseColumns.map((c) => ({
    ...c,
    header: headerMap[c.key] ?? c.header,
  }));
}
