/* eslint-disable react-refresh/only-export-components */
// lightTheme / darkTheme are exported alongside GridTable (intentional co-location)
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

// Register AG Grid modules lazily (executed when first grid page is opened)
ModuleRegistry.registerModules([AllCommunityModule]);
import type {
  ColDef,
  GridReadyEvent,
  RowDataUpdatedEvent,
  CellValueChangedEvent,
  CellClickedEvent,
  CellDoubleClickedEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  FilterChangedEvent,
  PaginationChangedEvent,
  FirstDataRenderedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  ColumnResizedEvent,
  ColumnMovedEvent,
  ColumnVisibleEvent,
  RowClassParams,
  RowStyle,
  IRowNode,
  GetContextMenuItems,
  GridApi,
  BodyScrollEndEvent,
  ModelUpdatedEvent,
  RowSelectedEvent,
  CellContextMenuEvent,
  CellKeyDownEvent,
  GetContextMenuItemsParams,
  MenuItemDef,
} from 'ag-grid-community';
import type { AgGridReactProps } from 'ag-grid-react';
import { App } from 'antd';
import DOMPurify from 'dompurify';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore } from '@/stores/localeStore';
import { getAgGridLocale } from './agGridLocale';
import { ComcdSelectCellEditor, ComcdSelectCellRenderer } from './ComcdSelectCell';
import './GridTable.css';

export type GridCellAlign = 'left' | 'center' | 'right';

/**
 * Extended ColDef — stores grid metadata in `context` to avoid AG Grid unknown-property warnings.
 * Paired fields (e.g. ickId alongside ickNm) are included in revert comparison without a hidden column.
 * gridRowUtils/ExcelUploadModal 등이 사용하는 타입 계약.
 */
export type ColDefEx<T> = ColDef<T> & {
  context?: {
    pairedFields?: (keyof T)[];
    /** Applies the shared bold cell style when true. */
    bold?: boolean;
    /** Applies the shared body-cell text alignment. */
    align?: GridCellAlign;
    /** Shows this text when the cell value is empty. */
    placeholder?: string;
  };
};

export const lightTheme = themeQuartz.withParams({
  backgroundColor: '#ffffff',
  headerBackgroundColor: '#f0f2f5',
  borderColor: '#e0e0e0',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 13,
  headerFontSize: 12,
  headerFontWeight: 600,
  rowHoverColor: 'rgba(22, 119, 255, 0.06)',
  selectedRowBackgroundColor: 'rgba(22, 119, 255, 0.10)',
  accentColor: '#1677ff',
  oddRowBackgroundColor: '#ffffff',
  columnBorder: true,
  wrapperBorderRadius: 6,
  headerColumnBorder: true,
  headerColumnResizeHandleColor: '#bfbfbf',
  cellHorizontalPaddingScale: 0.8,
  rowVerticalPaddingScale: 0.9,
});

export const darkTheme = themeQuartz.withParams({
  backgroundColor: '#141414',
  headerBackgroundColor: '#1f1f1f',
  borderColor: '#363636',
  borderRadius: 6,
  foregroundColor: 'rgba(255, 255, 255, 0.85)',
  fontFamily: 'inherit',
  fontSize: 13,
  headerFontSize: 12,
  headerFontWeight: 600,
  rowHoverColor: 'rgba(22, 119, 255, 0.10)',
  selectedRowBackgroundColor: 'rgba(22, 119, 255, 0.15)',
  accentColor: '#1677ff',
  oddRowBackgroundColor: '#1a1a1a',
  columnBorder: true,
  wrapperBorderRadius: 6,
  headerColumnBorder: true,
  headerColumnResizeHandleColor: '#555',
  cellHorizontalPaddingScale: 0.8,
  rowVerticalPaddingScale: 0.9,
});

// ── clipboard utils ──

/** Convert selected rows to tab-delimited text (data only, no headers).
 *  Falls back to the focused row when nothing is selected.
 *  Headers are only included via copyWithHeaders context menu action. */
function rowsToClipboardText<TData>(
  api: GridApi<TData>,
  columnDefs: ColDef<TData>[],
): string | null {
  const selectedRows = api.getSelectedRows();
  let rows: TData[];
  if (selectedRows.length > 0) {
    rows = selectedRows;
  } else {
    // No selection — use focused row as fallback
    const focused = api.getFocusedCell();
    if (!focused) return null;
    const node = api.getDisplayedRowAtIndex(focused.rowIndex);
    rows = node?.data ? [node.data] : [];
  }
  if (rows.length === 0) return null;

  const visibleCols = columnDefs.filter((c) => c.field && !c.hide);
  const lines = rows.map((row) =>
    visibleCols
      .map((c) => {
        const val = (row as Record<string, unknown>)[c.field as string];
        return val != null ? String(val) : '';
      })
      .join('\t'),
  );
  return lines.join('\n');
}

/** Parse clipboard text to 2D array */
function parseClipboardText(text: string): string[][] {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'));
}

// NoRows overlay — defined outside to avoid re-creation on each render
function NoRowsOverlay({ message }: { message: string }) {
  return (
    <div className="ds-grid-no-rows">
      <span className="ds-grid-no-rows-icon">📭</span>
      <span className="ds-grid-no-rows-text">{message}</span>
    </div>
  );
}

// ── Props interface ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GridTableProps<TData = any> {
  // ── required
  columnDefs: ColDef<TData>[];
  rowData: TData[];

  // ── basic settings
  rowKey?: string | ((data: TData) => string);
  defaultColDef?: ColDef<TData>;
  editable?: boolean;
  enableClipboard?: boolean;
  rowSelection?: 'singleRow' | 'multiRow';
  /** Enable checkbox column + header checkbox (replaces deprecated colDef.checkboxSelection) */
  checkboxSelection?: boolean;
  pagination?: boolean;
  pageSize?: number;
  height?: string | number;
  autoHeight?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  loading?: boolean;
  noRowsMessage?: string;

  // ── row style/class
  /** Dynamic row class */
  getRowClass?: (params: RowClassParams<TData>) => string | string[] | undefined;
  /** Dynamic row style */
  getRowStyle?: (params: RowClassParams<TData>) => RowStyle | undefined;
  /** Row selectable predicate */
  isRowSelectable?: (node: IRowNode<TData>) => boolean;

  // ── selection control
  /** Suppress row selection on click */
  suppressRowClickSelection?: boolean;
  /** Multi-select on click (without Ctrl) */
  rowMultiSelectWithClick?: boolean;

  // ── cell/focus control
  /** Suppress cell focus border */
  suppressCellFocus?: boolean;
  /** Suppress column moving */
  suppressMovableColumns?: boolean;
  /** Suppress context menu */
  suppressContextMenu?: boolean;
  /** Custom context menu */
  getContextMenuItems?: GetContextMenuItems<TData>;

  // ── search/filter
  /** Show floating filter row below header */
  floatingFilter?: boolean;
  /** Quick text filter (empty string → reset) */
  quickFilterText?: string;

  // ── pinned rows
  /** Rows pinned to top */
  pinnedTopRowData?: TData[];
  /** Rows pinned to bottom */
  pinnedBottomRowData?: TData[];

  // ── cell spanning
  /** Enable colSpan/rowSpan cell merge */
  enableCellSpan?: boolean;
  /** Allow text selection in cells. NOTE: enabling this disables the AG Grid context menu. Default: false */
  enableCellTextSelection?: boolean;

  // ── external filter
  /** Whether external filter is active */
  isExternalFilterPresent?: () => boolean;
  /** Whether row passes external filter */
  doesExternalFilterPass?: (node: IRowNode<TData>) => boolean;

  // ── context (shared object passed to callbacks)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any;

  // ── direct GridApi access
  /** AgGridReact ref — for direct GridApi control */
  gridRef?: React.RefObject<AgGridReact<TData> | null>;

  // ── events: rows
  onRowClick?: (data: TData) => void;
  onRowDoubleClick?: (data: TData, event: RowDoubleClickedEvent<TData>) => void;
  onRowSelected?: (event: RowSelectedEvent<TData>) => void;
  onSelectionChanged?: (rows: TData[]) => void;
  onFirstDataRendered?: (event: FirstDataRenderedEvent<TData>) => void;
  onModelUpdated?: (event: ModelUpdatedEvent<TData>) => void;
  onBodyScrollEnd?: (event: BodyScrollEndEvent) => void;

  // ── events: cells
  onCellClicked?: (event: CellClickedEvent<TData>) => void;
  onCellDoubleClicked?: (event: CellDoubleClickedEvent<TData>) => void;
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void;
  onCellEditingStarted?: (event: CellEditingStartedEvent<TData>) => void;
  onCellEditingStopped?: (event: CellEditingStoppedEvent<TData>) => void;
  onCellContextMenu?: (event: CellContextMenuEvent<TData>) => void;
  onCellKeyDown?: (event: CellKeyDownEvent<TData>) => void;

  // ── events: grid state
  onGridReady?: (api: GridApi<TData>) => void;
  onSortChanged?: (event: SortChangedEvent<TData>) => void;
  onFilterChanged?: (event: FilterChangedEvent<TData>) => void;
  onPaginationChanged?: (event: PaginationChangedEvent<TData>) => void;
  onColumnResized?: (event: ColumnResizedEvent<TData>) => void;
  onColumnMoved?: (event: ColumnMovedEvent<TData>) => void;
  onColumnVisible?: (event: ColumnVisibleEvent<TData>) => void;

  /**
   * Pass AG Grid native props directly (escape hatch)
   * Use for advanced AG Grid features not covered by GridTableProps
   * @example gridProps={{ treeData: true, getDataPath: (d) => d.path }}
   */
  gridProps?: Omit<
    AgGridReactProps<TData>,
    // Keys already handled by GridTableProps
    | 'columnDefs' | 'rowData' | 'defaultColDef' | 'theme' | 'localeText'
    | 'getRowId' | 'rowSelection' | 'pagination' | 'paginationPageSize'
    | 'paginationPageSizeSelector' | 'onGridReady' | 'onRowDataUpdated'
    | 'onRowClicked' | 'onRowDoubleClicked' | 'onCellValueChanged'
    | 'onSelectionChanged' | 'loading' | 'noRowsOverlayComponent'
    | 'noRowsOverlayComponentParams' | 'animateRows'
    | 'domLayout' | 'rowHeight' | 'headerHeight' | 'getRowClass' | 'getRowStyle'
    | 'isRowSelectable' | 'suppressRowClickSelection'
    | 'suppressCellFocus' | 'suppressMovableColumns' | 'suppressContextMenu'
    | 'getContextMenuItems' | 'isExternalFilterPresent' | 'doesExternalFilterPass'
    | 'context' | 'onCellClicked' | 'onCellDoubleClicked' | 'onCellEditingStarted'
    | 'onCellEditingStopped' | 'onCellContextMenu' | 'onCellKeyDown'
    | 'onSortChanged' | 'onFilterChanged' | 'onPaginationChanged'
    | 'onColumnResized' | 'onColumnMoved' | 'onColumnVisible'
    | 'onFirstDataRendered' | 'onModelUpdated' | 'onBodyScrollEnd'
    | 'onRowSelected' | 'quickFilterText'
    | 'pinnedTopRowData' | 'pinnedBottomRowData' | 'enableCellSpan'
  >;
}

// ── Main Component ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GridTable<TData = any>({
  columnDefs,
  rowData,
  rowKey = 'id',
  defaultColDef: userDefaultColDef,
  editable = false,
  enableClipboard = false,
  rowSelection,
  checkboxSelection = false,
  pagination = true,
  pageSize = 20,
  height = '100%',
  autoHeight = false,
  rowHeight = 36,
  headerHeight = 38,
  className,
  loading = false,
  noRowsMessage = '데이터가 없습니다.',
  getRowClass,
  getRowStyle,
  isRowSelectable,
  suppressRowClickSelection,
  rowMultiSelectWithClick,
  suppressCellFocus,
  suppressMovableColumns,
  suppressContextMenu,
  getContextMenuItems,
  floatingFilter,
  quickFilterText,
  pinnedTopRowData,
  pinnedBottomRowData,
  enableCellSpan,
  enableCellTextSelection = false,
  isExternalFilterPresent,
  doesExternalFilterPass,
  context,
  gridRef: externalGridRef,
  onRowClick,
  onRowDoubleClick,
  onRowSelected,
  onSelectionChanged,
  onFirstDataRendered,
  onModelUpdated,
  onBodyScrollEnd,
  onCellClicked,
  onCellDoubleClicked,
  onCellValueChanged,
  onCellEditingStarted,
  onCellEditingStopped,
  onCellContextMenu,
  onCellKeyDown,
  onGridReady,
  onSortChanged,
  onFilterChanged,
  onPaginationChanged,
  onColumnResized,
  onColumnMoved,
  onColumnVisible,
  gridProps,
}: GridTableProps<TData>) {
  const internalGridRef = useRef<AgGridReact<TData>>(null);
  const gridRef = (externalGridRef ?? internalGridRef) as React.RefObject<AgGridReact<TData>>;
  const containerRef = useRef<HTMLDivElement>(null);
  const rowDataRef = useRef(rowData);
  rowDataRef.current = rowData;
  const themeMode = useThemeStore((s) => s.mode);
  const { message } = App.useApp();

  const theme = useMemo(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode],
  );

  // 그리드 내부 문구(필터·컬럼 메뉴·페이지네이션 등)는 로케일 상수에서 온다.
  // 종전에는 한국어 상수가 고정돼 있어 언어를 바꿔도 이 부분만 한국어로 남았다.
  const locale = useLocaleStore((s) => s.locale);
  const localeText = useMemo(() => getAgGridLocale(locale), [locale]);

  const mergedDefaultColDef = useMemo<ColDef<TData>>(
    () => ({
      flex: 1,
      minWidth: 80,
      sortable: true,
      filter: true,
      floatingFilter,
      resizable: true,
      editable,
      cellDataType: false,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      suppressHeaderContextMenu: true,
      ...userDefaultColDef,
    }),
    [editable, floatingFilter, userDefaultColDef],
  );

  // Auto-inject valueFormatter + valueParser for columns based on sampled data type.
  // 1) Object columns ({label,value}): formatter returns label, suppresses AG Grid warning #48.
  // 2) YYYYMMDD date string columns: formatter converts to YYYY-MM-DD for display.
  const processedColumnDefs = useMemo<ColDef<TData>[]>(() => {
    const firstRow = rowData[0];
    return columnDefs.map((col) => {
      let result = col;

      // Auto-inject ComcdSelectCellRenderer when only ComcdSelectCellEditor is set (object params form)
      if (
        col.cellEditor === ComcdSelectCellEditor &&
        !col.cellRenderer &&
        col.cellEditorParams &&
        typeof col.cellEditorParams !== 'function'
      ) {
        const { cdDmnId, prefixOption } = col.cellEditorParams as { cdDmnId?: string; prefixOption?: string };
        if (cdDmnId) {
          result = {
            ...result,
            cellRenderer: ComcdSelectCellRenderer,
            cellRendererParams: { cdDmnId, ...(prefixOption !== undefined && { prefixOption }) },
          };
        }
      }

      // Data-based processing (object label, YYYYMMDD date)
      if (!result.field || result.valueFormatter || !firstRow) return result;
      const sampleVal = (firstRow as Record<string, unknown>)[result.field];
      if (sampleVal === null || sampleVal === undefined) return result;

      // Object column: {label, value}
      if (typeof sampleVal === 'object') {
        return {
          ...result,
          valueFormatter: (params) => {
            const v = params.value;
            if (v === null || v === undefined) return '';
            if (typeof v === 'object') return 'label' in v ? String((v as Record<string, unknown>).label) : '';
            return String(v);
          },
          valueParser: result.valueParser ?? ((params) => params.newValue),
        };
      }

      // YYYYMMDD date string column
      if (typeof sampleVal === 'string' && /^\d{8}$/.test(sampleVal) && dayjs(sampleVal, 'YYYYMMDD', true).isValid()) {
        return {
          ...result,
          valueFormatter: (params) => {
            const v = params.value;
            if (!v || typeof v !== 'string' || !/^\d{8}$/.test(v)) return v ?? '';
            return dayjs(v, 'YYYYMMDD').format('YYYY-MM-DD');
          },
        };
      }

      return result;
    });
  }, [columnDefs, rowData]);

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      onGridReady?.(event.api);
      if (!rowDataRef.current || rowDataRef.current.length === 0) {
        event.api.showNoRowsOverlay();
      }
    },
    [onGridReady],
  );

  const handleRowDataUpdated = useCallback((event: RowDataUpdatedEvent<TData>) => {
    if (event.api.getDisplayedRowCount() === 0) {
      event.api.showNoRowsOverlay();
    } else {
      event.api.hideOverlay();
    }
  }, []);

  const handleRowClick = useCallback(
    (event: RowClickedEvent<TData>) => {
      if (event.data) onRowClick?.(event.data);
    },
    [onRowClick],
  );

  const handleRowDoubleClick = useCallback(
    (event: RowDoubleClickedEvent<TData>) => {
      if (event.data) onRowDoubleClick?.(event.data, event);
    },
    [onRowDoubleClick],
  );

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent<TData>) => {
      const rows = event.api.getSelectedRows();
      onSelectionChanged?.(rows);
    },
    [onSelectionChanged],
  );

  const paginationPageSizeSelector = useMemo(() => [10, 20, 50, 100], []);

  // ── custom context menu (AG Grid Context Menu is Enterprise-only) ──
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    items: (MenuItemDef | string)[];
    params: GetContextMenuItemsParams<TData>;
  } | null>(null);

  const handleCellContextMenu = useCallback(
    (event: CellContextMenuEvent<TData>) => {
      onCellContextMenu?.(event);
      if (suppressContextMenu) return;
      if (!getContextMenuItems && !suppressContextMenu) return; // no items configured

      const mouseEvent = event.event as MouseEvent | null;
      if (!mouseEvent) return;
      mouseEvent.preventDefault();

      const params: GetContextMenuItemsParams<TData> = {
        node: event.node,
        column: event.column,
        value: event.value,
        api: event.api,
        context: event.context ?? {},
        event: mouseEvent,
        defaultItems: [],
      };

      const rawItems = getContextMenuItems ? getContextMenuItems(params) : [];
      const items = Array.isArray(rawItems) ? rawItems : [];
      if (items.length === 0) return;

      setCtxMenu({ x: mouseEvent.clientX, y: mouseEvent.clientY, items, params });
    },
    [suppressContextMenu, getContextMenuItems, onCellContextMenu],
  );

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ctxMenu]);

  const executeBuiltinAction = useCallback((itemName: string) => {
    const api = gridRef.current?.api;
    if (!api) return;
    if (itemName === 'copy') {
      const text = rowsToClipboardText(api, columnDefs);
      if (text) navigator.clipboard.writeText(text);
    } else if (itemName === 'copyWithHeaders') {
      const focusedCell = api.getFocusedCell();
      if (!focusedCell) return;
      const rowNode = api.getDisplayedRowAtIndex(focusedCell.rowIndex);
      if (!rowNode) return;
      const cols = api.getAllDisplayedColumns() ?? [];
      const header = cols.map((c) => c.getColDef().headerName ?? c.getColId()).join('\t');
      const row = cols.map((c) => String(api.getCellValue({ rowNode, colKey: c }) ?? '')).join('\t');
      navigator.clipboard.writeText(`${header}\n${row}`);
    }
  }, [columnDefs, gridRef]);

  // ── clipboard: Ctrl+C (keydown) + paste event ──
  useEffect(() => {
    if (!enableClipboard) return;
    const container = containerRef.current;
    if (!container) return;

    // Ctrl+C: copy selected rows (or focused row fallback)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container.contains(e.target as Node)) return;
      const api = gridRef.current?.api;
      if (!api) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        const focusedCell = api.getFocusedCell();
        // Skip if a cell editor is open
        if (focusedCell) {
          const editors = api.getCellEditorInstances({
            rowNodes: [api.getDisplayedRowAtIndex(focusedCell.rowIndex)!],
            columns: [focusedCell.column],
          });
          if (editors && editors.length > 0) return;
        }
        const text = rowsToClipboardText(api, columnDefs);
        if (text) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(text).then(() => {
            const count = api.getSelectedRows().length || 1;
            message.success(`${count}행이 클립보드에 복사되었습니다.`);
          });
        }
      }
    };

    // Ctrl+V: use `paste` event so clipboardData is available without Permissions API
    const handlePaste = (e: ClipboardEvent) => {
      if (!container.contains(e.target as Node) && !container.contains(document.activeElement)) return;
      const api = gridRef.current?.api;
      if (!api) return;

      const focusedCell = api.getFocusedCell();
      if (!focusedCell) return;

      // Block if no editable columns exist
      const hasEditable = columnDefs.some(
        (c) => editable || c.editable === true,
      );
      if (!hasEditable) return;

      const text = e.clipboardData?.getData('text/plain');
      if (!text?.trim()) return;

      e.preventDefault();
      e.stopPropagation();

      const parsed = parseClipboardText(text);
      const visibleCols = columnDefs.filter((c) => c.field && !c.hide);
      const focusedColIdx = visibleCols.findIndex(
        (c) => c.field === focusedCell.column.getColId(),
      );
      if (focusedColIdx < 0) return;

      // If clipboard has as many (or more) columns as the grid, align from col 0.
      // This handles grid→grid full-row paste regardless of which cell is focused.
      // If clipboard has fewer columns (external single-value paste), start from focused col.
      const numClipCols = Math.max(...parsed.map((r) => r.length));
      const startColIdx = numClipCols >= visibleCols.length ? 0 : focusedColIdx;

      let pastedCells = 0;
      parsed.forEach((rowValues, rowOffset) => {
        const rowNode = api.getDisplayedRowAtIndex(focusedCell.rowIndex + rowOffset);
        if (!rowNode) return;
        rowValues.forEach((value, colOffset) => {
          const col = visibleCols[startColIdx + colOffset];
          if (!col?.field) return;
          if (col.editable === false) return;
          // Convert to column's data type to avoid AG Grid v35 warning #135
          const existingVal = (rowNode.data as Record<string, unknown>)?.[col.field];
          let typedValue: unknown = value;
          if (typeof existingVal === 'number') {
            const n = Number(value);
            typedValue = Number.isNaN(n) ? value : n;
          } else if (typeof existingVal === 'boolean') {
            typedValue = value === 'true' || value === '1';
          }
          rowNode.setDataValue(col.field, typedValue);
          pastedCells++;
        });
      });

      if (pastedCells > 0) {
        message.success(`${parsed.length}행 붙여넣기 완료`);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('paste', handlePaste, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [enableClipboard, columnDefs, editable, message, gridRef]);

  return (
    <>
    <div
      ref={containerRef}
      className={`ds-grid-table ${editable ? 'ds-grid-editable' : ''} ${className ?? ''}`}
      style={autoHeight ? { width: '100%' } : { height, width: '100%', flex: height === '100%' ? 1 : 'none' }}
      tabIndex={-1}
    >
      <AgGridReact<TData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={processedColumnDefs}
        defaultColDef={mergedDefaultColDef}
        theme={theme}
        localeText={localeText}
        getRowId={rowKey
          ? (params) => typeof rowKey === 'function'
            ? rowKey(params.data)
            : String((params.data as Record<string, unknown>)[rowKey])
          : undefined}
        rowSelection={
          rowSelection
            ? {
                mode: rowSelection,
                checkboxes: checkboxSelection,
                headerCheckbox: checkboxSelection && rowSelection === 'multiRow',
                enableSelectionWithoutKeys: rowMultiSelectWithClick,
              }
            : onRowClick
              ? { mode: 'singleRow', checkboxes: false, enableClickSelection: true }
              : undefined
        }
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        animateRows={false}
        popupParent={document.body}
        enableCellTextSelection={enableCellTextSelection}
        domLayout={autoHeight ? 'autoHeight' : undefined}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        context={context}
        // ── row style/control
        getRowClass={getRowClass}
        getRowStyle={getRowStyle}
        isRowSelectable={isRowSelectable}
        suppressRowClickSelection={suppressRowClickSelection}
        suppressCellFocus={suppressCellFocus ?? (onRowClick ? true : undefined)}
        suppressMovableColumns={suppressMovableColumns}
        suppressContextMenu={true}
        stopEditingWhenCellsLoseFocus={true}
        // ── search/filter
        quickFilterText={quickFilterText}
        // ── pinned rows
        pinnedTopRowData={pinnedTopRowData}
        pinnedBottomRowData={pinnedBottomRowData}
        // ── cell spanning
        enableCellSpan={enableCellSpan}
        // ── external filter
        isExternalFilterPresent={isExternalFilterPresent}
        doesExternalFilterPass={doesExternalFilterPass}
        // ── overlays
        loading={loading}
        noRowsOverlayComponent={NoRowsOverlay}
        noRowsOverlayComponentParams={{ message: noRowsMessage }}
        // ── events: grid lifecycle
        onGridReady={handleGridReady}
        onRowDataUpdated={handleRowDataUpdated}
        onFirstDataRendered={onFirstDataRendered}
        onModelUpdated={onModelUpdated}
        onBodyScrollEnd={onBodyScrollEnd}
        // ── events: rows
        onRowClicked={onRowClick ? handleRowClick : undefined}
        onRowDoubleClicked={onRowDoubleClick ? handleRowDoubleClick : undefined}
        onRowSelected={onRowSelected}
        onSelectionChanged={onSelectionChanged ? handleSelectionChanged : undefined}
        // ── events: cells
        onCellClicked={onCellClicked}
        onCellDoubleClicked={onCellDoubleClicked}
        onCellValueChanged={onCellValueChanged}
        onCellEditingStarted={onCellEditingStarted}
        onCellEditingStopped={onCellEditingStopped}
        onCellContextMenu={handleCellContextMenu}
        preventDefaultOnContextMenu={!!getContextMenuItems && !suppressContextMenu}
        onCellKeyDown={onCellKeyDown}
        // ── events: grid state
        onSortChanged={onSortChanged}
        onFilterChanged={onFilterChanged}
        onPaginationChanged={onPaginationChanged}
        onColumnResized={onColumnResized}
        onColumnMoved={onColumnMoved}
        onColumnVisible={onColumnVisible}
        // ── escape hatch
        {...gridProps}
      />
    </div>
    {ctxMenu && createPortal(
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: ctxMenu.y,
          left: ctxMenu.x,
          zIndex: 9999,
          background: 'var(--component-background, #fff)',
          border: '1px solid var(--border-color, #e0e0e0)',
          borderRadius: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: 160,
          fontSize: 13,
          overflow: 'hidden',
        }}
      >
        {ctxMenu.items.map((item, i) => {
          if (item === 'separator') {
            return <div key={i} style={{ height: 1, background: 'var(--border-color, #e0e0e0)', margin: '2px 0' }} />;
          }
          if (typeof item === 'string') {
            // built-in string items: copy, copyWithHeaders
            const labels: Record<string, string> = {
              copy: 'Copy',
              copyWithHeaders: 'Copy with Headers',
              cut: 'Cut',
              paste: 'Paste',
              export: 'Export',
              csvExport: 'CSV Export',
            };
            return (
              <div
                key={i}
                style={{ padding: '6px 12px', cursor: 'pointer', color: 'var(--text-color, #000)', display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--item-hover-bg, rgba(0,0,0,0.04))'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setCtxMenu(null);
                  executeBuiltinAction(item);
                }}
              >
                <span style={{ width: 16 }} />
                <span>{labels[item] ?? item}</span>
              </div>
            );
          }
          // custom MenuItemDef
          const disabled = item.disabled ?? false;
          return (
            <div
              key={i}
              style={{
                padding: '6px 12px',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                color: 'var(--text-color, #000)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--item-hover-bg, rgba(0,0,0,0.04))'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              onMouseDown={(e) => {
                if (disabled) return;
                e.stopPropagation();
                setCtxMenu(null);
                item.action?.({ ...ctxMenu.params });
              }}
            >
              {item.icon
                ? <span
                    style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    // eslint-disable-next-line react/no-danger -- sanitized via DOMPurify (html+svg profile) below
                    dangerouslySetInnerHTML={{
                      __html: typeof item.icon === 'string'
                        ? DOMPurify.sanitize(item.icon, { USE_PROFILES: { html: true, svg: true } })
                        : '',
                    }} />
                : <span style={{ width: 16 }} />}
              <span>{item.name}</span>
            </div>
          );
        })}
      </div>,
      document.body,
    )}
    </>
  );
}
