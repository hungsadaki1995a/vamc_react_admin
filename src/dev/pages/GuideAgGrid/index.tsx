import { useMemo, useState, useCallback } from 'react';
import { Tabs, Card, Tag } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef, ColGroupDef, CellClassParams, CellStyle } from 'ag-grid-community';
import CodeSnippet from '@/components/common/CodeSnippet';
import { lightTheme, darkTheme } from '@/components/grid/GridTable';
import { useThemeStore } from '@/stores/themeStore';
import '@/components/grid/GridTable.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Code snippets
const basicSetupCode = `import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// 모듈 등록 (최상위에서 한 번만)
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
    { id: 1, name: '김철수', department: '개발팀', position: '팀장', hireDate: '2020-01-15', salary: 6000000 },
    { id: 2, name: '이영희', department: '기획팀', position: '과장', hireDate: '2021-03-20', salary: 5000000 },
    // ...
  ]);

  const [colDefs] = useState<ColDef<Employee>[]>([
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'department', headerName: '부서', flex: 1 },
    { field: 'position', headerName: '직급', width: 100 },
    { field: 'hireDate', headerName: '입사일', width: 120 },
    { field: 'salary', headerName: '급여', width: 130, sortable: true, filter: 'agNumberColumnFilter' },
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

const colDefOptionsCode = `// ColDef 주요 속성

const columnDefs: ColDef[] = [
  {
    field: 'name',              // 데이터 필드명
    headerName: '이름',          // 헤더 표시명
    width: 120,                 // 고정 너비 (픽셀)
    minWidth: 100,              // 최소 너비
    maxWidth: 200,              // 최대 너비
    flex: 1,                    // 유연한 너비 (비율)
    sortable: true,             // 정렬 가능
    filter: true,               // 필터 가능
    resizable: true,            // 리사이즈 가능
    editable: true,             // 편집 가능
    hide: false,                // 숨김 여부
    pinned: 'left',             // 고정 위치 ('left' | 'right')
    checkboxSelection: true,    // 체크박스 표시
  },
];

// defaultColDef: 모든 컬럼의 기본값
const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: false,        // 헤더 아래 필터 입력란
};`;

const themingCode = `// 테마 설정

// 라이트 테마
<div className="ag-theme-quartz" style={{ height: 400 }}>
  <AgGridReact {...props} />
</div>

// 다크 테마
<div className="ag-theme-quartz-dark" style={{ height: 400 }}>
  <AgGridReact {...props} />
</div>

// 자동 높이 (domLayout)
<AgGridReact
  domLayout="autoHeight"
  {...props}
/>

// 고정 높이
<div style={{ height: 600 }}>
  <AgGridReact {...props} />
</div>`;

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

// 사용
const columnDefs: ColDef[] = [
  {
    field: 'hireDate',
    headerName: '입사일',
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorParams: {
      format: 'YYYY-MM-DD',
    },
  },
];`;

const projectEditorsCode = `// 본 프로젝트 커스텀 에디터 (src/components/grid/cellEditors/)

import DateCellEditor from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';
import NumberCellEditor from '@/components/grid/cellEditors/NumberCellEditor';

const columnDefs: ColDef[] = [
  {
    field: 'dueDate',
    headerName: '완료일',
    editable: true,
    cellEditor: DateCellEditor,
    cellEditorParams: {
      format: 'YYYY-MM-DD',
    },
  },
  {
    field: 'status',
    headerName: '상태',
    editable: true,
    cellEditor: SelectCellEditor,
    cellEditorParams: {
      values: ['todo', 'inprogress', 'done'],
      valueLabels: { todo: '예정', inprogress: '진행중', done: '완료' },
    },
  },
  {
    field: 'tags',
    headerName: '태그',
    editable: true,
    cellEditor: TagsCellEditor,
    cellEditorParams: {
      presetTags: ['긴급', '중요', '검토필요', '보류'],
    },
  },
  {
    field: 'manDay',
    headerName: '공수(MD)',
    editable: true,
    cellEditor: NumberCellEditor,
    cellEditorParams: { min: 0, precision: 1 },
  },
];

// onCellValueChanged 이벤트
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  onCellValueChanged={(event) => {
    console.log('변경된 값:', event.newValue);
    console.log('이전 값:', event.oldValue);
    console.log('행 데이터:', event.data);
    console.log('컬럼:', event.column.getColId());
  }}
/>`;

const rowSelectionCode = `// 행 선택

const [selectedRows, setSelectedRows] = useState([]);

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '이름',
    checkboxSelection: true,  // 첫 번째 컬럼에만
    headerCheckboxSelection: true,  // 헤더 전체 선택 체크박스
  },
  // ... other columns
];

<AgGridReact
  rowSelection="multiple"  // 'single' | 'multiple'
  suppressRowClickSelection={true}  // 체크박스만 선택 가능
  onSelectionChanged={(event) => {
    const rows = event.api.getSelectedRows();
    setSelectedRows(rows);
    console.log('선택된 행:', rows);
  }}
  columnDefs={columnDefs}
  rowData={rowData}
/>

// API로 선택된 행 가져오기
const gridRef = useRef<AgGridReact>(null);

const handleGetSelected = () => {
  const selectedNodes = gridRef.current!.api.getSelectedRows();
  console.log(selectedNodes);
};

<AgGridReact ref={gridRef} {...props} />`;

const sortingCode = `// 정렬

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '이름',
    sortable: true,
    sort: 'asc',  // 초기 정렬 ('asc' | 'desc')
  },
  {
    field: 'salary',
    headerName: '급여',
    sortable: true,
    comparator: (a, b) => {
      // 커스텀 정렬 로직
      return a - b;
    },
  },
];

// 다중 컬럼 정렬
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  multiSortKey="ctrl"  // Ctrl 키를 누르고 클릭하면 다중 정렬
/>

// API로 정렬 설정
gridRef.current!.api.applyColumnState({
  state: [
    { colId: 'department', sort: 'asc' },
    { colId: 'salary', sort: 'desc' },
  ],
});`;

const filteringCode = `// 필터

const columnDefs: ColDef[] = [
  {
    field: 'name',
    headerName: '이름',
    filter: 'agTextColumnFilter',
    filterParams: {
      filterOptions: ['contains', 'notContains', 'equals', 'startsWith', 'endsWith'],
      defaultOption: 'contains',
      suppressAndOrCondition: true,
    },
  },
  {
    field: 'salary',
    headerName: '급여',
    filter: 'agNumberColumnFilter',
    filterParams: {
      filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
    },
  },
  {
    field: 'hireDate',
    headerName: '입사일',
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

// 플로팅 필터 (헤더 아래 필터 입력란)
const defaultColDef: ColDef = {
  filter: true,
  floatingFilter: true,
};

// 빠른 필터 (전체 검색)
const [quickFilter, setQuickFilter] = useState('');

<Input
  placeholder="전체 검색..."
  value={quickFilter}
  onChange={(e) => setQuickFilter(e.target.value)}
  style={{ marginBottom: 8, width: 200 }}
/>
<AgGridReact
  quickFilterText={quickFilter}
  {...props}
/>`;


// ── 헤더 그룹핑 코드 스니펫 ──

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

// ── 셀/행 스패닝 코드 스니펫 ──

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
];

// 데이터에 소계 행 포함
const rowData = [
  { category: '매출', item: '제품A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { category: '매출', item: '제품B', q1: 800,  q2: 900,  q3: 950,  q4: 1100 },
  { category: '매출 소계', item: '',  q1: 2000, q2: 2400, q3: 2050, q4: 2900 },
  // 소계 행에서 '구분' 셀이 '항목' 컬럼까지 병합됨
];`;

const rowSpanCode = `// rowSpan: 같은 값이 연속된 행에서 셀 병합
// ⚠️ AG Grid v35+ Community 기능 (CellSpanModule 필요)
import { CellSpanModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([CellSpanModule]);

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

// 그리드에 enableCellSpan 설정 필요
<AgGridReact
  columnDefs={columnDefs}
  rowData={rowData}
  enableCellSpan={true}
/>`;

// ── 풋터 / 고정 행 코드 스니펫 ──

const pinnedRowCode = `// pinnedTopRowData: 상단 고정 행 (헤더 아래)
// pinnedBottomRowData: 하단 고정 행 (풋터)
const pinnedTopRowData = useMemo(() => [
  { name: '[ 평균 ]', department: '-', position: '-', salary: 5460000 },
], []);

const pinnedBottomRowData = useMemo(() => [
  { name: '[ 합계 ]', department: '-', position: '-', salary: 27300000 },
], []);

<AgGridReact
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
};

<AgGridReact
  getRowStyle={getRowStyle}
  pinnedBottomRowData={pinnedBottomRowData}
/>`;

const manualGroupingCode = `// Community 에디션에서 그룹핑 효과 자체 구현
// 전략: 데이터를 그룹별로 정렬 + 소계 행 삽입 + valueFormatter(반복 숨김) + colSpan + 구분선

interface SalesRow {
  category: string;
  item: string;
  q1: number;
  q2: number;
  isSubtotal?: boolean;  // 소계 행 구분 플래그
}

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
    // 소계 행 추가
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

// 2단계: valueFormatter(반복 숨김) + colSpan + cellStyle로 소계 행 시각 구분
const columnDefs: ColDef[] = [
  {
    field: 'category',
    headerName: '구분',
    // 같은 카테고리 반복 시 빈 문자열 표시 (행 그룹핑 효과)
    valueFormatter: (params) => {
      if (params.data?.isSubtotal) return params.value;
      const idx = params.node?.rowIndex ?? 0;
      if (idx === 0) return params.value;
      // 이전 행과 같은 카테고리면 숨김
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
      // 그룹 첫 행에 상단 구분선
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
  { field: 'item', headerName: '항목' },
  { field: 'q1', headerName: '1분기', type: 'numericColumn' },
  { field: 'q2', headerName: '2분기', type: 'numericColumn' },
];

// 3단계: pinnedBottomRowData로 총계 행 추가
const totalRow = useMemo(() => [{
  category: '총 합계',
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

// ── 열 고정 코드 스니펫 ──

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
  { field: 'phone', headerName: '연락처', width: 150 },

  // 우측 고정: 급여, 액션
  {
    field: 'salary',
    headerName: '급여',
    width: 130,
    pinned: 'right',
    type: 'numericColumn',
  },
];`;

const dynamicPinningCode = `// API를 통한 동적 열 고정/해제
// gridRef.current.api 사용

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

// ── 클립보드 코드 스니펫 ──

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

      // 헤더 + 데이터를 탭 구분 텍스트로 변환
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

  // capture: true → AG Grid 내부 이벤트 차단 무관하게 동작
  document.addEventListener('keydown', handleKeyDown, true);
  return () => document.removeEventListener('keydown', handleKeyDown, true);
}, [enableClipboard, columnDefs, editable]);`;

// ── 데모 데이터 ──

interface GroupDemoRow {
  name: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  bonus: number;
}

const groupDemoData: GroupDemoRow[] = [
  { name: '김철수', department: '개발팀', position: '팀장', hireDate: '2020-01-15', salary: 6500000, bonus: 1000000 },
  { name: '박민수', department: '개발팀', position: '대리', hireDate: '2022-05-10', salary: 4500000, bonus: 600000 },
  { name: '한지혜', department: '개발팀', position: '사원', hireDate: '2024-02-01', salary: 3500000, bonus: 400000 },
  { name: '이영희', department: '기획팀', position: '과장', hireDate: '2021-03-20', salary: 5500000, bonus: 800000 },
  { name: '정수연', department: '디자인팀', position: '사원', hireDate: '2023-07-01', salary: 3800000, bonus: 500000 },
  { name: '최동욱', department: '영업팀', position: '부장', hireDate: '2019-11-05', salary: 7000000, bonus: 1200000 },
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
  { category: '매출', item: '제품A', q1: 1200, q2: 1500, q3: 1100, q4: 1800 },
  { category: '매출', item: '제품B', q1: 800, q2: 900, q3: 950, q4: 1100 },
  { category: '매출', item: '제품C', q1: 600, q2: 700, q3: 750, q4: 800 },
  { category: '매출 소계', item: '', q1: 2600, q2: 3100, q3: 2800, q4: 3700 },
  { category: '비용', item: '인건비', q1: 2000, q2: 2000, q3: 2100, q4: 2100 },
  { category: '비용', item: '운영비', q1: 500, q2: 550, q3: 520, q4: 600 },
  { category: '비용', item: '마케팅', q1: 300, q2: 400, q3: 350, q4: 500 },
  { category: '비용 소계', item: '', q1: 2800, q2: 2950, q3: 2970, q4: 3200 },
];

// 행 스패닝 데모 데이터
interface RowSpanDemoRow {
  department: string;
  team: string;
  name: string;
  role: string;
}

const rowSpanDemoData: RowSpanDemoRow[] = [
  { department: '개발본부', team: '프론트엔드', name: '김철수', role: '팀장' },
  { department: '개발본부', team: '프론트엔드', name: '이영희', role: '시니어' },
  { department: '개발본부', team: '백엔드', name: '박민수', role: '팀장' },
  { department: '개발본부', team: '백엔드', name: '한지혜', role: '주니어' },
  { department: '개발본부', team: '백엔드', name: '조현우', role: '주니어' },
  { department: '경영지원', team: '인사팀', name: '정수연', role: '과장' },
  { department: '경영지원', team: '인사팀', name: '최동욱', role: '대리' },
  { department: '경영지원', team: '재무팀', name: '윤미라', role: '팀장' },
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
    { id: 1, name: '김철수', department: '개발팀', position: '팀장', hireDate: '2020-01-15', salary: 6500000 },
    { id: 2, name: '이영희', department: '기획팀', position: '과장', hireDate: '2021-03-20', salary: 5500000 },
    { id: 3, name: '박민수', department: '개발팀', position: '대리', hireDate: '2022-05-10', salary: 4500000 },
    { id: 4, name: '정수연', department: '디자인팀', position: '사원', hireDate: '2023-07-01', salary: 3800000 },
    { id: 5, name: '최동욱', department: '영업팀', position: '부장', hireDate: '2019-11-05', salary: 7000000 },
  ]);

  const [sampleColDefs] = useState<ColDef<SampleEmployee>[]>([
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'department', headerName: '부서', flex: 1 },
    { field: 'position', headerName: '직급', width: 100 },
    {
      field: 'hireDate',
      headerName: '입사일',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('ko-KR');
      }
    },
    {
      field: 'salary',
      headerName: '급여',
      width: 130,
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toLocaleString('ko-KR') + '원';
      }
    },
  ]);

  // ── 헤더 그룹핑 데모 ──
  const [headerGroupColDefs] = useState<(ColDef<GroupDemoRow> | ColGroupDef)[]>([
    { field: 'name', headerName: '이름', width: 120, pinned: 'left' },
    {
      headerName: '인사 정보',
      children: [
        { field: 'department', headerName: '부서', width: 110 },
        { field: 'position', headerName: '직급', width: 100 },
        { field: 'hireDate', headerName: '입사일', width: 120,
          valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString('ko-KR') : '' },
      ],
    },
    {
      headerName: '급여 정보',
      children: [
        { field: 'salary', headerName: '기본급', width: 130,
          valueFormatter: (p) => p.value?.toLocaleString('ko-KR') + '원' },
        { field: 'bonus', headerName: '상여금', width: 120,
          valueFormatter: (p) => p.value?.toLocaleString('ko-KR') + '원' },
        { headerName: '총 급여', width: 140,
          valueGetter: (p) => (p.data?.salary ?? 0) + (p.data?.bonus ?? 0),
          valueFormatter: (p) => p.value?.toLocaleString('ko-KR') + '원' },
      ],
    },
  ]);

  // ── 셀 스패닝 데모 (colSpan) ──
  const [spanColDefs] = useState<ColDef<SpanDemoRow>[]>([
    { field: 'category', headerName: '구분', width: 120,
      colSpan: (params) => {
        // '소계' 행이면 구분+항목 2컬럼 병합
        if (params.data?.category?.includes('소계')) return 2;
        return 1;
      },
      cellStyle: (params) => {
        if (params.data?.category?.includes('소계')) {
          return { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' };
        }
        return undefined;
      },
    },
    { field: 'item', headerName: '항목', width: 120,
      cellStyle: (params) => {
        if (params.data?.category?.includes('소계')) {
          return { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' };
        }
        return undefined;
      },
    },
    { field: 'q1', headerName: '1분기', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q2', headerName: '2분기', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q3', headerName: '3분기', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
    { field: 'q4', headerName: '4분기', width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => p.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f5f5f5)' } : undefined,
    },
  ]);

  // ── 행 스패닝 데모 (spanRows) ──
  const [rowSpanColDefs] = useState<ColDef<RowSpanDemoRow>[]>([
    { field: 'department', headerName: '본부', width: 130, spanRows: true, sort: 'asc' as const,
      cellStyle: { fontWeight: 'bold' },
    },
    { field: 'team', headerName: '팀', width: 130, spanRows: true, sort: 'asc' as const },
    { field: 'name', headerName: '이름', width: 120 },
    { field: 'role', headerName: '직급', width: 100 },
  ]);

  // ── 풋터 (고정 행) 데모 ──
  const pinnedBottomData = useMemo<Partial<SampleEmployee>[]>(() => [
    {
      id: 0,
      name: '합 계',
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

  // ── 그룹핑 자체 구현 데모 ──
  const groupedRowData = useMemo<SpanDemoRow[]>(() => spanDemoData, []);
  const groupTotalRow = useMemo<Partial<SpanDemoRow>[]>(() => [{
    category: '총 합계',
    item: '',
    q1: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q1, 0),
    q2: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q2, 0),
    q3: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q3, 0),
    q4: spanDemoData.filter(r => !r.category.includes('소계')).reduce((s, r) => s + r.q4, 0),
  }], []);
  // 그룹 첫 행 판별: 이전 행과 카테고리가 다르면 그룹 시작
  const isGroupFirstRow = useCallback((params: { data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || !params.node || params.node.rowIndex === null) return false;
    const idx = params.node.rowIndex;
    if (idx === 0) return true;
    const prevRow = groupedRowData[idx - 1];
    return prevRow?.category !== params.data.category;
  }, []);

  // 반복 카테고리 숨김 (소계/총계 제외)
  const categoryValueFormatter = useCallback((params: { value?: string; data?: SpanDemoRow; node?: { rowIndex: number | null } }) => {
    if (!params.data || params.data.category.includes('소계')) return params.value ?? '';
    if (!params.node || params.node.rowIndex === null) return params.value ?? '';
    const idx = params.node.rowIndex;
    if (idx === 0) return params.value ?? '';
    const prevRow = groupedRowData[idx - 1];
    if (prevRow && prevRow.category === params.data.category) return '';  // 반복 숨김
    return params.value ?? '';
  }, []);

  // 소계/그룹 스타일
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
    { field: 'category', headerName: '구분', width: 120,
      colSpan: (params) => params.data?.category?.includes('소계') || params.data?.category === '총 합계' ? 2 : 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valueFormatter: categoryValueFormatter as any,
      cellStyle: groupCellStyle,
    },
    { field: 'item', headerName: '항목', width: 120,
      cellStyle: (params) => params.data?.category?.includes('소계') ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q1', headerName: '1분기', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q2', headerName: '2분기', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q3', headerName: '3분기', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
    { field: 'q4', headerName: '4분기', width: 110, type: 'numericColumn',
      valueFormatter: (p) => p.value?.toLocaleString(),
      cellStyle: (p) => (p.data?.category?.includes('소계') || p.node?.rowPinned) ? { fontWeight: 'bold', backgroundColor: 'var(--content-header-bg, #f0f0f0)' } : undefined,
    },
  ], [categoryValueFormatter, groupCellStyle]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // ── 열 고정 데모 ──
  const pinnedColDefs = useMemo<ColDef[]>(() => [
    { field: 'id', headerName: 'ID', width: 70, pinned: 'left', lockPinned: true },
    { field: 'name', headerName: '이름', width: 100, pinned: 'left', lockPinned: true },
    { field: 'department', headerName: '부서', width: 120 },
    { field: 'position', headerName: '직급', width: 100 },
    { field: 'hireDate', headerName: '입사일', width: 120 },
    { field: 'department', headerName: '소속팀', width: 120 },
    { field: 'position', headerName: '역할', width: 100 },
    { field: 'salary', headerName: '급여', width: 130, pinned: 'right', type: 'numericColumn',
      valueFormatter: (p) => p.value ? `${p.value.toLocaleString()}원` : '' },
  ], []);

  const tabItems = [
    {
      key: '1',
      label: '기본 설정',
      children: (
        <div className="demo-section">
          <h3>AG Grid 시작하기</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            AG Grid는 엔터프라이즈급 데이터 그리드 컴포넌트입니다. Community 버전을 사용하며 대부분의 기능을 무료로 제공합니다.
          </p>

          <Card title="라이브 데모" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={sampleData}
                columnDefs={sampleColDefs}
                defaultColDef={defaultColDef}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <h3>기본 사용법</h3>
          <CodeSnippet code={basicSetupCode} title="기본 그리드 설정" />

          <h3 style={{ marginTop: 24 }}>ColDef 속성</h3>
          <CodeSnippet code={colDefOptionsCode} title="컬럼 정의 주요 옵션" />

          <h3 style={{ marginTop: 24 }}>테마 및 레이아웃</h3>
          <CodeSnippet code={themingCode} title="테마 설정" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>💡 주의사항</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>ModuleRegistry.registerModules는 컴포넌트 외부(모듈 최상위)에서 한 번만 호출</li>
              <li>ag-grid.css와 ag-theme-quartz.css를 모두 import 필요</li>
              <li>테마 클래스는 그리드를 감싸는 div에 적용</li>
              <li>고정 높이 사용 시 style.height 또는 domLayout="autoHeight" 설정</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: '셀 렌더러 / 포맷터',
      children: (
        <div className="demo-section">
          <h3>valueFormatter</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            셀 값의 표시 형식을 변경합니다. 원본 데이터는 유지되며 화면 표시만 변경됩니다.
          </p>
          <CodeSnippet code={formatterCode} title="값 포맷팅" />

          <h3 style={{ marginTop: 24 }}>cellRenderer</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            커스텀 React 컴포넌트로 셀을 렌더링합니다. Tag, Avatar 등 복잡한 UI를 표현할 수 있습니다.
          </p>
          <CodeSnippet code={cellRendererCode} title="커스텀 셀 렌더러" />

          <h3 style={{ marginTop: 24 }}>cellStyle / cellClass</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            조건에 따라 셀의 스타일을 동적으로 변경합니다.
          </p>
          <CodeSnippet code={cellStyleCode} title="조건부 스타일링" />

          <h3 style={{ marginTop: 24 }}>툴팁</h3>
          <CodeSnippet code={tooltipCode} title="셀 툴팁 설정" />
        </div>
      ),
    },
    {
      key: '3',
      label: '셀 에디터',
      children: (
        <div className="demo-section">
          <h3>내장 셀 에디터</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            AG Grid는 텍스트, 숫자, 대형 텍스트, 선택 등 기본 에디터를 제공합니다.
          </p>
          <CodeSnippet code={cellEditorBasicCode} title="내장 에디터 사용" />

          <h3 style={{ marginTop: 24 }}>커스텀 셀 에디터</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            React forwardRef + useImperativeHandle 패턴으로 커스텀 에디터를 만들 수 있습니다.
            <br />
            <code>getValue()</code>와 <code>afterGuiAttached()</code> 메서드를 구현해야 합니다.
          </p>
          <CodeSnippet code={customCellEditorCode} title="커스텀 에디터 패턴" />

          <h3 style={{ marginTop: 24 }}>본 프로젝트 에디터</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            5가지 커스텀 에디터를 제공합니다: DateCellEditor, SelectCellEditor, NumberCellEditor, TagsCellEditor, TextAreaCellEditor
          </p>
          <CodeSnippet code={projectEditorsCode} title="프로젝트 커스텀 에디터 사용" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>💡 에디터 팁</strong>
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
    {
      key: '4',
      label: '행 선택 / 정렬 / 필터',
      children: (
        <div className="demo-section">
          <h3>행 선택</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            체크박스를 통한 단일/다중 행 선택을 지원합니다.
          </p>
          <CodeSnippet code={rowSelectionCode} title="행 선택 설정" />

          <h3 style={{ marginTop: 24 }}>정렬</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            컬럼 헤더 클릭으로 오름차순/내림차순 정렬이 가능하며, 다중 컬럼 정렬도 지원합니다.
          </p>
          <CodeSnippet code={sortingCode} title="정렬 설정" />

          <h3 style={{ marginTop: 24 }}>필터</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            텍스트, 숫자, 날짜 필터를 제공하며, 플로팅 필터와 빠른 검색 기능도 사용할 수 있습니다.
          </p>
          <CodeSnippet code={filteringCode} title="필터 설정" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>💡 팁</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li>multiSortKey="ctrl"로 Ctrl+클릭 다중 정렬 활성화</li>
              <li>floatingFilter: true로 헤더 아래 인라인 필터 표시</li>
              <li>quickFilterText로 모든 컬럼을 대상으로 빠른 검색</li>
              <li>suppressRowClickSelection: true로 체크박스만 선택 가능하게 설정</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '6',
      label: '헤더 그룹핑',
      children: (
        <div className="demo-section">
          <h3>컬럼 헤더 그룹</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>children</code> 배열을 사용해 관련 컬럼을 그룹으로 묶을 수 있습니다.
            그룹 헤더는 다단(중첩)으로 구성할 수 있으며, Community 에디션에서 지원됩니다.
          </p>

          <Card title="라이브 데모 - 헤더 그룹핑" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={groupDemoData}
                columnDefs={headerGroupColDefs}
                defaultColDef={defaultColDef}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <h3>기본 헤더 그룹</h3>
          <CodeSnippet code={headerGroupCode} title="헤더 그룹 설정" />

          <h3 style={{ marginTop: 24 }}>다단 그룹 / 열기·닫기</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
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
    {
      key: '7',
      label: '셀/행 스패닝',
      children: (
        <div className="demo-section">
          <h3>Column Spanning (colSpan)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>colSpan</code> 콜백으로 특정 조건에서 셀이 여러 컬럼을 차지하도록 설정합니다.
            소계 행이나 제목 행 등에 활용합니다.
          </p>

          <Card title="라이브 데모 - colSpan (구분 컬럼)" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 280 }}>
              <AgGridReact
                rowData={spanDemoData}
                columnDefs={spanColDefs}
                defaultColDef={{ resizable: true }}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={colSpanCode} title="colSpan 예제" />

          <h3 style={{ marginTop: 24 }}>Row Spanning (spanRows)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            같은 값이 연속된 행에서 셀을 자동 병합합니다.
            AG Grid v35+ Community의 <code>CellSpanModule</code> (<code>AllCommunityModule</code>에 포함)을 사용합니다.
          </p>

          <Card title="라이브 데모 - spanRows (본부/팀 자동 병합)" style={{ marginBottom: 24 }}>
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

          <CodeSnippet code={rowSpanCode} title="행 스패닝 (enableCellSpan)" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>핵심 정리</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>colSpan</code>: 함수형 — <code>(params) =&gt; number</code> (1이면 스패닝 없음)</li>
              <li><code>spanRows: true</code>: 같은 값의 연속 행 자동 병합 (정렬 필수)</li>
              <li><code>enableCellSpan: true</code>를 <code>AgGridReact</code>에 설정해야 행 스패닝 동작</li>
              <li>스패닝된 셀의 스타일은 <code>cellStyle</code> 콜백으로 별도 지정</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '8',
      label: '풋터 / 고정 행',
      children: (
        <div className="demo-section">
          <h3>Pinned Rows (고정 행)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>pinnedTopRowData</code>와 <code>pinnedBottomRowData</code>로 상단/하단에 고정 행을 추가합니다.
            합계, 평균, 요약 정보를 표시하는 풋터로 활용합니다.{' '}
            <Tag color="green">Community</Tag>
          </p>

          <Card title="라이브 데모 - 풋터 (하단 합계 행)" style={{ marginBottom: 24 }}>
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

          <CodeSnippet code={pinnedRowCode} title="Pinned Rows 기본 사용" />

          <h3 style={{ marginTop: 24 }}>고정 행 스타일링</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>params.node.rowPinned</code>으로 고정 행 여부를 판별하여 스타일을 적용합니다.
          </p>
          <CodeSnippet code={pinnedRowStyleCode} title="고정 행 스타일 커스터마이징" />

          <h3 style={{ marginTop: 24 }}>그룹핑 효과 자체 구현</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            데이터를 그룹별로 정렬하고 소계 행을 삽입한 뒤, <code>valueFormatter</code>(반복 값 숨김) + <code>colSpan</code>(소계 열 병합) + <code>cellStyle</code>(그룹 구분선) + <code>pinnedBottomRowData</code>(총계 풋터)를 조합하면
            Community 에디션에서도 그룹핑과 유사한 효과를 구현할 수 있습니다.
          </p>

          <Card title="라이브 데모 - 그룹핑 자체 구현 (반복 값 숨김 + colSpan + 총계 풋터)" style={{ marginBottom: 24 }}>
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

          <CodeSnippet code={manualGroupingCode} title="Community 그룹핑 자체 구현 패턴" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>핵심 정리</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>pinnedTopRowData</code>: 헤더 바로 아래 고정 행 (요약/검색 등)</li>
              <li><code>pinnedBottomRowData</code>: 스크롤 아래 고정 행 (합계/풋터)</li>
              <li><code>params.node.rowPinned</code>: <code>'top' | 'bottom' | undefined</code></li>
              <li>고정 행 데이터는 useMemo로 최적화 권장</li>
              <li>그룹핑: 데이터 전처리(소계 행 삽입) + valueFormatter(반복 숨김) + colSpan + cellStyle(구분선) 조합으로 자체 구현</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: '9',
      label: '열 고정 (Pinning)',
      children: (
        <div className="demo-section">
          <h3>Column Pinning (열 고정)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>pinned</code> 속성으로 특정 컬럼을 좌측 또는 우측에 고정합니다.
            스크롤 시에도 고정 컬럼은 항상 보이므로, ID/이름 등 핵심 식별 컬럼이나 액션 버튼에 사용합니다.
            <Tag color="green" style={{ marginLeft: 8 }}>Community</Tag>
          </p>

          <Card title="라이브 데모 - 좌/우 열 고정" style={{ marginBottom: 24 }}>
            <div className="ds-data-grid" style={{ height: 300 }}>
              <AgGridReact
                rowData={sampleData}
                columnDefs={pinnedColDefs}
                defaultColDef={{ resizable: true, filter: true, sortable: true }}
                theme={mode === 'dark' ? darkTheme : lightTheme}
              />
            </div>
          </Card>

          <CodeSnippet code={columnPinningCode} title="열 고정 기본 사용법" />

          <h3 style={{ marginTop: 24 }}>동적 열 고정</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            API를 통해 런타임에 열 고정을 변경할 수 있습니다.
            사용자가 컬럼 헤더를 우클릭하면 기본 제공되는 컨텍스트 메뉴에서도 고정/해제가 가능합니다.
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
    {
      key: 'clipboard',
      label: '복사 / 붙여넣기',
      children: (
        <div className="demo-section">
          <h3>Clipboard (복사 / 붙여넣기)</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            AG Grid Community 에디션에서는 기본 클립보드 기능이 제한적이므로,
            <code>GridTable</code> 래퍼에 커스텀 <code>enableClipboard</code> prop을 추가하여
            <strong> Ctrl+C (복사)</strong>와 <strong>Ctrl+V (붙여넣기)</strong>를 구현했습니다.
            <Tag color="blue" style={{ marginLeft: 8 }}>커스텀</Tag>
          </p>

          <Card title="사용법" style={{ marginBottom: 16 }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', width: 140 }}>단축키</th>
                  <th style={{ padding: '8px 12px' }}>동작</th>
                  <th style={{ padding: '8px 12px', width: 100 }}>조건</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}><code>Ctrl+C</code></td>
                  <td style={{ padding: '8px 12px' }}>선택된 행을 헤더 포함 탭 구분 텍스트로 클립보드에 복사</td>
                  <td style={{ padding: '8px 12px' }}>행 선택 필요</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 12px' }}><code>Ctrl+V</code></td>
                  <td style={{ padding: '8px 12px' }}>클립보드 데이터를 포커스 셀부터 행/열 매핑하여 붙여넣기</td>
                  <td style={{ padding: '8px 12px' }}><code>editable</code></td>
                </tr>
              </tbody>
            </table>
          </Card>

          <h3 style={{ marginTop: 24 }}>기본 사용법</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>enableClipboard</code> prop과 <code>rowSelection="multiRow"</code>를 함께 사용합니다.
            체크박스로 행을 선택한 뒤 Ctrl+C를 누르면 엑셀 호환 형식으로 복사됩니다.
          </p>
          <CodeSnippet code={clipboardBasicCode} title="GridTable 클립보드 사용법" />

          <h3 style={{ marginTop: 24 }}>구현 상세</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <code>document.addEventListener('keydown', handler, true)</code>로 캡처 페이즈에서 이벤트를 잡아
            AG Grid 내부의 <code>stopPropagation</code>과 무관하게 동작합니다.
          </p>
          <CodeSnippet code={clipboardImplCode} title="클립보드 구현 코드 (GridTable.tsx)" />

          <div style={{ marginTop: 16, padding: 12, background: 'var(--content-header-bg)', borderRadius: 4 }}>
            <strong>핵심 정리</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-secondary)' }}>
              <li><code>enableClipboard</code>: GridTable prop으로 그리드별 선택적 활성화</li>
              <li><strong>Ctrl+C</strong>: 선택 행 → 헤더 + 데이터를 탭(<code>\t</code>) 구분 텍스트로 복사</li>
              <li><strong>Ctrl+V</strong>: 포커스 셀부터 클립보드 데이터 파싱 → 셀 값 입력 (편집 모드 전용)</li>
              <li>셀 에디팅 중에는 기본 브라우저 복사/붙여넣기 동작 유지</li>
              <li>캡처 페이즈(<code>true</code>)로 등록하여 AG Grid 이벤트 차단 우회</li>
              <li>복사 형식은 엑셀/구글시트/메모장 호환</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>AG Grid 가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          오프라인 참조용 AG Grid 튜토리얼
        </p>
      </div>
      <Tabs items={tabItems} />
    </div>
  );
}
