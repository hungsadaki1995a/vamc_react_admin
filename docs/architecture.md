# VAMC NPL ADMIN — 시스템 아키텍처

## 기술 스택

| 영역 | 라이브러리 | 버전 |
|------|-----------|------|
| UI 프레임워크 | React | 19 |
| 언어 | TypeScript | 5.9 |
| 빌드 | Vite | 7 |
| UI 컴포넌트 | Ant Design | 6.3 |
| 상태 관리 | Zustand | 5 |
| 서버 상태 | TanStack React Query | 5 |
| HTTP | Axios | 1.13 |
| 라우팅 | React Router | 7 |
| 그리드 테이블 | AG Grid Community | 35 |
| 간트 차트 | frappe-gantt | 1.2.2 |
| 리치 텍스트 | TipTap | 3.20 |
| 스프레드시트 | Univer | 0.15 |
| 코드 에디터 | Monaco Editor | 4.7 |
| 차트 | Chart.js | 4.5 |

---

## 레이아웃 구조

```
┌──────┬──────────────────────────────────────────────┐
│      │  ContentHeader                               │
│ Icon │  (Breadcrumb + 프로젝트 선택 + 테마 토글)    │
│ Rail ├──────────────────────────────────────────────┤
│(56px)│  TabBar  (◀ 탭목록 ▶  ≡)                    │
│      ├──────────────────────────────────────────────┤
│      │  TabContent                                  │
│      │  (열린 탭 전체 마운트, display:none 토글)     │
└──────┴──────────────────────────────────────────────┘
  + FlyoutPanel (280px, 아이콘 레일 위 오버레이)
```

### 핵심 원칙: Tab-driven SPA

- **React Router** 는 `/app/:tabKey?` 경로 히스토리 동기화 전용
- **tabStore** 가 실제 콘텐츠 제어
- 열린 탭은 모두 동시 마운트 → `display: block/none` 토글로 상태 보존 (폼 입력, 스크롤 등 유지)

---

## 데이터 흐름

```
IconRail 클릭
  → menuStore.toggleFlyout()
  → FlyoutPanel 표시

FlyoutPanel 리프 메뉴 클릭
  → tabStore.openTab(menuItem)
  → menuStore.closeFlyout()
  → router.navigate(`/app/${tabKey}`)

브라우저 뒤로/앞으로
  → popstate 감지
  → tabStore.setActiveTab(tabKey from URL)
  → IconRail activeKey 동기화 (useTabRouteSync)
```

---

## 상태 관리 (Zustand Stores)

| 스토어 | 역할 | persist |
|--------|------|---------|
| `authStore` | 인증 (accessToken 메모리, user 정보) | 부분 (user, roles) |
| `tabStore` | 탭 목록, 활성 탭 | ✅ (localStorage) |
| `menuStore` | 레일/플라이아웃 상태, 서버 메뉴 | ❌ |
| `projectStore` | 활성 프로젝트, 내 프로젝트 목록 | ✅ |
| `themeStore` | 라이트/다크 모드 | ✅ |
| `localeStore` | 언어 설정 (ko/en/vi) | ✅ |
| `labelStore` | i18n 라벨 캐시 | ❌ |
| `comcdStore` | 공통코드 캐시 | ❌ |
| `settingsStore` | 홈 메뉴 키 등 개인 설정 | ✅ |

---

## 컴포넌트 레지스트리 자동 발견

```tsx
// src/config/componentRegistry.tsx
import.meta.glob('../features/*/pages/*.tsx')
```

- `src/features/{도메인}/pages/{ComponentName}/index.tsx` 파일명(PascalCase)이 곧 `componentPath`
- 수동 등록 불필요
- `overrides` 맵: 서버 scrId ≠ 로컬 폴더명일 때만 매핑

---

## 인증 흐름

```
POST /auth/login
  → AccessToken (응답 body, Bearer)
  → RefreshToken (httpOnly 쿠키 refresh_token)

자동 갱신 (Silent Refresh)
  → 401 응답 감지
  → 큐에 실패 요청 저장
  → POST /auth/refresh
  → 새 AccessToken 메모리 저장
  → 큐 재시도

로그아웃
  → POST /auth/logout
  → 메모리 토큰 삭제
  → 탭 초기화 → 로그인 페이지
```

---

## 폴더 구조

```
src/
├── components/          # 공유 컴포넌트
│   ├── auth/            # AuthGuard
│   ├── common/          # CodeSnippet, PlaceholderPage
│   ├── editors/         # RichTextEditor, CodeEditor, SpreadSheet
│   ├── gantt/           # GanttView, ganttTypes
│   ├── grid/            # GridTable, GridPanel, cellEditors/*
│   ├── icons/           # CustomIcons
│   ├── inputs/          # ComcdSelect, SearchSelectField
│   ├── layout/          # ContentHeader, FilterPanel, GridToolbar, FormPanel, ...
│   └── tabs/            # TabBar, TabContent, TabContextMenu
├── config/
│   ├── menuConfig.ts    # 메뉴 트리 (하드코딩 + 서버 동적 로드)
│   └── componentRegistry.tsx
├── features/            # 도메인별 페이지
│   ├── auth/
│   ├── cco/
│   ├── dashboard/
│   └── dev/             # 개발도구, 가이드, 데모
├── hooks/               # useApiQuery, useApiMutation, useMenuPermission, ...
├── lib/api/             # Axios 클라이언트, 인터셉터, 타입
├── mock/                # 로컬 목데이터
├── stores/              # Zustand 스토어 9개
├── styles/              # global.css, variables.css
└── types/               # MenuItem, Tab, 공통 타입
```

---

## 빌드 / 실행

```bash
npm run dev          # Vite 개발 서버 (포트 5173)
npm run build        # tsc -b && vite build → dist/
npx tsc --noEmit     # 타입 체크만
```

**환경 변수** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:8180
```
