import type { RefObject } from 'react';
import type {
  BodyScrollEndEvent,
  CellClickedEvent,
  CellContextMenuEvent,
  CellDoubleClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellKeyDownEvent,
  CellValueChangedEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  FilterChangedEvent,
  FirstDataRenderedEvent,
  GetContextMenuItems,
  GridApi,
  ICellRendererParams,
  IRowNode,
  ModelUpdatedEvent,
  PaginationChangedEvent,
  RowClassParams,
  RowDoubleClickedEvent,
  RowSelectedEvent,
  RowStyle,
  SortChangedEvent,
} from 'ag-grid-community';
import type { AgGridReact, AgGridReactProps } from 'ag-grid-react';

export type GridCellAlign = 'left' | 'center' | 'right';

/**
 * Extended ColDef — stores grid metadata in `context` to avoid AG Grid unknown-property warnings.
 * Paired fields (e.g. ickId alongside ickNm) are included in revert comparison without a hidden column.
 * Type contract used by gridRowUtils, ExcelUploadModal, etc.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GridTableProps<TData = any> = {
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
  gridRef?: RefObject<AgGridReact<TData> | null>;

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
};

export type ComcdCellRendererParams = ICellRendererParams & {
  cdDmnId: string;
  /** Shown when value is '' (same as ComcdSelect.prefixOption) */
  prefixOption?: string;
};
