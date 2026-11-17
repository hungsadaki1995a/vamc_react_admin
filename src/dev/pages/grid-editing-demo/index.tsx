/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, Tag, Card, Alert, Divider, Button, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ColGroupDef, CellValueChangedEvent, CellClassParams, CellStyle } from 'ag-grid-community';
import GridTable, { lightTheme, darkTheme } from '@/components/grid/GridTable';
import GridPanel from '@/components/grid/GridPanel';
import GridToolbar from '@/components/layout/GridToolbar';
import DateCellEditor, { DateCellRenderer } from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import { useTreeGrid } from '@/components/grid/useTreeGrid';
import { TreeCellRenderer } from '@/components/grid/TreeCellRenderer';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';
import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';
import { SearchSelectCellRenderer, SearchSelectCellEditor, searchSelectValueFormatter } from '@/components/grid/SearchSelectCell';
import type { SearchSelectOption } from '@/components/inputs/SearchSelectField';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useThemeStore } from '@/stores/themeStore';
import { useComcdStore } from '@/stores/comcdStore';
import DevPageHeader from '@/dev/DevPageHeader';

const EMPTY_CODES: import('@/api/common/comCdApi').CodeDetail[] = [];
import styles from './index.module.css';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ─── Code snippets (existing) ─── */
const basicGridCode = `import GridTable from '@/components/grid/GridTable';
import type { ColDef } from 'ag-grid-community';

const columnDefs: ColDef[] = [
  { field: 'name', headerName: 'Name', minWidth: 120 },
  { field: 'department', headerName: 'Department', width: 100 },
  { field: 'role', headerName: 'Role', width: 100 },
];

<GridTable
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  pagination={true}
  pageSize={20}
  onRowClick={(row) => console.log(row)}
/>`;

const editableGridCode = `import GridTable from '@/components/grid/GridTable';
import DateCellEditor from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';

const columnDefs: ColDef[] = [
  { field: 'name', headerName: 'Task name', editable: true },
  {
    field: 'status', headerName: 'Status',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: {
      values: ['planned', 'in_progress', 'completed'],
      valueLabels: { planned: 'Planned', in_progress: 'In progress', completed: 'Completed' },
    },
  },
  {
    field: 'dueDate', headerName: 'Due date',
    editable: true,
    cellEditor: DateCellEditor,
  },
  {
    field: 'assignee', headerName: 'Assignee',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: { values: ['Steve Kim', 'Michelle Lee', 'Thomas Song'] },
  },
  {
    field: 'tags', headerName: 'Tags',
    editable: true,
    cellEditor: TagsCellEditor,
    cellEditorParams: { presetTags: ['Urgent', 'Important', 'Bug', 'Feature'] },
    cellEditorPopup: true,
  },
];

<GridTable
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  editable={true}
  onCellValueChanged={(e) => console.log('Changed:', e.colDef.field, e.newValue)}
/>`;

const selectionGridCode = `<GridTable
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  rowSelection="multiRow"   // 'singleRow' | 'multiRow'
  onSelectionChanged={(rows) => console.log('Selected:', rows)}
/>`;

/* ─── Code snippets (cell renderers and formatters) ─── */
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

/* ─── Code snippets (cell editors) ─── */
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

import { forwardRef, useImperativeHandle, useRef } from 'react';
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
    cellEditorParams: { format: 'YYYY-MM-DD' },
  },
];`;

/* ─── Code snippets (header grouping) ─── */
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

/* ─── Code snippets (cell and row spanning) ─── */
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
];`;

const rowSpanCode = `// rowSpan: merge cells across consecutive rows with the same value
// An AG Grid v35+ Community feature (included in AllCommunityModule)

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

// enableCellSpan must be set on GridTable
<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  enableCellSpan={true}
/>`;

/* ─── Code snippets (footer and pinned rows) ─── */
const pinnedRowCode = `// pinnedTopRowData: rows pinned to the top, below the header
// pinnedBottomRowData: rows pinned to the bottom (a footer)
const pinnedTopRowData = useMemo(() => [
  { name: '[ Average ]', department: '-', position: '-', salary: 5460000 },
], []);

const pinnedBottomRowData = useMemo(() => [
  { name: '[ Total ]', department: '-', position: '-', salary: 27300000 },
], []);

<GridTable
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
};`;

const manualGroupingCode = `// Recreating row grouping in the Community edition
// Approach: sort by group, insert subtotal rows, hide repeats with valueFormatter, add colSpan and a separator line

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

// Step 2: valueFormatter (hide repeats) + colSpan + cellStyle
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: 'Category',
    valueFormatter: (params) => {
      if (params.data?.isSubtotal) return params.value;
      const idx = params.node?.rowIndex ?? 0;
      if (idx === 0) return params.value;
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
      return Object.keys(style).length ? style : undefined;
    },
  },
  { field: 'item', headerName: 'Item' },
  { field: 'q1', headerName: 'Q1', type: 'numericColumn' },
  { field: 'q2', headerName: 'Q2', type: 'numericColumn' },
];

// Step 3: add the grand total row with pinnedBottomRowData
<GridTable
  rowData={groupedData}
  columnDefs={columnDefs}
  pinnedBottomRowData={totalRow}
/>`;

/* ─── Code snippets (column pinning) ─── */
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

  // Pinned right: salary
  {
    field: 'salary',
    headerName: 'Salary',
    width: 130,
    pinned: 'right',
    type: 'numericColumn',
  },
];`;

const dynamicPinningCode = `// Pinning and unpinning columns through the API

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

/* ─── Code snippets (copy and paste) ─── */
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
          const rowNode = api.getDisplayedRowAtIndex(focused.rowIndex + rowOff);
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

const contextMenuBasicCode = `// getContextMenuItems customizes the right-click menu.
import GridTable from '@/components/grid/GridTable';
import type { GetContextMenuItemsParams } from 'ag-grid-community';

<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  rowKey="id"
  getContextMenuItems={(params: GetContextMenuItemsParams) => [
    {
      name: \`View "\${params.node?.data?.name}"\`,
      action: () => openDetail(params.node?.data),
      icon: '<span>🔍</span>',
    },
    {
      name: 'Edit',
      disabled: !canWrite,
      action: () => openEdit(params.node?.data),
      icon: '<span>✏️</span>',
    },
    'separator',
    {
      name: 'Delete',
      disabled: !canWrite,
      action: () => handleDelete(params.node?.data?.id),
      icon: '<span>🗑️</span>',
    },
    'separator',
    'copy',           // a built-in AG Grid item
    'copyWithHeaders',
  ]}
/>`;

const contextMenuBuiltinCode = `// Built-in AG Grid items (given as strings)
// 'copy' | 'copyWithHeaders' | 'cut' | 'paste' | 'export' | 'separator'

// Keeping only the built-in items
getContextMenuItems={() => ['copy', 'copyWithHeaders', 'separator', 'export']}

// Disabling it entirely
<GridTable suppressContextMenu={true} ... />`;

/* ─── Mock data (existing) ─── */
interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  joinDate: string;
}

const basicData: Employee[] = [
  { id: 'E001', name: 'Steve Kim', department: 'Engineering A', role: 'Team lead', email: 'kim@ds.com', joinDate: '2020-03-15' },
  { id: 'E002', name: 'Michelle Lee', department: 'Engineering A', role: 'Senior', email: 'lee@ds.com', joinDate: '2019-07-01' },
  { id: 'E003', name: 'Paul Park', department: 'Engineering B', role: 'Team lead', email: 'park@ds.com', joinDate: '2021-05-20' },
  { id: 'E004', name: 'Susan Choi', department: 'Engineering B', role: 'Staff', email: 'choi@ds.com', joinDate: '2023-01-10' },
  { id: 'E005', name: 'Andrew Jung', department: 'Planning', role: 'Team lead', email: 'jung@ds.com', joinDate: '2018-11-01' },
  { id: 'E006', name: 'Jane Han', department: 'Design', role: 'Senior', email: 'han@ds.com', joinDate: '2020-09-15' },
  { id: 'E007', name: 'Thomas Song', department: 'Engineering A', role: 'Staff', email: 'song@ds.com', joinDate: '2022-06-01' },
  { id: 'E008', name: 'Laura Yoon', department: 'QA', role: 'Team lead', email: 'yoon@ds.com', joinDate: '2019-03-20' },
  { id: 'E009', name: 'Jacob Lim', department: 'Engineering B', role: 'Senior', email: 'im@ds.com', joinDate: '2021-09-01' },
  { id: 'E010', name: 'Hannah Oh', department: 'Planning', role: 'Staff', email: 'oh@ds.com', joinDate: '2023-07-15' },
  { id: 'E011', name: 'Justin Kang', department: 'Engineering A', role: 'Staff', email: 'kang@ds.com', joinDate: '2024-02-01' },
  { id: 'E012', name: 'Jihoon Seo', department: 'Engineering B', role: 'Staff', email: 'seo@ds.com', joinDate: '2024-04-10' },
  { id: 'E013', name: 'Sue Jang', department: 'Design', role: 'Staff', email: 'jang@ds.com', joinDate: '2023-11-01' },
  { id: 'E014', name: 'Brian Bae', department: 'QA', role: 'Senior', email: 'bae@ds.com', joinDate: '2020-12-15' },
  { id: 'E015', name: 'Kevin Kwon', department: 'Infrastructure', role: 'Team lead', email: 'kwon@ds.com', joinDate: '2017-08-01' },
];

interface EditableTask {
  id: string;
  name: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
  tags: string[];
}

const editableData: EditableTask[] = [
  { id: 'T001', name: 'Login UI development', status: 'in_progress', priority: 'High', dueDate: '2025-04-15', assignee: 'Steve Kim', tags: ['Feature', 'Urgent'] },
  { id: 'T002', name: 'API authentication module', status: 'planned', priority: 'High', dueDate: '2025-04-20', assignee: 'Michelle Lee', tags: ['Feature'] },
  { id: 'T003', name: 'Dashboard charts', status: 'completed', priority: 'Medium', dueDate: '2025-03-30', assignee: 'Thomas Song', tags: ['Feature', 'Improvement'] },
  { id: 'T004', name: 'Fix the memory leak', status: 'in_progress', priority: 'Critical', dueDate: '2025-04-10', assignee: 'Paul Park', tags: ['Bug', 'Urgent'] },
  { id: 'T005', name: 'Update the docs', status: 'planned', priority: 'Low', dueDate: '2025-05-01', assignee: 'Laura Yoon', tags: [] },
  { id: 'T006', name: 'Performance testing', status: 'planned', priority: 'Medium', dueDate: '2025-04-25', assignee: 'Brian Bae', tags: ['QA'] },
  { id: 'T007', name: 'Dark mode support', status: 'planned', priority: 'Low', dueDate: '2025-05-15', assignee: 'Jane Han', tags: ['UI', 'Improvement'] },
  { id: 'T008', name: 'Database index tuning', status: 'in_progress', priority: 'High', dueDate: '2025-04-30', assignee: 'Jacob Lim', tags: ['Performance', 'DB'] },
  { id: 'T009', name: 'Notification center', status: 'completed', priority: 'Medium', dueDate: '2025-03-25', assignee: 'Susan Choi', tags: ['Feature'] },
  { id: 'T010', name: 'Accessibility (a11y) work', status: 'planned', priority: 'Low', dueDate: '2025-06-30', assignee: 'Hannah Oh', tags: ['UI', 'A11y'] },
  { id: 'T011', name: 'CI/CD pipeline setup', status: 'completed', priority: 'High', dueDate: '2025-03-10', assignee: 'Kevin Kwon', tags: ['DevOps'] },
  { id: 'T012', name: 'Responsive mobile work', status: 'in_progress', priority: 'Medium', dueDate: '2025-05-20', assignee: 'Sue Jang', tags: ['UI', 'Mobile'] },
];

const statusColors: Record<string, string> = { planned: 'default', in_progress: 'processing', completed: 'success' };
const statusLabels: Record<string, string> = { planned: 'Planned', in_progress: 'In progress', completed: 'Completed' };
const priorityColors: Record<string, string> = { 'Critical': 'red', 'High': 'orange', 'Medium': 'blue', 'Low': 'default' };

/* ─── Mock data (new) ─── */
interface GroupDemoRow {
  id: number;
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  bonus: number;
}

const groupDemoData: GroupDemoRow[] = [
  { id: 1, name: 'Michael Chen', department: 'Engineering', position: 'Team lead', hireDate: '2020-01-15', salary: 6500000, bonus: 1000000 },
  { id: 2, name: 'David Kim', department: 'Engineering', position: 'Associate', hireDate: '2022-05-10', salary: 4500000, bonus: 600000 },
  { id: 3, name: 'Grace Han', department: 'Engineering', position: 'Staff', hireDate: '2024-02-01', salary: 3500000, bonus: 400000 },
  { id: 4, name: 'Emily Park', department: 'Planning', position: 'Manager', hireDate: '2021-03-20', salary: 5500000, bonus: 800000 },
  { id: 5, name: 'Sophia Jung', department: 'Design', position: 'Staff', hireDate: '2023-07-01', salary: 3800000, bonus: 500000 },
  { id: 6, name: 'Peter Han', department: 'Sales', position: 'Director', hireDate: '2019-11-05', salary: 7000000, bonus: 1200000 },
];

interface SpanDemoRow {
  id: number;
  category: string;
  item: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

const spanDemoData: SpanDemoRow[] = [
  { id: 1, category: 'Revenue', item: 'Product A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { id: 2, category: 'Revenue', item: 'Product B', q1: 800, q2: 900, q3: 950, q4: 1100 },
  { id: 3, category: 'Revenue', item: 'Product C', q1: 600, q2: 700, q3: 750, q4: 800 },
  { id: 4, category: 'Revenue Subtotal', item: '', q1: 2600, q2: 3100, q3: 2800, q4: 3700 },
  { id: 5, category: 'Cost', item: 'Payroll', q1: 2000, q2: 2000, q3: 2100, q4: 2100 },
  { id: 6, category: 'Cost', item: 'Operations', q1: 500, q2: 550, q3: 520, q4: 600 },
  { id: 7, category: 'Cost', item: 'Marketing', q1: 300, q2: 400, q3: 350, q4: 500 },
  { id: 8, category: 'Cost Subtotal', item: '', q1: 2800, q2: 2950, q3: 2970, q4: 3200 },
];

interface RowSpanDemoRow {
  id: number;
  department: string;
  team: string;
  name: string;
  role: string;
}

const rowSpanDemoData: RowSpanDemoRow[] = [
  { id: 1, department: 'Engineering', team: 'Front-end', name: 'Michael Chen', role: 'Team lead' },
  { id: 2, department: 'Engineering', team: 'Front-end', name: 'Emily Park', role: 'Senior' },
  { id: 3, department: 'Engineering', team: 'Backend', name: 'David Kim', role: 'Team lead' },
  { id: 4, department: 'Engineering', team: 'Backend', name: 'Grace Han', role: 'Junior' },
  { id: 5, department: 'Engineering', team: 'Backend', name: 'Hugo Cho', role: 'Junior' },
  { id: 6, department: 'Corporate', team: 'HR', name: 'Sophia Jung', role: 'Manager' },
  { id: 7, department: 'Corporate', team: 'HR', name: 'Peter Han', role: 'Associate' },
  { id: 8, department: 'Corporate', team: 'Finance', name: 'Mira Yoon', role: 'Team lead' },
];

// ── Code snippets (DatePicker cells) ────────────────────────────────────────

const dateCellCode = `import DateCellEditor, { DateCellRenderer } from '@/components/grid/cellEditors/DateCellEditor';

// DateCellRenderer: displays a date in the given format
// DateCellEditor:   an Ant Design DatePicker popup editor (editing ends as soon as a date is picked)
const columnDefs: ColDef[] = [
  {
    field: 'startDt',
    headerName: 'Start date',
    editable: true,
    cellRenderer: DateCellRenderer,
    cellRendererParams: { format: 'YYYY-MM-DD' },  // the default; can be omitted
    cellEditor: DateCellEditor,
  },
  {
    field: 'endDt',
    headerName: 'End date',
    editable: true,
    cellRenderer: DateCellRenderer,
    cellRendererParams: { format: 'YYYY.MM.DD' },  // a custom format
    cellEditor: DateCellEditor,
    cellEditorParams: { format: 'YYYY.MM.DD' },
  },
];

// Using GridTable
<GridTable
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  editable={false}   // control it per column with editable: true
  pagination={false}
/>`;

// ── Code snippets (tree structure) ──────────────────────────────────────────

const treeCellCode = `import { useTreeGrid } from '@/components/grid/useTreeGrid';
import { TreeCellRenderer } from '@/components/grid/TreeCellRenderer';

// 1) The flat source data (the hierarchy lives in parentId)
const orgData = [
  { id: '001', name: 'Head office', parentId: null },
  { id: '010', name: 'Engineering division', parentId: '001' },
  { id: '011', name: 'Front-end team', parentId: '010' },
  { id: '012', name: 'Backend team', parentId: '010' },
  { id: '020', name: 'Corporate division', parentId: '001' },
  { id: '021', name: 'HR team', parentId: '020' },
];

// 2) Turn it into tree rows with useTreeGrid
const { treeData, toggleExpand, expandAll, collapseAll } = useTreeGrid({
  data: orgData,
  idField: 'id',          // primary key field (default: 'id')
  parentField: 'parentId', // parent id field (default: 'parentId')
  defaultExpanded: true,   // expand everything initially (default: true)
});

// 3) Apply TreeCellRenderer to the hierarchy column
const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: 'Organization',
    cellRenderer: TreeCellRenderer,
    cellRendererParams: {
      onToggle: toggleExpand,   // the collapse/expand toggle
      indentSize: 18,           // indent per level in px (default 18)
    },
  },
  { field: 'id', headerName: 'Code', width: 100 },
];

// 4) Pass treeData to GridTable (rowKey is required)
<GridTable
  columnDefs={columnDefs}
  rowData={treeData}
  rowKey="id"
  pagination={false}
/>`;

// ── Code snippets (ComcdSelect chaining) ────────────────────────────────────

const comcdChainCellCode = `import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';
import type { CodeDetail } from '@/api/common/comCdApi';

// Make cellEditorParams a function and you get access to params.data (the row)
// -> filter the child select's options by another column in the same row
const columnDefs: ColDef[] = [
  // Parent column
  {
    field: 'parentCd',
    headerName: 'Category',
    editable: true,
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'PARENT_CD' },
    cellEditor: ComcdSelectCellEditor,
    cellEditorParams: { cdDmnId: 'PARENT_CD' },
  },
  // Child column — cellEditorParams as a function so it can read the parent value
  {
    field: 'childCd',
    headerName: 'Subcategory',
    editable: true,
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'CHILD_CD' },
    cellEditor: ComcdSelectCellEditor,
    // Function form — reads parentCd from the same row via params.data
    cellEditorParams: (params: any) => ({
      cdDmnId: 'CHILD_CD',
      filterFn: (code: CodeDetail) => code.bzLrgCzCd === params.data.parentCd,
    }),
  },
];`;

// ── Code snippets for ComcdSelect / SearchSelect cell demo ───────────────────

const comcdCellCode = `import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';

// cellRenderer: turns the code into its display name (looked up in comcdStore)
// cellEditor:   the ComcdSelect dropdown popup editor
const columnDefs: ColDef[] = [
  {
    field: 'jbcCd',
    headerName: 'Grade',
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'JBC_CD' },
    // When you add editing:
    editable: true,
    cellEditor: ComcdSelectCellEditor,
    cellEditorParams: { cdDmnId: 'JBC_CD' },
  },
  {
    field: 'gdCd',
    headerName: 'Level',
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'GD_CD' },
  },
];`;

const searchCellCode = `import { SearchSelectCellRenderer, SearchSelectCellEditor, searchSelectValueFormatter } from '@/components/grid/SearchSelectCell';
import { getOrgList } from '@/api/{domain}/org';   // API calls live under src/api/{domain}/

// cellRenderer:    shows only the label from { label, value } or a plain string
// valueFormatter:  silences AG Grid warning #48 and converts to text for clipboard/CSV
// cellEditor:      an autocomplete editor (pass fetchOptions or staticOptions)
const columnDefs: ColDef[] = [
  {
    field: 'dept',
    headerName: 'Department',
    editable: true,
    cellRenderer: SearchSelectCellRenderer,
    valueFormatter: searchSelectValueFormatter,  // <- fixes warning #48
    cellEditor: SearchSelectCellEditor,
    cellEditorParams: {
      fetchOptions: async (kw: string) => {
        const res = await getOrgList({ orgNm: kw });
        return (res.data ?? []).map(o => ({ label: o.orgNm, value: o.orgId }));
      },
    },
  },
  {
    field: 'dept',
    headerName: 'Department (staticOptions)',
    editable: true,
    cellRenderer: SearchSelectCellRenderer,
    cellEditor: SearchSelectCellEditor,
    cellEditorParams: {
      staticOptions: [
        { label: 'Engineering A', value: 'D001' },
        { label: 'Engineering B', value: 'D002' },
        { label: 'Planning', value: 'D003' },
        { label: 'Design', value: 'D004' },
      ],
    },
  },
];`;

// ── ComcdSearchCellDemo (sub-component) ──────────────────────────────────────

interface ComcdDemoRow {
  id: number;
  name: string;
  jbcCd: string;
  gdCd: string;
  dept: { label: string; value: string } | null;
}

const SAMPLE_DEPTS: SearchSelectOption[] = [
  { label: 'Engineering A', value: 'D001', upDept: 'Engineering' },
  { label: 'Engineering B', value: 'D002', upDept: 'Engineering' },
  { label: 'Planning', value: 'D003', upDept: 'Corporate' },
  { label: 'Design', value: 'D004', upDept: 'Corporate' },
  { label: 'QA', value: 'D005', upDept: 'Engineering' },
  { label: 'HR', value: 'D006', upDept: 'Corporate' },
  { label: 'Finance', value: 'D007', upDept: 'Corporate' },
];

// ── Data for the chained-select grid demo ───────────────────────────────────

const CHAIN_PARENT_OPTS = [
  { label: 'Software', value: 'SW' },
  { label: 'Infrastructure', value: 'INFRA' },
  { label: 'Operations', value: 'OPS' },
];

const CHAIN_CHILD_MAP: Record<string, Array<{ label: string; value: string }>> = {
  SW:    [{ label: 'Front-end', value: 'SW01' }, { label: 'Backend', value: 'SW02' }, { label: 'Mobile app', value: 'SW03' }],
  INFRA: [{ label: 'Network', value: 'INF01' }, { label: 'Server / storage', value: 'INF02' }, { label: 'Database administration', value: 'INF03' }],
  OPS:   [{ label: 'Monitoring', value: 'OPS01' }, { label: 'Customer support', value: 'OPS02' }, { label: 'Security operations', value: 'OPS03' }],
};

const CHAIN_PARENT_LABEL: Record<string, string> = Object.fromEntries(CHAIN_PARENT_OPTS.map(o => [o.value, o.label]));
const CHAIN_CHILD_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(CHAIN_CHILD_MAP).flat().map(o => [o.value, o.label]),
);

interface ChainRow { id: number; task: string; parentCd: string; childCd: string; }

const CHAIN_INIT_ROWS: ChainRow[] = [
  { id: 1, task: 'Login UI development', parentCd: 'SW', childCd: 'SW01' },
  { id: 2, task: 'Add server capacity', parentCd: 'INFRA', childCd: 'INF02' },
  { id: 3, task: 'Incident response', parentCd: 'OPS', childCd: 'OPS01' },
  { id: 4, task: 'Uncategorized task', parentCd: '', childCd: '' },
];

function ComcdChainGridDemo() {
  const [rows, setRows] = useState<ChainRow[]>(CHAIN_INIT_ROWS);

  const chainCols = useMemo<ColDef<ChainRow>[]>(() => [
    { field: 'task', headerName: 'Task name', minWidth: 160, editable: true },
    {
      field: 'parentCd', headerName: 'Category', width: 140, flex: 0,
      editable: true,
      cellRenderer: (p: any) => {
        const label = CHAIN_PARENT_LABEL[p.value];
        return label
          ? <span style={{ background: '#e6f4ff', color: '#1677ff', padding: '1px 7px', borderRadius: 10, fontSize: 12 }}>{label}</span>
          : <span style={{ color: '#bfbfbf', fontSize: 12 }}>Not selected</span>;
      },
      cellEditor: SelectCellEditor,
      cellEditorParams: {
        values: CHAIN_PARENT_OPTS.map(o => o.value),
        valueLabels: CHAIN_PARENT_LABEL,
      },
    },
    {
      headerName: '',
      width: 36, flex: 0, sortable: false, filter: false, resizable: false,
      cellRenderer: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8 L11 8 M8 5 L11 8 L8 11" stroke="#1677ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
    },
    {
      field: 'childCd', headerName: 'Subcategory', width: 180,
      editable: (p: any) => !!p.data?.parentCd,
      cellRenderer: (p: any) => {
        if (!p.data?.parentCd) return <span style={{ color: '#bfbfbf', fontSize: 12 }}>Pick a category first</span>;
        const label = CHAIN_CHILD_LABEL[p.value];
        return label
          ? <span style={{ background: '#f6ffed', color: '#52c41a', padding: '1px 7px', borderRadius: 10, fontSize: 12 }}>{label}</span>
          : <span style={{ color: '#bfbfbf', fontSize: 12 }}>None</span>;
      },
      // cellEditorParams as a function — filters options by params.data.parentCd
      cellEditorParams: (p: any) => {
        const opts = CHAIN_CHILD_MAP[p.data?.parentCd] ?? [];
        return { values: opts.map(o => o.value), valueLabels: Object.fromEntries(opts.map(o => [o.value, o.label])) };
      },
      cellEditor: SelectCellEditor,
    },
  ], []);

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<ChainRow>) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== (e.data as ChainRow).id) return r;
      // Clear the subcategory when the category changes
      if (e.colDef.field === 'parentCd') return { ...e.data as ChainRow, childCd: '' };
      return e.data as ChainRow;
    }));
  }, []);

  return (
    <div style={{ marginTop: 12 }}>
      <Alert
        type="info"
        showIcon
        title="Click a Category cell, change the value, then click the Subcategory cell — only that category's items appear. Without a category, Subcategory cannot be edited."
        style={{ marginBottom: 10 }}
      />
      <div style={{ height: 180 }}>
        <GridTable<ChainRow>
          columnDefs={chainCols}
          rowData={rows}
          rowKey="id"
          editable={false}
          pagination={false}
          height="100%"
          onCellValueChanged={handleCellValueChanged}
        />
      </div>
    </div>
  );
}

function ComcdSearchCellDemo() {
  const jbcCodes = useComcdStore((s) => s.codes['JBC_CD'] ?? EMPTY_CODES);
  const gdCodes  = useComcdStore((s) => s.codes['GD_CD']  ?? EMPTY_CODES);

  const makeInitialRows = useCallback(
    (jbc: typeof jbcCodes, gd: typeof gdCodes): ComcdDemoRow[] => [
      {
        id: 1, name: 'John Doe',
        jbcCd: jbc[2]?.cd ?? jbc[0]?.cd ?? '',
        gdCd:  gd[0]?.cd ?? '',
        dept: { label: 'Engineering A', value: 'D001' },
      },
      {
        id: 2, name: 'Michael Chen',
        jbcCd: jbc[1]?.cd ?? jbc[0]?.cd ?? '',
        gdCd:  gd[1]?.cd ?? gd[0]?.cd ?? '',
        dept: { label: 'Planning', value: 'D003' },
      },
      {
        id: 3, name: 'Emily Park',
        jbcCd: jbc[0]?.cd ?? '',
        gdCd:  gd[0]?.cd ?? '',
        dept: null,
      },
    ],
    [],
  );

  const [rows, setRows] = useState<ComcdDemoRow[]>(() => makeInitialRows(jbcCodes, gdCodes));

  // Re-initialize rows when comcd codes load from server
  useEffect(() => {
    if (jbcCodes.length === 0 && gdCodes.length === 0) return;
    setRows(makeInitialRows(jbcCodes, gdCodes));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jbcCodes.length, gdCodes.length]);

  const comcdColDefs = useMemo<ColDef<ComcdDemoRow>[]>(() => [
    { field: 'name', headerName: 'Name', width: 110, editable: true },
    {
      field: 'jbcCd',
      headerName: 'Grade',
      width: 120,
      editable: true,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'JBC_CD' },
      cellEditor: ComcdSelectCellEditor,
      cellEditorParams: { cdDmnId: 'JBC_CD' },
    },
    {
      field: 'gdCd',
      headerName: 'Level',
      width: 120,
      editable: true,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'GD_CD' },
      cellEditor: ComcdSelectCellEditor,
      cellEditorParams: { cdDmnId: 'GD_CD' },
    },
    {
      field: 'dept',
      headerName: 'Department (SearchSelect)',
      flex: 1,
      editable: true,
      cellRenderer: SearchSelectCellRenderer,
      valueFormatter: searchSelectValueFormatter,
      cellEditor: SearchSelectCellEditor,
      cellEditorParams: {
        staticOptions: SAMPLE_DEPTS,
      },
    },
  ], []);

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<ComcdDemoRow>) => {
    setRows((prev) => prev.map((r) => r.id === (e.data as ComcdDemoRow).id ? e.data as ComcdDemoRow : r));
  }, []);

  return (
    <div className={styles.demoSection}>
      <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
        <thead><tr><th style={{ width: 240 }}>Component / prop</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>ComcdSelectCellRenderer</code></td><td>cellRenderer</td><td>Looks the code name up in comcdStore and displays it (cdDmnId required)</td></tr>
          <tr><td><code>ComcdSelectCellEditor</code></td><td>cellEditor</td><td>A common-code dropdown popup editor (cdDmnId required)</td></tr>
          <tr><td><code>cellRendererParams.cdDmnId</code></td><td><code>string</code></td><td>The common-code domain ID to look up (e.g. 'JBC_CD')</td></tr>
          <tr><td><code>cellEditorParams.cdDmnId</code></td><td><code>string</code></td><td>The common-code domain ID the editor looks up</td></tr>
          <tr><td><code>cellEditorParams.filterFn</code></td><td><code>(codes, row) =&gt; codes</code></td><td>Filters codes by another column's value (chaining)</td></tr>
          <tr><td><code>SearchSelectCellRenderer</code></td><td>cellRenderer</td><td>Displays the label from {'{label, value}'} or a plain string</td></tr>
          <tr><td><code>SearchSelectCellEditor</code></td><td>cellEditor</td><td>An autocomplete-style search editor</td></tr>
          <tr><td><code>cellEditorParams.staticOptions</code></td><td><code>Option[]</code></td><td>A static array of options</td></tr>
          <tr><td><code>cellEditorParams.fetchOptions</code></td><td><code>(kw) =&gt; Promise&lt;Option[]&gt;</code></td><td>A keyword-based server lookup function</td></tr>
        </tbody>
      </table>

      <h3>ComcdSelectCell — the common-code cell renderer and editor</h3>
      <p className={styles.demoDesc}>
        <code>ComcdSelectCellRenderer</code> looks the code name up in comcdStore and displays it.
        <code>ComcdSelectCellEditor</code> is a ComcdSelect dropdown popup editor.
        <br />
        <strong>Names only appear once comcdStore has loaded.</strong> Seeing raw code values in a dev environment is expected — the store has not loaded.
      </p>

      <Alert
        type="info"
        showIcon
        title="Click a cell to open its editor. Grade and Level use the ComcdSelect dropdown; Department uses autocomplete."
        style={{ marginBottom: 12 }}
      />

      <div style={{ height: 200 }}>
        <GridTable<ComcdDemoRow>
          columnDefs={comcdColDefs}
          rowData={rows}
          rowKey="id"
          editable={false}
          pagination={false}
          height="100%"
          onCellValueChanged={handleCellValueChanged}
        />
      </div>

      <Divider titlePlacement="left" style={{ marginTop: 20 }}>Using ComcdSelectCell</Divider>
      <CodeSnippet code={comcdCellCode} title="ComcdSelectCell (renderer + editor)" />

      <Divider titlePlacement="left" style={{ marginTop: 16 }}>ComcdSelectCell chaining — live demo</Divider>
      <p className={styles.demoDesc}>
        Make <code>cellEditorParams</code> a <strong>function</strong> and it can read another column of the same row
        from <code>params.data</code> to filter the subcategory options on the fly.
        In the grid below, <strong>click Category first, then Subcategory</strong> to see the chaining.
      </p>
      <ComcdChainGridDemo />
      <div style={{ marginTop: 12 }}>
        <CodeSnippet code={comcdChainCellCode} title="ComcdSelectCell chaining (cellEditorParams as a function)" />
      </div>

      <Divider titlePlacement="left" style={{ marginTop: 16 }}>Using SearchSelectCell</Divider>
      <p className={styles.demoDesc}>
        <code>SearchSelectCellRenderer</code> displays only the label from <code>{'{ label, value }'}</code> or
        a plain string. <code>SearchSelectCellEditor</code> takes <code>fetchOptions</code> or
        <code>staticOptions</code> and behaves like an autocomplete.
      </p>
      <CodeSnippet code={searchCellCode} title="SearchSelectCell (renderer + editor)" />
    </div>
  );
}

// ── DatePicker Cell Demo ───────────────────────────────────────────────────────

interface DateDemoRow {
  id: number;
  name: string;
  startDt: string;
  endDt: string;
  planDt: string;
}

const dateDemoData: DateDemoRow[] = [
  { id: 1, name: 'Project kickoff', startDt: '2025-04-01', endDt: '2025-04-15', planDt: '2025-03-25' },
  { id: 2, name: 'Requirements analysis', startDt: '2025-04-10', endDt: '2025-04-30', planDt: '2025-04-05' },
  { id: 3, name: 'Design and architecture', startDt: '2025-05-01', endDt: '2025-05-20', planDt: '2025-04-28' },
  { id: 4, name: 'Development sprint 1', startDt: '2025-05-21', endDt: '2025-06-10', planDt: '' },
  { id: 5, name: 'Development sprint 2', startDt: '2025-06-11', endDt: '2025-06-30', planDt: '' },
];

function DateCellDemo() {
  const [rows, setRows] = useState<DateDemoRow[]>(dateDemoData);

  const dateCols = useMemo<ColDef<DateDemoRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 60, flex: 0, editable: false },
    { field: 'name', headerName: 'Task name', minWidth: 180, editable: true },
    {
      field: 'startDt', headerName: 'Start date', width: 130, flex: 0,
      editable: true,
      cellRenderer: DateCellRenderer,
      cellRendererParams: { format: 'YYYY-MM-DD' },
      cellEditor: DateCellEditor,
    },
    {
      field: 'endDt', headerName: 'End date', width: 130, flex: 0,
      editable: true,
      cellRenderer: DateCellRenderer,
      cellRendererParams: { format: 'YYYY-MM-DD' },
      cellEditor: DateCellEditor,
    },
    {
      field: 'planDt', headerName: 'Planned date (YYYY.MM.DD)', width: 180, flex: 0,
      editable: true,
      cellRenderer: DateCellRenderer,
      cellRendererParams: { format: 'YYYY.MM.DD' },
      cellEditor: DateCellEditor,
      cellEditorParams: { format: 'YYYY.MM.DD' },
    },
  ], []);

  const handleCellValueChanged = useCallback(
    (e: CellValueChangedEvent<DateDemoRow>) => {
      setRows((prev) => prev.map((r) => r.id === (e.data as DateDemoRow).id ? { ...r, ...(e.data as DateDemoRow) } : r));
    },
    [],
  );

  return (
    <div className={styles.demoSection}>
      <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
        <thead><tr><th style={{ width: 260 }}>Component / prop</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>DateCellRenderer</code></td><td>cellRenderer</td><td>Renders a date value in the given format</td></tr>
          <tr><td><code>cellRendererParams.format</code></td><td><code>string</code></td><td>Display format (default: <code>'YYYY-MM-DD'</code>)</td></tr>
          <tr><td><code>DateCellEditor</code></td><td>cellEditor</td><td>An Ant Design DatePicker popup editor. Editing ends as soon as a date is picked</td></tr>
          <tr><td><code>cellEditorParams.format</code></td><td><code>string</code></td><td>DatePicker format inside the editor (default: <code>'YYYY-MM-DD'</code>)</td></tr>
        </tbody>
      </table>

      <h3>DateCellEditor + DateCellRenderer</h3>
      <p className={styles.demoDesc}>
        Clicking a cell opens an Ant Design <code>DatePicker</code> as a popup.
        Picking a date ends the edit immediately and the formatted date is shown.
        <code>cellRendererParams.format</code> controls the display format.
      </p>
      <Alert
        type="info"
        showIcon
        title="Click a date column to open the DatePicker. Picking a date saves it immediately."
        style={{ marginBottom: 12 }}
      />
      <div style={{ height: 220 }}>
        <GridTable<DateDemoRow>
          columnDefs={dateCols}
          rowData={rows}
          rowKey="id"
          editable={false}
          pagination={false}
          height="100%"
          onCellValueChanged={handleCellValueChanged}
        />
      </div>
      <Divider titlePlacement="left" style={{ marginTop: 20 }}>Usage</Divider>
      <CodeSnippet code={dateCellCode} title="DateCellRenderer + DateCellEditor" />
    </div>
  );
}

// ── Tree Demo ─────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string;
  name: string;
  type: string;
  headcount: number;
  parentId: string | null;
}

const orgRawData: OrgNode[] = [
  { id: '001', name: 'VAMC', type: 'Company', headcount: 1200, parentId: null },
  { id: '010', name: 'Engineering division', type: 'Division', headcount: 480, parentId: '001' },
  { id: '011', name: 'Front-end team', type: 'Team', headcount: 120, parentId: '010' },
  { id: '012', name: 'Backend team', type: 'Team', headcount: 150, parentId: '010' },
  { id: '013', name: 'Infrastructure team', type: 'Team', headcount: 80, parentId: '010' },
  { id: '014', name: 'QA team', type: 'Team', headcount: 60, parentId: '010' },
  { id: '020', name: 'Corporate division', type: 'Division', headcount: 320, parentId: '001' },
  { id: '021', name: 'HR team', type: 'Team', headcount: 90, parentId: '020' },
  { id: '022', name: 'Finance team', type: 'Team', headcount: 70, parentId: '020' },
  { id: '023', name: 'Legal team', type: 'Team', headcount: 40, parentId: '020' },
  { id: '030', name: 'Sales division', type: 'Division', headcount: 400, parentId: '001' },
  { id: '031', name: 'Domestic sales team', type: 'Team', headcount: 200, parentId: '030' },
  { id: '032', name: 'International sales team', type: 'Team', headcount: 150, parentId: '030' },
];

function TreeDemo() {
  const { treeData, toggleExpand, expandAll, collapseAll } = useTreeGrid({
    data: orgRawData,
    idField: 'id',
    parentField: 'parentId',
    defaultExpanded: true,
  });

  const treeCols = useMemo<ColDef<OrgNode>[]>(() => [
    {
      field: 'name',
      headerName: 'Organization',
      minWidth: 220,
      cellRenderer: TreeCellRenderer,
      cellRendererParams: { onToggle: toggleExpand, indentSize: 20 },
    },
    { field: 'type', headerName: 'Type', width: 80, flex: 0 },
    { field: 'id', headerName: 'Code', width: 80, flex: 0 },
    {
      field: 'headcount', headerName: 'Headcount', width: 80, flex: 0,
      type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? p.value.toLocaleString() : '',
    },
  ], [toggleExpand]);

  return (
    <div className={styles.demoSection}>
      <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
        <thead><tr><th style={{ width: 260 }}>Hook / component / prop</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>useTreeGrid(options)</code></td><td>Hook</td><td>Converts flat data into DFS-ordered tree rows. No Enterprise license needed</td></tr>
          <tr><td><code>options.data</code></td><td><code>T[]</code></td><td>The flat source data array</td></tr>
          <tr><td><code>options.idField</code></td><td><code>string</code></td><td>The unique ID field (default: <code>'id'</code>)</td></tr>
          <tr><td><code>options.parentField</code></td><td><code>string</code></td><td>The parent ID field (default: <code>'parentId'</code>)</td></tr>
          <tr><td><code>options.defaultExpanded</code></td><td><code>boolean</code></td><td>Whether everything starts expanded (default: <code>true</code>)</td></tr>
          <tr><td><code>returns.treeData</code></td><td><code>TreeRow&lt;T&gt;[]</code></td><td>The processed tree rows to pass to GridTable's rowData</td></tr>
          <tr><td><code>returns.toggleExpand(id)</code></td><td><code>fn</code></td><td>Collapses or expands a node</td></tr>
          <tr><td><code>returns.expandAll / collapseAll</code></td><td><code>fn</code></td><td>Expand all / collapse all</td></tr>
          <tr><td><code>TreeCellRenderer</code></td><td>cellRenderer</td><td>A hierarchy cell renderer with indentation and a toggle icon</td></tr>
          <tr><td><code>cellRendererParams.onToggle</code></td><td><code>(id) =&gt; void</code></td><td>Pass the toggleExpand function (required)</td></tr>
          <tr><td><code>cellRendererParams.indentSize</code></td><td><code>number</code></td><td>Indent per level in px (default: 18)</td></tr>
        </tbody>
      </table>

      <h3>Tree structure — useTreeGrid + TreeCellRenderer</h3>
      <p className={styles.demoDesc}>
        This works around the Community edition's limits: flat data is reordered depth-first and a custom
        cell renderer draws the hierarchy. No Enterprise license required.
      </p>
      <Alert
        type="info"
        showIcon
        title="Click the ▶ icon next to an organization to collapse or expand its children."
        style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={expandAll}
          style={{ padding: '2px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}>
          Expand all
        </button>
        <button onClick={collapseAll}
          style={{ padding: '2px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}>
          Collapse all
        </button>
      </div>
      <div style={{ height: 400 }}>
        <GridTable<OrgNode>
          columnDefs={treeCols}
          rowData={treeData}
          rowKey="id"
          pagination={false}
          height="100%"
          suppressCellFocus
        />
      </div>
      <Divider titlePlacement="left" style={{ marginTop: 20 }}>Usage</Divider>
      <CodeSnippet code={treeCellCode} title="useTreeGrid + TreeCellRenderer" />
    </div>
  );
}

// ── ToolbarActionDemo ───────────────────────────────────────────────────────────

interface MemberRow { id: number; name: string; role: string; team: string; }

const memberData: MemberRow[] = [
  { id: 1, name: 'Steve Kim', role: 'Developer', team: 'Backend' },
  { id: 2, name: 'Michelle Lee', role: 'Designer', team: 'UX' },
  { id: 3, name: 'Jason Park', role: 'PM', team: 'Planning' },
  { id: 4, name: 'Thomas Song', role: 'Developer', team: 'Front-end' },
  { id: 5, name: 'Eugene Choi', role: 'QA', team: 'Quality' },
];

const memberColDefs: ColDef<MemberRow>[] = [
  { field: 'name', headerName: 'Name', width: 100 },
  { field: 'role', headerName: 'Role', width: 100 },
  { field: 'team', headerName: 'Team', width: 100 },
];

function ToolbarActionDemo() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<MemberRow[]>(memberData);
  const [selected, setSelected] = useState<MemberRow[]>([]);

  const handleAdd = () => {
    const newId = Math.max(...data.map((r) => r.id)) + 1;
    const newRow: MemberRow = { id: newId, name: `New ${newId}`, role: 'Developer', team: 'Backend' };
    setData((prev) => [...prev, newRow]);
    message.success(`Row '${newRow.name}' was added.`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Confirm deletion',
      content: `Delete the ${selected.length} selected rows?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => {
        const ids = new Set(selected.map((r) => r.id));
        setData((prev) => prev.filter((r) => !ids.has(r.id)));
        setSelected([]);
        message.success(`${selected.length} rows deleted.`);
      },
    });
  };

  return (
    <GridPanel
      totalCount={data.length}
      actions={
        <>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={handleAdd}
          >
            New
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleDelete}
            disabled={selected.length === 0}
          >
            Delete {selected.length > 0 && `(${selected.length})`}
          </Button>
        </>
      }
      columnDefs={memberColDefs}
      rowData={data}
      rowSelection="multiRow"
      onSelectionChanged={setSelected}
      pagination={false}
      height={220}
    />
  );
}

// ── ClipboardDemo ──────────────────────────────────────────────────────────────

interface ClipboardRow { id: number; name: string; dept: string; score: number; }

const clipboardDemoData: ClipboardRow[] = [
  { id: 1, name: 'Steve Kim', dept: 'Engineering', score: 92 },
  { id: 2, name: 'Michelle Lee', dept: 'Planning', score: 85 },
  { id: 3, name: 'Paul Park', dept: 'Engineering', score: 78 },
  { id: 4, name: 'Susan Choi', dept: 'QA',   score: 95 },
];

const clipboardColDefs: ColDef<ClipboardRow>[] = [
  { field: 'name',  headerName: 'Name', width: 100, editable: false },
  { field: 'dept',  headerName: 'Department', width: 100, editable: false },
  { field: 'score', headerName: 'Score (editable)', width: 160, editable: true },
];

function ClipboardDemo() {
  const [rows, setRows] = useState<ClipboardRow[]>(clipboardDemoData);
  return (
    <GridPanel
      totalCount={rows.length}
      columnDefs={clipboardColDefs}
      rowData={rows}
      rowKey="id"
      rowSelection="multiRow"
      checkboxSelection
      rowMultiSelectWithClick
      enableClipboard
      pagination={false}
      height={210}
      onCellValueChanged={(e) =>
        setRows((prev) => prev.map((r) => r.id === (e.data as ClipboardRow).id ? { ...r, ...(e.data as ClipboardRow) } : r))
      }
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GridEditingDemo() {
  const mode = useThemeStore((s) => s.mode);
  const [tasks, setTasks] = useState(editableData);
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Employee[]>([]);

  /* ── Existing columns ── */
  const basicCols = useMemo<ColDef<Employee>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80, flex: 0 },
    { field: 'name', headerName: 'Name', width: 100, flex: 0 },
    { field: 'department', headerName: 'Department', width: 100, flex: 0 },
    { field: 'role', headerName: 'Role', width: 90, flex: 0 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
    { field: 'joinDate', headerName: 'Start date', width: 120, flex: 0 },
  ], []);

  const editableCols = useMemo<ColDef<EditableTask>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80, flex: 0, editable: false },
    { field: 'name', headerName: 'Task name', minWidth: 160, editable: true },
    {
      field: 'status', headerName: 'Status', width: 100, flex: 0,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        return <Tag color={statusColors[params.value]}>{statusLabels[params.value] ?? params.value}</Tag>;
      },
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['planned', 'in_progress', 'completed'], valueLabels: statusLabels },
    },
    {
      field: 'priority', headerName: 'Priority', width: 100, flex: 0,
      editable: true,
      cellRenderer: (params: any) => params.value ? <Tag color={priorityColors[params.value]}>{params.value}</Tag> : null,
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['Critical', 'High', 'Medium', 'Low'] },
    },
    { field: 'dueDate', headerName: 'Due date', width: 130, flex: 0, editable: true, cellEditor: DateCellEditor },
    {
      field: 'assignee', headerName: 'Assignee', width: 120, flex: 0, editable: true,
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['Steve Kim', 'Michelle Lee', 'Thomas Song', 'Paul Park', 'Laura Yoon', 'Brian Bae', 'Jane Han', 'Jacob Lim', 'Susan Choi', 'Hannah Oh', 'Kevin Kwon', 'Sue Jang'] },
    },
    {
      field: 'tags', headerName: 'Tags', minWidth: 160,
      editable: true,
      cellRenderer: (params: any) => {
        const tags: string[] = params.value ?? [];
        return tags.map((t: string) => <Tag key={t} style={{ marginRight: 2 }}>{t}</Tag>);
      },
      cellEditor: TagsCellEditor,
      cellEditorParams: { presetTags: ['Urgent', 'Important', 'Bug', 'Feature', 'Improvement', 'QA'] },
      cellEditorPopup: true,
    },
  ], []);

  const selectionCols = useMemo<ColDef<Employee>[]>(() => [
    { width: 50, flex: 0, sortable: false, filter: false },
    { field: 'name', headerName: 'Name', width: 100, flex: 0 },
    { field: 'department', headerName: 'Department', width: 100, flex: 0 },
    { field: 'role', headerName: 'Role', width: 90, flex: 0 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
  ], []);

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<EditableTask>) => {
    const field = e.colDef.field ?? 'unknown';
    const log = `[${e.data?.id}] ${field}: ${JSON.stringify(e.oldValue)} → ${JSON.stringify(e.newValue)}`;
    setChangeLog((prev) => [log, ...prev].slice(0, 10));
    setTasks((prev) => prev.map((t) => t.id === e.data?.id ? { ...t, [field]: e.newValue } : t));
  }, []);

  /* ── Header grouping columns ── */
  const [headerGroupColDefs] = useState<(ColDef<GroupDemoRow> | ColGroupDef)[]>([
    { field: 'name', headerName: 'Name', width: 120, pinned: 'left' },
    {
      headerName: 'HR information',
      children: [
        { field: 'department', headerName: 'Department', width: 110 },
        { field: 'position', headerName: 'Grade', width: 100 },
        {
          field: 'hireDate', headerName: 'Start date', width: 120,
          valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '',
        },
      ],
    },
    {
      headerName: 'Compensation',
      children: [
        {
          field: 'salary', headerName: 'Base salary', width: 130,
          valueFormatter: (p: any) => 'KRW ' + p.value?.toLocaleString('en-US'),
        },
        {
          field: 'bonus', headerName: 'Bonus', width: 120,
          valueFormatter: (p: any) => 'KRW ' + p.value?.toLocaleString('en-US'),
        },
        {
          headerName: 'Total pay', width: 140,
          valueGetter: (p: any) => (p.data?.salary ?? 0) + (p.data?.bonus ?? 0),
          valueFormatter: (p: any) => 'KRW ' + p.value?.toLocaleString('en-US'),
        },
      ],
    },
  ]);

  /* ── ColSpan demo columns ── */
  const [spanColDefs] = useState<ColDef<SpanDemoRow>[]>([
    {
      field: 'category', headerName: 'Category', width: 120,
      colSpan: (params) => params.data?.category?.includes('Subtotal') ? 2 : 1,
      cellStyle: (params) =>
        params.data?.category?.includes('Subtotal')
          ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' }
          : undefined,
    },
    {
      field: 'item', headerName: 'Item', width: 120,
      cellStyle: (params) =>
        params.data?.category?.includes('Subtotal')
          ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' }
          : undefined,
    },
    { field: 'q1', headerName: 'Q1', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q2', headerName: 'Q2', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q3', headerName: 'Q3', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q4', headerName: 'Q4', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
  ]);

  /* ── RowSpan demo columns ── */
  const [rowSpanColDefs] = useState<ColDef<RowSpanDemoRow>[]>([
    { field: 'department', headerName: 'Division', width: 130, spanRows: true, sort: 'asc' as const, cellStyle: { fontWeight: 'bold' } },
    { field: 'team', headerName: 'Team', width: 130, spanRows: true, sort: 'asc' as const },
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'role', headerName: 'Grade', width: 100 },
  ]);

  /* ── Footer demo ── */
  const pinnedBottomData = useMemo<Partial<GroupDemoRow>[]>(() => [{
    id: 0,
    name: 'Total',
    department: '-',
    position: '-',
    hireDate: '',
    salary: groupDemoData.reduce((s, r) => s + r.salary, 0),
    bonus: groupDemoData.reduce((s, r) => s + r.bonus, 0),
  }], []);

  const footerColDefs = useMemo<ColDef<GroupDemoRow>[]>(() => [
    { field: 'name', headerName: 'Name', width: 120 },
    { field: 'department', headerName: 'Department', width: 110 },
    { field: 'position', headerName: 'Grade', width: 100 },
    { field: 'hireDate', headerName: 'Start date', width: 120, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('en-US') : '' },
    { field: 'salary', headerName: 'Base salary', width: 130, valueFormatter: (p) => p.value ? 'KRW ' + p.value.toLocaleString('en-US') : '' },
    { field: 'bonus', headerName: 'Bonus', width: 120, valueFormatter: (p) => p.value ? 'KRW ' + p.value.toLocaleString('en-US') : '' },
  ], []);

  /* ── Manual grouping demo ── */
  const groupedRowData = useMemo(() => spanDemoData, []);

  const groupTotalRow = useMemo<Partial<SpanDemoRow>[]>(() => [{
    id: 99,
    category: 'Grand total',
    item: '',
    q1: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q1, 0),
    q2: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q2, 0),
    q3: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q3, 0),
    q4: spanDemoData.filter(r => !r.category.includes('Subtotal')).reduce((s, r) => s + r.q4, 0),
  }], []);

  const isGroupFirstRow = useCallback((params: { data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || !params.node || params.node.rowIndex === null) return false;
    const idx = params.node.rowIndex;
    if (idx === 0) return true;
    const prevRow = groupedRowData[idx - 1];
    return prevRow?.category !== params.data.category;
  }, [groupedRowData]);

  const categoryValueFormatter = useCallback((params: { value?: string; data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || params.data.category.includes('Subtotal')) return params.value ?? '';
    if (!params.node || params.node.rowIndex === null) return params.value ?? '';
    const idx = params.node.rowIndex;
    if (idx === 0) return params.value ?? '';
    const prevRow = groupedRowData[idx - 1];
    if (prevRow && prevRow.category === params.data.category) return '';
    return params.value ?? '';
  }, [groupedRowData]);

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
    {
      field: 'category', headerName: 'Category', width: 120,
      colSpan: (params) => params.data?.category?.includes('Subtotal') || params.data?.category === 'Grand total' ? 2 : 1,
      valueFormatter: categoryValueFormatter as any,
      cellStyle: groupCellStyle,
    },
    {
      field: 'item', headerName: 'Item', width: 120,
      cellStyle: (params) => params.data?.category?.includes('Subtotal') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q1', headerName: 'Q1', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q2', headerName: 'Q2', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q3', headerName: 'Q3', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q4', headerName: 'Q4', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('Subtotal') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
  ], [categoryValueFormatter, groupCellStyle]);

  /* ── Column pinning columns ── */
  const pinnedColDefs = useMemo<ColDef<GroupDemoRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 70, pinned: 'left', lockPinned: true },
    { field: 'name', headerName: 'Name', width: 100, pinned: 'left', lockPinned: true },
    { field: 'department', headerName: 'Department', width: 120 },
    { field: 'position', headerName: 'Grade', width: 100 },
    { field: 'hireDate', headerName: 'Start date', width: 120 },
    { field: 'department', headerName: 'Team', width: 120, colId: 'team' },
    { field: 'position', headerName: 'Role', width: 100, colId: 'role' },
    {
      field: 'salary', headerName: 'Salary', width: 130, pinned: 'right', type: 'numericColumn',
      valueFormatter: (p) => p.value ? `KRW ${p.value.toLocaleString()}` : '',
    },
  ], []);

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="GridEditingDemo" />

      <Tabs
        defaultActiveKey="toolbar"
        items={[
          /* ── GridToolbar ── */
          {
            key: 'toolbar',
            label: 'GridToolbar',
            children: (
              <div className={styles.demoSection}>
                <h3>GridToolbar</h3>
                <p className={styles.demoDesc}>
                  A toolbar that shows the row count and hosts action buttons. Use it on its own between FilterPanel and
                  GridTable, or together with GridTable through GridPanel.
                </p>
                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 140 }}>Prop</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>totalCount</code></td><td><code>number</code></td><td>Row count display (e.g. "102 total")</td></tr>
                    <tr><td><code>countLabel</code></td><td><code>string</code></td><td>Label in front of the count (default: "Total")</td></tr>
                    <tr><td><code>left</code></td><td><code>ReactNode</code></td><td>Extra content on the left (search terms, filter tags, …)</td></tr>
                    <tr><td><code>actions</code></td><td><code>ReactNode</code></td><td>Action buttons on the right (new, delete, Excel, …)</td></tr>
                  </tbody>
                </table>

                <Card title="Live demo" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Basic (count + buttons)</p>
                      <GridToolbar
                        totalCount={102}
                        actions={
                          <>
                            <Button icon={<PlusOutlined />} type="primary">New</Button>
                            <Button icon={<DeleteOutlined />} danger disabled>Delete</Button>
                          </>
                        }
                      />
                    </div>
                    <Divider style={{ margin: '0' }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Custom countLabel + the left slot</p>
                      <GridToolbar
                        totalCount={25}
                        countLabel="Results"
                        left={<span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Keyword: <strong>Steve Kim</strong></span>}
                        actions={<Button>Excel download</Button>}
                      />
                    </div>
                    <Divider style={{ margin: '0' }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>Buttons only, no count</p>
                      <GridToolbar
                        actions={
                          <>
                            <Button icon={<PlusOutlined />} type="primary">Add row</Button>
                            <Button>Save</Button>
                          </>
                        }
                      />
                    </div>
                  </div>
                </Card>

                <CodeSnippet code={`import GridToolbar from '@/components/layout/GridToolbar';
import { Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// Basic usage
<GridToolbar
  totalCount={data.length}
  actions={
    <>
      <Button type="primary" icon={<PlusOutlined />}>New</Button>
      <Button danger icon={<DeleteOutlined />} disabled={selected.length === 0}>
        Delete {selected.length > 0 && \`(\${selected.length})\`}
      </Button>
    </>
  }
/>

// Using the left slot
<GridToolbar
  totalCount={25}
  countLabel="Results"
  left={<span>Keyword: <strong>{keyword}</strong></span>}
  actions={<Button>Excel download</Button>}
/>`} title="Basic GridToolbar usage" />
              </div>
            ),
          },

          /* ── GridPanel ── */
          {
            key: 'grid-panel',
            label: 'GridPanel',
            children: (
              <div className={styles.demoSection}>
                <h3>GridPanel</h3>
                <p className={styles.demoDesc}>
                  A convenience component that bundles <code>GridToolbar + GridTable</code>.
                  Every GridTable prop still works, plus a few toolbar-specific ones.
                </p>
                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 160 }}>Prop</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>totalCount</code></td><td><code>number</code></td><td>Row count in the toolbar (e.g. "102 total")</td></tr>
                    <tr><td><code>countLabel</code></td><td><code>string</code></td><td>Label in front of the count (default: "Total")</td></tr>
                    <tr><td><code>toolbarLeft</code></td><td><code>ReactNode</code></td><td>Extra content on the left of the toolbar</td></tr>
                    <tr><td><code>actions</code></td><td><code>ReactNode</code></td><td>Action buttons on the right of the toolbar</td></tr>
                    <tr><td colSpan={3} style={{ color: 'var(--text-secondary)', fontSize: 12 }}>+ every GridTable prop (columnDefs, rowData, rowSelection, onSelectionChanged, …)</td></tr>
                  </tbody>
                </table>

                <Card title="Live demo — new/delete buttons with a row count" style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Select a row and the delete button becomes enabled.
                  </p>
                  <App>
                    <ToolbarActionDemo />
                  </App>
                </Card>

                <CodeSnippet code={`import { useState } from 'react';
import { App, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import GridPanel from '@/components/grid/GridPanel';

function MyPage() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<MyRow[]>(initialData);
  const [selected, setSelected] = useState<MyRow[]>([]);

  const handleDelete = () => {
    modal.confirm({
      title: 'Confirm deletion',
      content: \`Delete the \${selected.length} selected rows?\`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => {
        const ids = new Set(selected.map((r) => r.id));
        setData((prev) => prev.filter((r) => !ids.has(r.id)));
        setSelected([]);
        message.success(\`\${selected.length} rows deleted.\`);
      },
    });
  };

  return (
    <GridPanel
      totalCount={data.length}
      actions={
        <>
          <Button type="primary" icon={<PlusOutlined />}>New</Button>
          <Button danger icon={<DeleteOutlined />}
            disabled={selected.length === 0}
            onClick={handleDelete}
          >
            Delete {selected.length > 0 && \`(\${selected.length})\`}
          </Button>
        </>
      }
      columnDefs={columnDefs}
      rowData={data}
      rowKey="id"
      rowSelection="multiRow"
      onSelectionChanged={setSelected}
    />
  );
}`} title="The basic GridPanel pattern" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>Key points</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>totalCount={'{data.length}'}</code>: updates itself whenever the data changes</li>
                    <li><code>actions</code>: any ReactNode — new, delete, Excel, whatever you need</li>
                    <li><code>onSelectionChanged</code>: the array of selected rows — use it to enable the delete button</li>
                    <li>Every GridTable prop works: <code>rowSelection</code>, <code>editable</code>, <code>pagination</code>, <code>getContextMenuItems</code> and the rest</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── Basic grid ── */
          {
            key: 'basic',
            label: 'GridTable',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>The basic GridTable</h3>
                  <p>Sorting, filtering, resizing and pagination come for free.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>columnDefs</code></td><td>ColDef[]</td><td>The column definitions</td></tr>
                      <tr><td><code>rowData</code></td><td>T[]</td><td>The row data</td></tr>
                      <tr><td><code>rowKey</code></td><td>string</td><td>The unique row key field (default: "id")</td></tr>
                      <tr><td><code>pagination</code></td><td>boolean</td><td>Enables pagination (default: true)</td></tr>
                      <tr><td><code>pageSize</code></td><td>number</td><td>Rows per page (default: 20)</td></tr>
                      <tr><td><code>onRowClick</code></td><td>(row: T) =&gt; void</td><td>Row click callback</td></tr>
                      <tr><td><code>height</code></td><td>string | number</td><td>Grid height (default: "100%")</td></tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ height: 380 }}>
                  <GridTable<Employee>
                    columnDefs={basicCols}
                    rowData={basicData}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
                <CodeSnippet code={basicGridCode} />
              </div>
            ),
          },

          /* ── Cell editing ── */
          {
            key: 'editable',
            label: 'Cell editing',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>An editable grid and its cell editors</h3>
                  <p>Double-click a cell to start editing. Five custom cell editors are available.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Cell editor</th><th>Purpose</th><th>Key props</th></tr></thead>
                    <tbody>
                      <tr><td><code>DateCellEditor</code></td><td>Date selection (DatePicker)</td><td>format="YYYY-MM-DD"</td></tr>
                      <tr><td><code>SelectCellEditor</code></td><td>Dropdown selection</td><td>values, valueLabels</td></tr>
                      <tr><td><code>TagsCellEditor</code></td><td>Multi-tag input</td><td>presetTags</td></tr>
                      <tr><td><code>NumberCellEditor</code></td><td>Numeric input</td><td>min, max, precision</td></tr>
                      <tr><td><code>TextAreaCellEditor</code></td><td>Multi-line text</td><td>rows</td></tr>
                    </tbody>
                  </table>
                </div>
                <Alert type="info" showIcon title="Double-click a cell to edit it." style={{ marginBottom: 8 }} />
                <div style={{ height: 320 }}>
                  <GridTable<EditableTask>
                    columnDefs={editableCols}
                    rowData={tasks}
                    rowKey="id"
                    editable
                    enableClipboard
                    rowSelection="multiRow"
                    pagination={false}
                    onCellValueChanged={handleCellValueChanged}
                  />
                </div>
                {changeLog.length > 0 && (
                  <Card size="small" title="Change log" style={{ marginTop: 8, fontSize: 12 }}>
                    {changeLog.map((log, i) => (
                      <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '2px 0' }}>{log}</div>
                    ))}
                  </Card>
                )}
                <CodeSnippet code={editableGridCode} />
              </div>
            ),
          },

          /* ── Row selection ── */
          {
            key: 'selection',
            label: 'Row selection',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>Row selection</h3>
                  <p>Single and multiple row selection through checkboxes.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>rowSelection</code></td><td>'singleRow' | 'multiRow'</td><td>Selection mode</td></tr>
                      <tr><td><code>onSelectionChanged</code></td><td>(rows: T[]) =&gt; void</td><td>Selection change callback</td></tr>
                    </tbody>
                  </table>
                </div>
                <Alert
                  type="info"
                  showIcon
                  title={`Selected rows: ${selectedRows.length} ${selectedRows.length > 0 ? `(${selectedRows.map(r => r.name).join(', ')})` : ''}`}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ height: 350 }}>
                  <GridTable<Employee>
                    columnDefs={selectionCols}
                    rowData={basicData}
                    rowKey="id"
                    rowSelection="multiRow"
                    checkboxSelection
                    pagination={false}
                    onSelectionChanged={setSelectedRows}
                  />
                </div>
                <CodeSnippet code={selectionGridCode} />
              </div>
            ),
          },

          /* ── Cell renderers and formatters ── */
          {
            key: 'renderer',
            label: 'Renderers & formatters',
            children: (
              <div className={styles.demoSection}>
                <h3>Cell renderers and formatters</h3>
                <p className={styles.demoDesc}>Customize how a cell looks with valueFormatter, cellRenderer, cellStyle and cellClass on the ColDef.</p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColDef option</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>valueFormatter</code></td><td><code>(params) =&gt; string</code></td><td>Transforms the displayed value. The data is untouched — only the screen and clipboard change</td></tr>
                    <tr><td><code>cellRenderer</code></td><td><code>Component | string</code></td><td>Renders the cell with your own React component (Tag, Avatar, …)</td></tr>
                    <tr><td><code>cellRendererParams</code></td><td><code>object</code></td><td>Extra parameters passed to the cellRenderer</td></tr>
                    <tr><td><code>cellStyle</code></td><td><code>CSSProperties | (params) =&gt; CSSProperties</code></td><td>Inline cell style, optionally conditional</td></tr>
                    <tr><td><code>cellClass</code></td><td><code>string | (params) =&gt; string</code></td><td>Assigns a CSS class to the cell dynamically</td></tr>
                    <tr><td><code>tooltipField</code></td><td><code>string</code></td><td>Shows that field's value as a tooltip on hover</td></tr>
                    <tr><td><code>tooltipValueGetter</code></td><td><code>(params) =&gt; string</code></td><td>A function that computes custom tooltip text</td></tr>
                  </tbody>
                </table>

                <Card title="Live demo — valueFormatter / cellStyle / cellRenderer" style={{ marginBottom: 24 }}>
                  <div style={{ height: 260 }}>
                    <GridTable<Employee>
                      columnDefs={[
                        { field: 'name', headerName: 'Name', width: 100, tooltipField: 'email' },
                        { field: 'department', headerName: 'Department', width: 110 },
                        {
                          field: 'role', headerName: 'Grade', width: 90,
                          cellStyle: (p) => {
                            const map: Record<string, CellStyle> = {
                              'Team lead': { background: '#e6f4ff', color: '#0958d9' },
                              'Senior': { background: '#f6ffed', color: '#389e0d' },
                              'Staff': { background: '#f5f5f5', color: '#595959' },
                            };
                            return map[p.value] ?? {};
                          },
                        },
                        {
                          field: 'joinDate', headerName: 'Start date', width: 120,
                          valueFormatter: (p) => p.value ? p.value.replace(/-/g, '.') : '',
                        },
                        {
                          field: 'email', headerName: 'Status', width: 100,
                          valueFormatter: () => '',
                          cellRenderer: () => <Tag color="green">Active</Tag>,
                        },
                      ]}
                      rowData={basicData.slice(0, 6)}
                      rowKey="id"
                      pagination={false}
                      height={260}
                    />
                  </div>
                </Card>

                <h3>valueFormatter</h3>
                <p className={styles.demoDesc}>Changes how a cell value is displayed. The underlying data is untouched.</p>
                <CodeSnippet code={formatterCode} title="Value formatting" />

                <h3 style={{ marginTop: 24 }}>cellRenderer</h3>
                <p className={styles.demoDesc}>Renders a cell with your own React component, so tags, avatars and richer UI are all possible.</p>
                <CodeSnippet code={cellRendererCode} title="Custom cell renderers" />

                <h3 style={{ marginTop: 24 }}>cellStyle / cellClass</h3>
                <p className={styles.demoDesc}>Changes a cell's style dynamically based on a condition.</p>
                <CodeSnippet code={cellStyleCode} title="Conditional styling" />

                <h3 style={{ marginTop: 24 }}>Tooltips</h3>
                <CodeSnippet code={tooltipCode} title="Cell tooltips" />
              </div>
            ),
          },

          /* ── Cell editor guide ── */
          {
            key: 'celleditor',
            label: 'Cell editor guide',
            children: (
              <div className={styles.demoSection}>
                <h3>Cell editors</h3>
                <p className={styles.demoDesc}>The ColDef's <code>editable</code> and <code>cellEditor</code> control how a cell is edited. Both AG Grid's built-in editors and custom React editors work.</p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColDef option</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>editable</code></td><td><code>boolean | (params) =&gt; boolean</code></td><td>Enables cell editing. Pass a function for conditional control</td></tr>
                    <tr><td><code>cellEditor</code></td><td><code>Component | string</code></td><td>The editor component. Defaults to agTextCellEditor</td></tr>
                    <tr><td><code>cellEditorParams</code></td><td><code>object | (params) =&gt; object</code></td><td>Parameters passed to the editor. Pass a function to derive them from the row data</td></tr>
                    <tr><td><code>cellEditorPopup</code></td><td><code>boolean</code></td><td>Popup-mode editor (text area, DatePicker, …)</td></tr>
                    <tr><td><code>singleClickEdit</code></td><td><code>boolean</code></td><td>Start editing on a single click instead of a double click</td></tr>
                    <tr><td><code>onCellValueChanged</code></td><td><code>(event) =&gt; void</code></td><td>Fires once a cell value has changed. Provides event.oldValue and event.newValue</td></tr>
                  </tbody>
                </table>

                <Card title="Live demo — the built-in editors (double-click to edit)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 220 }}>
                    <GridTable<MemberRow>
                      columnDefs={[
                        { field: 'name', headerName: 'Name', editable: true, width: 110 },
                        {
                          field: 'role', headerName: 'Role', editable: true, width: 120,
                          cellEditor: 'agSelectCellEditor',
                          cellEditorParams: { values: ['Developer', 'PM', 'Designer', 'QA'] },
                        },
                        { field: 'team', headerName: 'Team', editable: true, flex: 1 },
                      ]}
                      rowData={memberData}
                      rowKey="id"
                      editable={false}
                      pagination={false}
                      height={220}
                    />
                  </div>
                </Card>

                <h3>Built-in cell editors</h3>
                <p className={styles.demoDesc}>AG Grid ships editors for text, numbers, large text and select inputs.</p>
                <CodeSnippet code={cellEditorBasicCode} title="Using the built-in editors" />

                <h3 style={{ marginTop: 24 }}>Custom cell editors</h3>
                <p className={styles.demoDesc}>
                  Custom editors are built with the React forwardRef + useImperativeHandle pattern.
                  You must implement <code>getValue()</code> and <code>afterGuiAttached()</code>.
                </p>
                <CodeSnippet code={customCellEditorCode} title="The custom editor pattern" />

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

          /* ── Common-code and search cells ── */
          {
            key: 'comcd-search-cell',
            label: 'Common-code & search cells',
            children: <ComcdSearchCellDemo />,
          },

          /* ── Header grouping ── */
          {
            key: 'headergroup',
            label: 'Header grouping',
            children: (
              <div className={styles.demoSection}>
                <h3>Column header groups</h3>
                <p className={styles.demoDesc}>
                  A <code>ColGroupDef.children</code> array groups related columns into a multi-level header. Supported in the Community edition.
                </p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColGroupDef option</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>headerName</code></td><td><code>string</code></td><td>Group header text</td></tr>
                    <tr><td><code>children</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>(ColDef | ColGroupDef)[]</code></td><td>The columns or subgroups in this group — its presence makes it a group</td></tr>
                    <tr><td><code>openByDefault</code></td><td><code>boolean</code></td><td>Whether the group starts expanded (default: false)</td></tr>
                    <tr><td><code>marryChildren</code></td><td><code>boolean</code></td><td>When true, columns cannot be dragged out of the group</td></tr>
                    <tr><td><code>columnGroupShow</code></td><td><code>'open' | 'closed'</code></td><td>Shows the column only while the group is expanded or only while collapsed</td></tr>
                    <tr><td><code>headerGroupComponent</code></td><td><code>Component</code></td><td>A custom group header component</td></tr>
                  </tbody>
                </table>

                <Card title="Live demo — header grouping" style={{ marginBottom: 24 }}>
                  <div className="ds-data-grid" style={{ height: 280 }}>
                    <AgGridReact
                      rowData={groupDemoData}
                      columnDefs={headerGroupColDefs as ColDef[]}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      theme={mode === 'dark' ? darkTheme : lightTheme}
                    />
                  </div>
                </Card>

                <h3>A basic header group</h3>
                <CodeSnippet code={headerGroupCode} title="Header group setup" />

                <h3 style={{ marginTop: 24 }}>Nested groups and expand/collapse</h3>
                <p className={styles.demoDesc}>
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

          /* ── Cell and row spanning ── */
          {
            key: 'spanning',
            label: 'Cell & row spanning',
            children: (
              <div className={styles.demoSection}>
                <h3>Column Spanning (colSpan)</h3>
                <p className={styles.demoDesc}>
                  The <code>colSpan</code> callback lets a cell span several columns under a condition.
                  Useful for subtotal rows and section headings.
                </p>

                <Card title="Live demo — colSpan (merged cells on subtotal rows)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 280 }}>
                    <GridTable<SpanDemoRow>
                      columnDefs={spanColDefs}
                      rowData={spanDemoData}
                      rowKey="id"
                      pagination={false}
                      defaultColDef={{ resizable: true }}
                    />
                  </div>
                </Card>

                <CodeSnippet code={colSpanCode} title="colSpan example" />

                <h3 style={{ marginTop: 24 }}>Row Spanning (spanRows)</h3>
                <p className={styles.demoDesc}>
                  Automatically merges cells across consecutive rows with the same value.
                  It uses <code>CellSpanModule</code> from AG Grid v35+ Community (included in <code>AllCommunityModule</code>).
                </p>

                <Card title="Live demo — spanRows (division and team merged automatically)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 320 }}>
                    <GridTable<RowSpanDemoRow>
                      columnDefs={rowSpanColDefs}
                      rowData={rowSpanDemoData}
                      rowKey="id"
                      pagination={false}
                      enableCellSpan
                      defaultColDef={{ resizable: true, flex: 1 }}
                    />
                  </div>
                </Card>

                <CodeSnippet code={rowSpanCode} title="Row spanning (enableCellSpan)" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>Key points</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>colSpan</code>: a function — <code>(params) =&gt; number</code> (1 means no spanning)</li>
                    <li><code>spanRows: true</code>: merges consecutive identical values (the data must be sorted)</li>
                    <li>Row spanning only works when the <code>enableCellSpan</code> prop is set on GridTable</li>
                    <li>Style spanned cells separately through the <code>cellStyle</code> callback</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── Footer and pinned rows ── */
          {
            key: 'footer',
            label: 'Footer & pinned rows',
            children: (
              <div className={styles.demoSection}>
                <h3>Pinned rows</h3>
                <p className={styles.demoDesc}>
                  <code>pinnedTopRowData</code> and <code>pinnedBottomRowData</code> add rows pinned to the top or bottom.
                  They make natural footers for totals, averages and summaries.{' '}
                  <Tag color="green">Community</Tag>
                </p>

                <Card title="Live demo — footer (a total row at the bottom)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 300 }}>
                    <GridTable<GroupDemoRow>
                      columnDefs={footerColDefs}
                      rowData={groupDemoData}
                      rowKey="id"
                      pagination={false}
                      pinnedBottomRowData={pinnedBottomData as GroupDemoRow[]}
                      defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true,
                        cellStyle: (params: any) =>
                          params.node.rowPinned
                            ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' }
                            : undefined,
                      }}
                    />
                  </div>
                </Card>

                <CodeSnippet code={pinnedRowCode} title="Basic pinned rows" />

                <h3 style={{ marginTop: 24 }}>Styling pinned rows</h3>
                <p className={styles.demoDesc}>
                  Check <code>params.node.rowPinned</code> to tell a pinned row apart and style it.
                </p>
                <CodeSnippet code={pinnedRowStyleCode} title="Customizing pinned row styles" />

                <h3 style={{ marginTop: 24 }}>Recreating grouping by hand</h3>
                <p className={styles.demoDesc}>
                  Sort the data by group, insert subtotal rows, then combine valueFormatter (hide repeated values), colSpan, cellStyle (a separator line) and pinnedBottomRowData (the grand total footer) —
                  and the Community edition gets a grouping effect of its own.
                </p>

                <Card title="Live demo — hand-rolled grouping (hidden repeats + colSpan + grand total footer)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 380 }}>
                    <GridTable<SpanDemoRow>
                      columnDefs={groupColDefs}
                      rowData={groupedRowData}
                      rowKey="id"
                      pagination={false}
                      pinnedBottomRowData={groupTotalRow as SpanDemoRow[]}
                      defaultColDef={{ resizable: true }}
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

          /* ── Column pinning ── */
          {
            key: 'pinning',
            label: 'Column pinning',
            children: (
              <div className={styles.demoSection}>
                <h3>Column pinning</h3>
                <p className={styles.demoDesc}>
                  The <code>pinned</code> property pins a column to the left or the right.
                  Pinned columns stay visible while scrolling, which suits identifying columns such as ID and name, or a column of action buttons.
                  <Tag color="green" style={{ marginLeft: 8 }}>Community</Tag>
                </p>

                <Card title="Live demo — pinned left (ID, name) and right (salary)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 280 }}>
                    <GridTable<GroupDemoRow>
                      columnDefs={pinnedColDefs}
                      rowData={groupDemoData}
                      rowKey="id"
                      pagination={false}
                      defaultColDef={{ resizable: true, filter: true, sortable: true }}
                    />
                  </div>
                </Card>

                <CodeSnippet code={columnPinningCode} title="Basic column pinning" />

                <h3 style={{ marginTop: 24 }}>Pinning at runtime</h3>
                <p className={styles.demoDesc}>
                  Pinning can be changed at runtime through the API.
                  Right-clicking a column header offers pin and unpin as well.
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

          /* ── Copy and paste ── */
          {
            key: 'clipboard',
            label: 'Copy & paste',
            children: (
              <div className={styles.demoSection}>
                <h3>Clipboard (copy and paste)</h3>
                <p className={styles.demoDesc}>
                  The Community edition's built-in clipboard support is limited, so the
                  <code>GridTable</code> wrapper adds a custom <code>enableClipboard</code> prop that implements
                  <strong> Ctrl+C (copy)</strong> and <strong>Ctrl+V (paste)</strong> itself.
                  <Tag color="blue" style={{ marginLeft: 8 }}>custom</Tag>
                </p>

                <Card title="How to use it" style={{ marginBottom: 16 }}>
                  <table className={styles.demoPropsTable}>
                    <thead>
                      <tr><th style={{ width: 140 }}>Shortcut</th><th>Action</th><th style={{ width: 100 }}>Requires</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>Ctrl+C</code></td>
                        <td>Copies the selected rows to the clipboard as tab-separated text, header included</td>
                        <td>Selected rows</td>
                      </tr>
                      <tr>
                        <td><code>Ctrl+V</code></td>
                        <td>Pastes the clipboard data starting at the focused cell, mapped row by row and column by column</td>
                        <td><code>editable</code></td>
                      </tr>
                    </tbody>
                  </table>
                </Card>

                <Card title="Live demo — select rows and Ctrl+C, then double-click a Score cell and Ctrl+V" style={{ marginBottom: 16 }}>
                  <App>
                    <ClipboardDemo />
                  </App>
                </Card>

                <CodeSnippet code={clipboardBasicCode} title="Using the GridTable clipboard" />

                <h3 style={{ marginTop: 24 }}>Implementation detail</h3>
                <p className={styles.demoDesc}>
                  <code>document.addEventListener('keydown', handler, true)</code> catches the event in the capture phase,
                  so it works regardless of AG Grid's internal <code>stopPropagation</code>.
                </p>
                <CodeSnippet code={clipboardImplCode} title="The clipboard implementation (GridTable.tsx)" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>Key points</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>enableClipboard</code>: a GridTable prop, enabled per grid</li>
                    <li><strong>Ctrl+C</strong>: copies the selected rows — header and data — as tab-separated text (Excel compatible)</li>
                    <li><strong>Ctrl+V</strong>: parses the clipboard and writes it into cells from the focused cell onward (edit mode only)</li>
                    <li>Registering in the capture phase (<code>true</code>) bypasses AG Grid's event blocking</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── Context menu ── */
          {
            key: 'context-menu',
            label: 'Context menu',
            children: (
              <div className={styles.demoSection}>
                <h3>Context menu</h3>
                <p className={styles.demoDesc}>
                  The <code>getContextMenuItems</code> prop customizes the menu shown when a cell is right-clicked.
                  AG Grid's own context menu is Enterprise-only, so GridTable implements its own.{' '}
                  <Tag color="blue">custom implementation</Tag>
                </p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 16 }}>
                  <thead><tr><th style={{ width: 220 }}>Prop / option</th><th>Type</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td><code>getContextMenuItems</code></td><td><code>(params) =&gt; MenuItem[]</code></td><td>Returns the items to show on right-click. Without it, no menu appears</td></tr>
                    <tr><td><code>suppressContextMenu</code></td><td><code>boolean</code></td><td>Disables the context menu entirely</td></tr>
                    <tr><td><code>MenuItemDef.name</code></td><td><code>string</code></td><td>The item's display text</td></tr>
                    <tr><td><code>MenuItemDef.action</code></td><td><code>() =&gt; void</code></td><td>The function run when the item is clicked</td></tr>
                    <tr><td><code>MenuItemDef.icon</code></td><td><code>string</code></td><td>Icon as an HTML string (e.g. <code>{'<span>🔍</span>'}</code>)</td></tr>
                    <tr><td><code>MenuItemDef.disabled</code></td><td><code>boolean</code></td><td>Disables the item</td></tr>
                    <tr><td><code>'separator'</code></td><td><code>string</code></td><td>A separator. Insert the string <code>'separator'</code> into the item array</td></tr>
                    <tr><td><code>'copy' | 'copyWithHeaders'</code></td><td><code>string</code></td><td>Built-in items (copy to clipboard)</td></tr>
                  </tbody>
                </table>

                <Alert
                  type="info"
                  showIcon
                  title="Where the popup renders"
                  description="GridTable applies popupParent={document.body} by default, so the menu renders correctly even inside an overflow:hidden container."
                  style={{ marginBottom: 16 }}
                />

                <Card title="Live demo — try right-clicking a cell" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, height: 240 }}>
                      <GridTable
                        columnDefs={[
                          { field: 'id',         headerName: 'ID',   width: 80,  flex: 0 },
                          { field: 'name',       headerName: 'Name', width: 120, flex: 0 },
                          { field: 'department', headerName: 'Department', flex: 1 },
                          { field: 'role',       headerName: 'Grade', width: 100, flex: 0 },
                          { field: 'email',      headerName: 'Email', flex: 1 },
                        ]}
                        rowData={basicData.slice(0, 6)}
                        rowKey="id"
                        pagination={false}
                        height={240}
                        getContextMenuItems={(params) => [
                          {
                            name: `View "${params.node?.data?.name}"`,
                            action: () => alert(`Details:\n${JSON.stringify(params.node?.data, null, 2)}`),
                            icon: '<span>🔍</span>',
                          },
                          {
                            name: 'Copy email',
                            action: () => navigator.clipboard.writeText(params.node?.data?.email ?? ''),
                            icon: '<span>📧</span>',
                          },
                          'separator',
                          'copy',
                          'copyWithHeaders',
                        ]}
                      />
                    </div>
                    {/* Always-visible context menu preview */}
                    <div style={{ width: 200, flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Menu preview</div>
                      <div style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        background: 'var(--component-background, #fff)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        fontSize: 13,
                      }}>
                        {[
                          { icon: '🔍', label: 'View "Steve Kim"' },
                          { icon: '📧', label: 'Copy email' },
                          null,
                          { icon: null, label: 'Copy' },
                          { icon: null, label: 'Copy with Headers' },
                        ].map((item, i) =>
                          item === null ? (
                            <div key={i} style={{ height: 1, background: 'var(--border-color)', margin: '2px 0' }} />
                          ) : (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 12px',
                              cursor: 'default',
                              color: 'var(--text-color)',
                            }}>
                              {item.icon && <span style={{ width: 16, textAlign: 'center' }}>{item.icon}</span>}
                              {!item.icon && <span style={{ width: 16 }} />}
                              <span>{item.label}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <h3>Basic usage</h3>
                <CodeSnippet code={contextMenuBasicCode} title="Basic getContextMenuItems usage (GridTable)" />

                <h3 style={{ marginTop: 24 }}>Built-in items and disabling the menu</h3>
                <CodeSnippet code={contextMenuBuiltinCode} title="Built-in item strings and disabling" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>Key points</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li>Omit <code>getContextMenuItems</code> and AG Grid's default menu shows</li>
                    <li><code>suppressContextMenu={'{true}'}</code> disables the context menu entirely</li>
                    <li>String items: <code>'copy' | 'copyWithHeaders' | 'cut' | 'paste' | 'export' | 'separator'</code></li>
                    <li>Custom items: <code>{'{ name, action, icon, disabled, cssClasses }'}</code></li>
                    <li><code>params.node?.data</code>: the right-clicked row's data / <code>params.value</code>: the cell value</li>
                    <li>Right-clicking a header is controlled separately by <code>suppressHeaderContextMenu</code> on defaultColDef</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── DatePicker cells ── */
          {
            key: 'datepicker-cell',
            label: 'DatePicker cells',
            children: <DateCellDemo />,
          },

          /* ── Tree structure ── */
          {
            key: 'tree',
            label: 'Tree structure',
            children: <TreeDemo />,
          },

          /* ── API reference ── */
          {
            key: 'api',
            label: 'API reference',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Basic configuration</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 180 }}>Prop</th><th>Type</th><th style={{ width: 100 }}>Default</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>columnDefs</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>ColDef&lt;T&gt;[]</code></td><td>—</td><td>The column definitions (AG Grid ColDef)</td></tr>
                      <tr><td><code>rowData</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>T[]</code></td><td>—</td><td>The row data array</td></tr>
                      <tr><td><code>rowKey</code></td><td><code>string</code></td><td><code>"id"</code></td><td>The unique row key field</td></tr>
                      <tr><td><code>defaultColDef</code></td><td><code>ColDef&lt;T&gt;</code></td><td>—</td><td>A default ColDef applied to every column</td></tr>
                      <tr><td><code>editable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Enables editing on every cell</td></tr>
                      <tr><td><code>enableClipboard</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Enables Ctrl+C / Ctrl+V clipboard copy and paste</td></tr>
                      <tr><td><code>rowSelection</code></td><td><code>'singleRow' | 'multiRow'</code></td><td>—</td><td>Row selection mode (omit it and selection is off)</td></tr>
                      <tr><td><code>pagination</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Enables pagination</td></tr>
                      <tr><td><code>pageSize</code></td><td><code>number</code></td><td><code>20</code></td><td>Rows per page</td></tr>
                      <tr><td><code>height</code></td><td><code>string | number</code></td><td><code>"100%"</code></td><td>Grid height. "100%" applies flex:1</td></tr>
                      <tr><td><code>autoHeight</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Sizes the grid to fit the number of rows</td></tr>
                      <tr><td><code>rowHeight</code></td><td><code>number</code></td><td>—</td><td>Row height in px</td></tr>
                      <tr><td><code>headerHeight</code></td><td><code>number</code></td><td>—</td><td>Header height in px</td></tr>
                      <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows the loading overlay</td></tr>
                      <tr><td><code>noRowsMessage</code></td><td><code>string</code></td><td><code>"No data."</code></td><td>Message shown when there are no rows</td></tr>
                      <tr><td><code>enableCellSpan</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Enables cell merging via colSpan / rowSpan</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Row styling and control</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>getRowClass</code></td><td><code>(params: RowClassParams&lt;T&gt;) =&gt; string | string[]</code></td><td>Assigns a CSS class per row, dynamically</td></tr>
                      <tr><td><code>getRowStyle</code></td><td><code>(params: RowClassParams&lt;T&gt;) =&gt; CSSProperties</code></td><td>Assigns an inline style per row, dynamically</td></tr>
                      <tr><td><code>isRowSelectable</code></td><td><code>(node: IRowNode&lt;T&gt;) =&gt; boolean</code></td><td>Whether the row can be selected (false disables its checkbox)</td></tr>
                      <tr><td><code>suppressRowClickSelection</code></td><td><code>boolean</code></td><td>Stops a click from selecting the row (checkbox only)</td></tr>
                      <tr><td><code>rowMultiSelectWithClick</code></td><td><code>boolean</code></td><td>Multi-select by clicking, without holding Ctrl</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Cell and UI control</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>suppressCellFocus</code></td><td><code>boolean</code></td><td>Suppresses the blue focus outline on a cell</td></tr>
                      <tr><td><code>suppressMovableColumns</code></td><td><code>boolean</code></td><td>Stops columns from being dragged</td></tr>
                      <tr><td><code>suppressContextMenu</code></td><td><code>boolean</code></td><td>Disables the right-click context menu</td></tr>
                      <tr><td><code>getContextMenuItems</code></td><td><code>GetContextMenuItems&lt;T&gt;</code></td><td>A function returning the custom context menu items</td></tr>
                      <tr><td><code>floatingFilter</code></td><td><code>boolean</code></td><td>Shows a floating filter row below the header</td></tr>
                      <tr><td><code>quickFilterText</code></td><td><code>string</code></td><td>Quick filter text applied across every column</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Pinned rows, external filters and more</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>pinnedTopRowData</code></td><td><code>T[]</code></td><td>Row data pinned to the top (stays put while scrolling)</td></tr>
                      <tr><td><code>pinnedBottomRowData</code></td><td><code>T[]</code></td><td>Row data pinned to the bottom</td></tr>
                      <tr><td><code>isExternalFilterPresent</code></td><td><code>() =&gt; boolean</code></td><td>Whether an external filter is active</td></tr>
                      <tr><td><code>doesExternalFilterPass</code></td><td><code>(node: IRowNode&lt;T&gt;) =&gt; boolean</code></td><td>Whether a row passes the external filter. Returning false hides it</td></tr>
                      <tr><td><code>context</code></td><td><code>any</code></td><td>A shared object passed to every AG Grid callback</td></tr>
                      <tr><td><code>gridRef</code></td><td><code>RefObject&lt;AgGridReact&lt;T&gt;&gt;</code></td><td>The AgGridReact ref, for direct GridApi control</td></tr>
                      <tr><td><code>gridProps</code></td><td><code>AgGridReactProps&lt;T&gt;</code></td><td>An escape hatch for advanced AG Grid props not covered by GridTableProps</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Events — rows</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Event</th><th>Signature</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>onRowClick</code></td><td><code>(data: T) =&gt; void</code></td><td>Row clicked. data is that row's original data</td></tr>
                      <tr><td><code>onRowDoubleClick</code></td><td><code>(data: T, event: RowDoubleClickedEvent) =&gt; void</code></td><td>Row double-clicked</td></tr>
                      <tr><td><code>onRowSelected</code></td><td><code>(event: RowSelectedEvent&lt;T&gt;) =&gt; void</code></td><td>Fires when an individual row's selection changes</td></tr>
                      <tr><td><code>onSelectionChanged</code></td><td><code>(rows: T[]) =&gt; void</code></td><td>Fires when the full list of selected rows changes</td></tr>
                      <tr><td><code>onFirstDataRendered</code></td><td><code>(event: FirstDataRenderedEvent&lt;T&gt;) =&gt; void</code></td><td>Fires once the first rowData has finished rendering</td></tr>
                      <tr><td><code>onModelUpdated</code></td><td><code>(event: ModelUpdatedEvent&lt;T&gt;) =&gt; void</code></td><td>Fires whenever filtering or sorting changes the displayed rows</td></tr>
                      <tr><td><code>onBodyScrollEnd</code></td><td><code>(event: BodyScrollEndEvent) =&gt; void</code></td><td>The grid body finished scrolling</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Events — cells</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Event</th><th>Signature</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>onCellClicked</code></td><td><code>(event: CellClickedEvent&lt;T&gt;) =&gt; void</code></td><td>Cell clicked</td></tr>
                      <tr><td><code>onCellDoubleClicked</code></td><td><code>(event: CellDoubleClickedEvent&lt;T&gt;) =&gt; void</code></td><td>Cell double-clicked</td></tr>
                      <tr><td><code>onCellValueChanged</code></td><td><code>(event: CellValueChangedEvent&lt;T&gt;) =&gt; void</code></td><td>A cell value changed after editing. Provides event.oldValue and event.newValue</td></tr>
                      <tr><td><code>onCellEditingStarted</code></td><td><code>(event: CellEditingStartedEvent&lt;T&gt;) =&gt; void</code></td><td>A cell entered edit mode</td></tr>
                      <tr><td><code>onCellEditingStopped</code></td><td><code>(event: CellEditingStoppedEvent&lt;T&gt;) =&gt; void</code></td><td>A cell left edit mode</td></tr>
                      <tr><td><code>onCellContextMenu</code></td><td><code>(event: CellContextMenuEvent&lt;T&gt;) =&gt; void</code></td><td>Cell right-clicked</td></tr>
                      <tr><td><code>onCellKeyDown</code></td><td><code>(event: CellKeyDownEvent&lt;T&gt;) =&gt; void</code></td><td>A key was pressed while a cell had focus</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>Events — grid state</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Event</th><th>Signature</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>onGridReady</code></td><td><code>(api: GridApi&lt;T&gt;) =&gt; void</code></td><td>The grid finished initializing</td></tr>
                      <tr><td><code>onSortChanged</code></td><td><code>(event: SortChangedEvent&lt;T&gt;) =&gt; void</code></td><td>A column sort changed</td></tr>
                      <tr><td><code>onFilterChanged</code></td><td><code>(event: FilterChangedEvent&lt;T&gt;) =&gt; void</code></td><td>A filter was applied or cleared</td></tr>
                      <tr><td><code>onPaginationChanged</code></td><td><code>(event: PaginationChangedEvent&lt;T&gt;) =&gt; void</code></td><td>The page or page size changed</td></tr>
                      <tr><td><code>onColumnResized</code></td><td><code>(event: ColumnResizedEvent&lt;T&gt;) =&gt; void</code></td><td>A column was resized by dragging</td></tr>
                      <tr><td><code>onColumnMoved</code></td><td><code>(event: ColumnMovedEvent&lt;T&gt;) =&gt; void</code></td><td>A column was moved by dragging</td></tr>
                      <tr><td><code>onColumnVisible</code></td><td><code>(event: ColumnVisibleEvent&lt;T&gt;) =&gt; void</code></td><td>A column was hidden or shown</td></tr>
                    </tbody>
                  </table>
                </section>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
