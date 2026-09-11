# VAMC NPL ADMIN — 개발 가이드

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
src/features/{도메인}/{화면ID}/
  ├── index.tsx          # 화면 컴포넌트
  ├── index.module.css   # CSS Modules
  └── {화면ID}1P/        # 이 화면에서만 여는 팝업 — 자식 폴더로 코로케이트
```

**화면 폴더에 `api.ts` 를 만들지 않습니다.** API 호출은 전부
`src/api/{도메인}/{업무}.ts` 에 두고 화면이 import 합니다 (아래 3단계).
파일명은 화면ID가 아니라 업무명으로 짓습니다 — `sys/menuMng.ts`, `sys/lblMng.ts`.

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

서버는 `{ status, message, data }` 만 내려주고 `success` 필드가 없습니다.
`useApiQuery` / `useApiMutation` 은 `success === true` 로 성공을 판정하므로
**API 함수에서 `status → success` 변환이 필수**입니다. (자세한 내용은 `docs/api-integration.md`)

```typescript
// src/api/{도메인}/task.ts  — 예: src/api/sys/taskMng.ts (업무명으로 짓는다)
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 대응하는 타입은 이 파일에 코로케이트 (src/api/common/comCdApi.ts 참고)
export interface Task { taskId: string; taskNm: string; }

// baseURL 이 빈 값이므로 경로에 /api 접두를 반드시 포함한다 (Vite 프록시 → :8080)
export async function getTask(id: string): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/api/task/${id}`);
  return { success: data.status === 200, message: data.message, data: data.data };
}

export async function getTaskList(): Promise<ApiResponse<Task[]>> {
  const { data } = await apiClient.get<ApiResponse<Task[]>>('/api/task/list');
  return { success: data.status === 200, message: data.message, data: data.data ?? [] };
}

export async function saveTask(payload: Partial<Task>): Promise<ApiResponse<Task>> {
  const { data } = await apiClient.post<ApiResponse<Task>>('/api/task', payload);
  return { success: data.status === 200, message: data.message, data: data.data };
}
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
| `page-master` | 그리드/목록 전용 | 고정 높이, 내부 스크롤 없음 (GridPanel/GanttSheet와 조합) |
| `page-container page-scrollable` | 스크롤 페이지 | 가이드/데모/폼 화면, 세로 스크롤 활성화 |

`page-container` + GridPanel/GridTable/GanttSheet 사용 시 CSS가 자동으로 `overflow: hidden` 처리하여 내부 스크롤 없이 그리드가 컨테이너를 채움. 이 동작이 필요 없으면 `page-scrollable` 추가.

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

**기본은 서버에서 받는다.** 그리드 목록을 엑셀로 내리는 경로는 프런트에서 파일을
만들지 않고 백엔드가 만든 것을 blob 으로 받는다 — 5만 건 같은 대량에서 브라우저가
버티지 못하고, 권한·마스킹 규칙을 서버가 알고 있기 때문이다.

```tsx
import { ExcelButton } from '@/components/excel';

<ExcelButton
  downloadUrl="/api/npl/debt/excel"
  columns={excelColumns}
  queryParams={searchParams}
  fileName="부실채권목록"
/>
```

세부 제어가 필요하면 `useExcel()` 훅을 직접 쓴다 (`src/hooks/useExcel.ts`).
업로드는 `ExcelUploadModal` + `gridExcelUtils` 조합이다.

### 브라우저에서 xlsx 를 직접 만드는 경우

스프레드시트 편집기(`components/editors/SpreadSheet.tsx`)만 해당한다. 사용자가 고른
파일을 화면에서 편집하고 다시 내려받는 흐름이라 서버를 거칠 수 없다.
여기서만 **SheetJS(`xlsx`)** 를 쓴다.

```typescript
import * as XLSX from 'xlsx';

// 읽기 — cellDates 로 날짜를 일련번호가 아닌 Date 로 받는다
const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(ws['!ref']!);
const cell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];

// 쓰기
const out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(out, XLSX.utils.aoa_to_sheet(rows), '목록');
const buf = XLSX.write(out, { type: 'array', bookType: 'xlsx' });
```

> ⚠️ **`book_append_sheet` 는 시트명 규칙을 어기면 예외를 던진다** — 31자 초과
> (`Sheet names cannot exceed 31 chars`), 중복 (`Worksheet with name |…| already exists!`).
> 사용자 데이터에서 시트명을 만들 때는 반드시 잘라내고 중복을 피한다.
> `SpreadSheet.tsx` 의 `safeSheetName()` 이 그 예다.

> ⚠️ **SheetJS 는 CDN tarball URL 로 고정돼 있다** — `package.json` 의
> `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`.
> npm 레지스트리의 `xlsx` 는 0.18.5(2022-03-24)에서 발행이 멈췄고 그 판에는
> Prototype Pollution(0.19.3 수정)과 ReDoS(0.20.2 수정)가 남아 있다. 두 건을 모두
> 해결한 판이 CDN 에만 있어 URL 로 받는다. pnpm 이 lock 에 integrity 해시를 남기므로
> 재현성은 유지된다.
>
> 버전을 올릴 때는 **레지스트리가 아니라 URL 을 바꾼다** — `pnpm update` 는 URL
> 의존성을 올리지 않는다. 폐쇄망으로 이관하면 이 URL 이 막히므로, 그때는 tarball 을
> 사내 저장소(Nexus raw 등)에 올리고 주소를 바꾼다.
>
> 방침 — **사용자가 직접 고른 파일만** 이 경로로 파싱한다. 서버에서 받은 파일이나
> 외부 입력은 넣지 않는다. 서버측 파싱이 필요하면 백엔드(Apache POI)에서 처리한다.
