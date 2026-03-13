# DS PMS 공유 컴포넌트 레퍼런스

## GridTable

**경로**: `src/components/grid/GridTable.tsx`

AG Grid Community를 래핑한 컴포넌트. 테마 자동 연동, 간소화된 Props, Ctrl+C/V 클립보드 지원.

```tsx
import GridTable from '@/components/grid/GridTable';
import type { ColDef } from 'ag-grid-community';

<GridTable<Employee>
  columnDefs={cols}
  rowData={data}
  rowKey="id"
  pagination={false}
  height={400}
/>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `columnDefs` * | `ColDef<T>[]` | — | 컬럼 정의 |
| `rowData` * | `T[]` | — | 행 데이터 |
| `rowKey` | `string` | `"id"` | 행 고유 키 필드 |
| `defaultColDef` | `ColDef<T>` | — | 모든 컬럼 기본값 |
| `editable` | `boolean` | `false` | 전체 셀 편집 |
| `enableClipboard` | `boolean` | `false` | Ctrl+C/V 클립보드 |
| `rowSelection` | `'singleRow' \| 'multiRow'` | — | 행 선택 모드 |
| `pagination` | `boolean` | `true` | 페이지네이션 |
| `pageSize` | `number` | `20` | 페이지당 행 수 |
| `height` | `string \| number` | `"100%"` | 그리드 높이 |
| `autoHeight` | `boolean` | `false` | 행 수에 맞게 자동 높이 |
| `rowHeight` | `number` | — | 행 높이(px) |
| `headerHeight` | `number` | — | 헤더 높이(px) |
| `loading` | `boolean` | `false` | 로딩 오버레이 |
| `noRowsMessage` | `string` | `"데이터가 없습니다."` | 빈 데이터 메시지 |
| `pinnedTopRowData` | `T[]` | — | 상단 고정 행 |
| `pinnedBottomRowData` | `T[]` | — | 하단 고정 행 (풋터) |
| `enableCellSpan` | `boolean` | `false` | colSpan/spanRows 활성화 |
| `floatingFilter` | `boolean` | — | 헤더 아래 인라인 필터 |
| `quickFilterText` | `string` | — | 전체 컬럼 빠른 검색 |
| `suppressCellFocus` | `boolean` | — | 셀 포커스 테두리 억제 |
| `gridRef` | `RefObject<AgGridReact>` | — | AgGridReact ref |
| `gridProps` | `AgGridReactProps<T>` | — | AG Grid 네이티브 props (escape hatch) |

### 이벤트

| 이벤트 | 시그니처 | 설명 |
|--------|---------|------|
| `onRowClick` | `(data: T) => void` | 행 클릭 |
| `onRowDoubleClick` | `(data: T, event) => void` | 행 더블클릭 |
| `onSelectionChanged` | `(rows: T[]) => void` | 선택 행 목록 변경 |
| `onCellValueChanged` | `(event: CellValueChangedEvent<T>) => void` | 셀 값 변경 |
| `onGridReady` | `(api: GridApi<T>) => void` | 그리드 초기화 완료 |
| `onSortChanged` | `(event) => void` | 정렬 변경 |
| `onFilterChanged` | `(event) => void` | 필터 변경 |

### 커스텀 Cell Editors / Renderers

```tsx
import DateCellEditor, { DateCellRenderer } from '@/components/grid/cellEditors/DateCellEditor';
import SelectCellEditor from '@/components/grid/cellEditors/SelectCellEditor';
import TagsCellEditor from '@/components/grid/cellEditors/TagsCellEditor';
import UserCellEditor from '@/components/grid/cellEditors/UserCellEditor';
import ComcdSelectCell, { ComcdSelectCellEditor } from '@/components/grid/ComcdSelectCell';

// 날짜 편집 + 표시
{ field: 'dueDate', editable: true,
  cellRenderer: DateCellRenderer,
  cellEditor: DateCellEditor }
// 날짜 포맷 커스텀
{ field: 'planDt', editable: true,
  cellRenderer: DateCellRenderer,
  cellRendererParams: { format: 'YYYY.MM.DD' },
  cellEditor: DateCellEditor,
  cellEditorParams: { format: 'YYYY.MM.DD' } }

// 공통코드 Select 셀
{ field: 'status', editable: true, cellRenderer: ComcdSelectCell,
  cellEditorParams: { cdDmnId: 'TASK_STATUS' } }

// 공통코드 체이닝 (부모 값에 따라 자식 옵션 필터)
{ field: 'childCd', editable: true, cellRenderer: ComcdSelectCell,
  cellEditorParams: (params) => ({
    cdDmnId: 'CHILD_DOMAIN',
    filterFn: (item) => item.bzLrgCzCd === params.data?.parentCd,
  }) }

// 상태 Select
{ field: 'status',  editable: true, cellEditor: SelectCellEditor,
  cellEditorParams: { values: ['todo','done'], valueLabels: { todo:'예정', done:'완료' } } }
{ field: 'tags',    editable: true, cellEditor: TagsCellEditor,
  cellEditorParams: { presetTags: ['긴급','중요'] }, cellEditorPopup: true }
{ field: 'assignee', editable: true, cellEditor: UserCellEditor }
```

### enableCellSpan과 enableCellTextSelection

`enableCellSpan={true}` 설정 시 `enableCellTextSelection`이 **자동으로 비활성화**됩니다.
AG Grid가 `spanRows`와 `enableCellTextSelection`을 동시에 지원하지 않기 때문입니다.

```tsx
// spanRows 사용 — enableCellTextSelection 자동 off (경고 없음)
<GridTable
  enableCellSpan
  columnDefs={[
    { field: 'dept', spanRows: true, sort: 'asc' },
    { field: 'name' },
  ]}
  rowData={data}
/>
```

---

## 트리 그리드 (AG Grid Community)

AG Grid Community 라이선스로 Enterprise `treeData` 없이 계층 구조를 구현합니다.
`useTreeGrid` 훅으로 flat 데이터를 DFS 순서로 변환하고, `TreeCellRenderer`로 들여쓰기+토글을 렌더링합니다.

### useTreeGrid

**경로**: `src/components/grid/useTreeGrid.ts`

```tsx
import { useTreeGrid } from '@/components/grid/useTreeGrid';
import type { TreeRow } from '@/components/grid/useTreeGrid';

const { treeData, toggleExpand, expandAll, collapseAll } = useTreeGrid({
  data: orgList,
  idField: 'orgId',       // default: 'id'
  parentField: 'upOrgId', // default: 'parentId'
  defaultExpanded: true,  // default: true
});

<GridTable
  rowData={treeData}
  columnDefs={[{
    field: 'orgNm',
    cellRenderer: TreeCellRenderer,
    cellRendererParams: { onToggle: toggleExpand },
  }]}
/>
```

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `data` * | `T[]` | — | 원본 flat 데이터 |
| `idField` | `string` | `'id'` | 고유 ID 필드명 |
| `parentField` | `string` | `'parentId'` | 부모 ID 필드명 |
| `defaultExpanded` | `boolean` | `true` | 초기 전체 펼침 여부 |

반환값:

| 값 | 타입 | 설명 |
|----|------|------|
| `treeData` | `TreeRow<T>[]` | DFS 순서 + `_treeLevel`, `_hasChildren`, `_isExpanded`, `_nodeId` 추가 |
| `toggleExpand` | `(id: string) => void` | 노드 접기/펼치기 |
| `expandAll` | `() => void` | 전체 펼치기 |
| `collapseAll` | `() => void` | 전체 접기 |
| `expandedIds` | `Set<string>` | 현재 펼쳐진 노드 ID 집합 |

### TreeCellRenderer

**경로**: `src/components/grid/TreeCellRenderer.tsx`

```tsx
import TreeCellRenderer from '@/components/grid/TreeCellRenderer';

columnDefs={[{
  field: 'orgNm',
  headerName: '조직명',
  cellRenderer: TreeCellRenderer,
  cellRendererParams: {
    onToggle: toggleExpand,
    indentSize: 18,        // 레벨당 들여쓰기(px), default: 18
    // innerRenderer: CustomRenderer,  // 커스텀 셀 내용 렌더러
  },
}]}
```

| cellRendererParams | 타입 | 기본값 | 설명 |
|---|------|--------|------|
| `onToggle` * | `(id: string) => void` | — | 토글 핸들러 (`useTreeGrid.toggleExpand`) |
| `indentSize` | `number` | `18` | 레벨당 들여쓰기(px) |
| `innerRenderer` | `React.ComponentType` | — | 셀 텍스트 대신 커스텀 컴포넌트 |

**전체 예시:**

```tsx
const { treeData, toggleExpand, expandAll, collapseAll } = useTreeGrid({
  data, idField: 'orgId', parentField: 'upOrgId',
});

<>
  <Space>
    <Button size="small" onClick={expandAll}>전체 펼치기</Button>
    <Button size="small" onClick={collapseAll}>전체 접기</Button>
  </Space>
  <GridTable
    rowData={treeData}
    columnDefs={[
      {
        field: 'orgNm',
        headerName: '조직명',
        cellRenderer: TreeCellRenderer,
        cellRendererParams: { onToggle: toggleExpand },
      },
      { field: 'orgId', headerName: '코드' },
    ]}
  />
</>
```

---

## GanttView

**경로**: `src/components/gantt/GanttView.tsx`
**타입**: `src/components/gantt/ganttTypes.ts`

frappe-gantt 1.2.2 기반 간트 차트. 좌측 그리드 패널, 크리티컬 패스, 드래그 편집 지원.

```tsx
import { useRef } from 'react';
import GanttView from '@/components/gantt/GanttView';
import type { GanttTask, GanttViewMode } from '@/components/gantt/ganttTypes';

// uncontrolled (기본) — 접기/펼치기 상태를 GanttView가 내부 관리
<GanttView tasks={tasks} viewMode="Week" height={500} />

// "오늘" 버튼 외부 연동
const scrollToTodayRef = useRef<(() => void) | null>(null);
<Button onClick={() => scrollToTodayRef.current?.()}>오늘</Button>
<GanttView tasks={tasks} scrollToTodayRef={scrollToTodayRef} todayButton={false} />

// controlled — 접기/펼치기 상태를 부모가 관리
const [collapsed, setCollapsed] = useState(new Set<string>());
<GanttView
  tasks={tasks}
  collapsedGroups={collapsed}
  onToggleGroup={(id) => setCollapsed(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  })}
/>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `tasks` * | `GanttTask[]` | — | 태스크 목록 |
| `viewMode` | `GanttViewMode` | `'Week'` | `'Quarter Day' \| 'Half Day' \| 'Day' \| 'Week' \| 'Month'` |
| `readOnly` | `boolean` | `false` | 날짜/진행률 드래그 비활성화 |
| `showCriticalPath` | `boolean` | `false` | 크리티컬 패스 강조 |
| `showGrid` | `boolean` | `true` | 좌측 태스크 그리드 패널 |
| `gridWidth` | `number` | `400` | 좌측 그리드 너비(px) |
| `gridMinWidth` | `number` | `200` | 그리드 최소 너비 |
| `gridMaxWidth` | `number` | `600` | 그리드 최대 너비 |
| `collapsedGroups` | `Set<string>` | — | 접힌 그룹 ID (controlled). **생략 시 GanttView 내부 상태로 자동 관리 (uncontrolled default)** |
| `onToggleGroup` | `(groupId) => void` | — | 그룹 접기/펼치기 콜백 (controlled 모드 시 사용) |
| `scrollToTodayRef` | `MutableRefObject<(() => void) \| null>` | — | 오늘 날짜로 스크롤하는 함수를 외부 ref에 주입. 툴바 "오늘" 버튼 연동에 사용 |
| `height` | `string \| number` | `"100%"` | 높이 |
| `loading` | `boolean` | `false` | 로딩 오버레이 |
| `showProgress` | `boolean` | `true` | 진행률 바 |
| `todayButton` | `boolean` | `true` | Today 이동 버튼 |
| `lines` | `'vertical' \| 'horizontal' \| 'both' \| 'none'` | `'both'` | 격자선 |
| `barHeight` | `number` | `28` | 바 높이(px) |
| `barCornerRadius` | `number` | `4` | 바 모서리 반경 |
| `rowPadding` | `number` | `16` | 행 위아래 패딩 |
| `language` | `string` | `'ko'` | 날짜 표시 언어 |

### 이벤트

| 이벤트 | 시그니처 | 설명 |
|--------|---------|------|
| `onTaskClick` | `(task) => void` | 태스크 바 클릭 |
| `onTaskDoubleClick` | `(task) => void` | 태스크 바 더블클릭 |
| `onTaskContextMenu` | `(task, event) => void` | 태스크 우클릭 |
| `onTaskHover` | `(task \| null) => void` | 호버 진입/이탈 |
| `onTaskSelect` | `(task \| null) => void` | 태스크 선택/해제 |
| `onGanttReady` | `() => void` | 초기 렌더링 완료 |
| `onDateChange` | `(task, start, end) => void` | 날짜 드래그 변경 |
| `onProgressChange` | `(task, progress) => void` | 진행률 드래그 변경 |

### GanttTask 타입

```typescript
interface GanttTask {
  // 필수
  id: string
  name: string
  start: string          // 'YYYY-MM-DD'
  end: string            // 'YYYY-MM-DD'
  progress: number       // 0~100

  // 의존성
  dependencies?: string[]
  dependencyTypes?: Record<string, 'FS' | 'SS' | 'FF' | 'SF'>

  // 계층/그룹
  parentId?: string
  level?: number         // 0=루트, 1=자식
  isGroup?: boolean      // 접기/펼치기 가능

  // 표시 옵션
  milestone?: boolean
  assignee?: string
  color?: string
  description?: string
  customClass?: string
  locked?: boolean
  priority?: 'low' | 'normal' | 'high' | 'critical'
}
```

---

## GanttSheet

**경로**: `src/components/gantt-sheet/GanttSheet.tsx`
**import**: `import { GanttSheet } from '@/components/gantt-sheet';`

`GanttView`와 **동일한 Props 인터페이스** — drop-in 교체 가능. `@tanstack/react-virtual` 기반 가상화로 5,000행+ 60fps 스크롤 지원.

> `lines` (`'vertical'|'horizontal'|'both'|'none'`, 기본 `'both'`)와 `language` (`'ko'|'en'|'vi'`, 기본 `'ko'`) 포함 GanttView 모든 Props 동일하게 동작.

```tsx
import { GanttSheet } from '@/components/gantt-sheet';
import type { GanttTask, GanttViewMode } from '@/components/gantt-sheet';

// 기본 사용 (GanttView와 동일)
<GanttSheet tasks={tasks} viewMode="Week" height={500} />

// 드래그 편집
<GanttSheet
  tasks={tasks}
  onDateChange={(task, start, end) => updateTask(task.id, { start, end })}
  onProgressChange={(task, progress) => updateTask(task.id, { progress })}
/>

// 오늘로 이동
const scrollToTodayRef = useRef<(() => void) | null>(null);
<GanttSheet tasks={tasks} scrollToTodayRef={scrollToTodayRef} />
<Button onClick={() => scrollToTodayRef.current?.()}>오늘</Button>
```

### GanttSheet 전용 Props (GanttView에 없음)

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `rowBuffer` | `number` | `5` | 가상화 오버스캔 행 수 |
| `columnWidth` | `number` | 뷰모드 기본값 | 열 너비 px 오버라이드 |

### 아키텍처

- **가상화**: `timelineBodyRef`가 스크롤 컨테이너. `overflow-y: scroll`로 수직 스크롤바 항상 표시.
- **헤더 분리**: `timelineHeaderRef`(overflow:hidden) + `timelineBodyRef`(overflow:scroll) — 수평 스크롤바 높이에 의한 패널 틀어짐 방지
- **화살표 SVG**: `position:absolute; top:0; height:totalListHeight` — 절대 좌표계. scrollTop 보정 없음. 부모 `overflow:hidden`이 클리핑.
- **텍스트 오버플로우**: 바가 좁으면 텍스트가 바 오른쪽 바깥으로 표시 (`overflow:visible`)

---

## 레이아웃 컴포넌트

### FilterPanel

**경로**: `src/components/layout/FilterPanel.tsx`

검색 조건 패널. 4열 그리드 레이아웃, 접기/펼치기, 활성 필터 수 배지.

```tsx
import FilterPanel from '@/components/layout/FilterPanel';

<FilterPanel activeFilterCount={2} onSearch={handleSearch} onReset={handleReset}>
  <div className="ds-filter-field">
    <span className="ds-filter-field-label">담당자</span>
    <Input value={assignee} onChange={...} />
  </div>
  <div className="ds-filter-field">
    <span className="ds-filter-field-label">상태</span>
    <Select value={status} onChange={...} options={...} />
  </div>
</FilterPanel>
```

| Prop | 타입 | 설명 |
|------|------|------|
| `activeFilterCount` | `number` | 적용된 필터 수 (배지) |
| `onSearch` | `() => void` | 검색 버튼 핸들러 |
| `onReset` | `() => void` | 초기화 버튼 핸들러 |
| `collapsed` | `boolean` | 접힘 상태 (controlled) |
| `onCollapsedChange` | `(v) => void` | 접힘 상태 변경 |

**CSS 클래스 규칙:**
- `.ds-filter-field` — flex row, 라벨+입력 수평 배치
- `.ds-filter-field-label` — width: 72px, text-align: right (열 정렬 통일)
- `Space + plain <span>` 조합 사용 금지

---

### GridToolbar

**경로**: `src/components/layout/GridToolbar.tsx`

그리드/목록 위 툴바. 총 건수 + 좌측 추가 요소 + 우측 액션 버튼.

```tsx
import GridToolbar from '@/components/layout/GridToolbar';

<GridToolbar
  totalCount={data.length}
  actions={
    <>
      <Button type="primary" onClick={handleAdd}>등록</Button>
      <Button onClick={handleDelete}>삭제</Button>
    </>
  }
/>
```

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `totalCount` | `number` | — | 건수 표시 (예: "전체 42건") |
| `countLabel` | `string` | `"전체"` | 건수 라벨 |
| `left` | `ReactNode` | — | 좌측 추가 요소 |
| `actions` | `ReactNode` | — | 우측 액션 버튼 영역 |

> ⚠️ `right` prop은 없음. 반드시 `actions` 사용.

---

### GridPanel

**경로**: `src/components/grid/GridPanel.tsx`

`GridToolbar` + `GridTable`을 하나로 묶은 래퍼. 툴바와 그리드를 함께 사용하는 일반적인 목록 화면에 적합.

```tsx
import GridPanel from '@/components/grid/GridPanel';

<GridPanel<User>
  totalCount={data.length}
  actions={
    <Space>
      <Button icon={<DownloadOutlined />}>엑셀 다운로드</Button>
      <Button type="primary" onClick={handleAdd}>등록</Button>
    </Space>
  }
  columnDefs={columnDefs}
  rowData={data}
  rowKey="id"
  onRowClick={handleRowClick}
  height="100%"
  loading={isLoading}
/>
```

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `totalCount` | `number` | — | 건수 표시 |
| `countLabel` | `string` | `"전체"` | 건수 라벨 |
| `toolbarLeft` | `ReactNode` | — | 툴바 좌측 추가 요소 |
| `actions` | `ReactNode` | — | 툴바 우측 액션 버튼 |
| `...GridTableProps` | — | — | GridTable의 모든 Props 그대로 전달 |

> **높이 패턴**: 컨테이너를 `display:flex; flex-direction:column`으로 설정하고 `height="100%"` 전달 시 GridTable이 `flex:1`로 남은 공간을 채움.

```tsx
{/* flex column 컨테이너 안에서 높이 자동 채움 */}
<div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
  <GridPanel height="100%" ... />
</div>
```

---

### FormPanel

**경로**: `src/components/layout/FormPanel.tsx`

CRUD 입력 폼 하단 패널. 헤더(제목 + 액션버튼 + 접기토글) + 폼 본문. 수정 모드 시 하단 테두리가 primary 색상으로 강조됨.

```tsx
import FormPanel from '@/components/layout/FormPanel';

<FormPanel
  title="입력"
  editMode={isEditMode}
  collapsed={formCollapsed}
  onCollapsedChange={setFormCollapsed}
  actions={
    <Space>
      <Button onClick={handleReset}>초기화</Button>
      <Button type="primary" onClick={handleSave}>저장</Button>
      <Button danger disabled={!isEditMode} onClick={handleDelete}>삭제</Button>
    </Space>
  }
>
  <Form form={form} layout="horizontal">
    {/* 폼 필드들 */}
  </Form>
</FormPanel>
```

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | `ReactNode` | — | 패널 제목 (헤더 좌측) |
| `actions` | `ReactNode` | — | 액션 버튼 영역 (헤더 우측, 접기 토글 앞) |
| `editMode` | `boolean` | `false` | 수정 모드 — 하단 테두리를 primary 색상으로 강조 |
| `collapsed` | `boolean` | — | 접힘 상태 (controlled) |
| `onCollapsedChange` | `(v: boolean) => void` | — | 접힘 상태 변경 콜백 |
| `children` | `ReactNode` | — | 폼 내용 |

> `collapsed` prop을 생략하면 내부 상태로 동작(uncontrolled).

---

### SplitPanel

**경로**: `src/components/layout/SplitPanel.tsx`

좌우 또는 상하 분할 패널. 드래그 리사이즈.

```tsx
import SplitPanel from '@/components/layout/SplitPanel';

<SplitPanel direction="horizontal" defaultSize={400}>
  <LeftPanel />
  <RightPanel />
</SplitPanel>
```

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `direction` * | `'horizontal' \| 'vertical'` | — | 분할 방향 |
| `defaultSize` | `number` | — | 첫 번째 패널 초기 크기(px) |
| `primaryMinSize` | `number` | `200` | 첫 번째 패널 최소 크기 |
| `secondaryMinSize` | `number` | `200` | 두 번째 패널 최소 크기 |
| `secondaryVisible` | `boolean` | `true` | 두 번째 패널 표시 여부 |
| `onResize` | `(size) => void` | — | 리사이즈 콜백 |

---

### DetailPanel

**경로**: `src/components/layout/DetailPanel.tsx`

그리드 오른쪽 상세 패널. 헤더(제목 + 닫기버튼) + 스크롤 본문.

```tsx
import DetailPanel from '@/components/layout/DetailPanel';

<DetailPanel title="업무 상세" onClose={() => setSelected(null)}>
  <Form ... />
</DetailPanel>
```

---

## 입력 컴포넌트

### ComcdSelect

**경로**: `src/components/inputs/ComcdSelect.tsx`

공통코드(comcdStore)로 옵션을 자동 로드하는 Select.

```tsx
import ComcdSelect from '@/components/inputs/ComcdSelect';
import type { ComcdSelectProps } from '@/components/inputs/ComcdSelect';

// 기본 사용
<ComcdSelect cdDmnId="TASK_STATUS" value={status} onChange={setStatus} />

// 체이닝 — 부모 값에 따라 옵션 필터링
<ComcdSelect
  cdDmnId="CHILD_DOMAIN"
  value={childVal}
  onChange={setChildVal}
  filterFn={(item) => item.bzLrgCzCd === parentVal}
/>
```

| Prop | 타입 | 설명 |
|------|------|------|
| `cdDmnId` * | `string` | 공통코드 도메인 ID |
| `value` | `string` | 선택 값 |
| `onChange` | `(value, option) => void` | 변경 핸들러 |
| `filterFn` | `(item: CodeDetail) => boolean` | 옵션 필터 함수 (체이닝 용) |
| `mode` | `'multiple' \| 'tags'` | 다중 선택 |
| `placeholder` | `string` | 플레이스홀더 |
| `disabled` | `boolean` | 비활성화 |
| `style` | `CSSProperties` | 스타일 |

---

### SearchSelectField

**경로**: `src/components/inputs/SearchSelectField.tsx`

자동완성(inline) + 팝업 모달 검색을 지원하는 Select. 정적/동적 옵션 모두 가능.
레이아웃: `[명칭 입력] [검색🔍] [코드(읽기전용)]`

```tsx
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';

// 정적 옵션, 단일 선택
<SearchSelectField
  value={selected}             // SearchSelectValue | null
  onChange={setSelected}
  options={userOptions}
  placeholder="사용자 검색"
/>

// 비동기, 다중 선택
<SearchSelectField
  value={selected}             // SearchSelectValue[]
  onChange={setSelected}
  fetchOptions={(keyword) => searchUsers(keyword)}
  multiple
/>
```

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `value` | `SearchSelectValue \| SearchSelectValue[] \| null` | — | 선택 값 |
| `onChange` | `(val) => void` | — | 변경 핸들러 |
| `options` | `SearchSelectOption[]` | — | 정적 옵션 목록 |
| `fetchOptions` | `(keyword) => Promise<SearchSelectOption[]>` | — | 비동기 옵션 조회 |
| `multiple` | `boolean` | `false` | 다중 선택 (태그 UI) |
| `placeholder` | `string` | `'검색어 입력'` | 플레이스홀더 |
| `disabled` | `boolean` | `false` | 비활성화 |
| `style` | `CSSProperties` | — | 컨테이너 스타일 |
| `modalTitle` | `string` | `'검색'` | 팝업 모달 제목 |
| `modalWidth` | `number` | `560` | 팝업 모달 너비 |
| `nameWidth` | `number` | `120` | 명칭 입력 고정 너비(px) |
| `codeWidth` | `number` | `110` | 코드 표시 너비(px) |
| `columns` | `ColumnsType<SearchSelectOption>` | `[명칭, 코드]` | 모달 테이블 컬럼 커스텀 |
| `showModalSearch` | `boolean` | `true` | 모달 내 검색바 표시 |
| `modalSearchFields` | `string[]` | `['label','value']` | 모달 검색 대상 필드 |
| `renderModalContent` | `(ctx) => ReactNode` | — | 모달 본문 완전 커스텀 |

**SearchSelectValue 타입:**
```typescript
interface SearchSelectValue { label: string; value: string; }
```

**도메인 Wrapper 패턴** (`src/components/inputs/selectors/`):

```tsx
import DeptSelectField from '@/components/inputs/selectors/DeptSelectField';

// 부서 선택 — fetchOptions(getOrgTree/getOrgList) 내장
<DeptSelectField value={dept} onChange={setDept} />
<DeptSelectField value={depts} onChange={setDepts} multiple />
```

| DeptSelectField Prop | 타입 | 설명 |
|------|------|------|
| `value` | `SearchSelectValue \| SearchSelectValue[] \| null` | 선택 값 |
| `onChange` | `(val) => void` | 변경 핸들러 |
| `multiple` | `boolean` | 다중 선택 |
| `disabled` | `boolean` | 비활성화 |
| `style` | `CSSProperties` | 스타일 |
| `placeholder` | `string` | 플레이스홀더 |

---

## 에디터

### RichTextEditor

**경로**: `src/components/editors/RichTextEditor.tsx`

TipTap 3 기반. 이미지(업로드/정렬/리사이즈), YouTube 임베드, 다크모드 지원.

```tsx
import RichTextEditor from '@/components/editors/RichTextEditor';

<RichTextEditor
  value={content}
  onChange={setContent}
  mode="full"
  onImageUpload={(file) => uploadFile(file).then(r => r.url)}
/>
```

| Prop | 설명 |
|------|------|
| `value` | HTML 문자열 |
| `onChange` | 변경 핸들러 |
| `mode` | `'full' \| 'compact' \| 'minimal'` |
| `onImageUpload` | `(file) => Promise<string>` (없으면 base64) |
| `readOnly` | 읽기 전용 |

---

### CodeEditor

**경로**: `src/components/editors/CodeEditor.tsx`

Monaco Editor 기반. 언어 자동 감지, 다크모드 연동.

```tsx
import CodeEditor from '@/components/editors/CodeEditor';

<CodeEditor value={code} onChange={setCode} language="typescript" height={400} />
```

---

### SpreadSheet

**경로**: `src/components/editors/SpreadSheet.tsx`

Univer 기반 스프레드시트. 툴바, 공식 입력, 데이터 가져오기/내보내기 지원.

```tsx
import SpreadSheet from '@/components/editors/SpreadSheet';
import type { SpreadSheetRef } from '@/components/editors/SpreadSheet';

const ref = useRef<SpreadSheetRef>(null);
<SpreadSheet ref={ref} height={500} showToolbar />
```

---

## 공통 컴포넌트

### CodeSnippet

**경로**: `src/components/common/CodeSnippet.tsx`

코드 하이라이팅 + 복사 버튼.

```tsx
import CodeSnippet from '@/components/common/CodeSnippet';

<CodeSnippet code={myCode} title="사용 예시" />
```
