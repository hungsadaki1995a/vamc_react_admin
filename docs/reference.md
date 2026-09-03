# VAMC NPL ADMIN — 내부 API 레퍼런스

> hooks / stores / utils / contexts / config / lib/api 전체 사용법 정리

---

## Hooks

### useApiQuery

서버 데이터 조회용. `ApiResponse<T>` 자동 언래핑.

```typescript
import { useApiQuery } from '@/hooks/useApiQuery';

const { data, isLoading, error } = useApiQuery(
  ['queryKey', param],        // React Query 캐시 키
  () => myApi.getList(),      // () => Promise<ApiResponse<T>>
  { enabled: !!param },       // UseQueryOptions (선택)
);
```

- `success === false` 또는 `data === null` → `ApiError` throw
- 401/403/404는 재시도 없음, 그 외 최대 1회 재시도
- `staleTime`: 5분 (전역 기본값)

---

### useApiMutation

데이터 변경(생성/수정/삭제)용. 성공 토스트 자동 처리.

```typescript
import { useApiMutation } from '@/hooks/useApiMutation';

const { mutate, isPending } = useApiMutation(
  (payload) => myApi.save(payload),
  {
    successMessage: '저장되었습니다.',              // 성공 시 자동 토스트
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['list'] }),
    onError: (err: ApiError) => console.error(err.userMessage),
  },
);

mutate(formData);
```

---

### useMenuPermission

현재 활성 탭의 권한 조회.

```typescript
import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canRead, canWrite, permType } = useMenuPermission();

if (!canRead) return <div>접근 권한이 없습니다.</div>;
return canWrite && <Button>등록</Button>;
```

| permType | canRead | canWrite |
|----------|---------|----------|
| `'M'` | ✅ | ✅ |
| `'S'` | ✅ | ❌ |
| `''` | ❌ | ❌ |

---

### useScreenLabel

화면 ID(sceId) 기반의 세분화된 i18n 훅. `useLabelStore().t()`의 구조화된 버전.

```typescript
import { useScreenLabel } from '@/hooks/useScreenLabel';

// sceId는 TabContext에서 자동 추출 (TabContent 내부 컴포넌트)
const { tvt, tvb, tvh, tsg, tsm, tsb } = useScreenLabel();

// 명시적 sceId (TabContent 외부 컴포넌트)
const { tvt } = useScreenLabel('SYS030101SC');
```

| 함수 | 키 패턴 | 용도 |
|------|---------|------|
| `tvt(field)` | `{sceId}.VIEW.TEXT_{field}` | 폼 필드 라벨 |
| `tvb(field)` | `{sceId}.VIEW.BTN_{field}` | 버튼 텍스트 |
| `tvh(field)` | `{sceId}.VIEW.TITLE_{field}` | 제목/섹션 헤더 |
| `tsg(field)` | `{sceId}.SCRIPT.GRID_{field}` | 그리드 컬럼 헤더 |
| `tsm(field)` | `{sceId}.SCRIPT.MSG_{field}` | 성공/오류/확인 메시지 |
| `tsb(field)` | `{sceId}.SCRIPT.BTN_{field}` | 다이얼로그 버튼 텍스트 |

키가 없으면 키 자체 반환 (빈 문자열 반환 없음).

---

### useLogout

로그아웃 확인 모달 + 전체 상태 초기화.

```typescript
import { useLogout } from '@/hooks/useLogout';

const confirmLogout = useLogout();

<Button onClick={confirmLogout}>로그아웃</Button>
```

내부 동작: `POST /api/auth/logout` → authStore.logout() → clearProjects() → resetTabs() → clearServerMenus() → `/login` 이동.

---

### useTabRouteSync

탭 시스템 ↔ 브라우저 URL 양방향 동기화. `AppLayout`에서 한 번만 호출.

```typescript
import { useTabRouteSync } from '@/hooks/useTabRouteSync';

// AppLayout 내부에서만 사용
useTabRouteSync();
```

- 탭 활성화 → `navigate('/app/{tabKey}')`
- 브라우저 뒤로/앞으로 → `setActiveTab(tabKey from URL)`
- Rail 아이콘 active 상태 자동 동기화

---

## Stores (Zustand)

### authStore

인증 상태 관리. `accessToken`은 메모리, `user/roles`는 localStorage 저장.

```typescript
import { useAuthStore } from '@/stores/authStore';

const { user, isAuthenticated, roles } = useAuthStore();
const hasRole = useAuthStore((s) => s.hasRole);

hasRole('ADMIN'); // → boolean
```

| 액션 | 설명 |
|------|------|
| `setAuth(token, me, refreshToken?)` | 로그인 후 전체 상태 설정 |
| `setAccessToken(token)` | Silent Refresh — 토큰만 갱신 |
| `logout()` | 모든 인증 상태 초기화 |
| `setLoading(bool)` | 초기 로드 중 상태 |

localStorage 키: `pms-auth` (user, roles만 저장)

---

### tabStore

탭 목록 및 활성 탭 관리. localStorage에 전체 탭 상태 저장.

```typescript
import { useTabStore } from '@/stores/tabStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

const { openTab, closeTab, tabs, activeTabKey } = useTabStore();

// 탭 열기
const menuItem = findMenuByKey(menuConfig, 'project.list');
if (menuItem) openTab(menuItem);
```

| 액션 | 설명 |
|------|------|
| `openTab(menuItem)` | 탭 열기 (이미 열린 탭이면 활성화) |
| `closeTab(key)` | 탭 닫기 (pinned 탭은 닫기 불가) |
| `closeOtherTabs(key)` | 해당 탭 외 모두 닫기 |
| `closeRightTabs(key)` | 오른쪽 탭 모두 닫기 |
| `closeAllTabs()` | 핀 탭 제외 모두 닫기 |
| `setActiveTab(key)` | 활성 탭 변경 |
| `pinTab(key)` / `unpinTab(key)` | 탭 고정/해제 |
| `reorderTabs(from, to)` | DnD 재정렬 |
| `resetTabs()` | 전체 초기화 (로그아웃 시) |

- `maxTabs`: 20개 (초과 시 가장 앞의 미고정 탭 자동 제거)
- 홈 탭은 자동 pinned, closable=false

localStorage 키: `pms-tabs`

---

### menuStore

아이콘 레일/플라이아웃 상태 + 서버 메뉴 관리. **persist 없음**.

```typescript
import { useMenuStore } from '@/stores/menuStore';

const { serverMenus, loadMenuForProject } = useMenuStore();

// 프로젝트 변경 후 메뉴 재로드
await loadMenuForProject();
```

| 액션 | 설명 |
|------|------|
| `toggleFlyout(railKey)` | 아이콘 레일 클릭 → 플라이아웃 토글 |
| `closeFlyout()` | 플라이아웃 닫기 |
| `toggleSidebar()` | 사이드바 전체 열기/닫기 |
| `loadMenuForProject()` | `GET /api/mnu/auth-list` 호출 → serverMenus 갱신 |
| `setServerMenus(menus)` | 직접 메뉴 설정 |
| `clearServerMenus()` | 메뉴 초기화 (로그아웃 시) |
| `resetNavState()` | 네비게이션 상태 초기화 (프로젝트 변경 시) |

---

### projectStore

활성 프로젝트 + 내 프로젝트 목록. localStorage 저장.

```typescript
import { useProjectStore } from '@/stores/projectStore';

const { activeProject, myProjects, fetchMyProjects, setActiveProject } = useProjectStore();

// 로그인 후 내 프로젝트 로드
await fetchMyProjects();

// activeProject는 axios 인터셉터가 X-Project-Id 헤더로 자동 주입
```

- `fetchMyProjects()`: 목록 로드 + 이전 선택 프로젝트 유지 (목록에 없으면 첫 번째로 자동 선택)

localStorage 키: `pms-project` (activeProject, myProjects)

---

### themeStore

라이트/다크 테마. localStorage 저장.

```typescript
import { useThemeStore } from '@/stores/themeStore';

const { mode, toggleMode } = useThemeStore();
// mode: 'light' | 'dark'
```

localStorage 키: `pms-theme`

---

### localeStore

언어 설정. localStorage 저장.

```typescript
import { useLocaleStore } from '@/stores/localeStore';
import type { LocaleKey } from '@/stores/localeStore';

const { locale, setLocale } = useLocaleStore();
// locale: 'ko' | 'en' | 'vi'

setLocale('en'); // → App.tsx가 감지하여 라벨 자동 재로드
```

localStorage 키: `pms-locale`

---

### labelStore

다국어 라벨 캐시. **persist 없음** (매 마운트 시 서버에서 로드).

```typescript
import { useLabelStore } from '@/stores/labelStore';

const t = useLabelStore((s) => s.t);
t('BTN_SAVE');    // → '저장' (키 없으면 'BTN_SAVE' 그대로 반환)
```

`loadLabels()`: App.tsx에서 `[activeProjectId, locale]` 변경 시 자동 호출.

→ 화면별 구조화가 필요하면 `useScreenLabel()` 훅 사용.

---

### comcdStore

공통코드 캐시. **persist 없음**.

```typescript
import { useComcdStore } from '@/stores/comcdStore';

const getOptions   = useComcdStore((s) => s.getOptions);
const getCodeName  = useComcdStore((s) => s.getCodeName);

// Select options
<Select options={getOptions('TASK_STATUS')} />

// 코드명 조회
getCodeName('TASK_STATUS', 'DONE'); // → '완료'
```

`loadCodes()`: App.tsx에서 `[activeProjectId, locale]` 변경 시 자동 호출.

→ JSX에서는 `<ComcdSelect cdDmnId="TASK_STATUS" ... />` 컴포넌트 사용 권장.

---

### settingsStore

개인 설정 (홈 메뉴 키 등). localStorage 저장.

```typescript
import { useSettingsStore } from '@/stores/settingsStore';

const { homeMenuKey, setHomeMenuKey } = useSettingsStore();
// homeMenuKey 기본값: 'dashboard'
```

localStorage 키: `pms-settings`

---

## Utils

### menuUtils (`src/utils/menuUtils.ts`)

#### `findMenuByKey(items, key)`

메뉴 트리에서 key로 `MenuItem` 탐색 (재귀).

```typescript
import { findMenuByKey } from '@/utils/menuUtils';
import { menuConfig } from '@/config/menuConfig';

const menu = findMenuByKey(menuConfig, 'project.list');
// → MenuItem | null
```

#### `getMenuParentKeys(items, targetKey)`

특정 키의 모든 상위 키 배열 반환 (플라이아웃 openKeys 용).

```typescript
const parents = getMenuParentKeys(menuConfig, 'project.list');
// → ['project'] 또는 null
```

#### `getMenuBreadcrumb(menus, targetKey)`

브레드크럼 경로 반환.

```typescript
const crumbs = getMenuBreadcrumb(menuConfig, 'project.list');
// → [{ key: 'project', label: '프로젝트' }, { key: 'project.list', label: '목록' }]
```

#### `buildAntMenuItems(items)`

`MenuItem[]` → Ant Design `Menu` 컴포넌트용 `items` 변환. 아이콘 문자열을 React 컴포넌트로 변환.

```typescript
const antItems = buildAntMenuItems(serverMenus);
<Menu items={antItems} />
```

---

## Contexts

### TabContext / useTabContext

TabContent 내부의 각 페이지 컴포넌트에서 현재 탭 정보 접근.

```typescript
import { useTabContext } from '@/contexts/TabContext';
import type { Tab } from '@/types/tab';

const ctx = useTabContext(); // → TabContextValue | null
const tab: Tab | undefined = ctx?.tab;

tab.key          // tabKey (menuItem.key)
tab.title        // 탭 표시 제목
tab.componentKey // componentPath (페이지 컴포넌트 폴더명)
tab.sceId        // 서버 화면 ID (예: 'SYS030101SC')
tab.pinned       // 고정 여부
tab.closable     // 닫기 가능 여부
```

`useScreenLabel()` 훅이 내부적으로 `useTabContext()`를 사용하여 sceId를 자동 추출합니다.

---

## Config

### componentRegistry (`src/config/componentRegistry.tsx`)

페이지 컴포넌트 자동 발견 및 lazy import.

```typescript
// 자동 발견: src/features/*/*/index.tsx  +  src/dev/pages/*/index.tsx
// 폴더명 = componentPath = 화면ID(sceId)

// 수동 매핑은 예외 수단 — 원칙은 DB 의 MENU_URL_ADDR 을 폴더명(화면ID)에 맞추는 것.
// 현재 overrides 는 비어 있다.
const overrides: Record<string, ComponentType> = {};
```

새 페이지 추가 시 별도 등록 불필요. 파일 생성만으로 자동 인식.

---

### menuConfig (`src/config/menuConfig.ts`)

정적 메뉴 트리. 서버 메뉴와 별개로 로컬 개발/도구 메뉴에 사용.

```typescript
import { menuConfig } from '@/config/menuConfig';

// MenuItem 타입
interface MenuItem {
  key: string;           // 탭 키 (도트 표기: 'project.list')
  label: string;         // 표시 이름
  icon?: string;         // Ant Design 아이콘 이름 또는 'custom:*'
  componentPath?: string; // 페이지 컴포넌트 폴더명 (PascalCase)
  sceId?: string;        // 서버 화면 ID
  labelKey?: string;     // i18n 라벨 키
  permType?: string;     // 'M' | 'S' | ''
  children?: MenuItem[];
  hidden?: boolean;
}
```

---

## lib/api

### apiClient (`src/lib/api/client.ts`)

```typescript
import { apiClient } from '@/lib/api/client';

// baseURL 이 빈 값이므로 경로에 /api 접두를 포함한다 (Vite 프록시 → :8080)
const { data } = await apiClient.get<ApiResponse<Task>>('/api/task/1');
const { data } = await apiClient.post<ApiResponse<Task>>('/api/task', payload);

// 서버는 success 필드를 안 내려준다 — API 함수에서 status → success 변환 필수
return { success: data.status === 200, message: data.message, data: data.data };
```

자동 주입 헤더: `Authorization`, `X-Project-Id`, `X-Lang`.

---

### ApiError (`src/lib/api/error.ts`)

```typescript
import { ApiError } from '@/lib/api/error';

try {
  await apiClient.get('/some-endpoint');
} catch (err) {
  if (err instanceof ApiError) {
    err.statusCode      // HTTP 상태 코드
    err.userMessage     // 사용자 표시 메시지 (한국어)
    err.isUnauthorized  // 401
    err.isForbidden     // 403
    err.isNotFound      // 404
    err.isServerError   // 500+
  }
}

// AxiosError → ApiError 변환
const apiErr = ApiError.fromAxiosError(axiosError);

// unknown → ApiError 변환
const apiErr = ApiError.from(unknownError);
```

---

### queryClient (`src/lib/api/queryClient.ts`)

전역 `QueryClient` 인스턴스. Provider에 주입되어 있으므로 직접 사용 시 import.

```typescript
import { queryClient } from '@/lib/api/queryClient';

// 캐시 무효화
queryClient.invalidateQueries({ queryKey: ['tasks'] });

// 캐시 직접 설정
queryClient.setQueryData(['tasks'], newData);
```

기본 설정:
- `staleTime`: 5분
- `retry`: 401/403/404는 재시도 없음, 그 외 최대 1회
- `refetchOnWindowFocus`: false

---

### apiNotify (`src/lib/api/apiNotify.ts`)

axios 인터셉터 등 React 외부에서 Ant Design 토스트를 띄우기 위한 브릿지.

```typescript
import { apiNotify } from '@/lib/api/apiNotify';

// axios 인터셉터 내부에서 사용
apiNotify.error('네트워크 오류가 발생했습니다.');
apiNotify.warning('경고 메시지');
```

핸들러는 `ApiNotifyBridge` 컴포넌트(`App.tsx` 마운트)에서 자동 등록. 페이지 컴포넌트에서는 `App.useApp().message`를 직접 사용하세요.

---

### 타입 (`src/lib/api/types.ts`)

| 타입 | 설명 |
|------|------|
| `ApiResponse<T>` | `{ status?, success, message, data }` — 서버는 `status` 만 주고 `success` 는 API 함수가 채운다 |
| `PaginatedResponse<T>` | `ApiResponse<T[]> + meta` |
| `UserInfo` | 사용자 기본 정보 |
| `LoginRequest` | `{ username, password }` |
| `LoginResponse` | `{ accessToken, refreshToken, tokenType, expiresIn }` |
| `MeResponse` | 사용자 상세 정보 + roles |
| `MyProjectResponseDto` | 프로젝트 정보 DTO |
| `PaginationParams` | `{ page, size, sort, order }` |
