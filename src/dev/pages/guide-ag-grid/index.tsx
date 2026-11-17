import { useMemo, useState, useCallback } from 'react';
import { Tabs, Card, Tag } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ColGroupDef, CellClassParams, CellStyle } from 'ag-grid-community';
import CodeSnippet from '@/components/common/CodeSnippet';
import { lightTheme, darkTheme } from '@/components/grid/GridTable';
import { useThemeStore } from '@/stores/themeStore';
import '@/components/grid/GridTable.css';
import DevPageHeader from '@/dev/DevPageHeader';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Code snippets
const basicSetupCode = `import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Register the modules (once, at module top level)
ModuleRegistry.registerModules([AllCommunityModule]);

interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
}

export default function BasicGrid() {
  const [rowData] = useState<Employee[]>([
    { id: 1, name: 'Michael Chen', department: 'Engineering', position: 'Team lead', hireDate: '2020-01-15', salary: 6000000 },
    { id: 2, name: 'Emily Park', department: 'Planning', position: 'Manager', hireDate: '2021-03-20', salary: 5000000 },
    // ...
  ]);

  const [colDefs] = useState<ColDef<Employee>[]>([
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'position', headerName: 'Grade', width: 100 },
    { field: 'hireDate', headerName: 'Start date', width: 120 },
    { field: 'salary', headerName: 'Salary', width: 130, sortable: true, filter: 'agNumberColumnFilter' },
  ]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <div className="ag-theme-quartz" style={{ height: 400 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
      />
    </div>
  );
}`;

const colDefOptionsCode = `// The main ColDef properties

const columnDefs: ColDef[] = [
  {
    field: 'name',              // data field name
    headerName: 'Name',         // header text
    width: 120,                 // fixed width in pixels
    minWidth: 100,              // minimum width
    maxWidth: 200,              // maximum width
    flex: 1,                    // flexible width (a ratio)
    sortable: true,             // sortable
    filter: true,               // filterable
    resizable: true,            // resizable
    editable: true,             // editable
    hide: false,                // hidden or not
    pinned: 'left',             // pin side ('left' | 'right')
    checkboxSelection: true,    // show a checkbox
  },
];

// defaultColDef: defaults applied to every column
const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: false,        // filter input below the header
};`;

const themingCode = `// Theming

// Light theme
<div className="ag-theme-quartz" style={{ height: 400 }}>
  <AgGridReact {...props} />
</div>

// Dark theme
<div className="ag-theme-quartz-dark" style={{ height: 400 }}>
  <AgGridReact {...props} />
</div>

// Auto height (domLayout)
<AgGridReact
  domLayout="autoHeight"
  {...props}
/>

// Fixed height
<div style={{ height: 600 }}>
  <AgGridReact {...props} />
</div>`;

const formatterCode = `// valueFormatter: formats the display only — the underlying data is untouched

const columnDefs: ColDef[] = [
  {
    field: 'hireDate',
    headerName: 'Start date',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('ko-KR');
    },
  },
  {
    field: 'salary',
    headerName: 'Salary',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return 'KRW ' + params.value.toLocaleString('en-US');
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    valueFormatter: (params) => {
      const statusMap: Record<string, string> = {
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
      };
      return statusMap[params.value] || params.value;
    },
  },
];`;

const cellRendererCode = `// cellRenderer: render a cell with your own React component

import { Tag } from 'antd';
import type { CustomCellRendererProps } from 'ag-grid-react';

// Status tag renderer
const StatusRenderer = (props: CustomCellRendererProps) => {
  const { value } = props;
  const colorMap: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    pending: 'orange',
  };
  return <Tag color={colorMap[value]}>{value}</Tag>;
};

// Using it in a column definition
const columnDefs: ColDef[] = [
  {
    field: 'status',
    headerName: 'Status',
    cellRenderer: StatusRenderer,
    width: 100,
  },
];

// Avatar + name renderer
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const UserRenderer = (props: CustomCellRendererProps) => {
  const { data } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar size="small" icon={<UserOutlined />} />
      <span>{data.name}</span>
    </div>
  );
};`;

const cellStyleCode = `// cellStyle and cellClass: conditional styling

const columnDefs: ColDef[] = [
  {
    field: 'salary',
    headerName: 'Salary',
    cellStyle: (params) => {
      if (params.value > 6000000) {
        return { backgroundColor: '#fff7e6', color: '#d46b08' };
      }
      return {};
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    cellClass: (params) => {
      if (params.value === 'active') return 'cell-active';
      if (params.value === 'inactive') return 'cell-inactive';
      return '';
    },
  },
];

// The CSS
.cell-active {
  background-color: #f6ffed;
  color: #52c41a;
}
.cell-inactive {
  background-color: #f5f5f5;
  color: #8c8c8c;
}`;

const tooltipCode = `// Tooltips

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    tooltipField: 'name',  // show the field value as the tooltip
  },
  {
    field: 'department',
    headerName: 'Department',
    tooltipValueGetter: (params) => {
      return \`Department: \${params.data.department}, team size: \${params.data.teamSize}\`;
    },
  },
];

// Global tooltip settings
<AgGridReact
  tooltipShowDelay={500}
  tooltipHideDelay={2000}
  {...props}
/>`;

const cellEditorBasicCode = `// The built-in cell editors

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    editable: true,
    cellEditor: 'agTextCellEditor',
  },
  {
    field: 'age',
    headerName: 'Age',
    editable: true,
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      max: 100,
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    editable: true,
    cellEditor: 'agLargeTextCellEditor',
    cellEditorPopup: true,
    cellEditorParams: {
      maxLength: 1000,
      rows: 10,
      cols: 50,
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['active', 'inactive', 'pending'],
    },
  },
];`;

const customCellEditorCode = `// The custom cell editor pattern

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { CustomCellEditorProps } from 'ag-grid-react';

export interface DateCellEditorProps extends CustomCellEditorProps {
  format?: string;
}

const DateCellEditor = forwardRef((props: DateCellEditorProps, ref) => {
  const { value, onValueChange, format = 'YYYY-MM-DD' } = props;
  const inputRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => value,
    afterGuiAttached: () => {
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  }));

  const handleChange = (date: dayjs.Dayjs | null) => {
    const newValue = date ? date.format(format) : null;
    onValueChange(newValue);
  };

  return (
    <DatePicker
      ref={inputRef}
      value={value ? dayjs(value) : null}
      onChange={handleChange}
      format={format}
      style={{ width: '100%' }}
    />
  );
});

// Usage
const columnDefs: ColDef[] = [
  {
    field: 'hireDate',
    headerName: 'Start date',
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorParams: {
      format: 'YYYY-MM-DD',
    },
  },
];`;

const projectEditorsCode = `// The custom editors in this project (src/components/grid/cellEditors/)

import DateCellEditor from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';
import NumberCellEditor from '@/components/grid/cellEditors/NumberCellEditor';

const columnDefs: ColDef[] = [
  {
    field: 'dueDate',
    headerName: 'Completed on',
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorParams: {
      format: 'YYYY-MM-DD',
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: {
      values: ['todo', 'inprogress', 'done'],
      valueLabels: { todo: 'To do', inprogress: 'In progress', done: 'Done' },
    },
  },
  {
    field: 'tags',
    headerName: 'Tags',
    editable: true,
    cellEditor: TagsCellEditor,
    cellEditorParams: {
      presetTags: ['Urgent', 'Important', 'Needs review', 'On hold'],
    },
  },
  {
    field: 'manDay',
    headerName: 'Effort (MD)',
    editable: true,
    cellEditor: NumberCellEditor,
    cellEditorParams: { min: 0, precision: 1 },
  },
];

// The onCellValueChanged event
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  onCellValueChanged={(event) => {
    console.log('new value:', event.newValue);
    console.log('old value:', event.oldValue);
    console.log('row data:', event.data);
    console.log('column:', event.column.getColId());
  }}
/>`;

const rowSelectionCode = `// Row selection

const [selectedRows, setSelectedRows] = useState([]);

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    checkboxSelection: true,  // on the first column only
    headerCheckboxSelection: true,  // select-all checkbox in the header
  },
  // ... other columns
];

<AgGridReact
  rowSelection="multiple"  // 'single' | 'multiple'
  suppressRowClickSelection={true}  // only the checkbox selects
  onSelectionChanged={(event) => {
    const rows = event.api.getSelectedRows();
    setSelectedRows(rows);
    console.log('selected rows:', rows);
  }}
  columnDefs={columnDefs}
  rowData={rowData}
/>

// Reading the selected rows through the API
const gridRef = useRef<AgGridReact>(null);

const handleGetSelected = () => {
  const selectedNodes = gridRef.current!.api.getSelectedRows();
  console.log(selectedNodes);
};

<AgGridReact ref={gridRef} {...props} />`;

const sortingCode = `// Sorting

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    sortable: true,
    sort: 'asc',  // initial sort ('asc' | 'desc')
  },
  {
    field: 'salary',
    headerName: 'Salary',
    sortable: true,
    comparator: (a, b) => {
      // custom comparator
      return a - b;
    },
  },
];

// Multi-column sorting
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  multiSortKey="ctrl"  // hold Ctrl and click to sort by several columns
/>

// Setting the sort through the API
gridRef.current!.api.applyColumnState({
  state: [
    { colId: 'department', sort: 'asc' },
    { colId: 'salary', sort: 'desc' },
  ],
});`;

const filteringCode = `// Filters

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Name',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains', 'equals', 'startsWith', 'endsWith'],
      defaultOption: 'contains',
      suppressAndOrCondition: true,
    },
  },
  {
    field: 'salary',
    headerName: 'Salary',
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
    },
  },
  {
    field: 'hireDate',
    headerName: 'Start date',
    filter: 'agDateColumnFilter',
    filterParams: {
      comparator: (filterDate: Date, cellValue: string) => {
        const cellDate = new Date(cellValue);
        if (cellDate < filterDate) return -1;
        if (cellDate > filterDate) return 1;
        return 0;
      },
    },
  },
];

// Floating filters (an input row below the header)
const defaultColDef: ColDef = {
  filter: true,
  floatingFilter: true,
};

// Quick filter (searches every column)
const [quickFilter, setQuickFilter] = useState('');

<Input
  placeholder="Search everything..."
  value={quickFilter}
  onChange={(e) => setQuickFilter(e.target.value)}
  style={{ marginBottom: 8, width: 200 }}
/>
<AgGridReact
  quickFilterText={quickFilter}
  {...props}
/>`;


// ── Header grouping snippets ──

const headerGroupCode = `// Header grouping: a children array makes a column group
const [columnDefs] = useState<(ColDef | ColGroupDef)[]>([
  { field: 'name', headerName: 'Name', width: 120, pinned: 'left' },
  {
    headerName: 'HR information',  // group header text
    children: [                     // the child columns
      { field: 'department', headerName: 'Department' },
      { field: 'position', headerName: 'Grade' },
      { field: 'hireDate', headerName: 'Start date' },
    ],
  },
  {
    headerName: 'Compensation',
    children: [
      { field: 'salary', headerName: 'Base salary' },
      { field: 'bonus', headerName: 'Bonus' },
      { field: 'totalPay', headerName: 'Total pay' },
    ],
  },
]);`;

const headerGroupAdvancedCode = `// Multi-level header groups (nested)
const columnDefs: (ColDef | ColGroupDef)[] = [
  { field: 'name', headerName: 'Name' },
  {
    headerName: 'Attendance',
    children: [
      {
        headerName: 'Presence',
        children: [
          { field: 'attendance', headerName: 'Days present' },
          { field: 'absence', headerName: 'Days absent' },
        ],
      },
      {
        headerName: 'Performance',
        children: [
          { field: 'kpi', headerName: 'KPI' },
          { field: 'evaluation', headerName: 'Rating' },
        ],
      },
    ],
  },
];

// Expanding and collapsing groups (columnGroupShow)
const columnDefs2 = [
  {
    headerName: 'Amount detail',
    children: [
      // shown while the group is collapsed
      { field: 'totalPay', headerName: 'Total', columnGroupShow: 'closed' },
      // shown while the group is expanded
      { field: 'salary', headerName: 'Base salary', columnGroupShow: 'open' },
      { field: 'bonus', headerName: 'Bonus', columnGroupShow: 'open' },
      { field: 'tax', headerName: 'Tax', columnGroupShow: 'open' },
    ],
  },
];`;

// ── Cell / row spanning snippets ──

const colSpanCode = `// colSpan: let a cell span several columns under a condition
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: 'Category',
    width: 120,
    // On a subtotal row, merge Category and Item into one cell
    colSpan: (params) => params.data.category?.includes('Subtotal') ? 2 : 1,
    cellStyle: (params) => {
      if (params.data.category?.includes('Subtotal')) {
        return { fontWeight: 'bold', backgroundColor: '#f5f5f5' };
      }
      return undefined;
    },
  },
  { field: 'item', headerName: 'Item', width: 120 },
  { field: 'q1', headerName: 'Q1', type: 'numericColumn' },
  { field: 'q2', headerName: 'Q2', type: 'numericColumn' },
  { field: 'q3', headerName: 'Q3', type: 'numericColumn' },
  { field: 'q4', headerName: 'Q4', type: 'numericColumn' },
];

// Data with subtotal rows
const rowData = [
  { category: 'Revenue', item: 'Product A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { category: 'Revenue', item: 'Product B', q1: 800,  q2: 900,  q3: 950,  q4: 1100 },
  { category: 'Revenue Subtotal', item: '',  q1: 2000, q2: 2400, q3: 2050, q4: 2900 },
  // On a subtotal row the Category cell spans into the Item column
];`;

const rowSpanCode = `// rowSpan: merge cells across consecutive rows with the same value
// Note: an AG Grid v35+ Community feature (needs CellSpanModule)
import { CellSpanModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([CellSpanModule]);

const columnDefs: ColDef[] = [
  {
    field: 'department',
    headerName: 'Department',
    spanRows: true,       // merge identical consecutive values
    sort: 'asc',          // merging only makes sense on sorted data
  },
  { field: 'name', headerName: 'Name' },
  { field: 'position', headerName: 'Grade' },
];

// enableCellSpan must be set on the grid
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  enableCellSpan={true}
/>`;

// ── Footer / pinned row snippets ──

const pinnedRowCode = `// pinnedTopRowData: rows pinned to the top, below the header
// pinnedBottomRowData: rows pinned to the bottom (a footer)
const pinnedTopRowData = useMemo(() => [
  { name: '[ Average ]', department: '-', position: '-', salary: 5460000 },
], []);

const pinnedBottomRowData = useMemo(() => [
  { name: '[ Total ]', department: '-', position: '-', salary: 27300000 },
], []);

<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  pinnedTopRowData={pinnedTopRowData}
  pinnedBottomRowData={pinnedBottomRowData}
/>`;

const pinnedRowStyleCode = `// Styling pinned rows
const defaultColDef: ColDef = {
  cellStyle: (params) => {
    // Pinned rows get a background color and bold text
    if (params.node.rowPinned) {
      return {
        fontWeight: 'bold',
        backgroundColor: 'var(--content-header-bg, #f5f5f5)',
      };
    }
    return undefined;
  },
};

// getRowStyle styles the whole row
const getRowStyle = (params) => {
  if (params.node.rowPinned === 'bottom') {
    return { fontWeight: 'bold', background: '#f0f0f0' };
  }
  return undefined;
};

<AgGridReact
  getRowStyle={getRowStyle}
  pinnedBottomRowData={pinnedBottomRowData}
/>`;

const manualGroupingCode = `// Recreating row grouping in the Community edition
// Approach: sort by group, insert subtotal rows, hide repeats with valueFormatter, add colSpan and a separator line

interface SalesRow {
  category: string;
  item: string;
  q1: number;
  q2: number;
  isSubtotal?: boolean;  // marks a subtotal row
}

// Step 1: sort the source data by group and insert subtotal rows
function buildGroupedData(rawData: SalesRow[]): SalesRow[] {
  const groups = new Map<string, SalesRow[]>();
  rawData.forEach(row => {
    const list = groups.get(row.category) || [];
    list.push(row);
    groups.set(row.category, list);
  });

  const result: SalesRow[] = [];
  groups.forEach((rows, category) => {
    result.push(...rows);
    // append the subtotal row
    result.push({
      category: category + ' Subtotal',
      item: '',
      q1: rows.reduce((s, r) => s + r.q1, 0),
      q2: rows.reduce((s, r) => s + r.q2, 0),
      isSubtotal: true,
    });
  });
  return result;
}

// Step 2: valueFormatter (hide repeats) + colSpan + cellStyle to set subtotal rows apart
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: 'Category',
    // Repeat categories render as an empty string — the row-grouping effect
    valueFormatter: (params) => {
      if (params.data?.isSubtotal) return params.value;
      const idx = params.node?.rowIndex ?? 0;
      if (idx === 0) return params.value;
      // hide it when the previous row has the same category
      const prevData = params.api.getDisplayedRowAtIndex(idx - 1)?.data;
      return prevData?.category === params.value ? '' : params.value;
    },
    colSpan: (params) => params.data?.isSubtotal ? 2 : 1,
    cellStyle: (params) => {
      const style: any = {};
      if (params.data?.isSubtotal) {
        style.fontWeight = 'bold';
        style.backgroundColor = '#f0f0f0';
      }
      // a top border on the first row of each group
      const idx = params.node?.rowIndex ?? 0;
      if (idx > 0 && !params.data?.isSubtotal) {
        const prevData = params.api.getDisplayedRowAtIndex(idx - 1)?.data;
        if (prevData?.category !== params.data?.category) {
          style.borderTop = '2px solid #d9d9d9';
        }
      }
      return Object.keys(style).length ? style : undefined;
    },
  },
  { field: 'item', headerName: 'Item' },
  { field: 'q1', headerName: 'Q1', type: 'numericColumn' },
  { field: 'q2', headerName: 'Q2', type: 'numericColumn' },
];

// Step 3: add the grand total row with pinnedBottomRowData
const totalRow = useMemo(() => [{
  category: 'Grand total',
  item: '',
  q1: data.reduce((s, r) => s + r.q1, 0),
  q2: data.reduce((s, r) => s + r.q2, 0),
  isSubtotal: true,
}], [data]);

<AgGridReact
  rowData={groupedData}
  columnDefs={columnDefs}
  pinnedBottomRowData={totalRow}
/>`;

// ── Column pinning snippets ──

const columnPinningCode = `// Column pinning
const columnDefs: ColDef[] = [
  // Pinned left: ID and name
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',        // pinned to the left
    lockPinned: true,       // cannot be unpinned by dragging
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 120,
    pinned: 'left',
    lockPosition: 'left',  // the column cannot be moved at all
  },

  // Regular columns (they scroll)
  { field: 'department', headerName: 'Department', flex: 1 },
  { field: 'position', headerName: 'Grade', flex: 1 },
  { field: 'hireDate', headerName: 'Start date', flex: 1 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'phone', headerName: 'Phone', width: 150 },

  // Pinned right: salary and actions
  {
    field: 'salary',
    headerName: 'Salary',
    width: 130,
    pinned: 'right',
    type: 'numericColumn',
  },
];`;

const dynamicPinningCode = `// Pinning and unpinning columns through the API
// Use gridRef.current.api

// Pin a column to the left
api.setColumnsPinned(['name', 'id'], 'left');

// Pin a column to the right
api.setColumnsPinned(['salary'], 'right');

// Unpin
api.setColumnsPinned(['name'], null);

// Or configure it per column definition
const colDef: ColDef = {
  field: 'name',
  pinned: 'left',
  lockPinned: true,      // the user cannot unpin it
  lockPosition: 'left',  // it cannot be moved elsewhere
  suppressMovable: true,  // dragging is disabled entirely
};

// The context menu can pin columns too
// Right-click a column header -> "Pin Column" -> Left / Right / No Pin`;

// ── Clipboard snippets ──

const clipboardBasicCode = `// Turn on enableClipboard on the GridTable component
<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  rowSelection="multiRow"    // row selection is required
  enableClipboard            // enables the clipboard feature
  editable                   // pasting only works in edit mode
  onCellValueChanged={handleCellValueChanged}
/>

// How to use it:
// 1. Select rows with the checkboxes (several at a time)
// 2. Ctrl+C copies the selected rows as tab-separated text, header included
// 3. Ctrl+V pastes straight into Excel or Google Sheets
// 4. In edit mode, Ctrl+V writes the clipboard data into the cells`;

const clipboardImplCode = `// The core of the clipboard implementation in GridTable.tsx
useEffect(() => {
  if (!enableClipboard) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!container.contains(e.target as Node)) return;
    const api = gridRef.current?.api;
    if (!api) return;

    // Ctrl+C: copy the selected rows as tab-separated text
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      const selectedRows = api.getSelectedRows();
      if (selectedRows.length === 0) return;

      // turn the header and data into tab-separated text
      const headers = visibleCols.map(c => c.headerName);
      const lines = selectedRows.map(row =>
        visibleCols.map(c => row[c.field] ?? '').join('\\t')
      );
      const text = [headers.join('\\t'), ...lines].join('\\n');

      e.preventDefault();
      navigator.clipboard.writeText(text);
      message.success(selectedRows.length + ' rows copied');
    }

    // Ctrl+V: paste from the clipboard starting at the focused cell
    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && editable) {
      const focused = api.getFocusedCell();
      if (!focused) return;

      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const rows = text.split('\\n').map(l => l.split('\\t'));
        rows.forEach((vals, rowOff) => {
          const rowNode = api.getDisplayedRowAtIndex(
            focused.rowIndex + rowOff
          );
          vals.forEach((val, colOff) => {
            const col = visibleCols[startColIdx + colOff];
            if (col?.editable !== false) {
              rowNode?.setDataValue(col.field, val);
            }
          });
        });
      });
    }
  };

  // capture: true -> works regardless of AG Grid stopping the event internally
  document.addEventListener('keydown', handleKeyDown, true);
  return () => document.removeEventListener('keydown', handleKeyDown, true);
}, [enableClipboard, columnDefs, editable]);`;

// ── Demo data ──

interface GroupDemoRow {
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  bonus: number;
}

const groupDemoData: GroupDemoRow[] = [
  { name: 'Michael Chen', department: 'Engineering', position: 'Team lead', hireDate: '2020-01-15', salary: 6500000, bonus: 1000000 },
  { name: 'David Kim', department: 'Engineering', position: 'Associate', hireDate: '2022-05-10', salary: 4500000, bonus: 600000 },
  { name: 'Grace Han', department: 'Engineering', position: 'Staff', hireDate: '2024-02-01', salary: 3500000, bonus: 400000 },
  { name: 'Emily Park', department: 'Planning', position: 'Manager', hireDate: '2021-03-20', salary: 5500000, bonus: 800000 },
  { name: 'Sophia Jung', department: 'Design', position: 'Staff', hireDate: '2023-07-01', salary: 3800000, bonus: 500000 },
  { name: 'Peter Han', department: 'Sales', position: 'Director', hireDate: '2019-11-05', salary: 7000000, bonus: 1200000 },
];

interface SpanDemoRow {
  category: string;
  item: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

const spanDemoData: SpanDemoRow[] = [
  { category: 'Revenue', item: 'Product A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { category: 'Revenue', item: 'Product B', q1: 800, q2: 900, q3: 950, q4: 1100 },
  { category: 'Revenue', item: 'Product C', q1: 600, q2: 700, q3: 750, q4: 800 },
  { category: 'Revenue Subtotal', item: '', q1: 2600, q2: 3100, q3: 2800, q4: 3700 },
  { category: 'Cost', item: 'Payroll', q1: 2000, q2: 2000, q3: 2100, q4: 2100 },
  { category: 'Cost', item: 'Operations', q1: 500, q2: 550, q3: 520, q4: 600 },
  { category: 'Cost', item: 'Marketing', q1: 300, q2: 400, q3: 350, q4: 500 },
  { category: 'Cost Subtotal', item: '', q1: 2800, q2: 2950, q3: 2970, q4: 3200 },
];

// Data for the row-spanning demo
interface RowSpanDemoRow {
  department: string;
  team: string;
  name: string;
  role: string;
}

const rowSpanDemoData: RowSpanDemoRow[] = [
  { department: 'Engineering', team: 'Front-end', name: 'Michael Chen', role: 'Team lead' },
  { department: 'Engineering', team: 'Front-end', name: 'Emily Park', role: 'Senior' },
  { department: 'Engineering', team: 'Backend', name: 'David Kim', role: 'Team lead' },
  { department: 'Engineering', team: 'Backend', name: 'Grace Han', role: 'Junior' },
  { department: 'Engineering', team: 'Backend', name: 'Hugo Cho', role: 'Junior' },
  { department: 'Corporate', team: 'HR', name: 'Sophia Jung', role: 'Manager' },
  { department: 'Corporate', team: 'HR', name: 'Peter Han', role: 'Associate' },
  { department: 'Corporate', team: 'Finance', name: 'Mira Yoon', role: 'Team lead' },
];

interface SampleEmployee {
  id: number;
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
}

export default function GuideAgGrid() {
  const mode = useThemeStore((s) => s.mode);

  const [sampleData] = useState<SampleEmployee[]>([
    { id: 1, name: 'Michael Chen', department: 'Engineering', position: 'Team lead', hireDate: '2020-01-15', salary: 6500000 },
    { id: 2, name: 'Emily Park', department: 'Planning', position: 'Manager', hireDate: '2021-03-20', salary: 5500000 },
    { id: 3, name: 'David Kim', department: 'Engineering', position: 'Associate', hireDate: '2022-05-10', salary: 4500000 },
    { id: 4, name: 'Sophia Jung', department: 'Design', position: 'Staff', hireDate: '2023-07-01', salary: 3800000 },
    { id: 5, name: 'Peter Han', department: 'Sales', position: 'Director', hireDate: '2019-11-05', salary: 7000000 },
  ]);

  const [sampleColDefs] = useState<ColDef<SampleEmployee>[]>([
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'department', headerName: 'Department', flex: 1 },
    { field: 'position', headerName: 'Grade', width: 100 },
    {
      field: 'hireDate',
      headerName: 'Start date',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('ko-KR');
      }
    },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 130,
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return 'KRW ' + params.value.toLocaleString('en-US');
      }
    },
  ]);

  // ── Header grouping demo ──
  const [headerGroupColDefs] = useState<(ColDef<GroupDemoRow> | ColGroupDef)[]>([
    { field: 'name', headerName: 'Name', width: 120, pinned: 'left' },
    {
      headerName: 'HR information',
      children: [
        { field: 'department', headerName: 'Department', width: 110 },
        { field: 'position', headerName: 'Grade', width: 100 },
        { field: 'hireDate', headerName: 'Start date', width: 120,
          valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '' },
      ],
    },
    {
      headerName: 'Compensation',
      children: [
        { field: 'salary', headerName: 'Base salary', width: 130,
          valueFormatter: (p) => 'KRW ' + p.value?.toLocaleString('en-US') },
        { field: 'bonus', headerName: 'Bonus', width: 120,
          valueFormatter: (p) => 'KRW ' + p.value?.toLocaleString('en-US') },
        { headerName: 'Total pay', width: 140,
          valueGetter: (p) => (p.data?.salary ?? 0) + (p.data?.bonus ?? 0),
          valueFormatter: (p) => 'KRW ' + p.value?.toLocaleString('en-US') },
      ],
    },
  ]);

  // ── Cell spanning demo (colSpan) ──
  const [spanColDefs] = useState<ColDef<SpanDemoRow>[]>([
    { field: 'category', headerName: 'Category', width: 120,
      colSpan: (params) => {
        // On a subtotal row, merge Category and Item into one cell
        if (params.data?.category?.includes('Subtotal')) return 2;
        return 1;
      },
      cellStyle: (params) => {
        if (params.data?.category?.includes('Subtotal')) {
          return { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' };
        }
        return undefined;
      },
    },
    { field: 'item', headerName: 'Item', width: 120,
      cellStyle: (params) => {
        if (params.data?.category?.includes('Subtotal')) {
          return { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' };
        }
        return undefined;
      },
    },
    { field: 'q1', headerName: 'Q1', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q2', headerName: 'Q2', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q3', headerName: 'Q3', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q4', headerName: 'Q4', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
  ]);

  // ── Row spanning demo (spanRows) ──
  const [rowSpanColDefs] = useState<ColDef<RowSpanDemoRow>[]>([
    { field: 'department', headerName: 'Division', width: 130, spanRows: true, sort: 'asc' as const,
      cellStyle: { fontWeight: 'bold' },
    },
    { field: 'team', headerName: 'Team', width: 130, spanRows: true, sort: 'asc' as const },
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'role', headerName: 'Grade', width: 100 },
  ]);

  // ── Footer (pinned row) demo ──
  const pinnedBottomData = useMemo<Partial<SampleEmployee>[]>(() => [
    {
      id: 0,
      name: 'Total',
      department: '-',
      position: '-',
      hireDate: '',
      salary: sampleData.reduce((sum, row) => sum + row.salary, 0),
    },
  ], [sampleData]);

  const footerDefaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: (params) => {
      if (params.node.rowPinned) {
        return { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' };
      }
      return undefined;
    },
  };

  // ── Hand-rolled grouping demo ──
  const groupedRowData = useMemo<SpanDemoRow[]>(() => spanDemoData, []);
  const groupTotalRow = useMemo<Partial<SpanDemoRow>[]>(() => [{
    category: 'Grand total',
    item: '',
    q1: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q1, 0),
    q2: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q2, 0),
    q3: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q3, 0),
    q4: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q4, 0),
  }], []);
  // A row starts a group when its category differs from the previous row's
  const isGroupFirstRow = useCallback((params: { data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || !params.node || params.node.rowIndex === null) return false;
    const idx = params.node.rowIndex;
    if (idx === 0) return true;
    const prevRow = groupedRowData[idx - 1];
    return prevRow?.category !== params.data.category;
  }, []);

  // Hide repeated categories (subtotal and grand total rows excepted)
  const categoryValueFormatter = useCallback((params: { value?: string; data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || params.data.category.includes('Subtotal')) return params.value ?? '';
    if (!params.node || params.node.rowIndex === null) return params.value ?? '';
    const idx = params.node.rowIndex;
    if (idx === 0) return params.value ?? '';
    const prevRow = groupedRowData[idx - 1];
    if (prevRow && prevRow.category === params.data.category) return '';  // hide the repeat
    return params.value ?? '';
  }, []);

  // Subtotal and group styling
  const groupCellStyle = useCallback((params: CellClassParams<SpanDemoRow>) => {
    const base: CellStyle = {};
    if (params.data?.category?.includes('Subtotal') || params.node?.rowPinned) {
      base.fontWeight = 'bold';
      base.backgroundColor = 'var(--content-header-bg, #f0f0f0)';
    }
    if (isGroupFirstRow(params) && !params.data?.category?.includes('Subtotal')) {
      base.borderTop = '2px solid var(--border-color, #d9d9d9)';
    }
    return Object.keys(base).length > 0 ? base : undefined;
  }, [isGroupFirstRow]);

  const groupColDefs = useMemo<ColDef<SpanDemoRow>[]>(() => [
    { field: 'category', headerName: 'Category', width: 120,
      colSpan: (params) => params.data?.category?.includes('Subtotal') || params.data?.category === 'Grand total' ? 2 : 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valueFormatter: categoryValueFormatter as any,
      cellStyle: groupCellStyle,
    },
    { field: 'item', headerName: 'Item', width: 120,
      cellStyle: (params) => params.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q1', headerName: 'Q1', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q2', headerName: 'Q2', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q3', headerName: 'Q3', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q4', headerName: 'Q4', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
  ], [categoryValueFormatter, groupCellStyle]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // ── Column pinning demo ──
  const pinnedColDefs = useMemo<ColDef[]>(() => [
    { field: 'id', headerName: 'ID', width: 70, pinned: 'left', lockPinned: true },
    { field: 'name', headerName: 'Name', width: 100, pinned: 'left', lockPinned: true },
    { field: 'department', headerName: 'Department', width: 120 },
    { field: 'position', headerName: 'Grade', width: 100 },
    { field: 'hireDate', headerName: 'Start date', width: 120 },
    { field: 'department', headerName: 'Team', width: 120 },
    { field: 'position', headerName: 'Role', width: 100 },
    { field: 'salary', headerName: 'Salary', width: 130, pinned: 'right', type: 'numericColumn',
      valueFormatter: (p) => p.value ? `KRW ${p.value.toLocaleString()}` : '' },
  ], []);

  const tabItems = [
    {
      key: '1',
      label: 'Basic setup',
      children: (
        <div className="demo-section">
          <h3>Getting started with AG Grid</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            AG Grid is an enterprise-grade data grid. We use the Community edition, which covers almost everything for free.
          </p>

          <Card title="Live demo" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={sampleData}
                columnDefs={sampleColDefs}
                defaultColDef={defaultColDef}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <h3>Basic usage</h3>
          <CodeSnippet code={basicSetupCode} title="Basic grid setup" />

          <h3 style={{ marginTop: 24 }}>ColDef properties</h3>
          <CodeSnippet code={colDefOptionsCode} title="The main column options" />

          <h3 style={{ marginTop: 24 }}>Theme and layout</h3>
          <CodeSnippet code={themingCode} title="Theming" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Things to watch out for</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>Call ModuleRegistry.registerModules once, outside any component, at module top level</li>
              <li>Import both ag-grid.css and ag-theme-quartz.css</li>
              <li>Apply the theme class to the div wrapping the grid</li>
              <li>For a fixed height, set style.height or domLayout="autoHeight"</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: 'Cell renderers & formatters',
      children: (
        <div className="demo-section">
          <h3>valueFormatter</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Changes how a cell value is displayed. The underlying data is untouched.
          </p>
          <CodeSnippet code={formatterCode} title="Value formatting" />

          <h3 style={{ marginTop: 24 }}>cellRenderer</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Renders a cell with your own React component, so tags, avatars and richer UI are all possible.
          </p>
          <CodeSnippet code={cellRendererCode} title="Custom cell renderers" />

          <h3 style={{ marginTop: 24 }}>cellStyle / cellClass</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Changes a cell's style dynamically based on a condition.
          </p>
          <CodeSnippet code={cellStyleCode} title="Conditional styling" />

          <h3 style={{ marginTop: 24 }}>Tooltips</h3>
          <CodeSnippet code={tooltipCode} title="Cell tooltips" />
        </div>
      ),
    },
    {
      key: '3',
      label: 'Cell editors',
      children: (
        <div className="demo-section">
          <h3>Built-in cell editors</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            AG Grid ships editors for text, numbers, large text and select inputs.
          </p>
          <CodeSnippet code={cellEditorBasicCode} title="Using the built-in editors" />

          <h3 style={{ marginTop: 24 }}>Custom cell editors</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Custom editors are built with the React forwardRef + useImperativeHandle pattern.
            <br />
            You must implement <code>getValue()</code> and <code>afterGuiAttached()</code>.
          </p>
          <CodeSnippet code={customCellEditorCode} title="The custom editor pattern" />

          <h3 style={{ marginTop: 24 }}>The editors in this project</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Five custom editors are provided: DateCellEditor, SelectCellEditor, NumberCellEditor, TagsCellEditor and TextAreaCellEditor.
          </p>
          <CodeSnippet code={projectEditorsCode} title="Using the project's custom editors" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Editor tips</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>editable takes a boolean or a function, so editing can be conditional</li>
              <li>cellEditorParams passes extra configuration to the editor</li>
              <li>onCellValueChanged is where you react to a value change</li>
              <li>cellEditorPopup: true switches the editor into popup mode</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '4',
      label: 'Selection, sorting & filtering',
      children: (
        <div className="demo-section">
          <h3>Row selection</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Single and multiple row selection through checkboxes.
          </p>
          <CodeSnippet code={rowSelectionCode} title="Row selection setup" />

          <h3 style={{ marginTop: 24 }}>Sorting</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Click a column header to sort ascending or descending; multi-column sorting is supported too.
          </p>
          <CodeSnippet code={sortingCode} title="Sorting setup" />

          <h3 style={{ marginTop: 24 }}>Filtering</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Text, number and date filters, plus floating filters and quick search.
          </p>
          <CodeSnippet code={filteringCode} title="Filter setup" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Tips</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>multiSortKey="ctrl" enables Ctrl+click multi-column sorting</li>
              <li>floatingFilter: true shows an inline filter row below the header</li>
              <li>quickFilterText searches across every column</li>
              <li>suppressRowClickSelection: true makes the checkbox the only way to select</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '6',
      label: 'Header grouping',
      children: (
        <div className="demo-section">
          <h3>Column header groups</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            A <code>children</code> array groups related columns together.
            Group headers can be nested several levels deep, and the Community edition supports it.
          </p>

          <Card title="Live demo — header grouping" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={groupDemoData}
                columnDefs={headerGroupColDefs}
                defaultColDef={defaultColDef}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <h3>A basic header group</h3>
          <CodeSnippet code={headerGroupCode} title="Header group setup" />

          <h3 style={{ marginTop: 24 }}>Nested groups and expand/collapse</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>columnGroupShow</code> controls which columns appear when a group is expanded or collapsed.
          </p>
          <CodeSnippet code={headerGroupAdvancedCode} title="Nested groups & columnGroupShow" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Key points</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>A column with a <code>children</code> array automatically becomes a group header</li>
              <li>Nesting works: children inside children gives multi-level headers</li>
              <li><code>columnGroupShow: 'open' | 'closed'</code> decides visibility per expand state</li>
              <li><code>headerGroupComponent</code> renders a custom group header</li>
              <li><code>marryChildren: true</code> keeps group columns from being moved out</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '7',
      label: 'Cell & row spanning',
      children: (
        <div className="demo-section">
          <h3>Column Spanning (colSpan)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            The <code>colSpan</code> callback lets a cell span several columns under a condition.
            Useful for subtotal rows and section headings.
          </p>

          <Card title="Live demo — colSpan (the Category column)" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={spanDemoData}
                columnDefs={spanColDefs}
                defaultColDef={{ resizable: true }}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={colSpanCode} title="colSpan example" />

          <h3 style={{ marginTop: 24 }}>Row Spanning (spanRows)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Automatically merges cells across consecutive rows with the same value.
            It uses <code>CellSpanModule</code> from AG Grid v35+ Community (included in <code>AllCommunityModule</code>).
          </p>

          <Card title="Live demo — spanRows (division and team merged automatically)" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 320 }}>
              <AgGridReact
                rowData={rowSpanDemoData}
                columnDefs={rowSpanColDefs}
                defaultColDef={{ resizable: true, flex: 1 }}
                enableCellSpan={true}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={rowSpanCode} title="Row spanning (enableCellSpan)" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Key points</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>colSpan</code>: a function — <code>(params) =&gt; number</code> (1 means no spanning)</li>
              <li><code>spanRows: true</code>: merges consecutive identical values (the data must be sorted)</li>
              <li>Row spanning only works when <code>enableCellSpan: true</code> is set on <code>AgGridReact</code></li>
              <li>Style spanned cells separately through the <code>cellStyle</code> callback</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '8',
      label: 'Footer & pinned rows',
      children: (
        <div className="demo-section">
          <h3>Pinned rows</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>pinnedTopRowData</code> and <code>pinnedBottomRowData</code> add rows pinned to the top or bottom.
            They make natural footers for totals, averages and summaries.{' '}
            <Tag color="green">Community</Tag>
          </p>

          <Card title="Live demo — footer (a total row at the bottom)" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 300 }}>
              <AgGridReact
                rowData={sampleData}
                columnDefs={sampleColDefs}
                defaultColDef={footerDefaultColDef}
                pinnedBottomRowData={pinnedBottomData}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={pinnedRowCode} title="Basic pinned rows" />

          <h3 style={{ marginTop: 24 }}>Styling pinned rows</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Check <code>params.node.rowPinned</code> to tell a pinned row apart and style it.
          </p>
          <CodeSnippet code={pinnedRowStyleCode} title="Customizing pinned row styles" />

          <h3 style={{ marginTop: 24 }}>Recreating grouping by hand</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Sort the data by group, insert subtotal rows, then combine <code>valueFormatter</code> (hide repeated values), <code>colSpan</code> (merge the subtotal columns), <code>cellStyle</code> (a group separator line) and <code>pinnedBottomRowData</code> (the grand total footer) —
            and the Community edition gets an effect close to real row grouping.
          </p>

          <Card title="Live demo — hand-rolled grouping (hidden repeats + colSpan + grand total footer)" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 380 }}>
              <AgGridReact
                rowData={groupedRowData}
                columnDefs={groupColDefs}
                defaultColDef={{ resizable: true }}
                pinnedBottomRowData={groupTotalRow}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={manualGroupingCode} title="Hand-rolled grouping in the Community edition" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Key points</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>pinnedTopRowData</code>: rows pinned under the header (summaries, search rows)</li>
              <li><code>pinnedBottomRowData</code>: rows pinned below the scroll area (totals, footers)</li>
              <li><code>params.node.rowPinned</code>: <code>'top' | 'bottom' | undefined</code></li>
              <li>Wrap pinned row data in useMemo</li>
              <li>Grouping: preprocess the data (insert subtotal rows) and combine valueFormatter (hide repeats), colSpan and cellStyle (separator line)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '9',
      label: 'Column pinning',
      children: (
        <div className="demo-section">
          <h3>Column pinning</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            The <code>pinned</code> property pins a column to the left or the right.
            Pinned columns stay visible while scrolling, which suits identifying columns such as ID and name, or a column of action buttons.
            <Tag color="green" style={{ marginLeft: 8 }}>Community</Tag>
          </p>

          <Card title="Live demo — columns pinned left and right" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 300 }}>
              <AgGridReact
                rowData={sampleData}
                columnDefs={pinnedColDefs}
                defaultColDef={{ resizable: true, filter: true, sortable: true }}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={columnPinningCode} title="Basic column pinning" />

          <h3 style={{ marginTop: 24 }}>Pinning at runtime</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Pinning can be changed at runtime through the API.
            Users can also pin and unpin from the built-in context menu by right-clicking a column header.
          </p>
          <CodeSnippet code={dynamicPinningCode} title="Pinning and unpinning at runtime" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Key points</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>pinned: 'left'</code>: pinned to the left while scrolling</li>
              <li><code>pinned: 'right'</code>: pinned to the right — handy for action buttons</li>
              <li><code>lockPinned: true</code>: the user cannot unpin it by dragging</li>
              <li><code>lockPosition: 'left'</code>: the column cannot be moved at all</li>
              <li>Change it at runtime: <code>api.setColumnsPinned(['col'], 'left')</code></li>
              <li>Give pinned columns a fixed <code>width</code> rather than <code>flex</code></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: 'clipboard',
      label: 'Copy & paste',
      children: (
        <div className="demo-section">
          <h3>Clipboard (copy and paste)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            The Community edition's built-in clipboard support is limited, so the
            <code>GridTable</code> wrapper adds a custom <code>enableClipboard</code> prop that implements
            <strong> Ctrl+C (copy)</strong> and <strong>Ctrl+V (paste)</strong> itself.
            <Tag color="blue" style={{ marginLeft: 8 }}>custom</Tag>
          </p>

          <Card title="How to use it" style={{ marginBottom: 16 }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', width: 140 }}>Shortcut</th>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                  <th style={{ padding: '8px 12px', width: 100 }}>Requires</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}><code>Ctrl+C</code></td>
                  <td style={{ padding: '8px 12px' }}>Copies the selected rows to the clipboard as tab-separated text, header included</td>
                  <td style={{ padding: '8px 12px' }}>Selected rows</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}><code>Ctrl+V</code></td>
                  <td style={{ padding: '8px 12px' }}>Pastes the clipboard data starting at the focused cell, mapped row by row and column by column</td>
                  <td style={{ padding: '8px 12px' }}><code>editable</code></td>
                </tr>
              </tbody>
            </table>
          </Card>

          <h3 style={{ marginTop: 24 }}>Basic usage</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Use the <code>enableClipboard</code> prop together with <code>rowSelection="multiRow"</code>.
            Select rows with the checkboxes and press Ctrl+C to copy them in an Excel-compatible format.
          </p>
          <CodeSnippet code={clipboardBasicCode} title="Using the GridTable clipboard" />

          <h3 style={{ marginTop: 24 }}>Implementation detail</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>document.addEventListener('keydown', handler, true)</code> catches the event in the capture phase,
            so it works regardless of AG Grid's internal <code>stopPropagation</code>.
          </p>
          <CodeSnippet code={clipboardImplCode} title="The clipboard implementation (GridTable.tsx)" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>Key points</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>enableClipboard</code>: a GridTable prop, enabled per grid</li>
              <li><strong>Ctrl+C</strong>: copies the selected rows — header and data — as tab (<code>\t</code>) separated text</li>
              <li><strong>Ctrl+V</strong>: parses the clipboard and writes it into cells from the focused cell onward (edit mode only)</li>
              <li>While a cell is being edited, the browser's own copy and paste behavior is left alone</li>
              <li>Registering in the capture phase (<code>true</code>) bypasses AG Grid's event blocking</li>
              <li>The copied format works in Excel, Google Sheets and plain text editors</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GuideAgGrid" />
      <Tabs items={tabItems} />
    </div>
  );
}
