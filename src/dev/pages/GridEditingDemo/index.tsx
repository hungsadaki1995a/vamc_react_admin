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

const EMPTY_CODES: import('@/api/common/comCdApi').CodeDetail[] = [];
import styles from './index.module.css';

ModuleRegistry.registerModules([AllCommunityModule]);

/* ─── Code snippets (existing) ─── */
const basicGridCode = `import GridTable from '@/components/grid/GridTable';
import type { ColDef } from 'ag-grid-community';

const columnDefs: ColDef[] = [
  { field: 'name', headerName: '이름', minWidth: 120 },
  { field: 'department', headerName: '부서', width: 100 },
  { field: 'role', headerName: '역할', width: 100 },
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
  { field: 'name', headerName: '업무명', editable: true },
  {
    field: 'status', headerName: '상태',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: {
      values: ['planned', 'in_progress', 'completed'],
      valueLabels: { planned: '계획', in_progress: '진행중', completed: '완료' },
    },
  },
  {
    field: 'dueDate', headerName: '마감일',
    editable: true,
    cellEditor: DateCellEditor,
  },
  {
    field: 'assignee', headerName: '담당자',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: { values: ['김영수', '이미영', '송태현'] },
  },
  {
    field: 'tags', headerName: '태그',
    editable: true,
    cellEditor: TagsCellEditor,
    cellEditorParams: { presetTags: ['긴급', '중요', '버그', '기능'] },
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

/* ─── Code snippets (셀 렌더러/포맷터) ─── */
const formatterCode = `// valueFormatter: 값 포맷팅 (표시만 변경, 원본 데이터는 유지)

const columnDefs: ColDef[] = [
  {
    field: 'hireDate',
    headerName: '입사일',
    valueFormatter: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString('ko-KR');
    },
  },
  {
    field: 'salary',
    headerName: '급여',
    valueFormatter: (params) => {
      if (params.value == null) return '';
      return params.value.toLocaleString('ko-KR') + '원';
    },
  },
  {
    field: 'status',
    headerName: '상태',
    valueFormatter: (params) => {
      const statusMap: Record<string, string> = {
        active: '활성',
        inactive: '비활성',
        pending: '대기중',
      };
      return statusMap[params.value] || params.value;
    },
  },
];`;

const cellRendererCode = `// cellRenderer: 커스텀 React 컴포넌트

import { Tag } from 'antd';
import type { CustomCellRendererProps } from 'ag-grid-react';

// 상태 태그 렌더러
const StatusRenderer = (props: CustomCellRendererProps) => {
  const { value } = props;
  const colorMap: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    pending: 'orange',
  };
  return <Tag color={colorMap[value]}>{value}</Tag>;
};

// 컬럼 정의에서 사용
const columnDefs: ColDef[] = [
  {
    field: 'status',
    headerName: '상태',
    cellRenderer: StatusRenderer,
    width: 100,
  },
];

// 아바타 + 이름 렌더러
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

const cellStyleCode = `// cellStyle, cellClass: 조건부 스타일링

const columnDefs: ColDef[] = [
  {
    field: 'salary',
    headerName: '급여',
    cellStyle: (params) => {
      if (params.value > 6000000) {
        return { backgroundColor: '#fff7e6', color: '#d46b08' };
      }
      return {};
    },
  },
  {
    field: 'status',
    headerName: '상태',
    cellClass: (params) => {
      if (params.value === 'active') return 'cell-active';
      if (params.value === 'inactive') return 'cell-inactive';
      return '';
    },
  },
];

// CSS 정의
.cell-active {
  background-color: #f6ffed;
  color: #52c41a;
}
.cell-inactive {
  background-color: #f5f5f5;
  color: #8c8c8c;
}`;

const tooltipCode = `// 툴팁 설정

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '이름',
    tooltipField: 'name',  // 필드값을 툴팁으로 표시
  },
  {
    field: 'department',
    headerName: '부서',
    tooltipValueGetter: (params) => {
      return \`부서: \${params.data.department}, 팀원: \${params.data.teamSize}명\`;
    },
  },
];

// 전역 툴팁 설정
<AgGridReact
  tooltipShowDelay={500}
  tooltipHideDelay={2000}
  {...props}
/>`;

/* ─── Code snippets (셀 에디터) ─── */
const cellEditorBasicCode = `// 내장 셀 에디터

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '이름',
    editable: true,
    cellEditor: 'agTextCellEditor',
  },
  {
    field: 'age',
    headerName: '나이',
    editable: true,
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: {
      min: 0,
      max: 100,
    },
  },
  {
    field: 'description',
    headerName: '설명',
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
    headerName: '상태',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['active', 'inactive', 'pending'],
    },
  },
];`;

const customCellEditorCode = `// 커스텀 셀 에디터 패턴

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

// 사용
const columnDefs: ColDef[] = [
  {
    field: 'hireDate',
    headerName: '입사일',
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorParams: { format: 'YYYY-MM-DD' },
  },
];`;

/* ─── Code snippets (헤더 그룹핑) ─── */
const headerGroupCode = `// 헤더 그룹핑: children 배열로 컬럼 그룹 구성
const [columnDefs] = useState<(ColDef | ColGroupDef)[]>([
  { field: 'name', headerName: '이름', width: 120, pinned: 'left' },
  {
    headerName: '인사 정보',        // 그룹 헤더명
    children: [                     // 하위 컬럼들
      { field: 'department', headerName: '부서' },
      { field: 'position', headerName: '직급' },
      { field: 'hireDate', headerName: '입사일' },
    ],
  },
  {
    headerName: '급여 정보',
    children: [
      { field: 'salary', headerName: '기본급' },
      { field: 'bonus', headerName: '상여금' },
      { field: 'totalPay', headerName: '총 급여' },
    ],
  },
]);`;

const headerGroupAdvancedCode = `// 다단 헤더 그룹 (중첩)
const columnDefs: (ColDef | ColGroupDef)[] = [
  { field: 'name', headerName: '이름' },
  {
    headerName: '근무 현황',
    children: [
      {
        headerName: '출결',
        children: [
          { field: 'attendance', headerName: '출근일' },
          { field: 'absence', headerName: '결근일' },
        ],
      },
      {
        headerName: '성과',
        children: [
          { field: 'kpi', headerName: 'KPI' },
          { field: 'evaluation', headerName: '평가' },
        ],
      },
    ],
  },
];

// 그룹 열기/닫기 (columnGroupShow)
const columnDefs2 = [
  {
    headerName: '금액 상세',
    children: [
      // 그룹 닫혔을 때 보이는 컬럼
      { field: 'totalPay', headerName: '총액', columnGroupShow: 'closed' },
      // 그룹 열렸을 때 보이는 컬럼들
      { field: 'salary', headerName: '기본급', columnGroupShow: 'open' },
      { field: 'bonus', headerName: '상여금', columnGroupShow: 'open' },
      { field: 'tax', headerName: '세금', columnGroupShow: 'open' },
    ],
  },
];`;

/* ─── Code snippets (셀/행 스패닝) ─── */
const colSpanCode = `// colSpan: 조건에 따라 셀이 여러 컬럼을 차지
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: '구분',
    width: 120,
    // '소계' 행이면 구분+항목 2컬럼 병합
    colSpan: (params) => params.data.category?.includes('소계') ? 2 : 1,
    cellStyle: (params) => {
      if (params.data.category?.includes('소계')) {
        return { fontWeight: 'bold', backgroundColor: '#f5f5f5' };
      }
      return undefined;
    },
  },
  { field: 'item', headerName: '항목', width: 120 },
  { field: 'q1', headerName: '1분기', type: 'numericColumn' },
  { field: 'q2', headerName: '2분기', type: 'numericColumn' },
  { field: 'q3', headerName: '3분기', type: 'numericColumn' },
  { field: 'q4', headerName: '4분기', type: 'numericColumn' },
];`;

const rowSpanCode = `// rowSpan: 같은 값이 연속된 행에서 셀 병합
// AG Grid v35+ Community 기능 (AllCommunityModule에 포함)

const columnDefs: ColDef[] = [
  {
    field: 'department',
    headerName: '부서',
    spanRows: true,       // 같은 값 자동 병합
    sort: 'asc',          // 정렬해야 병합이 의미 있음
  },
  { field: 'name', headerName: '이름' },
  { field: 'position', headerName: '직급' },
];

// GridTable에 enableCellSpan 설정 필요
<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  enableCellSpan={true}
/>`;

/* ─── Code snippets (풋터/고정 행) ─── */
const pinnedRowCode = `// pinnedTopRowData: 상단 고정 행 (헤더 아래)
// pinnedBottomRowData: 하단 고정 행 (풋터)
const pinnedTopRowData = useMemo(() => [
  { name: '[ 평균 ]', department: '-', position: '-', salary: 5460000 },
], []);

const pinnedBottomRowData = useMemo(() => [
  { name: '[ 합계 ]', department: '-', position: '-', salary: 27300000 },
], []);

<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  pinnedTopRowData={pinnedTopRowData}
  pinnedBottomRowData={pinnedBottomRowData}
/>`;

const pinnedRowStyleCode = `// 고정 행 스타일 커스터마이징
const defaultColDef: ColDef = {
  cellStyle: (params) => {
    // 고정 행이면 배경색 + 굵게
    if (params.node.rowPinned) {
      return {
        fontWeight: 'bold',
        backgroundColor: 'var(--content-header-bg, #f5f5f5)',
      };
    }
    return undefined;
  },
};

// getRowStyle로 전체 행 스타일
const getRowStyle = (params) => {
  if (params.node.rowPinned === 'bottom') {
    return { fontWeight: 'bold', background: '#f0f0f0' };
  }
  return undefined;
};`;

const manualGroupingCode = `// Community 에디션에서 그룹핑 효과 자체 구현
// 전략: 데이터를 그룹별로 정렬 + 소계 행 삽입 + valueFormatter(반복 숨김) + colSpan + 구분선

// 1단계: 원본 데이터를 그룹별로 정렬 + 소계 행 삽입
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
      category: category + ' 소계',
      item: '',
      q1: rows.reduce((s, r) => s + r.q1, 0),
      q2: rows.reduce((s, r) => s + r.q2, 0),
      isSubtotal: true,
    });
  });
  return result;
}

// 2단계: valueFormatter(반복 숨김) + colSpan + cellStyle
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: '구분',
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
  { field: 'item', headerName: '항목' },
  { field: 'q1', headerName: '1분기', type: 'numericColumn' },
  { field: 'q2', headerName: '2분기', type: 'numericColumn' },
];

// 3단계: pinnedBottomRowData로 총계 행 추가
<GridTable
  rowData={groupedData}
  columnDefs={columnDefs}
  pinnedBottomRowData={totalRow}
/>`;

/* ─── Code snippets (열 고정) ─── */
const columnPinningCode = `// 열 고정 (Column Pinning)
const columnDefs: ColDef[] = [
  // 좌측 고정: ID, 이름
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left',        // 좌측 고정
    lockPinned: true,       // 드래그로 고정 해제 불가
  },
  {
    field: 'name',
    headerName: '이름',
    width: 120,
    pinned: 'left',
    lockPosition: 'left',  // 컬럼 이동 자체를 제한
  },

  // 일반 컬럼 (스크롤 가능)
  { field: 'department', headerName: '부서', flex: 1 },
  { field: 'position', headerName: '직급', flex: 1 },
  { field: 'hireDate', headerName: '입사일', flex: 1 },
  { field: 'email', headerName: '이메일', width: 200 },

  // 우측 고정: 급여
  {
    field: 'salary',
    headerName: '급여',
    width: 130,
    pinned: 'right',
    type: 'numericColumn',
  },
];`;

const dynamicPinningCode = `// API를 통한 동적 열 고정/해제

// 특정 컬럼을 좌측 고정
api.setColumnsPinned(['name', 'id'], 'left');

// 특정 컬럼을 우측 고정
api.setColumnsPinned(['salary'], 'right');

// 고정 해제
api.setColumnsPinned(['name'], null);

// 컬럼 정의에서 개별 설정
const colDef: ColDef = {
  field: 'name',
  pinned: 'left',
  lockPinned: true,      // 사용자가 고정 해제 불가
  lockPosition: 'left',  // 다른 위치로 이동 불가
  suppressMovable: true,  // 드래그 이동 완전 비활성화
};

// 컨텍스트 메뉴로도 고정 가능
// 컬럼 헤더 우클릭 → "Pin Column" → Left / Right / No Pin`;

/* ─── Code snippets (복사/붙여넣기) ─── */
const clipboardBasicCode = `// GridTable 컴포넌트에 enableClipboard 활성화
<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  rowSelection="multiRow"    // 행 선택 필요
  enableClipboard            // 클립보드 기능 활성화
  editable                   // 붙여넣기는 편집모드에서만
  onCellValueChanged={handleCellValueChanged}
/>

// 사용법:
// 1. 체크박스로 행 선택 (여러 행 가능)
// 2. Ctrl+C → 선택 행이 헤더 포함 탭 구분 텍스트로 복사
// 3. 엑셀/구글시트에 Ctrl+V로 붙여넣기 가능
// 4. 편집모드에서 Ctrl+V → 클립보드 데이터가 셀에 입력`;

const clipboardImplCode = `// GridTable.tsx 내부 클립보드 구현 핵심
useEffect(() => {
  if (!enableClipboard) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!container.contains(e.target as Node)) return;
    const api = gridRef.current?.api;
    if (!api) return;

    // Ctrl+C: 선택된 행을 탭 구분 텍스트로 복사
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
      message.success(selectedRows.length + '행 복사');
    }

    // Ctrl+V: 클립보드 → 포커스 셀부터 붙여넣기
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

  // capture: true → AG Grid 내부 이벤트 차단 무관하게 동작
  document.addEventListener('keydown', handleKeyDown, true);
  return () => document.removeEventListener('keydown', handleKeyDown, true);
}, [enableClipboard, columnDefs, editable]);`;

const contextMenuBasicCode = `// getContextMenuItems prop으로 우클릭 메뉴를 커스터마이징합니다.
import GridTable from '@/components/grid/GridTable';
import type { GetContextMenuItemsParams } from 'ag-grid-community';

<GridTable
  columnDefs={columnDefs}
  rowData={rowData}
  rowKey="id"
  getContextMenuItems={(params: GetContextMenuItemsParams) => [
    {
      name: \`"\${params.node?.data?.name}" 상세보기\`,
      action: () => openDetail(params.node?.data),
      icon: '<span>🔍</span>',
    },
    {
      name: '수정',
      disabled: !canWrite,
      action: () => openEdit(params.node?.data),
      icon: '<span>✏️</span>',
    },
    'separator',
    {
      name: '삭제',
      disabled: !canWrite,
      action: () => handleDelete(params.node?.data?.id),
      icon: '<span>🗑️</span>',
    },
    'separator',
    'copy',           // AG Grid 기본 제공 항목
    'copyWithHeaders',
  ]}
/>`;

const contextMenuBuiltinCode = `// AG Grid 기본 제공 항목 (문자열로 지정)
// 'copy' | 'copyWithHeaders' | 'cut' | 'paste' | 'export' | 'separator'

// 기본 항목만 유지하는 예시
getContextMenuItems={() => ['copy', 'copyWithHeaders', 'separator', 'export']}

// 완전히 비활성화
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
  { id: 'E001', name: '김영수', department: '개발1팀', role: '팀장', email: 'kim@ds.com', joinDate: '2020-03-15' },
  { id: 'E002', name: '이미영', department: '개발1팀', role: '선임', email: 'lee@ds.com', joinDate: '2019-07-01' },
  { id: 'E003', name: '박정호', department: '개발2팀', role: '팀장', email: 'park@ds.com', joinDate: '2021-05-20' },
  { id: 'E004', name: '최수진', department: '개발2팀', role: '사원', email: 'choi@ds.com', joinDate: '2023-01-10' },
  { id: 'E005', name: '정민우', department: '기획팀', role: '팀장', email: 'jung@ds.com', joinDate: '2018-11-01' },
  { id: 'E006', name: '한지은', department: '디자인팀', role: '선임', email: 'han@ds.com', joinDate: '2020-09-15' },
  { id: 'E007', name: '송태현', department: '개발1팀', role: '사원', email: 'song@ds.com', joinDate: '2022-06-01' },
  { id: 'E008', name: '윤서연', department: 'QA팀', role: '팀장', email: 'yoon@ds.com', joinDate: '2019-03-20' },
  { id: 'E009', name: '임재혁', department: '개발2팀', role: '선임', email: 'im@ds.com', joinDate: '2021-09-01' },
  { id: 'E010', name: '오하늘', department: '기획팀', role: '사원', email: 'oh@ds.com', joinDate: '2023-07-15' },
  { id: 'E011', name: '강민준', department: '개발1팀', role: '사원', email: 'kang@ds.com', joinDate: '2024-02-01' },
  { id: 'E012', name: '서지훈', department: '개발2팀', role: '사원', email: 'seo@ds.com', joinDate: '2024-04-10' },
  { id: 'E013', name: '장수연', department: '디자인팀', role: '사원', email: 'jang@ds.com', joinDate: '2023-11-01' },
  { id: 'E014', name: '배현우', department: 'QA팀', role: '선임', email: 'bae@ds.com', joinDate: '2020-12-15' },
  { id: 'E015', name: '권도현', department: '인프라팀', role: '팀장', email: 'kwon@ds.com', joinDate: '2017-08-01' },
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
  { id: 'T001', name: '로그인 UI 개발', status: 'in_progress', priority: '높음', dueDate: '2025-04-15', assignee: '김영수', tags: ['기능', '긴급'] },
  { id: 'T002', name: 'API 인증 모듈', status: 'planned', priority: '높음', dueDate: '2025-04-20', assignee: '이미영', tags: ['기능'] },
  { id: 'T003', name: '대시보드 차트', status: 'completed', priority: '중간', dueDate: '2025-03-30', assignee: '송태현', tags: ['기능', '개선'] },
  { id: 'T004', name: '메모리 누수 수정', status: 'in_progress', priority: '긴급', dueDate: '2025-04-10', assignee: '박정호', tags: ['버그', '긴급'] },
  { id: 'T005', name: '문서 업데이트', status: 'planned', priority: '낮음', dueDate: '2025-05-01', assignee: '윤서연', tags: [] },
  { id: 'T006', name: '성능 테스트', status: 'planned', priority: '중간', dueDate: '2025-04-25', assignee: '배현우', tags: ['QA'] },
  { id: 'T007', name: '다크모드 지원', status: 'planned', priority: '낮음', dueDate: '2025-05-15', assignee: '한지은', tags: ['UI', '개선'] },
  { id: 'T008', name: 'DB 인덱스 최적화', status: 'in_progress', priority: '높음', dueDate: '2025-04-30', assignee: '임재혁', tags: ['성능', 'DB'] },
  { id: 'T009', name: '알림 센터 구현', status: 'completed', priority: '중간', dueDate: '2025-03-25', assignee: '최수진', tags: ['기능'] },
  { id: 'T010', name: '접근성(a11y) 개선', status: 'planned', priority: '낮음', dueDate: '2025-06-30', assignee: '오하늘', tags: ['UI', '접근성'] },
  { id: 'T011', name: 'CI/CD 파이프라인 설정', status: 'completed', priority: '높음', dueDate: '2025-03-10', assignee: '권도현', tags: ['DevOps'] },
  { id: 'T012', name: '모바일 반응형 작업', status: 'in_progress', priority: '중간', dueDate: '2025-05-20', assignee: '장수연', tags: ['UI', '모바일'] },
];

const statusColors: Record<string, string> = { planned: 'default', in_progress: 'processing', completed: 'success' };
const statusLabels: Record<string, string> = { planned: '계획', in_progress: '진행중', completed: '완료' };
const priorityColors: Record<string, string> = { '긴급': 'red', '높음': 'orange', '중간': 'blue', '낮음': 'default' };

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
  { id: 1, name: '김철수', department: '개발팀', position: '팀장', hireDate: '2020-01-15', salary: 6500000, bonus: 1000000 },
  { id: 2, name: '박민수', department: '개발팀', position: '대리', hireDate: '2022-05-10', salary: 4500000, bonus: 600000 },
  { id: 3, name: '한지혜', department: '개발팀', position: '사원', hireDate: '2024-02-01', salary: 3500000, bonus: 400000 },
  { id: 4, name: '이영희', department: '기획팀', position: '과장', hireDate: '2021-03-20', salary: 5500000, bonus: 800000 },
  { id: 5, name: '정수연', department: '디자인팀', position: '사원', hireDate: '2023-07-01', salary: 3800000, bonus: 500000 },
  { id: 6, name: '최동욱', department: '영업팀', position: '부장', hireDate: '2019-11-05', salary: 7000000, bonus: 1200000 },
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
  { id: 1, category: '매출', item: '제품A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { id: 2, category: '매출', item: '제품B', q1: 800, q2: 900, q3: 950, q4: 1100 },
  { id: 3, category: '매출', item: '제품C', q1: 600, q2: 700, q3: 750, q4: 800 },
  { id: 4, category: '매출 소계', item: '', q1: 2600, q2: 3100, q3: 2800, q4: 3700 },
  { id: 5, category: '비용', item: '인건비', q1: 2000, q2: 2000, q3: 2100, q4: 2100 },
  { id: 6, category: '비용', item: '운영비', q1: 500, q2: 550, q3: 520, q4: 600 },
  { id: 7, category: '비용', item: '마케팅', q1: 300, q2: 400, q3: 350, q4: 500 },
  { id: 8, category: '비용 소계', item: '', q1: 2800, q2: 2950, q3: 2970, q4: 3200 },
];

interface RowSpanDemoRow {
  id: number;
  department: string;
  team: string;
  name: string;
  role: string;
}

const rowSpanDemoData: RowSpanDemoRow[] = [
  { id: 1, department: '개발본부', team: '프론트엔드', name: '김철수', role: '팀장' },
  { id: 2, department: '개발본부', team: '프론트엔드', name: '이영희', role: '시니어' },
  { id: 3, department: '개발본부', team: '백엔드', name: '박민수', role: '팀장' },
  { id: 4, department: '개발본부', team: '백엔드', name: '한지혜', role: '주니어' },
  { id: 5, department: '개발본부', team: '백엔드', name: '조현우', role: '주니어' },
  { id: 6, department: '경영지원', team: '인사팀', name: '정수연', role: '과장' },
  { id: 7, department: '경영지원', team: '인사팀', name: '최동욱', role: '대리' },
  { id: 8, department: '경영지원', team: '재무팀', name: '윤미라', role: '팀장' },
];

// ── Code snippets (DatePicker 셀) ─────────────────────────────────────────────

const dateCellCode = `import DateCellEditor, { DateCellRenderer } from '@/components/grid/cellEditors/DateCellEditor';

// DateCellRenderer: 날짜를 지정 포맷으로 표시
// DateCellEditor:   Ant Design DatePicker 팝업 에디터 (선택 즉시 편집 종료)
const columnDefs: ColDef[] = [
  {
    field: 'startDt',
    headerName: '시작일',
    editable: true,
    cellRenderer: DateCellRenderer,
    cellRendererParams: { format: 'YYYY-MM-DD' },  // 기본값, 생략 가능
    cellEditor: DateCellEditor,
  },
  {
    field: 'endDt',
    headerName: '종료일',
    editable: true,
    cellRenderer: DateCellRenderer,
    cellRendererParams: { format: 'YYYY.MM.DD' },  // 커스텀 포맷
    cellEditor: DateCellEditor,
    cellEditorParams: { format: 'YYYY.MM.DD' },
  },
];

// GridTable 사용
<GridTable
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  editable={false}   // 컬럼별 editable: true로 개별 제어
  pagination={false}
/>`;

// ── Code snippets (Tree 구조) ─────────────────────────────────────────────────

const treeCellCode = `import { useTreeGrid } from '@/components/grid/useTreeGrid';
import { TreeCellRenderer } from '@/components/grid/TreeCellRenderer';

// 1) 원본 flat 데이터 (parentId로 계층 표현)
const orgData = [
  { id: '001', name: '본사', parentId: null },
  { id: '010', name: '개발본부', parentId: '001' },
  { id: '011', name: '프론트엔드팀', parentId: '010' },
  { id: '012', name: '백엔드팀', parentId: '010' },
  { id: '020', name: '경영지원본부', parentId: '001' },
  { id: '021', name: '인사팀', parentId: '020' },
];

// 2) useTreeGrid로 트리 데이터 처리
const { treeData, toggleExpand, expandAll, collapseAll } = useTreeGrid({
  data: orgData,
  idField: 'id',          // PK 필드명 (기본값: 'id')
  parentField: 'parentId', // 부모 ID 필드명 (기본값: 'parentId')
  defaultExpanded: true,   // 초기 전체 펼침 (기본값: true)
});

// 3) TreeCellRenderer를 계층 컬럼에 적용
const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '조직명',
    cellRenderer: TreeCellRenderer,
    cellRendererParams: {
      onToggle: toggleExpand,   // 접기/펼치기 토글
      indentSize: 18,           // 레벨당 들여쓰기(px), 기본값 18
    },
  },
  { field: 'id', headerName: '코드', width: 100 },
];

// 4) GridTable에 treeData 사용 (rowKey 필수)
<GridTable
  columnDefs={columnDefs}
  rowData={treeData}
  rowKey="id"
  pagination={false}
/>`;

// ── Code snippets (ComcdSelect 체이닝) ────────────────────────────────────────

const comcdChainCellCode = `import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';
import type { CodeDetail } from '@/api/common/comCdApi';

// cellEditorParams를 함수로 지정하면 params.data (행 데이터)에 접근 가능
// → 같은 행의 다른 컬럼값으로 자식 셀렉트 옵션 필터링
const columnDefs: ColDef[] = [
  // 부모 컬럼
  {
    field: 'parentCd',
    headerName: '대분류',
    editable: true,
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'PARENT_CD' },
    cellEditor: ComcdSelectCellEditor,
    cellEditorParams: { cdDmnId: 'PARENT_CD' },
  },
  // 자식 컬럼 — cellEditorParams를 함수로 사용하여 부모값 참조
  {
    field: 'childCd',
    headerName: '소분류',
    editable: true,
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'CHILD_CD' },
    cellEditor: ComcdSelectCellEditor,
    // 함수 형태 — params.data에서 같은 행의 parentCd 읽기
    cellEditorParams: (params: any) => ({
      cdDmnId: 'CHILD_CD',
      filterFn: (code: CodeDetail) => code.bzLrgCzCd === params.data.parentCd,
    }),
  },
];`;

// ── Code snippets for ComcdSelect / SearchSelect cell demo ───────────────────

const comcdCellCode = `import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';

// cellRenderer: 코드값 → 명칭으로 자동 표시 (comcdStore 참조)
// cellEditor:   ComcdSelect 드롭다운 팝업 에디터
const columnDefs: ColDef[] = [
  {
    field: 'jbcCd',
    headerName: '직급',
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'JBC_CD' },
    // editable 편집 추가 시:
    editable: true,
    cellEditor: ComcdSelectCellEditor,
    cellEditorParams: { cdDmnId: 'JBC_CD' },
  },
  {
    field: 'gdCd',
    headerName: '등급',
    cellRenderer: ComcdSelectCellRenderer,
    cellRendererParams: { cdDmnId: 'GD_CD' },
  },
];`;

const searchCellCode = `import { SearchSelectCellRenderer, SearchSelectCellEditor, searchSelectValueFormatter } from '@/components/grid/SearchSelectCell';
import { getOrgList } from '@/api/{도메인}/org';   // API 호출은 src/api/{도메인}/ 아래에 둔다

// cellRenderer:    { label, value } 또는 plain string에서 명칭(label)만 표시
// valueFormatter:  AG Grid warning #48 억제 + 클립보드/CSV 텍스트 변환
// cellEditor:      AutoComplete 에디터 (fetchOptions 또는 staticOptions 전달)
const columnDefs: ColDef[] = [
  {
    field: 'dept',
    headerName: '부서',
    editable: true,
    cellRenderer: SearchSelectCellRenderer,
    valueFormatter: searchSelectValueFormatter,  // ← warning #48 해결
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
    headerName: '부서 (staticOptions)',
    editable: true,
    cellRenderer: SearchSelectCellRenderer,
    cellEditor: SearchSelectCellEditor,
    cellEditorParams: {
      staticOptions: [
        { label: '개발1팀', value: 'D001' },
        { label: '개발2팀', value: 'D002' },
        { label: '기획팀',  value: 'D003' },
        { label: '디자인팀', value: 'D004' },
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
  { label: '개발1팀',   value: 'D001', upDept: '개발본부' },
  { label: '개발2팀',   value: 'D002', upDept: '개발본부' },
  { label: '기획팀',    value: 'D003', upDept: '경영지원' },
  { label: '디자인팀',  value: 'D004', upDept: '경영지원' },
  { label: 'QA팀',     value: 'D005', upDept: '개발본부' },
  { label: '인사팀',    value: 'D006', upDept: '경영지원' },
  { label: '재무팀',    value: 'D007', upDept: '경영지원' },
];

// ── 체이닝 그리드 데모 데이터 ─────────────────────────────────────────────────

const CHAIN_PARENT_OPTS = [
  { label: 'SW 개발', value: 'SW' },
  { label: '인프라', value: 'INFRA' },
  { label: '운영지원', value: 'OPS' },
];

const CHAIN_CHILD_MAP: Record<string, Array<{ label: string; value: string }>> = {
  SW:    [{ label: '프론트엔드', value: 'SW01' }, { label: '백엔드', value: 'SW02' }, { label: '모바일앱', value: 'SW03' }],
  INFRA: [{ label: '네트워크', value: 'INF01' }, { label: '서버/스토리지', value: 'INF02' }, { label: 'DB 관리', value: 'INF03' }],
  OPS:   [{ label: '모니터링', value: 'OPS01' }, { label: '고객지원', value: 'OPS02' }, { label: '보안운영', value: 'OPS03' }],
};

const CHAIN_PARENT_LABEL: Record<string, string> = Object.fromEntries(CHAIN_PARENT_OPTS.map(o => [o.value, o.label]));
const CHAIN_CHILD_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(CHAIN_CHILD_MAP).flat().map(o => [o.value, o.label]),
);

interface ChainRow { id: number; task: string; parentCd: string; childCd: string; }

const CHAIN_INIT_ROWS: ChainRow[] = [
  { id: 1, task: '로그인 UI 개발', parentCd: 'SW', childCd: 'SW01' },
  { id: 2, task: '서버 증설', parentCd: 'INFRA', childCd: 'INF02' },
  { id: 3, task: '장애 대응', parentCd: 'OPS', childCd: 'OPS01' },
  { id: 4, task: '미분류 업무', parentCd: '', childCd: '' },
];

function ComcdChainGridDemo() {
  const [rows, setRows] = useState<ChainRow[]>(CHAIN_INIT_ROWS);

  const chainCols = useMemo<ColDef<ChainRow>[]>(() => [
    { field: 'task', headerName: '업무명', minWidth: 160, editable: true },
    {
      field: 'parentCd', headerName: '대분류', width: 140, flex: 0,
      editable: true,
      cellRenderer: (p: any) => {
        const label = CHAIN_PARENT_LABEL[p.value];
        return label
          ? <span style={{ background: '#e6f4ff', color: '#1677ff', padding: '1px 7px', borderRadius: 10, fontSize: 12 }}>{label}</span>
          : <span style={{ color: '#bfbfbf', fontSize: 12 }}>미선택</span>;
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
      field: 'childCd', headerName: '소분류', width: 180,
      editable: (p: any) => !!p.data?.parentCd,
      cellRenderer: (p: any) => {
        if (!p.data?.parentCd) return <span style={{ color: '#bfbfbf', fontSize: 12 }}>← 대분류 먼저</span>;
        const label = CHAIN_CHILD_LABEL[p.value];
        return label
          ? <span style={{ background: '#f6ffed', color: '#52c41a', padding: '1px 7px', borderRadius: 10, fontSize: 12 }}>{label}</span>
          : <span style={{ color: '#bfbfbf', fontSize: 12 }}>선택 없음</span>;
      },
      // cellEditorParams를 함수로 — params.data.parentCd 기반으로 옵션 동적 필터링
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
      // 대분류 변경 시 소분류 초기화
      if (e.colDef.field === 'parentCd') return { ...e.data as ChainRow, childCd: '' };
      return e.data as ChainRow;
    }));
  }, []);

  return (
    <div style={{ marginTop: 12 }}>
      <Alert
        type="info"
        showIcon
        title='대분류 셀을 클릭 → 값 변경 → 소분류 셀 클릭 시 해당 대분류의 항목만 표시됩니다. 대분류가 없으면 소분류는 편집 불가.'
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
        id: 1, name: '홍길동',
        jbcCd: jbc[2]?.cd ?? jbc[0]?.cd ?? '',
        gdCd:  gd[0]?.cd ?? '',
        dept: { label: '개발1팀', value: 'D001' },
      },
      {
        id: 2, name: '김철수',
        jbcCd: jbc[1]?.cd ?? jbc[0]?.cd ?? '',
        gdCd:  gd[1]?.cd ?? gd[0]?.cd ?? '',
        dept: { label: '기획팀', value: 'D003' },
      },
      {
        id: 3, name: '이영희',
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
    { field: 'name', headerName: '이름', width: 110, editable: true },
    {
      field: 'jbcCd',
      headerName: '직급',
      width: 120,
      editable: true,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'JBC_CD' },
      cellEditor: ComcdSelectCellEditor,
      cellEditorParams: { cdDmnId: 'JBC_CD' },
    },
    {
      field: 'gdCd',
      headerName: '등급',
      width: 120,
      editable: true,
      cellRenderer: ComcdSelectCellRenderer,
      cellRendererParams: { cdDmnId: 'GD_CD' },
      cellEditor: ComcdSelectCellEditor,
      cellEditorParams: { cdDmnId: 'GD_CD' },
    },
    {
      field: 'dept',
      headerName: '부서(SearchSelect)',
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
        <thead><tr><th style={{ width: 240 }}>컴포넌트 / Prop</th><th>타입</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td><code>ComcdSelectCellRenderer</code></td><td>cellRenderer</td><td>comcdStore에서 코드명 조회 후 표시 (cdDmnId 필수)</td></tr>
          <tr><td><code>ComcdSelectCellEditor</code></td><td>cellEditor</td><td>공통코드 드롭다운 팝업 에디터 (cdDmnId 필수)</td></tr>
          <tr><td><code>cellRendererParams.cdDmnId</code></td><td><code>string</code></td><td>조회할 공통코드 도메인 ID (예: 'JBC_CD')</td></tr>
          <tr><td><code>cellEditorParams.cdDmnId</code></td><td><code>string</code></td><td>에디터에서 조회할 공통코드 도메인 ID</td></tr>
          <tr><td><code>cellEditorParams.filterFn</code></td><td><code>(codes, row) =&gt; codes</code></td><td>다른 컬럼값 기반 코드 필터링 (체이닝)</td></tr>
          <tr><td><code>SearchSelectCellRenderer</code></td><td>cellRenderer</td><td>{'{label, value}'} 또는 string에서 label 표시</td></tr>
          <tr><td><code>SearchSelectCellEditor</code></td><td>cellEditor</td><td>AutoComplete 방식 검색 에디터</td></tr>
          <tr><td><code>cellEditorParams.staticOptions</code></td><td><code>Option[]</code></td><td>정적 옵션 배열</td></tr>
          <tr><td><code>cellEditorParams.fetchOptions</code></td><td><code>(kw) =&gt; Promise&lt;Option[]&gt;</code></td><td>키워드 기반 서버 조회 함수</td></tr>
        </tbody>
      </table>

      <h3>ComcdSelectCell — 공통코드 셀 렌더러/에디터</h3>
      <p className={styles.demoDesc}>
        <code>ComcdSelectCellRenderer</code>는 comcdStore에서 코드명을 조회해 표시합니다.
        <code>ComcdSelectCellEditor</code>는 ComcdSelect 드롭다운 팝업 에디터입니다.
        <br />
        <strong>※ comcdStore가 로드된 환경에서만 명칭이 표시됩니다.</strong> 개발 환경에서 코드값 그대로 보이면 정상입니다 (store 미로드).
      </p>

      <Alert
        type="info"
        showIcon
        title="셀을 클릭하면 에디터가 열립니다. 직급/등급은 ComcdSelect 드롭다운, 부서는 AutoComplete 방식입니다."
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

      <Divider titlePlacement="left" style={{ marginTop: 20 }}>ComcdSelectCell 사용법</Divider>
      <CodeSnippet code={comcdCellCode} title="ComcdSelectCell (renderer + editor)" />

      <Divider titlePlacement="left" style={{ marginTop: 16 }}>ComcdSelectCell 체이닝 — 라이브 데모</Divider>
      <p className={styles.demoDesc}>
        <code>cellEditorParams</code>를 <strong>함수</strong>로 지정하면 <code>params.data</code>에서
        같은 행의 다른 컬럼값을 읽어 소분류 옵션을 동적으로 필터링합니다.
        아래 그리드에서 <strong>대분류 → 소분류 순서로 클릭</strong>하여 체이닝을 확인하세요.
      </p>
      <ComcdChainGridDemo />
      <div style={{ marginTop: 12 }}>
        <CodeSnippet code={comcdChainCellCode} title="ComcdSelectCell 체이닝 (cellEditorParams 함수)" />
      </div>

      <Divider titlePlacement="left" style={{ marginTop: 16 }}>SearchSelectCell 사용법</Divider>
      <p className={styles.demoDesc}>
        <code>SearchSelectCellRenderer</code>는 <code>{'{ label, value }'}</code> 또는 plain string에서
        label(명칭)만 표시합니다. <code>SearchSelectCellEditor</code>는 <code>fetchOptions</code> 또는
        <code>staticOptions</code>를 받아 AutoComplete 방식으로 동작합니다.
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
  { id: 1, name: '프로젝트 킥오프', startDt: '2025-04-01', endDt: '2025-04-15', planDt: '2025-03-25' },
  { id: 2, name: '요구사항 분석', startDt: '2025-04-10', endDt: '2025-04-30', planDt: '2025-04-05' },
  { id: 3, name: '설계 및 아키텍처', startDt: '2025-05-01', endDt: '2025-05-20', planDt: '2025-04-28' },
  { id: 4, name: '개발 스프린트 1', startDt: '2025-05-21', endDt: '2025-06-10', planDt: '' },
  { id: 5, name: '개발 스프린트 2', startDt: '2025-06-11', endDt: '2025-06-30', planDt: '' },
];

function DateCellDemo() {
  const [rows, setRows] = useState<DateDemoRow[]>(dateDemoData);

  const dateCols = useMemo<ColDef<DateDemoRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 60, flex: 0, editable: false },
    { field: 'name', headerName: '업무명', minWidth: 180, editable: true },
    {
      field: 'startDt', headerName: '시작일', width: 130, flex: 0,
      editable: true,
      cellRenderer: DateCellRenderer,
      cellRendererParams: { format: 'YYYY-MM-DD' },
      cellEditor: DateCellEditor,
    },
    {
      field: 'endDt', headerName: '종료일', width: 130, flex: 0,
      editable: true,
      cellRenderer: DateCellRenderer,
      cellRendererParams: { format: 'YYYY-MM-DD' },
      cellEditor: DateCellEditor,
    },
    {
      field: 'planDt', headerName: '계획일 (YYYY.MM.DD)', width: 180, flex: 0,
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
        <thead><tr><th style={{ width: 260 }}>컴포넌트 / Prop</th><th>타입</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td><code>DateCellRenderer</code></td><td>cellRenderer</td><td>날짜 값을 지정 포맷으로 표시하는 렌더러</td></tr>
          <tr><td><code>cellRendererParams.format</code></td><td><code>string</code></td><td>표시 포맷 (기본: <code>'YYYY-MM-DD'</code>)</td></tr>
          <tr><td><code>DateCellEditor</code></td><td>cellEditor</td><td>Ant Design DatePicker 팝업 에디터. 날짜 선택 즉시 편집 종료</td></tr>
          <tr><td><code>cellEditorParams.format</code></td><td><code>string</code></td><td>에디터 내 DatePicker 포맷 (기본: <code>'YYYY-MM-DD'</code>)</td></tr>
        </tbody>
      </table>

      <h3>DateCellEditor + DateCellRenderer</h3>
      <p className={styles.demoDesc}>
        셀을 클릭하면 Ant Design <code>DatePicker</code>가 팝업으로 열립니다.
        날짜 선택 즉시 편집이 종료되고 포맷팅된 날짜가 표시됩니다.
        <code>cellRendererParams.format</code>으로 표시 형식을 지정할 수 있습니다.
      </p>
      <Alert
        type="info"
        showIcon
        title="날짜 컬럼을 클릭하여 DatePicker를 열어보세요. 날짜 선택 즉시 저장됩니다."
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
      <Divider titlePlacement="left" style={{ marginTop: 20 }}>사용법</Divider>
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
  { id: '001', name: 'VAMC', type: '회사', headcount: 1200, parentId: null },
  { id: '010', name: '개발본부', type: '본부', headcount: 480, parentId: '001' },
  { id: '011', name: '프론트엔드팀', type: '팀', headcount: 120, parentId: '010' },
  { id: '012', name: '백엔드팀', type: '팀', headcount: 150, parentId: '010' },
  { id: '013', name: '인프라팀', type: '팀', headcount: 80, parentId: '010' },
  { id: '014', name: 'QA팀', type: '팀', headcount: 60, parentId: '010' },
  { id: '020', name: '경영지원본부', type: '본부', headcount: 320, parentId: '001' },
  { id: '021', name: '인사팀', type: '팀', headcount: 90, parentId: '020' },
  { id: '022', name: '재무팀', type: '팀', headcount: 70, parentId: '020' },
  { id: '023', name: '법무팀', type: '팀', headcount: 40, parentId: '020' },
  { id: '030', name: '영업본부', type: '본부', headcount: 400, parentId: '001' },
  { id: '031', name: '국내영업팀', type: '팀', headcount: 200, parentId: '030' },
  { id: '032', name: '해외영업팀', type: '팀', headcount: 150, parentId: '030' },
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
      headerName: '조직명',
      minWidth: 220,
      cellRenderer: TreeCellRenderer,
      cellRendererParams: { onToggle: toggleExpand, indentSize: 20 },
    },
    { field: 'type', headerName: '구분', width: 80, flex: 0 },
    { field: 'id', headerName: '코드', width: 80, flex: 0 },
    {
      field: 'headcount', headerName: '인원', width: 80, flex: 0,
      type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? p.value.toLocaleString() : '',
    },
  ], [toggleExpand]);

  return (
    <div className={styles.demoSection}>
      <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
        <thead><tr><th style={{ width: 260 }}>훅 / 컴포넌트 / Prop</th><th>타입</th><th>설명</th></tr></thead>
        <tbody>
          <tr><td><code>useTreeGrid(options)</code></td><td>Hook</td><td>flat 데이터를 DFS 순 트리 행으로 변환. Enterprise 불필요</td></tr>
          <tr><td><code>options.data</code></td><td><code>T[]</code></td><td>원본 flat 데이터 배열</td></tr>
          <tr><td><code>options.idField</code></td><td><code>string</code></td><td>고유 ID 필드명 (기본: <code>'id'</code>)</td></tr>
          <tr><td><code>options.parentField</code></td><td><code>string</code></td><td>부모 ID 필드명 (기본: <code>'parentId'</code>)</td></tr>
          <tr><td><code>options.defaultExpanded</code></td><td><code>boolean</code></td><td>초기 전체 펼침 여부 (기본: <code>true</code>)</td></tr>
          <tr><td><code>returns.treeData</code></td><td><code>TreeRow&lt;T&gt;[]</code></td><td>GridTable rowData에 전달할 처리된 트리 행 배열</td></tr>
          <tr><td><code>returns.toggleExpand(id)</code></td><td><code>fn</code></td><td>노드 접기/펼치기 토글</td></tr>
          <tr><td><code>returns.expandAll / collapseAll</code></td><td><code>fn</code></td><td>전체 펼치기 / 전체 접기</td></tr>
          <tr><td><code>TreeCellRenderer</code></td><td>cellRenderer</td><td>들여쓰기 + 토글 아이콘이 있는 계층 셀 렌더러</td></tr>
          <tr><td><code>cellRendererParams.onToggle</code></td><td><code>(id) =&gt; void</code></td><td>toggleExpand 함수 전달 (필수)</td></tr>
          <tr><td><code>cellRendererParams.indentSize</code></td><td><code>number</code></td><td>레벨당 들여쓰기 px (기본: 18)</td></tr>
        </tbody>
      </table>

      <h3>Tree 구조 — useTreeGrid + TreeCellRenderer</h3>
      <p className={styles.demoDesc}>
        AG Grid Community Edition 제약을 우회하여, flat 데이터를 DFS 순서로 재배치하고
        커스텀 셀 렌더러로 계층 UI를 구현합니다. Enterprise 라이선스 불필요.
      </p>
      <Alert
        type="info"
        showIcon
        title="조직명 옆 ▶ 아이콘을 클릭하면 하위 조직을 접고 펼칩니다."
        style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={expandAll}
          style={{ padding: '2px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}>
          전체 펼치기
        </button>
        <button onClick={collapseAll}
          style={{ padding: '2px 10px', fontSize: 12, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}>
          전체 접기
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
      <Divider titlePlacement="left" style={{ marginTop: 20 }}>사용법</Divider>
      <CodeSnippet code={treeCellCode} title="useTreeGrid + TreeCellRenderer" />
    </div>
  );
}

// ── ToolbarActionDemo ───────────────────────────────────────────────────────────

interface MemberRow { id: number; name: string; role: string; team: string; }

const memberData: MemberRow[] = [
  { id: 1, name: '김영수', role: '개발자', team: '백엔드' },
  { id: 2, name: '이미영', role: '디자이너', team: 'UX' },
  { id: 3, name: '박지성', role: 'PM', team: '기획' },
  { id: 4, name: '송태현', role: '개발자', team: '프론트' },
  { id: 5, name: '최유진', role: 'QA', team: '품질' },
];

const memberColDefs: ColDef<MemberRow>[] = [
  { field: 'name', headerName: '이름', width: 100 },
  { field: 'role', headerName: '역할', width: 100 },
  { field: 'team', headerName: '팀', width: 100 },
];

function ToolbarActionDemo() {
  const { message, modal } = App.useApp();
  const [data, setData] = useState<MemberRow[]>(memberData);
  const [selected, setSelected] = useState<MemberRow[]>([]);

  const handleAdd = () => {
    const newId = Math.max(...data.map((r) => r.id)) + 1;
    const newRow: MemberRow = { id: newId, name: `신규${newId}`, role: '개발자', team: '백엔드' };
    setData((prev) => [...prev, newRow]);
    message.success(`'${newRow.name}' 행이 추가됐습니다.`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: '삭제 확인',
      content: `선택한 ${selected.length}건을 삭제하시겠습니까?`,
      okText: '삭제',
      okButtonProps: { danger: true },
      onOk: () => {
        const ids = new Set(selected.map((r) => r.id));
        setData((prev) => prev.filter((r) => !ids.has(r.id)));
        setSelected([]);
        message.success(`${selected.length}건 삭제됐습니다.`);
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
            등록
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleDelete}
            disabled={selected.length === 0}
          >
            삭제 {selected.length > 0 && `(${selected.length})`}
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
  { id: 1, name: '김영수', dept: '개발팀', score: 92 },
  { id: 2, name: '이미영', dept: '기획팀', score: 85 },
  { id: 3, name: '박정호', dept: '개발팀', score: 78 },
  { id: 4, name: '최수진', dept: 'QA팀',   score: 95 },
];

const clipboardColDefs: ColDef<ClipboardRow>[] = [
  { field: 'name',  headerName: '이름', width: 100, editable: false },
  { field: 'dept',  headerName: '부서', width: 100, editable: false },
  { field: 'score', headerName: '점수 (편집 가능)', width: 160, editable: true },
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
    { field: 'name', headerName: '이름', width: 100, flex: 0 },
    { field: 'department', headerName: '부서', width: 100, flex: 0 },
    { field: 'role', headerName: '역할', width: 90, flex: 0 },
    { field: 'email', headerName: '이메일', minWidth: 180 },
    { field: 'joinDate', headerName: '입사일', width: 120, flex: 0 },
  ], []);

  const editableCols = useMemo<ColDef<EditableTask>[]>(() => [
    { field: 'id', headerName: 'ID', width: 80, flex: 0, editable: false },
    { field: 'name', headerName: '업무명', minWidth: 160, editable: true },
    {
      field: 'status', headerName: '상태', width: 100, flex: 0,
      editable: true,
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        return <Tag color={statusColors[params.value]}>{statusLabels[params.value] ?? params.value}</Tag>;
      },
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['planned', 'in_progress', 'completed'], valueLabels: statusLabels },
    },
    {
      field: 'priority', headerName: '우선순위', width: 100, flex: 0,
      editable: true,
      cellRenderer: (params: any) => params.value ? <Tag color={priorityColors[params.value]}>{params.value}</Tag> : null,
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['긴급', '높음', '중간', '낮음'] },
    },
    { field: 'dueDate', headerName: '마감일', width: 130, flex: 0, editable: true, cellEditor: DateCellEditor },
    {
      field: 'assignee', headerName: '담당자', width: 120, flex: 0, editable: true,
      cellEditor: SelectCellEditor,
      cellEditorParams: { values: ['김영수', '이미영', '송태현', '박정호', '윤서연', '배현우', '한지은', '임재혁', '최수진', '오하늘', '권도현', '장수연'] },
    },
    {
      field: 'tags', headerName: '태그', minWidth: 160,
      editable: true,
      cellRenderer: (params: any) => {
        const tags: string[] = params.value ?? [];
        return tags.map((t: string) => <Tag key={t} style={{ marginRight: 2 }}>{t}</Tag>);
      },
      cellEditor: TagsCellEditor,
      cellEditorParams: { presetTags: ['긴급', '중요', '버그', '기능', '개선', 'QA'] },
      cellEditorPopup: true,
    },
  ], []);

  const selectionCols = useMemo<ColDef<Employee>[]>(() => [
    { width: 50, flex: 0, sortable: false, filter: false },
    { field: 'name', headerName: '이름', width: 100, flex: 0 },
    { field: 'department', headerName: '부서', width: 100, flex: 0 },
    { field: 'role', headerName: '역할', width: 90, flex: 0 },
    { field: 'email', headerName: '이메일', minWidth: 180 },
  ], []);

  const handleCellValueChanged = useCallback((e: CellValueChangedEvent<EditableTask>) => {
    const field = e.colDef.field ?? 'unknown';
    const log = `[${e.data?.id}] ${field}: ${JSON.stringify(e.oldValue)} → ${JSON.stringify(e.newValue)}`;
    setChangeLog((prev) => [log, ...prev].slice(0, 10));
    setTasks((prev) => prev.map((t) => t.id === e.data?.id ? { ...t, [field]: e.newValue } : t));
  }, []);

  /* ── Header grouping columns ── */
  const [headerGroupColDefs] = useState<(ColDef<GroupDemoRow> | ColGroupDef)[]>([
    { field: 'name', headerName: '이름', width: 120, pinned: 'left' },
    {
      headerName: '인사 정보',
      children: [
        { field: 'department', headerName: '부서', width: 110 },
        { field: 'position', headerName: '직급', width: 100 },
        {
          field: 'hireDate', headerName: '입사일', width: 120,
          valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '',
        },
      ],
    },
    {
      headerName: '급여 정보',
      children: [
        {
          field: 'salary', headerName: '기본급', width: 130,
          valueFormatter: (p: any) => p.value?.toLocaleString('ko-KR') + '원',
        },
        {
          field: 'bonus', headerName: '상여금', width: 120,
          valueFormatter: (p: any) => p.value?.toLocaleString('ko-KR') + '원',
        },
        {
          headerName: '총 급여', width: 140,
          valueGetter: (p: any) => (p.data?.salary ?? 0) + (p.data?.bonus ?? 0),
          valueFormatter: (p: any) => p.value?.toLocaleString('ko-KR') + '원',
        },
      ],
    },
  ]);

  /* ── ColSpan demo columns ── */
  const [spanColDefs] = useState<ColDef<SpanDemoRow>[]>([
    {
      field: 'category', headerName: '구분', width: 120,
      colSpan: (params) => params.data?.category?.includes('소계') ? 2 : 1,
      cellStyle: (params) =>
        params.data?.category?.includes('소계')
          ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' }
          : undefined,
    },
    {
      field: 'item', headerName: '항목', width: 120,
      cellStyle: (params) =>
        params.data?.category?.includes('소계')
          ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' }
          : undefined,
    },
    { field: 'q1', headerName: '1분기', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q2', headerName: '2분기', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q3', headerName: '3분기', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
    { field: 'q4', headerName: '4분기', width: 100, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined },
  ]);

  /* ── RowSpan demo columns ── */
  const [rowSpanColDefs] = useState<ColDef<RowSpanDemoRow>[]>([
    { field: 'department', headerName: '본부', width: 130, spanRows: true, sort: 'asc' as const, cellStyle: { fontWeight: 'bold' } },
    { field: 'team', headerName: '팀', width: 130, spanRows: true, sort: 'asc' as const },
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'role', headerName: '직급', width: 100 },
  ]);

  /* ── Footer demo ── */
  const pinnedBottomData = useMemo<Partial<GroupDemoRow>[]>(() => [{
    id: 0,
    name: '합 계',
    department: '-',
    position: '-',
    hireDate: '',
    salary: groupDemoData.reduce((s, r) => s + r.salary, 0),
    bonus: groupDemoData.reduce((s, r) => s + r.bonus, 0),
  }], []);

  const footerColDefs = useMemo<ColDef<GroupDemoRow>[]>(() => [
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'department', headerName: '부서', width: 110 },
    { field: 'position', headerName: '직급', width: 100 },
    { field: 'hireDate', headerName: '입사일', width: 120, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '' },
    { field: 'salary', headerName: '기본급', width: 130, valueFormatter: (p) => p.value ? p.value.toLocaleString('ko-KR') + '원' : '' },
    { field: 'bonus', headerName: '상여금', width: 120, valueFormatter: (p) => p.value ? p.value.toLocaleString('ko-KR') + '원' : '' },
  ], []);

  /* ── Manual grouping demo ── */
  const groupedRowData = useMemo(() => spanDemoData, []);

  const groupTotalRow = useMemo<Partial<SpanDemoRow>[]>(() => [{
    id: 99,
    category: '총 합계',
    item: '',
    q1: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q1, 0),
    q2: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q2, 0),
    q3: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q3, 0),
    q4: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q4, 0),
  }], []);

  const isGroupFirstRow = useCallback((params: { data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || !params.node || params.node.rowIndex === null) return false;
    const idx = params.node.rowIndex;
    if (idx === 0) return true;
    const prevRow = groupedRowData[idx - 1];
    return prevRow?.category !== params.data.category;
  }, [groupedRowData]);

  const categoryValueFormatter = useCallback((params: { value?: string; data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || params.data.category.includes('소계')) return params.value ?? '';
    if (!params.node || params.node.rowIndex === null) return params.value ?? '';
    const idx = params.node.rowIndex;
    if (idx === 0) return params.value ?? '';
    const prevRow = groupedRowData[idx - 1];
    if (prevRow && prevRow.category === params.data.category) return '';
    return params.value ?? '';
  }, [groupedRowData]);

  const groupCellStyle = useCallback((params: CellClassParams<SpanDemoRow>) => {
    const base: CellStyle = {};
    if (params.data?.category?.includes('소계') || params.node?.rowPinned) {
      base.fontWeight = 'bold';
      base.backgroundColor = 'var(--content-header-bg, #f0f0f0)';
    }
    if (isGroupFirstRow(params) && !params.data?.category?.includes('소계')) {
      base.borderTop = '2px solid var(--border-color, #d9d9d9)';
    }
    return Object.keys(base).length > 0 ? base : undefined;
  }, [isGroupFirstRow]);

  const groupColDefs = useMemo<ColDef<SpanDemoRow>[]>(() => [
    {
      field: 'category', headerName: '구분', width: 120,
      colSpan: (params) => params.data?.category?.includes('소계') || params.data?.category === '총 합계' ? 2 : 1,
      valueFormatter: categoryValueFormatter as any,
      cellStyle: groupCellStyle,
    },
    {
      field: 'item', headerName: '항목', width: 120,
      cellStyle: (params) => params.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q1', headerName: '1분기', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q2', headerName: '2분기', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q3', headerName: '3분기', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
    { field: 'q4', headerName: '4분기', width: 110, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString(), cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined },
  ], [categoryValueFormatter, groupCellStyle]);

  /* ── Column pinning columns ── */
  const pinnedColDefs = useMemo<ColDef<GroupDemoRow>[]>(() => [
    { field: 'id', headerName: 'ID', width: 70, pinned: 'left', lockPinned: true },
    { field: 'name', headerName: '이름', width: 100, pinned: 'left', lockPinned: true },
    { field: 'department', headerName: '부서', width: 120 },
    { field: 'position', headerName: '직급', width: 100 },
    { field: 'hireDate', headerName: '입사일', width: 120 },
    { field: 'department', headerName: '소속팀', width: 120, colId: 'team' },
    { field: 'position', headerName: '역할', width: 100, colId: 'role' },
    {
      field: 'salary', headerName: '급여', width: 130, pinned: 'right', type: 'numericColumn',
      valueFormatter: (p) => p.value ? `${p.value.toLocaleString()}원` : '',
    },
  ], []);

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>그리드 테이블</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          GridTable / GridToolbar / GridPanel 컴포넌트와 셀 편집기(Cell Editor) 사용 예시입니다.
        </p>
      </div>

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
                  데이터 건수 표시 + 액션 버튼을 제공하는 도구 모음입니다. FilterPanel 아래, GridTable 위에 단독으로 사용하거나
                  GridPanel을 통해 GridTable과 함께 사용합니다.
                </p>
                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 140 }}>Prop</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>totalCount</code></td><td><code>number</code></td><td>건수 표시 (예: "전체 102건")</td></tr>
                    <tr><td><code>countLabel</code></td><td><code>string</code></td><td>건수 앞 라벨 (기본: "전체")</td></tr>
                    <tr><td><code>left</code></td><td><code>ReactNode</code></td><td>좌측 추가 요소 (검색어, 필터 태그 등)</td></tr>
                    <tr><td><code>actions</code></td><td><code>ReactNode</code></td><td>우측 액션 버튼들 (등록/삭제/엑셀 등)</td></tr>
                  </tbody>
                </table>

                <Card title="라이브 데모" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>기본 (건수 + 버튼)</p>
                      <GridToolbar
                        totalCount={102}
                        actions={
                          <>
                            <Button icon={<PlusOutlined />} type="primary">등록</Button>
                            <Button icon={<DeleteOutlined />} danger disabled>삭제</Button>
                          </>
                        }
                      />
                    </div>
                    <Divider style={{ margin: '0' }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>countLabel 변경 + left 슬롯</p>
                      <GridToolbar
                        totalCount={25}
                        countLabel="조회 결과"
                        left={<span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>검색어: <strong>김영수</strong></span>}
                        actions={<Button>엑셀 다운로드</Button>}
                      />
                    </div>
                    <Divider style={{ margin: '0' }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px' }}>건수 없이 버튼만</p>
                      <GridToolbar
                        actions={
                          <>
                            <Button icon={<PlusOutlined />} type="primary">행 추가</Button>
                            <Button>저장</Button>
                          </>
                        }
                      />
                    </div>
                  </div>
                </Card>

                <CodeSnippet code={`import GridToolbar from '@/components/layout/GridToolbar';
import { Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// 기본 사용
<GridToolbar
  totalCount={data.length}
  actions={
    <>
      <Button type="primary" icon={<PlusOutlined />}>등록</Button>
      <Button danger icon={<DeleteOutlined />} disabled={selected.length === 0}>
        삭제 {selected.length > 0 && \`(\${selected.length})\`}
      </Button>
    </>
  }
/>

// left 슬롯 활용
<GridToolbar
  totalCount={25}
  countLabel="조회 결과"
  left={<span>검색어: <strong>{keyword}</strong></span>}
  actions={<Button>엑셀 다운로드</Button>}
/>`} title="GridToolbar 기본 사용" />
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
                  <code>GridToolbar + GridTable</code>을 하나로 묶은 편의 컴포넌트입니다.
                  GridTable의 모든 props를 그대로 지원하며, 추가로 툴바 관련 props를 제공합니다.
                </p>
                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 160 }}>Prop</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>totalCount</code></td><td><code>number</code></td><td>툴바 건수 표시 (예: "전체 102건")</td></tr>
                    <tr><td><code>countLabel</code></td><td><code>string</code></td><td>건수 앞 라벨 (기본: "전체")</td></tr>
                    <tr><td><code>toolbarLeft</code></td><td><code>ReactNode</code></td><td>툴바 좌측 추가 요소</td></tr>
                    <tr><td><code>actions</code></td><td><code>ReactNode</code></td><td>툴바 우측 액션 버튼들</td></tr>
                    <tr><td colSpan={3} style={{ color: 'var(--text-secondary)', fontSize: 12 }}>+ GridTable의 모든 props (columnDefs, rowData, rowSelection, onSelectionChanged, ...)</td></tr>
                  </tbody>
                </table>

                <Card title="라이브 데모 — 등록/삭제 버튼 + 건수 표시" style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    행을 선택하면 삭제 버튼이 활성화됩니다.
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
      title: '삭제 확인',
      content: \`선택한 \${selected.length}건을 삭제하시겠습니까?\`,
      okText: '삭제',
      okButtonProps: { danger: true },
      onOk: () => {
        const ids = new Set(selected.map((r) => r.id));
        setData((prev) => prev.filter((r) => !ids.has(r.id)));
        setSelected([]);
        message.success(\`\${selected.length}건 삭제됐습니다.\`);
      },
    });
  };

  return (
    <GridPanel
      totalCount={data.length}
      actions={
        <>
          <Button type="primary" icon={<PlusOutlined />}>등록</Button>
          <Button danger icon={<DeleteOutlined />}
            disabled={selected.length === 0}
            onClick={handleDelete}
          >
            삭제 {selected.length > 0 && \`(\${selected.length})\`}
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
}`} title="GridPanel 기본 사용 패턴" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>totalCount={'{data.length}'}</code>: 데이터 변경 시 자동 업데이트</li>
                    <li><code>actions</code>: 등록/삭제/엑셀 등 버튼을 ReactNode로 자유롭게 구성</li>
                    <li><code>onSelectionChanged</code>: 선택된 행 배열 → 삭제 버튼 활성화 제어에 활용</li>
                    <li>GridTable props 전체 지원: <code>rowSelection</code>, <code>editable</code>, <code>pagination</code>, <code>getContextMenuItems</code> 등</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 기본 그리드 ── */
          {
            key: 'basic',
            label: 'GridTable',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>기본 GridTable</h3>
                  <p>정렬, 필터, 리사이즈, 페이지네이션이 기본 제공됩니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>columnDefs</code></td><td>ColDef[]</td><td>컬럼 정의 배열</td></tr>
                      <tr><td><code>rowData</code></td><td>T[]</td><td>행 데이터</td></tr>
                      <tr><td><code>rowKey</code></td><td>string</td><td>행 고유 키 필드 (기본: "id")</td></tr>
                      <tr><td><code>pagination</code></td><td>boolean</td><td>페이지네이션 활성화 (기본: true)</td></tr>
                      <tr><td><code>pageSize</code></td><td>number</td><td>페이지당 행 수 (기본: 20)</td></tr>
                      <tr><td><code>onRowClick</code></td><td>(row: T) =&gt; void</td><td>행 클릭 콜백</td></tr>
                      <tr><td><code>height</code></td><td>string | number</td><td>그리드 높이 (기본: "100%")</td></tr>
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

          /* ── 셀 편집 ── */
          {
            key: 'editable',
            label: '셀 편집',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>편집 가능 그리드 + Cell Editors</h3>
                  <p>셀을 더블클릭하면 편집 모드가 활성화됩니다. 5종의 커스텀 Cell Editor를 지원합니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Cell Editor</th><th>용도</th><th>주요 Props</th></tr></thead>
                    <tbody>
                      <tr><td><code>DateCellEditor</code></td><td>날짜 선택 (DatePicker)</td><td>format="YYYY-MM-DD"</td></tr>
                      <tr><td><code>SelectCellEditor</code></td><td>드롭다운 선택</td><td>values, valueLabels</td></tr>
                      <tr><td><code>TagsCellEditor</code></td><td>다중 태그 입력</td><td>presetTags</td></tr>
                      <tr><td><code>NumberCellEditor</code></td><td>숫자 입력</td><td>min, max, precision</td></tr>
                      <tr><td><code>TextAreaCellEditor</code></td><td>여러 줄 텍스트</td><td>rows</td></tr>
                    </tbody>
                  </table>
                </div>
                <Alert type="info" showIcon title="셀을 더블클릭하여 편집해보세요." style={{ marginBottom: 8 }} />
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
                  <Card size="small" title="변경 로그" style={{ marginTop: 8, fontSize: 12 }}>
                    {changeLog.map((log, i) => (
                      <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '2px 0' }}>{log}</div>
                    ))}
                  </Card>
                )}
                <CodeSnippet code={editableGridCode} />
              </div>
            ),
          },

          /* ── 행 선택 ── */
          {
            key: 'selection',
            label: '행 선택',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>행 선택 (Row Selection)</h3>
                  <p>체크박스를 통한 단일/다중 행 선택을 지원합니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>rowSelection</code></td><td>'singleRow' | 'multiRow'</td><td>선택 모드</td></tr>
                      <tr><td><code>onSelectionChanged</code></td><td>(rows: T[]) =&gt; void</td><td>선택 변경 콜백</td></tr>
                    </tbody>
                  </table>
                </div>
                <Alert
                  type="info"
                  showIcon
                  title={`선택된 행: ${selectedRows.length}건 ${selectedRows.length > 0 ? `(${selectedRows.map(r => r.name).join(', ')})` : ''}`}
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

          /* ── 셀 렌더러/포맷터 ── */
          {
            key: 'renderer',
            label: '셀 렌더러/포맷터',
            children: (
              <div className={styles.demoSection}>
                <h3>셀 렌더러 / 포맷터</h3>
                <p className={styles.demoDesc}>ColDef에 valueFormatter, cellRenderer, cellStyle, cellClass 등을 지정하여 셀 표시를 커스터마이징합니다.</p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColDef 옵션</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>valueFormatter</code></td><td><code>(params) =&gt; string</code></td><td>표시 값 변환. 원본 데이터는 유지되며 화면/클립보드 표시만 변경</td></tr>
                    <tr><td><code>cellRenderer</code></td><td><code>Component | string</code></td><td>커스텀 React 컴포넌트로 셀 렌더링 (Tag, Avatar 등)</td></tr>
                    <tr><td><code>cellRendererParams</code></td><td><code>object</code></td><td>cellRenderer에 전달할 추가 파라미터</td></tr>
                    <tr><td><code>cellStyle</code></td><td><code>CSSProperties | (params) =&gt; CSSProperties</code></td><td>셀 인라인 스타일 (조건부 가능)</td></tr>
                    <tr><td><code>cellClass</code></td><td><code>string | (params) =&gt; string</code></td><td>셀 CSS 클래스 동적 지정</td></tr>
                    <tr><td><code>tooltipField</code></td><td><code>string</code></td><td>마우스 호버 시 해당 필드값을 툴팁으로 표시</td></tr>
                    <tr><td><code>tooltipValueGetter</code></td><td><code>(params) =&gt; string</code></td><td>커스텀 툴팁 텍스트 계산 함수</td></tr>
                  </tbody>
                </table>

                <Card title="라이브 데모 — valueFormatter / cellStyle / cellRenderer" style={{ marginBottom: 24 }}>
                  <div style={{ height: 260 }}>
                    <GridTable<Employee>
                      columnDefs={[
                        { field: 'name', headerName: '이름', width: 100, tooltipField: 'email' },
                        { field: 'department', headerName: '부서', width: 110 },
                        {
                          field: 'role', headerName: '직급', width: 90,
                          cellStyle: (p) => {
                            const map: Record<string, CellStyle> = {
                              '팀장': { background: '#e6f4ff', color: '#0958d9' },
                              '선임': { background: '#f6ffed', color: '#389e0d' },
                              '사원': { background: '#f5f5f5', color: '#595959' },
                            };
                            return map[p.value] ?? {};
                          },
                        },
                        {
                          field: 'joinDate', headerName: '입사일', width: 120,
                          valueFormatter: (p) => p.value ? p.value.replace(/-/g, '.') : '',
                        },
                        {
                          field: 'email', headerName: '상태', width: 100,
                          valueFormatter: () => '',
                          cellRenderer: () => <Tag color="green">활성</Tag>,
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
                <p className={styles.demoDesc}>셀 값의 표시 형식을 변경합니다. 원본 데이터는 유지되며 화면 표시만 변경됩니다.</p>
                <CodeSnippet code={formatterCode} title="값 포맷팅" />

                <h3 style={{ marginTop: 24 }}>cellRenderer</h3>
                <p className={styles.demoDesc}>커스텀 React 컴포넌트로 셀을 렌더링합니다. Tag, Avatar 등 복잡한 UI를 표현할 수 있습니다.</p>
                <CodeSnippet code={cellRendererCode} title="커스텀 셀 렌더러" />

                <h3 style={{ marginTop: 24 }}>cellStyle / cellClass</h3>
                <p className={styles.demoDesc}>조건에 따라 셀의 스타일을 동적으로 변경합니다.</p>
                <CodeSnippet code={cellStyleCode} title="조건부 스타일링" />

                <h3 style={{ marginTop: 24 }}>툴팁</h3>
                <CodeSnippet code={tooltipCode} title="셀 툴팁 설정" />
              </div>
            ),
          },

          /* ── 셀 에디터 가이드 ── */
          {
            key: 'celleditor',
            label: '셀 에디터 가이드',
            children: (
              <div className={styles.demoSection}>
                <h3>셀 에디터</h3>
                <p className={styles.demoDesc}>ColDef의 <code>editable</code>과 <code>cellEditor</code>로 셀 편집 방식을 제어합니다. AG Grid 내장 에디터와 커스텀 React 에디터를 모두 지원합니다.</p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColDef 옵션</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>editable</code></td><td><code>boolean | (params) =&gt; boolean</code></td><td>셀 편집 활성화. 함수형으로 조건부 제어 가능</td></tr>
                    <tr><td><code>cellEditor</code></td><td><code>Component | string</code></td><td>에디터 컴포넌트. 기본값: agTextCellEditor</td></tr>
                    <tr><td><code>cellEditorParams</code></td><td><code>object | (params) =&gt; object</code></td><td>에디터에 전달할 파라미터. 함수형으로 행 데이터 기반 동적 설정 가능</td></tr>
                    <tr><td><code>cellEditorPopup</code></td><td><code>boolean</code></td><td>팝업 모드 에디터 (텍스트 에어리어, DatePicker 등)</td></tr>
                    <tr><td><code>singleClickEdit</code></td><td><code>boolean</code></td><td>더블클릭 대신 싱글클릭으로 편집 시작</td></tr>
                    <tr><td><code>onCellValueChanged</code></td><td><code>(event) =&gt; void</code></td><td>셀 값 변경 완료 시 콜백. event.oldValue / event.newValue 제공</td></tr>
                  </tbody>
                </table>

                <Card title="라이브 데모 — 내장 에디터 (더블클릭으로 편집)" style={{ marginBottom: 24 }}>
                  <div style={{ height: 220 }}>
                    <GridTable<MemberRow>
                      columnDefs={[
                        { field: 'name', headerName: '이름', editable: true, width: 110 },
                        {
                          field: 'role', headerName: '역할', editable: true, width: 120,
                          cellEditor: 'agSelectCellEditor',
                          cellEditorParams: { values: ['개발자', 'PM', '디자이너', 'QA'] },
                        },
                        { field: 'team', headerName: '팀', editable: true, flex: 1 },
                      ]}
                      rowData={memberData}
                      rowKey="id"
                      editable={false}
                      pagination={false}
                      height={220}
                    />
                  </div>
                </Card>

                <h3>내장 셀 에디터</h3>
                <p className={styles.demoDesc}>AG Grid는 텍스트, 숫자, 대형 텍스트, 선택 등 기본 에디터를 제공합니다.</p>
                <CodeSnippet code={cellEditorBasicCode} title="내장 에디터 사용" />

                <h3 style={{ marginTop: 24 }}>커스텀 셀 에디터</h3>
                <p className={styles.demoDesc}>
                  React forwardRef + useImperativeHandle 패턴으로 커스텀 에디터를 만들 수 있습니다.
                  <code>getValue()</code>와 <code>afterGuiAttached()</code> 메서드를 구현해야 합니다.
                </p>
                <CodeSnippet code={customCellEditorCode} title="커스텀 에디터 패턴" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>에디터 팁</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li>editable은 boolean 또는 함수로 설정 가능 (조건부 편집)</li>
                    <li>cellEditorParams로 에디터에 추가 설정 전달</li>
                    <li>onCellValueChanged로 값 변경 시 로직 처리</li>
                    <li>cellEditorPopup: true로 팝업 에디터 모드 사용 가능</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 공통코드/검색 셀 ── */
          {
            key: 'comcd-search-cell',
            label: '공통코드/검색 셀',
            children: <ComcdSearchCellDemo />,
          },

          /* ── 헤더 그룹핑 ── */
          {
            key: 'headergroup',
            label: '헤더 그룹핑',
            children: (
              <div className={styles.demoSection}>
                <h3>컬럼 헤더 그룹</h3>
                <p className={styles.demoDesc}>
                  <code>ColGroupDef.children</code> 배열로 관련 컬럼을 묶어 다단 헤더를 구성합니다. Community 에디션에서 지원됩니다.
                </p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 24 }}>
                  <thead><tr><th style={{ width: 200 }}>ColGroupDef 옵션</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>headerName</code></td><td><code>string</code></td><td>그룹 헤더 표시명</td></tr>
                    <tr><td><code>children</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>(ColDef | ColGroupDef)[]</code></td><td>그룹에 속한 컬럼/하위 그룹 (있으면 자동으로 그룹으로 처리)</td></tr>
                    <tr><td><code>openByDefault</code></td><td><code>boolean</code></td><td>초기 그룹 펼침 여부 (기본: false)</td></tr>
                    <tr><td><code>marryChildren</code></td><td><code>boolean</code></td><td>true이면 그룹 내 컬럼을 그룹 밖으로 이동 불가</td></tr>
                    <tr><td><code>columnGroupShow</code></td><td><code>'open' | 'closed'</code></td><td>그룹이 열렸을 때 / 닫혔을 때만 표시할 컬럼 지정</td></tr>
                    <tr><td><code>headerGroupComponent</code></td><td><code>Component</code></td><td>커스텀 그룹 헤더 컴포넌트</td></tr>
                  </tbody>
                </table>

                <Card title="라이브 데모 - 헤더 그룹핑" style={{ marginBottom: 24 }}>
                  <div className="ds-data-grid" style={{ height: 280 }}>
                    <AgGridReact
                      rowData={groupDemoData}
                      columnDefs={headerGroupColDefs as ColDef[]}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      theme={mode === 'dark' ? darkTheme : lightTheme}
                    />
                  </div>
                </Card>

                <h3>기본 헤더 그룹</h3>
                <CodeSnippet code={headerGroupCode} title="헤더 그룹 설정" />

                <h3 style={{ marginTop: 24 }}>다단 그룹 / 열기·닫기</h3>
                <p className={styles.demoDesc}>
                  <code>columnGroupShow</code>로 그룹 열기/닫기 시 표시할 컬럼을 제어할 수 있습니다.
                </p>
                <CodeSnippet code={headerGroupAdvancedCode} title="다단 그룹 & columnGroupShow" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>children</code> 배열이 있으면 자동으로 그룹 헤더로 처리</li>
                    <li>중첩 가능: children 안에 다시 children (다단 헤더)</li>
                    <li><code>columnGroupShow: 'open' | 'closed'</code>로 그룹 접기/펼치기 시 표시 제어</li>
                    <li><code>headerGroupComponent</code>로 커스텀 그룹 헤더 렌더링 가능</li>
                    <li><code>marryChildren: true</code>로 그룹 내 컬럼 이동 제한</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 셀/행 스패닝 ── */
          {
            key: 'spanning',
            label: '셀/행 스패닝',
            children: (
              <div className={styles.demoSection}>
                <h3>Column Spanning (colSpan)</h3>
                <p className={styles.demoDesc}>
                  <code>colSpan</code> 콜백으로 특정 조건에서 셀이 여러 컬럼을 차지하도록 설정합니다.
                  소계 행이나 제목 행 등에 활용합니다.
                </p>

                <Card title="라이브 데모 - colSpan (소계 행 셀 병합)" style={{ marginBottom: 24 }}>
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

                <CodeSnippet code={colSpanCode} title="colSpan 예제" />

                <h3 style={{ marginTop: 24 }}>Row Spanning (spanRows)</h3>
                <p className={styles.demoDesc}>
                  같은 값이 연속된 행에서 셀을 자동 병합합니다.
                  AG Grid v35+ Community의 <code>CellSpanModule</code> (<code>AllCommunityModule</code>에 포함)을 사용합니다.
                </p>

                <Card title="라이브 데모 - spanRows (본부/팀 자동 병합)" style={{ marginBottom: 24 }}>
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

                <CodeSnippet code={rowSpanCode} title="행 스패닝 (enableCellSpan)" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>colSpan</code>: 함수형 — <code>(params) =&gt; number</code> (1이면 스패닝 없음)</li>
                    <li><code>spanRows: true</code>: 같은 값의 연속 행 자동 병합 (정렬 필수)</li>
                    <li><code>enableCellSpan</code> prop을 GridTable에 설정해야 행 스패닝 동작</li>
                    <li>스패닝된 셀의 스타일은 <code>cellStyle</code> 콜백으로 별도 지정</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 풋터/고정 행 ── */
          {
            key: 'footer',
            label: '풋터/고정 행',
            children: (
              <div className={styles.demoSection}>
                <h3>Pinned Rows (고정 행)</h3>
                <p className={styles.demoDesc}>
                  <code>pinnedTopRowData</code>와 <code>pinnedBottomRowData</code>로 상단/하단에 고정 행을 추가합니다.
                  합계, 평균, 요약 정보를 표시하는 풋터로 활용합니다.{' '}
                  <Tag color="green">Community</Tag>
                </p>

                <Card title="라이브 데모 - 풋터 (하단 합계 행)" style={{ marginBottom: 24 }}>
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

                <CodeSnippet code={pinnedRowCode} title="Pinned Rows 기본 사용" />

                <h3 style={{ marginTop: 24 }}>고정 행 스타일링</h3>
                <p className={styles.demoDesc}>
                  <code>params.node.rowPinned</code>으로 고정 행 여부를 판별하여 스타일을 적용합니다.
                </p>
                <CodeSnippet code={pinnedRowStyleCode} title="고정 행 스타일 커스터마이징" />

                <h3 style={{ marginTop: 24 }}>그룹핑 효과 자체 구현</h3>
                <p className={styles.demoDesc}>
                  데이터를 그룹별로 정렬하고 소계 행을 삽입한 뒤, valueFormatter(반복 값 숨김) + colSpan + cellStyle(구분선) + pinnedBottomRowData(총계 풋터)를 조합하면
                  Community 에디션에서도 그룹핑 효과를 구현할 수 있습니다.
                </p>

                <Card title="라이브 데모 - 그룹핑 자체 구현 (반복 값 숨김 + colSpan + 총계 풋터)" style={{ marginBottom: 24 }}>
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

                <CodeSnippet code={manualGroupingCode} title="Community 그룹핑 자체 구현 패턴" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>pinnedTopRowData</code>: 헤더 바로 아래 고정 행 (요약/검색 등)</li>
                    <li><code>pinnedBottomRowData</code>: 스크롤 아래 고정 행 (합계/풋터)</li>
                    <li><code>params.node.rowPinned</code>: <code>'top' | 'bottom' | undefined</code></li>
                    <li>고정 행 데이터는 useMemo로 최적화 권장</li>
                    <li>그룹핑: 데이터 전처리(소계 행 삽입) + valueFormatter(반복 숨김) + colSpan + cellStyle(구분선) 조합</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 열 고정 ── */
          {
            key: 'pinning',
            label: '열 고정',
            children: (
              <div className={styles.demoSection}>
                <h3>Column Pinning (열 고정)</h3>
                <p className={styles.demoDesc}>
                  <code>pinned</code> 속성으로 특정 컬럼을 좌측 또는 우측에 고정합니다.
                  스크롤 시에도 고정 컬럼은 항상 보이므로, ID/이름 등 핵심 식별 컬럼이나 액션 버튼에 사용합니다.
                  <Tag color="green" style={{ marginLeft: 8 }}>Community</Tag>
                </p>

                <Card title="라이브 데모 - 좌/우 열 고정 (좌: ID·이름, 우: 급여)" style={{ marginBottom: 24 }}>
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

                <CodeSnippet code={columnPinningCode} title="열 고정 기본 사용법" />

                <h3 style={{ marginTop: 24 }}>동적 열 고정</h3>
                <p className={styles.demoDesc}>
                  API를 통해 런타임에 열 고정을 변경할 수 있습니다.
                  컬럼 헤더 우클릭 컨텍스트 메뉴에서도 고정/해제가 가능합니다.
                </p>
                <CodeSnippet code={dynamicPinningCode} title="동적 열 고정 / 해제" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>pinned: 'left'</code>: 좌측 고정 (스크롤 시 왼쪽에 고정)</li>
                    <li><code>pinned: 'right'</code>: 우측 고정 (액션 버튼 등에 활용)</li>
                    <li><code>lockPinned: true</code>: 사용자가 드래그로 고정 해제 불가</li>
                    <li><code>lockPosition: 'left'</code>: 컬럼 이동 자체를 제한</li>
                    <li>API로 동적 변경: <code>api.setColumnsPinned(['col'], 'left')</code></li>
                    <li>고정 컬럼은 <code>width</code> 고정값 사용 권장 (<code>flex</code> 미사용)</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 복사/붙여넣기 ── */
          {
            key: 'clipboard',
            label: '복사/붙여넣기',
            children: (
              <div className={styles.demoSection}>
                <h3>Clipboard (복사 / 붙여넣기)</h3>
                <p className={styles.demoDesc}>
                  AG Grid Community 에디션에서는 기본 클립보드 기능이 제한적이므로,
                  <code>GridTable</code> 래퍼에 커스텀 <code>enableClipboard</code> prop을 추가하여
                  <strong> Ctrl+C (복사)</strong>와 <strong>Ctrl+V (붙여넣기)</strong>를 구현했습니다.
                  <Tag color="blue" style={{ marginLeft: 8 }}>커스텀</Tag>
                </p>

                <Card title="사용법" style={{ marginBottom: 16 }}>
                  <table className={styles.demoPropsTable}>
                    <thead>
                      <tr><th style={{ width: 140 }}>단축키</th><th>동작</th><th style={{ width: 100 }}>조건</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>Ctrl+C</code></td>
                        <td>선택된 행을 헤더 포함 탭 구분 텍스트로 클립보드에 복사</td>
                        <td>행 선택 필요</td>
                      </tr>
                      <tr>
                        <td><code>Ctrl+V</code></td>
                        <td>클립보드 데이터를 포커스 셀부터 행/열 매핑하여 붙여넣기</td>
                        <td><code>editable</code></td>
                      </tr>
                    </tbody>
                  </table>
                </Card>

                <Card title="라이브 데모 — 행 선택 후 Ctrl+C, 점수 셀 더블클릭 후 수정 → Ctrl+V" style={{ marginBottom: 16 }}>
                  <App>
                    <ClipboardDemo />
                  </App>
                </Card>

                <CodeSnippet code={clipboardBasicCode} title="GridTable 클립보드 사용법" />

                <h3 style={{ marginTop: 24 }}>구현 상세</h3>
                <p className={styles.demoDesc}>
                  <code>document.addEventListener('keydown', handler, true)</code>로 캡처 페이즈에서 이벤트를 잡아
                  AG Grid 내부의 <code>stopPropagation</code>과 무관하게 동작합니다.
                </p>
                <CodeSnippet code={clipboardImplCode} title="클립보드 구현 코드 (GridTable.tsx)" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>enableClipboard</code>: GridTable prop으로 그리드별 선택적 활성화</li>
                    <li><strong>Ctrl+C</strong>: 선택 행 → 헤더 + 데이터를 탭 구분 텍스트로 복사 (엑셀 호환)</li>
                    <li><strong>Ctrl+V</strong>: 포커스 셀부터 클립보드 데이터 파싱 → 셀 값 입력 (편집 모드 전용)</li>
                    <li>캡처 페이즈(<code>true</code>)로 등록하여 AG Grid 이벤트 차단 우회</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── 우클릭 메뉴 ── */
          {
            key: 'context-menu',
            label: '우클릭 메뉴',
            children: (
              <div className={styles.demoSection}>
                <h3>Context Menu (우클릭 메뉴)</h3>
                <p className={styles.demoDesc}>
                  <code>getContextMenuItems</code> prop으로 셀 우클릭 시 표시할 메뉴 항목을 커스터마이징합니다.
                  AG Grid Context Menu는 Enterprise 전용이므로 GridTable에서 자체 구현합니다.{' '}
                  <Tag color="blue">커스텀 구현</Tag>
                </p>

                <table className={styles.demoPropsTable} style={{ marginBottom: 16 }}>
                  <thead><tr><th style={{ width: 220 }}>Prop / 옵션</th><th>타입</th><th>설명</th></tr></thead>
                  <tbody>
                    <tr><td><code>getContextMenuItems</code></td><td><code>(params) =&gt; MenuItem[]</code></td><td>우클릭 시 표시할 메뉴 항목 반환. 미지정 시 메뉴 없음</td></tr>
                    <tr><td><code>suppressContextMenu</code></td><td><code>boolean</code></td><td>컨텍스트 메뉴 완전 비활성화</td></tr>
                    <tr><td><code>MenuItemDef.name</code></td><td><code>string</code></td><td>메뉴 항목 표시명</td></tr>
                    <tr><td><code>MenuItemDef.action</code></td><td><code>() =&gt; void</code></td><td>항목 클릭 시 실행 함수</td></tr>
                    <tr><td><code>MenuItemDef.icon</code></td><td><code>string</code></td><td>아이콘 HTML 문자열 (예: <code>{'<span>🔍</span>'}</code>)</td></tr>
                    <tr><td><code>MenuItemDef.disabled</code></td><td><code>boolean</code></td><td>항목 비활성화</td></tr>
                    <tr><td><code>'separator'</code></td><td><code>string</code></td><td>구분선. 항목 배열에 문자열 <code>'separator'</code>로 삽입</td></tr>
                    <tr><td><code>'copy' | 'copyWithHeaders'</code></td><td><code>string</code></td><td>기본 제공 항목 (클립보드 복사)</td></tr>
                  </tbody>
                </table>

                <Alert
                  type="info"
                  showIcon
                  title="팝업 렌더링 위치"
                  description="GridTable은 popupParent={document.body}를 기본 적용합니다. overflow:hidden 컨테이너에서도 메뉴가 정상 표시됩니다."
                  style={{ marginBottom: 16 }}
                />

                <Card title="라이브 데모 — 셀을 우클릭해 보세요" style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, height: 240 }}>
                      <GridTable
                        columnDefs={[
                          { field: 'id',         headerName: 'ID',   width: 80,  flex: 0 },
                          { field: 'name',       headerName: '이름', width: 120, flex: 0 },
                          { field: 'department', headerName: '부서', flex: 1 },
                          { field: 'role',       headerName: '직급', width: 100, flex: 0 },
                          { field: 'email',      headerName: '이메일', flex: 1 },
                        ]}
                        rowData={basicData.slice(0, 6)}
                        rowKey="id"
                        pagination={false}
                        height={240}
                        getContextMenuItems={(params) => [
                          {
                            name: `"${params.node?.data?.name}" 상세보기`,
                            action: () => alert(`상세보기:\n${JSON.stringify(params.node?.data, null, 2)}`),
                            icon: '<span>🔍</span>',
                          },
                          {
                            name: '이메일 복사',
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
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>메뉴 미리보기</div>
                      <div style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 4,
                        background: 'var(--component-background, #fff)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                        fontSize: 13,
                      }}>
                        {[
                          { icon: '🔍', label: '"김영수" 상세보기' },
                          { icon: '📧', label: '이메일 복사' },
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

                <h3>기본 사용법</h3>
                <CodeSnippet code={contextMenuBasicCode} title="getContextMenuItems 기본 사용 (GridTable)" />

                <h3 style={{ marginTop: 24 }}>기본 제공 항목 / 비활성화</h3>
                <CodeSnippet code={contextMenuBuiltinCode} title="기본 항목 문자열 및 비활성화" />

                <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
                  <strong>핵심 정리</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><code>getContextMenuItems</code> 미지정 → AG Grid 기본 메뉴 표시</li>
                    <li><code>suppressContextMenu={'{true}'}</code> → 컨텍스트 메뉴 완전 비활성화</li>
                    <li>문자열 항목: <code>'copy' | 'copyWithHeaders' | 'cut' | 'paste' | 'export' | 'separator'</code></li>
                    <li>커스텀 항목: <code>{'{ name, action, icon, disabled, cssClasses }'}</code></li>
                    <li><code>params.node?.data</code>: 우클릭한 행의 데이터 / <code>params.value</code>: 셀 값</li>
                    <li>헤더 우클릭은 <code>suppressHeaderContextMenu</code>(defaultColDef)로 별도 제어</li>
                  </ul>
                </div>
              </div>
            ),
          },

          /* ── DatePicker 셀 ── */
          {
            key: 'datepicker-cell',
            label: 'DatePicker 셀',
            children: <DateCellDemo />,
          },

          /* ── Tree 구조 ── */
          {
            key: 'tree',
            label: 'Tree 구조',
            children: <TreeDemo />,
          },

          /* ── API 레퍼런스 ── */
          {
            key: 'api',
            label: 'API 레퍼런스',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>기본 설정</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 180 }}>Prop</th><th>타입</th><th style={{ width: 100 }}>기본값</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>columnDefs</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>ColDef&lt;T&gt;[]</code></td><td>—</td><td>컬럼 정의 배열 (AG Grid ColDef)</td></tr>
                      <tr><td><code>rowData</code> <span style={{ color: '#ff4d4f' }}>*</span></td><td><code>T[]</code></td><td>—</td><td>행 데이터 배열</td></tr>
                      <tr><td><code>rowKey</code></td><td><code>string</code></td><td><code>"id"</code></td><td>행 고유 키 필드명</td></tr>
                      <tr><td><code>defaultColDef</code></td><td><code>ColDef&lt;T&gt;</code></td><td>—</td><td>모든 컬럼에 적용할 기본 ColDef</td></tr>
                      <tr><td><code>editable</code></td><td><code>boolean</code></td><td><code>false</code></td><td>전체 셀 편집 활성화</td></tr>
                      <tr><td><code>enableClipboard</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Ctrl+C/V 클립보드 복사/붙여넣기 활성화</td></tr>
                      <tr><td><code>rowSelection</code></td><td><code>'singleRow' | 'multiRow'</code></td><td>—</td><td>행 선택 모드 (없으면 선택 비활성)</td></tr>
                      <tr><td><code>pagination</code></td><td><code>boolean</code></td><td><code>true</code></td><td>페이지네이션 활성화</td></tr>
                      <tr><td><code>pageSize</code></td><td><code>number</code></td><td><code>20</code></td><td>페이지당 행 수</td></tr>
                      <tr><td><code>height</code></td><td><code>string | number</code></td><td><code>"100%"</code></td><td>그리드 높이. "100%"이면 flex:1 적용</td></tr>
                      <tr><td><code>autoHeight</code></td><td><code>boolean</code></td><td><code>false</code></td><td>행 수에 맞게 높이 자동 조정</td></tr>
                      <tr><td><code>rowHeight</code></td><td><code>number</code></td><td>—</td><td>행 높이(px)</td></tr>
                      <tr><td><code>headerHeight</code></td><td><code>number</code></td><td>—</td><td>헤더 높이(px)</td></tr>
                      <tr><td><code>loading</code></td><td><code>boolean</code></td><td><code>false</code></td><td>로딩 오버레이 표시</td></tr>
                      <tr><td><code>noRowsMessage</code></td><td><code>string</code></td><td><code>"데이터가 없습니다."</code></td><td>빈 데이터 시 표시할 메시지</td></tr>
                      <tr><td><code>enableCellSpan</code></td><td><code>boolean</code></td><td><code>false</code></td><td>colSpan/rowSpan 기반 셀 병합 활성화</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>행 스타일 / 제어</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>getRowClass</code></td><td><code>(params: RowClassParams&lt;T&gt;) =&gt; string | string[]</code></td><td>행마다 동적으로 CSS 클래스 지정</td></tr>
                      <tr><td><code>getRowStyle</code></td><td><code>(params: RowClassParams&lt;T&gt;) =&gt; CSSProperties</code></td><td>행마다 동적으로 인라인 스타일 지정</td></tr>
                      <tr><td><code>isRowSelectable</code></td><td><code>(node: IRowNode&lt;T&gt;) =&gt; boolean</code></td><td>행 선택 가능 여부 (false = 체크박스 비활성)</td></tr>
                      <tr><td><code>suppressRowClickSelection</code></td><td><code>boolean</code></td><td>클릭으로 행 선택 억제 (체크박스 전용)</td></tr>
                      <tr><td><code>rowMultiSelectWithClick</code></td><td><code>boolean</code></td><td>Ctrl 없이 클릭만으로 다중 선택</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>셀 / UI 제어</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>suppressCellFocus</code></td><td><code>boolean</code></td><td>셀 포커스 시 파란 테두리 억제</td></tr>
                      <tr><td><code>suppressMovableColumns</code></td><td><code>boolean</code></td><td>컬럼 드래그 이동 억제</td></tr>
                      <tr><td><code>suppressContextMenu</code></td><td><code>boolean</code></td><td>우클릭 컨텍스트 메뉴 비활성화</td></tr>
                      <tr><td><code>getContextMenuItems</code></td><td><code>GetContextMenuItems&lt;T&gt;</code></td><td>커스텀 컨텍스트 메뉴 항목 반환 함수</td></tr>
                      <tr><td><code>floatingFilter</code></td><td><code>boolean</code></td><td>헤더 아래 플로팅 필터 입력 행 표시</td></tr>
                      <tr><td><code>quickFilterText</code></td><td><code>string</code></td><td>전체 컬럼 빠른 필터 텍스트</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>고정 행 / 외부 필터 / 기타</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>pinnedTopRowData</code></td><td><code>T[]</code></td><td>상단에 고정할 행 데이터 (스크롤 시 유지)</td></tr>
                      <tr><td><code>pinnedBottomRowData</code></td><td><code>T[]</code></td><td>하단에 고정할 행 데이터</td></tr>
                      <tr><td><code>isExternalFilterPresent</code></td><td><code>() =&gt; boolean</code></td><td>외부 필터 활성 여부</td></tr>
                      <tr><td><code>doesExternalFilterPass</code></td><td><code>(node: IRowNode&lt;T&gt;) =&gt; boolean</code></td><td>외부 필터 통과 여부. false 반환 시 행 숨김</td></tr>
                      <tr><td><code>context</code></td><td><code>any</code></td><td>모든 AG Grid 콜백에 전달될 공유 객체</td></tr>
                      <tr><td><code>gridRef</code></td><td><code>RefObject&lt;AgGridReact&lt;T&gt;&gt;</code></td><td>AgGridReact ref (GridApi 직접 제어)</td></tr>
                      <tr><td><code>gridProps</code></td><td><code>AgGridReactProps&lt;T&gt;</code></td><td>GridTableProps에 없는 AG Grid 고급 props 직접 전달 (escape hatch)</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>이벤트 — 행</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>이벤트</th><th>시그니처</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>onRowClick</code></td><td><code>(data: T) =&gt; void</code></td><td>행 클릭. data는 해당 행의 원본 데이터</td></tr>
                      <tr><td><code>onRowDoubleClick</code></td><td><code>(data: T, event: RowDoubleClickedEvent) =&gt; void</code></td><td>행 더블클릭</td></tr>
                      <tr><td><code>onRowSelected</code></td><td><code>(event: RowSelectedEvent&lt;T&gt;) =&gt; void</code></td><td>개별 행의 선택 상태 변경 시</td></tr>
                      <tr><td><code>onSelectionChanged</code></td><td><code>(rows: T[]) =&gt; void</code></td><td>선택된 전체 행 목록 변경 시</td></tr>
                      <tr><td><code>onFirstDataRendered</code></td><td><code>(event: FirstDataRenderedEvent&lt;T&gt;) =&gt; void</code></td><td>첫 번째 rowData가 그리드에 렌더링 완료된 시점</td></tr>
                      <tr><td><code>onModelUpdated</code></td><td><code>(event: ModelUpdatedEvent&lt;T&gt;) =&gt; void</code></td><td>필터/정렬 등으로 표시 행이 변경될 때마다</td></tr>
                      <tr><td><code>onBodyScrollEnd</code></td><td><code>(event: BodyScrollEndEvent) =&gt; void</code></td><td>그리드 본문 스크롤 종료</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>이벤트 — 셀</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>이벤트</th><th>시그니처</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>onCellClicked</code></td><td><code>(event: CellClickedEvent&lt;T&gt;) =&gt; void</code></td><td>셀 클릭</td></tr>
                      <tr><td><code>onCellDoubleClicked</code></td><td><code>(event: CellDoubleClickedEvent&lt;T&gt;) =&gt; void</code></td><td>셀 더블클릭</td></tr>
                      <tr><td><code>onCellValueChanged</code></td><td><code>(event: CellValueChangedEvent&lt;T&gt;) =&gt; void</code></td><td>편집 후 셀 값 변경. event.oldValue / event.newValue 제공</td></tr>
                      <tr><td><code>onCellEditingStarted</code></td><td><code>(event: CellEditingStartedEvent&lt;T&gt;) =&gt; void</code></td><td>셀 편집 모드 진입 시</td></tr>
                      <tr><td><code>onCellEditingStopped</code></td><td><code>(event: CellEditingStoppedEvent&lt;T&gt;) =&gt; void</code></td><td>셀 편집 모드 종료 시</td></tr>
                      <tr><td><code>onCellContextMenu</code></td><td><code>(event: CellContextMenuEvent&lt;T&gt;) =&gt; void</code></td><td>셀 우클릭</td></tr>
                      <tr><td><code>onCellKeyDown</code></td><td><code>(event: CellKeyDownEvent&lt;T&gt;) =&gt; void</code></td><td>셀 포커스 상태에서 키 입력</td></tr>
                    </tbody>
                  </table>
                </section>

                <section>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', borderBottom: '2px solid var(--primary-color)', display: 'inline-block', paddingBottom: 4 }}>이벤트 — 그리드 상태</h3>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th style={{ width: 220 }}>이벤트</th><th>시그니처</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>onGridReady</code></td><td><code>(api: GridApi&lt;T&gt;) =&gt; void</code></td><td>그리드 초기화 완료</td></tr>
                      <tr><td><code>onSortChanged</code></td><td><code>(event: SortChangedEvent&lt;T&gt;) =&gt; void</code></td><td>컬럼 정렬 변경 시</td></tr>
                      <tr><td><code>onFilterChanged</code></td><td><code>(event: FilterChangedEvent&lt;T&gt;) =&gt; void</code></td><td>필터 적용/해제 시</td></tr>
                      <tr><td><code>onPaginationChanged</code></td><td><code>(event: PaginationChangedEvent&lt;T&gt;) =&gt; void</code></td><td>페이지 이동/페이지 크기 변경 시</td></tr>
                      <tr><td><code>onColumnResized</code></td><td><code>(event: ColumnResizedEvent&lt;T&gt;) =&gt; void</code></td><td>컬럼 너비 드래그 리사이즈 시</td></tr>
                      <tr><td><code>onColumnMoved</code></td><td><code>(event: ColumnMovedEvent&lt;T&gt;) =&gt; void</code></td><td>컬럼 드래그 이동 시</td></tr>
                      <tr><td><code>onColumnVisible</code></td><td><code>(event: ColumnVisibleEvent&lt;T&gt;) =&gt; void</code></td><td>컬럼 숨김/표시 토글 시</td></tr>
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
