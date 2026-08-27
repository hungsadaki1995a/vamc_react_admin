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
import.meta.glob('../features/*/*/index.tsx')   // 업무 화면
import.meta.glob('../dev/pages/*/index.tsx')    // 데모/가이드/샘플 (DEV_TOOLS_ENABLED 일 때만)
```

- `src/features/{도메인}/{화면ID}/index.tsx` 의 **폴더명**이 곧 `componentPath`
  (= `MENU_MNG.MENU_URL_ADDR` = 탭의 `componentKey` = 라벨 키의 `sceId`)
- 글롭이 2단계 고정이라 **팝업을 부모 화면의 자식 폴더**에 두면 레지스트리에 등록되지 않는다
- 수동 등록 불필요. `overrides` 맵은 예외 수단 — 원칙은 DB 의 URL 을 폴더명에 맞추는 것이다

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
├── api/                 # 서버 API 호출 — 도메인 패키지로 구분
│   ├── common/          # code.ts, menu.ts, lbl.ts — 전역 부트스트랩
│   └── sys/             # usr.ts, org.ts, sce.ts, proj.ts — 시스템 운영 관리
├── features/            # 업무 화면 (도메인 / 화면ID)
│   ├── admin/
│   ├── auth/
│   ├── cco/
│   └── dashboard/
├── dev/pages/           # 개발도구·가이드·데모·이관 샘플 (운영 번들 제외)
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
npm install
npm run dev          # Vite 개발 서버 (포트 3000, strictPort)
npm run build        # tsc -b && vite build → dist/
npm run lint         # ESLint
npx tsc --noEmit     # 타입 체크만
```

**환경 변수** — `cp .env.example .env.local` 후 값을 확인한다.
```
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_DEV_TOOLS=false
```

> 포트는 `vite.config.ts`에 `strictPort: true`로 고정돼 있어, 3000이 사용 중이면
> 다른 포트로 넘어가지 않고 **기동이 실패한다.**
>
> `VITE_API_BASE_URL`을 **빈 값**으로 두면 상대경로 `/api`로 호출하고, Vite dev 프록시가
> `http://127.0.0.1:8080`(사용자/관리자 백엔드)으로 전달한다. 배포에서는 nginx가 프록시한다.
>
> ⚠️ 백엔드(`vamc-npl-admin-backend`)를 `local` 프로파일로 함께 띄워야 로그인이 된다.
