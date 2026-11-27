# VAMC NPL Admin — Architecture

Coding rules live in `.agents/rules/` (`coding-convention.md`, `naming-convention.md`, `styling-convention.md`). This document describes how the app is put together.

## Tech stack

| Area | Library | Version (package.json) |
|------|---------|------------------------|
| UI | React | 19.2 |
| Language | TypeScript (strict) | 5.9 |
| Build | Vite + `@vitejs/plugin-react` | 7.3 |
| UI kit | Ant Design | 6.3 |
| Client state | Zustand | 5 |
| Server state | TanStack React Query | 5 |
| HTTP | Axios | 1.18 |
| Routing | React Router | 7 |
| Grid (editable / large) | AG Grid Community + `ag-grid-react` | 35 |
| Styling | SCSS Modules + Tailwind CSS v4 (`@tailwindcss/vite`) | 4.3 |
| i18n | DB labels (`label-store`) + `react-i18next` for auth pages | i18next 27 |
| Dates | dayjs | 1.11 |
| API client generation | `@hey-api/openapi-ts` → `src/api/generated` | 0.99 |
| Package manager | pnpm (pinned by `packageManager`) | 11 |

`xlsx`, `@tiptap/*`, `chart.js`, `@monaco-editor/react` are still in `package.json` but are not imported anywhere in `src/` today.

---

## Layout

```
┌──────────────────────────────────────────────────────────┐
│ Header  (logo, language selector, user, logout)          │
├──────┬───────────────────────────────────────────────────┤
│ Icon │ TabBar   (open tabs, context menu)                │
│ Rail ├───────────────────────────────────────────────────┤
│      │ TabContent                                         │
│      │ (all open tabs stay mounted, hidden with display)  │
└──────┴───────────────────────────────────────────────────┘
  + FlyoutPanel (menu tree next to the rail) + sidebar toggle
```

`src/app/AppLayout.tsx` renders `Header`, `IconRail`, `FlyoutPanel`, `TabBar`, `TabContent`.

### Tab-driven SPA

- `tab-store` owns the content: which tabs are open (max 20) and which one is active. Tabs are persisted (`vamc-tabs`).
- Every open tab stays mounted; switching only toggles visibility, so form input and scroll position survive.
- React Router keeps the URL in sync only. `src/app/route-constants.ts` maps fixed paths to menu codes (`ROUTE_MENU_CODES`); `useTabRouteSync()` syncs URL ↔ active tab and handles back/forward.
- Closing a tab aborts that tab's in-flight requests (`lib/api/tab-request-registry.ts`).

---

## Boot and data flow

```
main.tsx → <QueryClientProvider> → App.tsx
  App
    useRestoreSession()      restore token / user from storage
    useAppSync()             on locale change: dayjs + <html lang> + i18next,
                             reload common codes, menus (if logged in), labels
    <ConfigProvider theme={APP_THEME} locale={antLocale}>
      <AntApp>
        GlobalLoadingSpinner   driven by loading-store (top bar for reads, overlay for writes)
        ApiNotifyBridge        wires axios interceptor toasts to antd message
        AppRoutes              /login, /find-id, /find-password, private routes → AuthGuard → AppLayout
```

Menu click flow:

```
IconRail click        → menuStore.toggleFlyout(railKey)
Flyout leaf click     → tabStore.openTab(menuItem) → URL updated by useTabRouteSync
TabContent            → componentRegistry[tab.componentKey] (lazy) inside <TabContext>
```

---

## Stores (Zustand, `src/stores/`)

| Store | Role | Persisted (key) |
|-------|------|-----------------|
| `auth-store` | access token, `isAuthenticated`, user, roles | ✅ `vamc-auth` (token also in localStorage/cookie via `utils/token-storage.ts`) |
| `tab-store` | open tabs, active tab | ✅ `vamc-tabs` |
| `menu-store` | rail/flyout state, server menu tree, `serverMenus` | ✅ `vamc-menu-trees` (partial) |
| `project-store` | active project (sent as `X-Project-Id`) | ✅ `vamc-project` |
| `locale-store` | `'en' \| 'vn'` (default `en`) | ✅ `vamc-locale` (localStorage + cookie) |
| `label-store` | DB label map + `t()` | IndexedDB cache, 5 min TTL |
| `common-code-store` | all common codes + `getOptions` / `getCodeName` | IndexedDB cache, 5 min TTL |
| `settings-store` | personal settings (home menu key) | ✅ `vamc-settings` |
| `loading-store` | request counters: `background` (reads → top bar), `blocking` (writes / downloads → overlay) | ❌ |

Stores hold app-wide client state only. Business data from the server goes through React Query hooks, not stores.

---

## Screen registry

`src/config/component-registry.tsx`:

```ts
import.meta.glob('../features/*/*/index.tsx')
```

- `src/features/<domain>/<screen>/index.tsx` is registered under the folder name and its variants (`fee-management`, `FeeManagement`, `FEE-MANAGEMENT`, `FEEMANAGEMENT`).
- The tab's `componentKey` comes from the menu (`menuUrlAddr` / `resolveMenuComponent` in `config/menu-component-fallback.ts`).
- The glob is fixed at depth 2, so modals and sub-components in the screen folder are never registered.
- `overrides` maps server screen IDs (`SYS020103SC`, …) to folders when the DB menu URL cannot match the folder name.

---

## Authentication

```
GET  /api/auth/public-key   RSA public key; the password is encrypted client-side (lib/crypto.ts)
POST /api/auth/login        → accessToken (body) + refresh token (httpOnly cookie)
401 on any call             → queue requests → POST /api/auth/refresh → retry queue
refresh fails               → clear tokens, auth-store.logout(), redirect to /login
POST /api/auth/logout       → useLogout() also clears tabs and menus
```

Details: `docs/api-integration.md`.

---

## Folder structure

```
src/
├── app/            App, AppLayout, AppRoutes, route-constants
├── api/            HTTP layer — one file per resource
│   ├── common/     api-utils (helpers), auth, menus, labels, common codes
│   ├── system/     System Operation Management (fee, form, batch, label, menu, role, …)
│   ├── contents/   Content Management (post, faq, inquiry, banner, site display)
│   ├── npl/ trade/ auction/
│   ├── generated/  OpenAPI SDK — generated, never edited
│   └── swagger.ts  OpenAPI types (openapi-typescript)
├── assets/images/  SVG/PNG icons by group
├── components/     shared UI
│   ├── auth/       AuthGuard, AuthHeader
│   ├── common/     ActionButton, Popup, DataTable, Pagination, StatusBadge, … (barrel index.ts)
│   ├── grid/       GridTable, GridPanel (AG Grid)
│   ├── icons/      CustomIcons
│   ├── inputs/     AppSelect, TextInput, AppDatePicker, … (barrel index.ts)
│   ├── layout/     Header, IconRail, FlyoutPanel, FilterPanel, FormPanel, GridToolbar, PageHeader, SplitPanel
│   └── tabs/       TabBar, TabContent, TabContextMenu
├── config/         component-registry, menu-config, menu-component-fallback, theme-config
├── contexts/       tab-context (current tab for useScreenLabel)
├── features/       business screens: <domain>/<screen>/index.tsx (+ _shared/ per domain)
│   ├── auth/ member/ npl/ trade/ auction/ content/ system/ dashboard/
├── hooks/          use-api-query, use-api-action, use-notify, use-menu-permission, use-screen-label, …
├── lib/
│   ├── api/        axios client + interceptors, ApiError, queryClient, apiNotify, types
│   ├── cache/      IndexedDB cache (labels, codes)
│   └── i18n/       i18next setup + locales/{en,vn}.json
├── stores/         Zustand stores
├── styles/         global.scss, variables.scss, date-picker.scss, tailwind.css, colors.css, semantic-colors.css, typography.css
├── types/          shared types (menu, tab, grid, inputs, component props)
└── utils/          jwt, token/locale storage, menu utils
```

---

## Build and run

```bash
corepack enable          # pnpm version comes from package.json "packageManager"
pnpm install
pnpm dev                 # Vite dev server on :3000 (strictPort — fails if 3000 is taken)
pnpm build               # tsc -b && vite build → dist/
pnpm lint                # ESLint (src/api/generated is ignored)
npx tsc -b               # type check only (--noEmit is a no-op: tsconfig.json is a solution file)
pnpm api:generate        # regenerate src/api/generated + src/api/swagger.ts from the backend OpenAPI
```

Environment — `cp .env.example .env.local`:

```
VITE_API_BASE_URL=                       # empty → relative /api through the Vite proxy (nginx in production)
VITE_API_PROXY_TARGET=http://localhost:7200   # proxy target when the base URL is empty (default 127.0.0.1:8080)
VITE_SWAGGER_URL=http://localhost:8080/v3/api-docs
```

The admin backend (`vamc-npl-admin-backend`) must be running for login to work. Production serves `dist/` with nginx (`nginx.conf`, `Dockerfile`), which also proxies `/api/`.
