# DS PMS — 개발 가이드

## 새 페이지 추가

### 1단계: 메뉴 등록 (menuConfig.ts)

```typescript
// src/config/menuConfig.ts
{
  key: 'my-feature.list',
  label: '목록',
  icon: 'UnorderedListOutlined',
  componentPath: 'MyFeatureList',  // 페이지 컴포넌트 폴더명 (PascalCase)
  sceId: 'MY001001SC',              // 서버 화면 ID
}
```

### 2단계: 페이지 컴포넌트 생성

```
src/features/myFeature/pages/MyFeatureList/
  └── index.tsx
```

컴포넌트 레지스트리가 자동 발견 (`import.meta.glob`) — 수동 등록 불필요.

단, 서버 `scrId` ↔ 로컬 폴더명이 다를 경우 `overrides` 맵에 추가:
```tsx
// src/config/componentRegistry.tsx
const overrides: Record<string, string> = {
  'MY001001SC': 'MyFeatureList',
};
```

### 3단계: 페이지 레이아웃 선택

> 섹션 제목에는 `page-header`(삭제됨) 대신 `ds-section-header` 사용.

#### 그리드/목록 페이지 (내부 스크롤 없음)
```tsx
export default function MyFeatureList() {
  return (
    <div className="page-container">
      <div className="ds-section-header">
        <h2>목록</h2>
      </div>
      <FilterPanel ...>...</FilterPanel>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <GridPanel totalCount={...} actions={...} columnDefs={...} rowData={...} height="100%" />
      </div>
    </div>
  );
}
```

#### 가이드/폼 페이지 (스크롤 있음)
```tsx
export default function MyGuide() {
  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>가이드</h2>
      </div>
      {/* 내용 */}
    </div>
  );
}
```

---

## API 연동 패턴

### API 함수 작성

```typescript
// src/features/myFeature/api/myFeatureApi.ts
import { apiClient, fromList } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface Task { id: string; name: string; }

// 단건 조회
export const getTask = async (id: string): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return data;
};

// 목록 조회 (배열이 data.mtxTt 키로 감싸진 경우)
export const getTaskList = async (): Promise<ApiResponse<Task[]>> => {
  const { data } = await apiClient.get<ApiResponse<{ mtxTt: Task[] }>>('/tasks/list');
  return fromList(data, 'mtxTt');
};

// 저장
export const saveTask = async (payload: Partial<Task>): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.post<ApiResponse<Task>>('/tasks', payload);
  return data;
};
```

### useApiQuery — 데이터 조회

```tsx
import { useApiQuery } from '@/hooks/useApiQuery';
import { getTaskList } from '../api/myFeatureApi';

function MyList() {
  const { data: tasks = [], isLoading } = useApiQuery(
    ['tasks'],
    getTaskList,
  );
  return <GridTable rowData={tasks} columnDefs={...} loading={isLoading} />;
}
```

### useApiMutation — 데이터 변경

```tsx
import { useApiMutation } from '@/hooks/useApiMutation';
import { saveTask } from '../api/myFeatureApi';

function MyForm() {
  const mutation = useApiMutation(saveTask, {
    successMessage: '저장되었습니다.',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleSave = () => mutation.mutate(formData);
}
```

---

## 권한 체크

```tsx
import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canRead, canWrite } = useMenuPermission();

  if (!canRead) return <div>접근 권한이 없습니다.</div>;

  return (
    <>
      <GridToolbar
        totalCount={data.length}
        actions={
          canWrite && (
            <>
              <Button type="primary" onClick={handleAdd}>등록</Button>
              <Button danger onClick={handleDelete}>삭제</Button>
            </>
          )
        }
      />
    </>
  );
}
```

| permType | canRead | canWrite |
|----------|---------|---------|
| `'M'` | ✅ | ✅ |
| `'S'` | ✅ | ❌ |
| `''` | ❌ | ❌ |

---

## 다국어 (i18n)

```tsx
import { useLabelStore } from '@/stores/labelStore';

function MyPage() {
  const t = useLabelStore((s) => s.t);
  return <Button>{t('BTN_SAVE')}</Button>;
  // 키가 없으면 키 자체 반환 ('BTN_SAVE')
}
```

라벨은 프로젝트 변경 / 언어 변경 시 `App.tsx`에서 자동 재로드됨.

---

## CSS 모듈 패턴

`src/features/` 하위 파일은 반드시 **CSS Modules** 사용:

```tsx
// index.module.css
.container { padding: 16px; }
.title { font-size: 16px; font-weight: 600; }

// index.tsx
import styles from './index.module.css';
<div className={styles.container}>
  <h3 className={styles.title}>...</h3>
</div>
```

다크모드 선택자:
```css
/* CSS Modules에서 전역 선택자 사용 */
:global([data-theme="dark"]) .container { background: #1a1f2e; }

/* antd 내부 클래스 타깃팅 */
.wrapper :global(.ant-checkbox-wrapper) { display: flex; }
```

`src/components/`, `src/styles/` — plain CSS 사용.

---

## 페이지 레이아웃 클래스 정리

| 클래스 | 용도 | 특징 |
|--------|------|------|
| `page-container` | 기본 페이지 컨테이너 | 흰색 카드, padding, 내부 overflow hidden |
| `page-master` | 그리드/목록 전용 | 고정 높이, 내부 스크롤 없음 (GridPanel/GanttView와 조합) |
| `page-container page-scrollable` | 스크롤 페이지 | 가이드/데모/폼 화면, 세로 스크롤 활성화 |
| `page-legacy` | 레거시 스타일 화면 | padding 0, 배경 흰색 |

`page-container` + GridPanel/GridTable/GanttView 사용 시 CSS가 자동으로 `overflow: hidden` 처리하여 내부 스크롤 없이 그리드가 컨테이너를 채움. 이 동작이 필요 없으면 `page-scrollable` 추가.

---

## 탭 / 라우팅

직접 탭 조작이 필요한 경우:
```tsx
import { useTabStore } from '@/stores/tabStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

const openTab = useTabStore((s) => s.openTab);

const handleNavigate = () => {
  const menuItem = findMenuByKey(menuConfig, 'my-feature.detail');
  if (menuItem) openTab(menuItem);
};
```

---

## 공통코드 (ComcdSelect 패턴)

```tsx
// 공통코드 Select (자동 옵션 로드)
<ComcdSelect cdDmnId="TASK_STATUS" value={status} onChange={setStatus} />

// 공통코드 텍스트 표시
import { useComcdStore } from '@/stores/comcdStore';
const getCodeName = useComcdStore((s) => s.getCodeName);
const label = getCodeName('TASK_STATUS', 'DONE');  // '완료'
```

---

## 상태 저장 패턴 (Zustand)

```typescript
// src/stores/myStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      value: '',
      setValue: (v) => set({ value: v }),
    }),
    { name: 'pms-my-store' },
  ),
);
```

영속 불필요 시 `persist` 래퍼 제거.

---

## Excel 내보내기

```typescript
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const exportExcel = async (data: Row[]) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('목록');
  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '이름', key: 'name', width: 20 },
  ];
  data.forEach(row => ws.addRow(row));
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), '목록.xlsx');
};
```
