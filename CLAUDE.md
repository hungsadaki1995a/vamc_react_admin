# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VAMC NPL ADMIN — 부실채권 관리 어드민 시스템. React + TypeScript SPA.

**중요**: 모든 외부 라이브러리는 무조건 무료(오픈소스)만 사용. 향후 판매 목적 제품.

## Commands

```bash
npm run dev          # Vite dev server (port 3000, strictPort)
npm run build        # TypeScript compile + Vite production build → dist/
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check (no output)
```

### Environment

`.env.local`에서 `VITE_API_BASE_URL`을 **빈 값**으로 두면 Vite dev 프록시가 `/api` 요청을 `http://127.0.0.1:8080`으로 전달합니다 (CORS 우회, vite.config.ts 참조). 백엔드를 직접 호출하려면 URL을 지정하세요:
```
VITE_API_BASE_URL=          # 개발 기본값 (Vite 프록시 사용)
VITE_API_BASE_URL=http://localhost:8080   # 직접 호출 시
```

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Ant Design 6** (UI components, ko_KR locale)
- **Zustand 5** (state management, persist middleware)
- **React Router v7** (minimal — `/app/:tabKey?` only)
- **Axios** (HTTP client, interceptors for auth)
- **TanStack React Query 5** (server state, custom hooks)
- **AG Grid 35** (data grid, Community Edition)
- **frappe-gantt 1.2.2** (gantt chart)
- **TipTap 3** (rich text editor)
- **Monaco Editor** (code editor)
- **Univer 0.15** (spreadsheet)
- **Chart.js 4** (charts)

## Architecture

**Tab-driven SPA**: The tab system controls content display, not React Router. Router is used only for browser history sync (back/forward).

### Layout Structure
```
┌──────┬─────────────────────────────────┐
│ Icon │  ContentHeader (Breadcrumb +    │
│ Rail │   프로젝트선택/테마)             │
│(56px)├─────────────────────────────────┤
│      │  TabBar (◀ tabs ▶ ≡)           │
│      ├─────────────────────────────────┤
│      │  TabContent                     │
│      │                                 │
└──────┴─────────────────────────────────┘
  + FlyoutPanel (280px, overlay on rail click)
```

### Key Data Flow
```
IconRail click → menuStore.toggleFlyout() → FlyoutPanel shows
FlyoutPanel leaf click → tabStore.openTab() → TabContent renders
                       → closeFlyout()
                       → navigate(`/app/${tabKey}`)
Browser back/forward → popstate → URL tabKey → setActiveTab()
Tab switch → ContentHeader breadcrumb updates → Rail active icon syncs
```

### Tab State Preservation
All open tab components stay mounted simultaneously. Active tab gets `display:block`, inactive tabs get `display:none`. This preserves component state (form inputs, scroll position, filters) without unmounting.

### Core Files

| File | Purpose |
|------|---------|
| `src/components/layout/IconRail.tsx` | Left icon rail (1st level menu icons) |
| `src/components/layout/FlyoutPanel.tsx` | Overlay panel (2~4 level menu tree) |
| `src/components/layout/ContentHeader.tsx` | Breadcrumb + project selector + theme toggle |
| `src/components/tabs/TabBar.tsx` | Tab bar with scroll arrows, DnD, context menu, manage dropdown |
| `src/components/tabs/TabContent.tsx` | State-preserving container (display:none toggle) |
| `src/stores/tabStore.ts` | Tab state: open/close/pin/reorder, persist to localStorage |
| `src/stores/menuStore.ts` | Rail/Flyout: activeRailKey, flyoutVisible, openKeys, selectedKey |
| `src/stores/themeStore.ts` | Dark/light theme, persisted |
| `src/stores/projectStore.ts` | Active project + my projects list, persisted |
| `src/stores/authStore.ts` | Auth state: accessToken (memory), user/roles (persist) |
| `src/stores/labelStore.ts` | i18n label cache (loaded on mount & project/locale change) |
| `src/stores/comcdStore.ts` | Common code cache (loaded on mount & project/locale change) |
| `src/stores/localeStore.ts` | Locale setting ko/en/vi, persisted |
| `src/stores/settingsStore.ts` | Personal settings (homeMenuKey), persisted |
| `src/lib/api/client.ts` | Axios instance + auth interceptors + silent refresh |
| `src/lib/api/types.ts` | ApiResponse, VamcApiResponse, auth types, project types |
| `src/lib/api/error.ts` | ApiError class with Korean messages |
| `src/lib/api/queryClient.ts` | QueryClient instance (staleTime 5m, no retry on 401/403/404) |
| `src/lib/api/apiNotify.ts` | Toast bridge for non-React contexts (axios interceptors) |
| `src/api/lbl.ts` | fetchBulkLabels (GET /api/lbl/bulk) |
| `src/api/menu.ts` | fetchAuthMenuList (GET /api/mnu/auth-list) |
| `src/api/common.ts` | getAllCodeList, getCodeList, getCodeDomains |
| `src/api/project.ts` | getMyProjects |
| `src/api/user.ts` | User API |
| `src/contexts/TabContext.tsx` | TabContext — provides current tab info to page components |
| `src/hooks/useApiQuery.ts` | useQuery wrapper with ApiResponse<T> auto-unwrap |
| `src/hooks/useApiMutation.ts` | useMutation wrapper with auto-unwrap + success toast |
| `src/hooks/useMenuPermission.ts` | Returns canRead/canWrite from active tab's permType |
| `src/hooks/useScreenLabel.ts` | sceId-scoped label helpers: tvt/tvb/tvh/tsg/tsm/tsb |
| `src/hooks/useLogout.ts` | Logout confirm modal + full state reset |
| `src/hooks/useTabRouteSync.ts` | Bidirectional tab ↔ browser history + rail sync |
| `src/config/menuConfig.ts` | Static menu tree (dashboard + dev tools) |
| `src/config/componentRegistry.tsx` | Auto-discover page components via import.meta.glob |
| `src/utils/menuUtils.ts` | findMenuByKey, getMenuParentKeys, getMenuBreadcrumb, buildAntMenuItems |

### Folder Convention
```
src/
├── api/                    # API 함수 (domain-agnostic)
├── components/             # 공유 컴포넌트
│   ├── auth/               # AuthGuard
│   ├── common/             # CodeSnippet, PlaceholderPage
│   ├── editors/            # RichTextEditor, CodeEditor, SpreadSheet
│   ├── gantt/              # GanttView, ganttTypes
│   ├── grid/               # GridTable, GridPanel, cellEditors/*
│   ├── icons/              # CustomIcons
│   ├── inputs/             # ComcdSelect, SearchSelectField
│   ├── layout/             # ContentHeader, FilterPanel, GridToolbar, FormPanel, SplitPanel, DetailPanel
│   └── tabs/               # TabBar, TabContent, TabContextMenu
├── config/                 # menuConfig, componentRegistry
├── contexts/               # TabContext
├── features/
│   ├── auth/               # LoginPage
│   ├── cco/                # CCO101001SC (사용자관리) 등 레거시 화면
│   ├── dashboard/          # Dashboard
│   └── dev/                # 개발 도구, 데모, 가이드 페이지
├── hooks/                  # 공통 훅
├── lib/api/                # Axios 클라이언트, 에러, 타입
├── stores/                 # Zustand 스토어 9개
├── styles/                 # global.css, variables.css
├── types/                  # MenuItem, Tab, 공통 타입
└── utils/                  # menuUtils
```

### Adding a New Page
1. Add `MenuItem` to `src/config/menuConfig.ts` with a `componentPath`
2. Create `src/features/{domain}/pages/{ComponentName}/index.tsx`
3. **수동 등록 불필요** — `import.meta.glob('../features/*/*/index.tsx')`이 자동 발견
4. 서버 scrId ≠ 폴더명인 경우만 `componentRegistry.tsx`의 `overrides`에 추가

### Page Layout Classes
| 클래스 | 용도 |
|--------|------|
| `page-master` | 그리드/폼 화면 — 고정 높이, 내부 스크롤 없음 |
| `page-container` | 스크롤 화면 — 흰 카드, overflow 부모 위임 |
| `page-container page-scrollable` | 스크롤 필요한 가이드/데모 화면 |
| `page-legacy` | 레거시 스타일 — padding 0, 배경 흰색 |

### CSS 규칙
- `src/features/` 하위: **CSS Modules** 사용 (`index.module.css`)
- `src/components/`, `src/styles/`: plain CSS 사용
- 다크모드: `:global([data-theme="dark"]) .className { ... }`

### Path Alias
`@/` maps to `src/` (configured in both vite.config.ts and tsconfig.app.json)

## Stores Overview

| 스토어 | persist | localStorage 키 |
|--------|---------|-----------------|
| `authStore` | 일부 (user, roles) | `pms-auth` |
| `tabStore` | ✅ (tabs, activeTabKey) | `pms-tabs` |
| `menuStore` | ❌ | — |
| `projectStore` | ✅ (activeProject, myProjects) | `pms-project` |
| `themeStore` | ✅ | `pms-theme` |
| `localeStore` | ✅ | `pms-locale` |
| `labelStore` | ❌ (서버에서 재로드) | — |
| `comcdStore` | ❌ (서버에서 재로드) | — |
| `settingsStore` | ✅ (homeMenuKey) | `pms-settings` |

## API Client

`apiClient` 하나만 사용 (`src/lib/api/client.ts`).
- **baseURL**: `VITE_API_BASE_URL` — 개발 시 빈 값(Vite 프록시 `/api` → `http://127.0.0.1:8080`)
- 인터셉터: Bearer 토큰 주입, Silent Refresh (401), X-Project-Id / X-Lang 헤더 자동 주입

### 응답 포맷

```typescript
// ds_pms_new (Spring Boot 레거시)
ApiResponse<T> = { success: boolean; message: string; data: T | null }

// ds_pms_server (현재 서버)
VamcApiResponse<T> = { status: number; message: string; data: T | null }
```

### API 함수 패턴

```typescript
import { apiClient, fromList } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 단건 조회
export const getTask = async (id: string): Promise<ApiResponse<Task>> => {
  const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
  return data;
};

// 목록 (배열이 data.mtxTt 키로 감싸진 경우)
export const getTaskList = async (): Promise<ApiResponse<Task[]>> => {
  const { data } = await apiClient.get<ApiResponse<{ mtxTt: Task[] }>>('/tasks/list');
  return fromList(data, 'mtxTt');
};
```

`useApiQuery` / `useApiMutation` 훅은 `success === true` 기준으로 성공/실패를 판단합니다.

## Backend Server

- **Server**: Spring Boot 3.5.9 + MyBatis + MariaDB + Redis at `../vamc-npl-backend/` (아키텍처/컨벤션은 해당 프로젝트 README.md 참조)
- **Run**: `cd ../vamc-npl-backend && ./mvnw spring-boot:run` (port 8080, Swagger: `/swagger-ui.html`)
- **API Base**: 개발 시 Vite 프록시 경유 (`/api` → `http://127.0.0.1:8080`)
- **Auth**: JWT (AccessToken + RefreshToken both in response body; Refresh sent via `Refresh-Token` header, Redis 기반 토큰 로테이션)
- **Local test account**: `admin` / `1q2w3e4r1!` (inserted by `LocalTestDataInitializer` on startup)
- **CORS**: `http://localhost:3000`, `http://localhost:8080` (local/dev 프로파일 `cors.allowed-origins`)

## Design Docs (`docs/`)

| 파일 | 내용 |
|------|------|
| `docs/architecture.md` | 기술 스택, 레이아웃 구조, 탭 SPA, 인증 흐름, 폴더 구조 |
| `docs/components.md` | GridTable, GridPanel, FormPanel, GanttView, FilterPanel, GridToolbar 등 Props 레퍼런스 |
| `docs/development-guide.md` | 새 페이지 추가, API 패턴, CSS Modules, i18n, 권한, Zustand |
| `docs/i18n-and-permissions.md` | labelStore, localeStore, useMenuPermission, permType 체계 |
| `docs/api-integration.md` | apiClient, 인터셉터, 응답 포맷, useApiQuery/Mutation, Silent Refresh |
| `docs/reference.md` | Hooks / Stores / Utils / Contexts / Config / lib/api 전체 레퍼런스 |
