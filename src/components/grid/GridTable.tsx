import { useMemo, useCallback, useRef, useEffect } from 'react';
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
} from 'ag-grid-community';
import type { AgGridReactProps } from 'ag-grid-react';
import { App } from 'antd';
import { useThemeStore } from '@/stores/themeStore';
import { AG_GRID_LOCALE_KO } from './agGridLocaleKo';
import './GridTable.css';

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

/** Convert selected rows to tab-delimited text (with headers) */
function rowsToClipboardText<TData>(
  api: GridApi<TData>,
  columnDefs: ColDef<TData>[],
): string | null {
  const selectedRows = api.getSelectedRows();
  const rows = selectedRows.length > 0 ? selectedRows : [];
  if (rows.length === 0) return null;

  const visibleCols = columnDefs.filter(
    (c) => c.headerName && c.field && !c.hide,
  );
  const headers = visibleCols.map((c) => c.headerName ?? c.field ?? '');
  const lines = rows.map((row) =>
    visibleCols
      .map((c) => {
        const val = (row as any)[c.field as string];
        return val != null ? String(val) : '';
      })
      .join('\t'),
  );
  return [headers.join('\t'), ...lines].join('\n');
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

export interface GridTableProps<TData = any> {
  // ── required
  columnDefs: ColDef<TData>[];
  rowData: TData[];

  // ── basic settings
  rowKey?: string;
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

  // ── external filter
  /** Whether external filter is active */
  isExternalFilterPresent?: () => boolean;
  /** Whether row passes external filter */
  doesExternalFilterPass?: (node: IRowNode<TData>) => boolean;

  // ── context (shared object passed to callbacks)
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
    | 'noRowsOverlayComponentParams' | 'animateRows' | 'enableCellTextSelection'
    | 'domLayout' | 'rowHeight' | 'headerHeight' | 'getRowClass' | 'getRowStyle'
    | 'isRowSelectable' | 'suppressRowClickSelection' | 'rowMultiSelectWithClick'
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

  const mergedDefaultColDef = useMemo<ColDef<TData>>(
    () => ({
      flex: 1,
      minWidth: 80,
      sortable: true,
      filter: true,
      floatingFilter,
      resizable: true,
      editable,
      ...userDefaultColDef,
    }),
    [editable, floatingFilter, userDefaultColDef],
  );

  // Auto-inject valueFormatter + valueParser for columns whose data values are objects.
  // Suppresses AG Grid warning #48: "Cell data type is 'object' but no Value Formatter/Parser".
  // Detects object-typed columns by sampling the first row; re-runs when data or defs change.
  // For {label, value} objects (SearchSelectValue), formatter returns label; parser is pass-through.
  const processedColumnDefs = useMemo<ColDef<TData>[]>(() => {
    const firstRow = rowData[0];
    if (!firstRow) return columnDefs;
    return columnDefs.map((col) => {
      if (!col.field) return col;
      const sampleVal = (firstRow as any)[col.field];
      if (sampleVal === null || sampleVal === undefined || typeof sampleVal !== 'object') return col;
      const patch: Partial<ColDef<TData>> = {};
      if (!col.valueFormatter) {
        patch.valueFormatter = (params) => {
          const v = params.value;
          if (v === null || v === undefined) return '';
          if (typeof v === 'object') return 'label' in v ? String((v as any).label) : '';
          return String(v);
        };
      }
      if (!col.valueParser) {
        patch.valueParser = (params) => params.newValue;
      }
      return { ...col, ...patch };
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

  // ── clipboard: Ctrl+C / Ctrl+V ──
  useEffect(() => {
    if (!enableClipboard) return;
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container.contains(e.target as Node)) return;

      const api = gridRef.current?.api;
      if (!api) return;

      // Ctrl+C: copy selected rows
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        const focusedCell = api.getFocusedCell();
        if (focusedCell) {
          const cellEditor = api.getCellEditorInstances({
            rowNodes: [api.getDisplayedRowAtIndex(focusedCell.rowIndex)!],
            columns: [focusedCell.column],
          });
          if (cellEditor && cellEditor.length > 0) return;
        }

        const text = rowsToClipboardText(api, columnDefs);
        if (text) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(text).then(() => {
            const count = api.getSelectedRows().length;
            message.success(`${count}행이 클립보드에 복사되었습니다.`);
          });
        }
      }

      // Ctrl+V: paste (editable mode only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && editable) {
        const focusedCell = api.getFocusedCell();
        if (!focusedCell) return;

        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.readText().then((text) => {
          if (!text.trim()) return;
          const parsed = parseClipboardText(text);
          const visibleCols = columnDefs.filter((c) => c.field && !c.hide);
          const startColIdx = visibleCols.findIndex(
            (c) => c.field === focusedCell.column.getColId(),
          );
          if (startColIdx < 0) return;

          let pastedCells = 0;
          parsed.forEach((rowValues, rowOffset) => {
            const rowNode = api.getDisplayedRowAtIndex(
              focusedCell.rowIndex + rowOffset,
            );
            if (!rowNode) return;

            rowValues.forEach((value, colOffset) => {
              const col = visibleCols[startColIdx + colOffset];
              if (!col?.field) return;
              if (col.editable === false) return;
              rowNode.setDataValue(col.field, value);
              pastedCells++;
            });
          });
          if (pastedCells > 0) {
            message.success(
              `${parsed.length}행 ${Math.min(parsed[0]?.length ?? 0, visibleCols.length - startColIdx)}열 붙여넣기 완료`,
            );
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [enableClipboard, columnDefs, editable, message, gridRef]);

  return (
    <div
      ref={containerRef}
      className={`ds-grid-table ${className ?? ''}`}
      style={autoHeight ? { width: '100%' } : { height, width: '100%', flex: height === '100%' ? 1 : 'none' }}
      tabIndex={-1}
    >
      <AgGridReact<TData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={processedColumnDefs}
        defaultColDef={mergedDefaultColDef}
        theme={theme}
        localeText={AG_GRID_LOCALE_KO}
        getRowId={rowKey ? (params) => String((params.data as any)[rowKey]) : undefined}
        rowSelection={rowSelection ? { mode: rowSelection, checkboxes: checkboxSelection, headerCheckbox: checkboxSelection && rowSelection === 'multiRow' } : undefined}
        pagination={pagination}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        animateRows={false}
        enableCellTextSelection={!enableCellSpan}
        domLayout={autoHeight ? 'autoHeight' : undefined}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        context={context}
        // ── row style/control
        getRowClass={getRowClass}
        getRowStyle={getRowStyle}
        isRowSelectable={isRowSelectable}
        suppressRowClickSelection={suppressRowClickSelection}
        rowMultiSelectWithClick={rowMultiSelectWithClick}
        suppressCellFocus={suppressCellFocus}
        suppressMovableColumns={suppressMovableColumns}
        suppressContextMenu={suppressContextMenu || !!getContextMenuItems}
        getContextMenuItems={getContextMenuItems}
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
        onCellContextMenu={onCellContextMenu}
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
  );
}
