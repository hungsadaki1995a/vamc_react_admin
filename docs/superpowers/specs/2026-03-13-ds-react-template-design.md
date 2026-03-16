# ds_react_template — Mock-Only React 템플릿 설계

**날짜**: 2026-03-13
**목적**: `ds_pms_client`를 복사하여 서버 연동 없이 mock 데이터만으로 동작하는 새 프로젝트 생성

---

## 1. 개요

`ds_pms/ds_pms_client`를 `ds_pms/ds_react_template`로 복사한 뒤,
서버 API 호출 지점을 Mock Service Layer로 교체한다.
컴포넌트 / store 구조 / 탭 시스템 / 레이아웃은 **변경 없음**.

---

## 2. 프로젝트 복사

- **원본**: `ds_pms/ds_pms_client/`
- **대상**: `ds_pms/ds_react_template/`
- **제외**: `.git`, `node_modules`, `dist`, `.env.local`, `sessions`, `events.jsonl`, `statuses`, `views.json`
- `package.json` `name` → `ds-react-template`
- `index.html` `<title>` → `DS React Template`
- `.env.local` 새 생성:
  ```
  VITE_API_BASE_URL=http://localhost:__mock__
  ```
  (axios baseURL을 의도적으로 무효 URL로 설정 → 실수로 HTTP 요청이 나가도 즉시 실패)

---

## 3. Mock Service Layer

### 3-1. 파일 구조

```
src/mock/
├── services/
│   ├── authService.ts      # login + getMe mock
│   ├── labelService.ts     # 빈 라벨 맵 반환
│   ├── menuService.ts      # menuConfig.ts → MenuItem[] 직접 반환
│   ├── projectService.ts   # 최소 프로젝트 1건 반환
│   └── comcdService.ts     # 최소 공통코드 반환
└── labels.ts               # 빈 객체 {} (없는 키는 key 자체 표시)
```

기존 `mock/codes.ts`, `mock/projects.ts`, `mock/tasks.ts`, `mock/users.ts`는 타입 구조가 서버 응답과 달라 store 직접 연동에 사용하지 않음 — 단, **Dashboard·기타 컴포넌트에서 직접 import하는 곳은 그대로 유지**.

### 3-2. authService.ts

LoginPage는 내부적으로 `login()` + `getMe()` 두 호출을 순서대로 수행한다.
두 함수 모두 mock으로 교체.

```ts
// src/mock/services/authService.ts

import type { LoginResponse, MeResponse } from '@/lib/api/types';

export const mockLogin = (_id: string, _pw: string): LoginResponse => ({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 7200,
});

export const mockGetMe = (): MeResponse => ({
  usrId: 'admin',
  usrNm: '관리자',
  email: 'admin@mock.local',
  dpCd: 'DEPT001',
  usrCCd: 'USR001',
  phnNo: '',
  roles: ['ROLE_ADMIN'],
});
```

**교체 대상**: `src/features/auth/LoginPage/api.ts`의 `login()`, `getMe()` 두 함수 모두.

### 3-3. menuService.ts

`GET /api/mnu/auth-list`는 서버에서 메뉴+권한 목록을 받아온 뒤 `buildServerMenuTree()`로 변환한다.
Mock에서는 이 단계를 건너뛰고 `menuConfig.ts`의 `menuItems`를 **바로 `MenuItem[]`로 반환**한다.
모든 메뉴의 `permType = 'M'`.

```ts
// src/mock/services/menuService.ts

import { menuItems } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

function setPermType(items: MenuItem[]): MenuItem[] {
  return items.map(item => ({
    ...item,
    permType: 'M' as const,
    children: item.children ? setPermType(item.children) : undefined,
  }));
}

export const mockLoadMenus = (): MenuItem[] => setPermType(menuItems);
```

**교체 대상**: App 초기화 시 `fetchAuthMenuList()` → `mockLoadMenus()`.

### 3-4. labelService.ts / labels.ts

라벨 캐시(IndexedDB) 레이어를 우회하고 정적 맵을 직접 반환.
`labels.ts` = `export const mockLabels: Record<string, string> = {};`

```ts
// src/mock/services/labelService.ts

import { mockLabels } from '@/mock/labels';

export const mockLoadLabels = async (): Promise<Record<string, string>> => mockLabels;
```

**교체 대상**: `labelStore.ts`의 `loadLabels()` 내부 — IndexedDB 캐시 + `fetchBulkLabels()` 호출 블록을 `mockLoadLabels()` 단일 호출로 교체.

### 3-5. comcdService.ts

`comcdStore`가 기대하는 `CodeDetail` 타입으로 최소 데이터 정의.
빈 배열 반환도 가능 (드롭다운이 비어있는 것은 템플릿 동작에 무해).

```ts
// src/mock/services/comcdService.ts

import type { CodeDetail } from '@/api/common';

export const mockLoadCodes = async (): Promise<CodeDetail[]> => [];
```

**교체 대상**: `comcdStore.ts`의 `loadCodes()` 내부 — IndexedDB 캐시 + `getAllCodeList()` 호출 블록을 `mockLoadCodes()` 단일 호출로 교체.

### 3-6. projectService.ts

`projectStore`가 기대하는 `MyProjectResponseDto` 타입으로 최소 1건 정의.

```ts
// src/mock/services/projectService.ts

import type { MyProjectResponseDto } from '@/lib/api/types';

export const mockLoadProjects = async (): Promise<MyProjectResponseDto[]> => [
  {
    projId: 'PJ001',
    projNm: '샘플 프로젝트',
    projType: 'DEV',
    clnNm: null,
    bzDpNm: null,
    pmId: 'admin',
    adminId: 'admin',
    pnSrDt: null,
    pnEdDt: null,
    rltSrDt: null,
    rltEdDt: null,
    bigo: null,
    rgDttm: '',
    roles: [],
  },
];
```

**교체 대상**: `projectStore.ts`의 `fetchMyProjects()` 내부 API 호출.

---

## 4. 교체 지점 전체 목록

| 파일 | 교체 대상 | mock 함수 |
|------|-----------|-----------|
| `features/auth/LoginPage/api.ts` | `login()` | `mockLogin()` |
| `features/auth/LoginPage/api.ts` | `getMe()` | `mockGetMe()` |
| `stores/labelStore.ts` | `fetchBulkLabels()` + IDB 캐시 블록 | `mockLoadLabels()` |
| `stores/comcdStore.ts` | `getAllCodeList()` + IDB 캐시 블록 | `mockLoadCodes()` |
| `stores/projectStore.ts` | API 호출 | `mockLoadProjects()` |
| `features/auth/LoginPage/index.tsx` | `fetchAuthMenuList()` (로그인 직후) | `mockLoadMenus()` |
| App 초기화 (`menuStore.loadMenuForProject()`) | `fetchAuthMenuList()` | `mockLoadMenus()` |

`CCO101001SC`: 실 API 호출 부분 → `mock/users.ts` 직접 참조로 교체.

---

## 5. 유지되는 것

- 탭 시스템 (TabBar, TabContent, tabStore)
- 레이아웃 (IconRail, FlyoutPanel, ContentHeader)
- 모든 features 페이지 컴포넌트
- 다국어 구조 (labelStore, localeStore) — loadLabels 내부만 교체
- 권한 구조 (useMenuPermission, permType)
- `src/lib/api/client.ts` — 그대로 유지 (향후 재연동 시 baseURL + 실제 API 함수 복원만 하면 됨)
- 기존 `mock/*.ts` (codes, projects, tasks, users) — 컴포넌트에서 직접 import하는 곳 그대로 유지

---

## 6. 성공 기준

- `npm run dev` 실행 후 로그인 화면 표시
- 아무 ID/PW 입력 → 대시보드 진입
- 모든 메뉴 탭 클릭 가능, 페이지 렌더링
- `http://localhost:__mock__`로 향하는 실제 HTTP 요청 없음 (브라우저 DevTools Network 탭)
- `npm run build` TypeScript 오류 없음
