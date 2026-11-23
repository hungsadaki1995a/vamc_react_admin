# VAMC NPL Admin — Internal Reference

Quick lookup of shared hooks, stores, utils and `lib/`. How-to guides: `development-guide.md`, `api-integration.md`, `i18n-and-permissions.md`.

## Hooks (`src/hooks/`)

### Data

| Hook | Signature | Notes |
|------|-----------|-------|
| `useApiQuery` | `useApiQuery<T>(queryKey, queryFn: () => Promise<ApiResponse<T>>, options?)` → `UseQueryResult<T, ApiError>` | throws `ApiError` when `success` is false or `data` is null |
| `useApiAction` | `useApiAction(fn, { invalidate?: QueryKey[] })` → mutation resolving `ApiResponse<T>` | default for writes; refetch failures never fail the write |
| `useApiTask` | `useApiTask(fn, { invalidate? })` → mutation resolving `fn`'s result | uploads, non-`ApiResponse` calls |
| `useApiDownload` | `useApiDownload(fn)` → mutation `void` | shows an error toast itself |
| `useApiMutation` | `useApiMutation(fn, { successMessage?, …useMutationOptions })` | legacy |
| `useCommonCodes` | `useCommonCodes(groupCd \| null)` → `{ label, value }[]` | `GET /api/common/codes/{groupCd}`, 5 min stale |

### UI / app

| Hook | Returns | Notes |
|------|---------|-------|
| `useNotify()` | `{ toast, notify, dialog }` | `toast` = antd `message`; `notify.*` = notification with label title; `dialog.confirm/info/warning/error` with label OK/Cancel |
| `useMenuPermission()` | `{ permType, canRead, canWrite }` | from the active tab's server menu; constants `AUTHRT_READ/WRITE/ALL` |
| `useScreenLabel(sceId?)` | `{ t, tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme, labels, sceId }` | `sceId` from `TabContext` |
| `useComponentLabel()` | same, with `sceId = 'COMPONENT'` | shared components |
| `useTotalCountLabel()` | `{ template, format(count) }` | "Total {0} items" from `COMPONENT.VIEW.TEXT_gridTotal` |
| `useLogout()` | `() => void` | confirm dialog → `POST /api/auth/logout` → clear auth, project, tabs, menus → `/login` |
| `useAllMenus()` | `MenuItem[]` | server + static menus, localised — single source for tab titles, breadcrumb, flyout |
| `useTabRouteSync()` | — | URL ↔ active tab, back/forward (mounted in `AppLayout`) |
| `useRestoreSession()` | — | restore session on boot (mounted in `App`) |
| `useAppSync()` | `{ antLocale }` | locale side effects + reload codes/menus/labels (mounted in `App`) |

### System Operation (`features/system/_shared/`)

| Hook | Purpose |
|------|---------|
| `usePagedList<F>(initialFilter, { pageSize?, defaultSort? })` | `{ draft, applied, page, sort, pageQuery, setDraft, search, reset, setPage, setSort }` |
| `useFieldErrors<K>()` | `{ errors, hasErrors, setError, clearError, clearAll, checkRequired, applyApiError }` |
| `useSysDialogs()` | `{ confirm, ask, alert, guardDiscard }` with v0.8 button texts |
| `useMenuSettings`, `useMenuPermissions` | data hooks of the menu settings / menu permission screens |

---

## Stores (`src/stores/`)

All are Zustand hooks: `useXxxStore((s) => s.field)`; outside React use `useXxxStore.getState()`.

| Store | State | Actions |
|-------|-------|---------|
| `useAuthStore` | `accessToken`, `isAuthenticated`, `isLoading`, `user`, `roles` | `setAuth(token, me)`, `setAccessToken`, `logout`, `setLoading`, `hasRole(role)` |
| `useTabStore` | `tabs`, `activeTabKey`, `maxTabs` (20) | `openTab(menuItem, params?)`, `closeTab`, `closeOtherTabs`, `closeRightTabs`, `closeAllTabs`, `setActiveTab`, `pinTab`, `unpinTab`, `reorderTabs`, `resetTabs` |
| `useMenuStore` | `activeRailKey`, `flyoutVisible`, `openKeys`, `selectedKey`, `menuTrees`, `serverMenus`, `menuLoading` | `toggleFlyout(railKey)`, `closeFlyout`, `toggleSidebar`, `loadMenuForProject`, `invalidateMenuCache`, `clearServerMenus`, `resetNavState`, … |
| `useProjectStore` | `activeProject: { id, name, status } \| null` | `setActiveProject`, `clearProjects` |
| `useLocaleStore` | `locale: 'en' \| 'vn'` | `setLocale` |
| `useLabelStore` | `labels`, `labelsVersion` | `t(key, default?)`, `tmc/tmi/tme(code)`, `loadLabels(force?)`, `invalidateLabelCache()` |
| `useComcdStore` | `codes`, `loading` | `loadCodes`, `getOptions(cdDmnId)`, `getCodeName(cdDmnId, cd)` |
| `useSettingsStore` | `homeMenuKey` | `setHomeMenuKey` |
| `useLoadingStore` | request counter | `increment`, `decrement` (used by the axios interceptor) |

Persistence keys and caches: see `architecture.md` → Stores.

`Tab` (`types/tab.ts`): `key`, `menuKey`, `title`, `componentKey`, `sceId?`, `labelKey?`, `params?`, `pinned`, `closable`.

---

## Contexts

| Context | Use |
|---------|-----|
| `TabContext` / `useTabContext()` (`contexts/tab-context.tsx`) | `{ tab }` of the screen being rendered; `null` outside `TabContent`. Read `tab.params` for parameters passed to `openTab`. |
| `PageHeaderSlotContext` / `usePageHeaderSlot(slot)` (`components/layout/page-header-slot-context.tsx`) | let a screen push actions / inline filters into `PageHeader` |

---

## Utils (`src/utils/`)

| File | Exports |
|------|---------|
| `menu-utils.ts` | `findMenuByKey(items, key)`, `findMenuByComponentPath`, `findTopLevelMenuKey`, `getMenuParentKeys`, `getMenuBreadcrumb`, `buildAntMenuItems` |
| `menu-tree-utils.ts` | `MENU_ICON_BY_CODE`, `getTopLevelMenuItems`, `getMenuIconByCode`, `findMenuTreeByCode`, `mapMenuTreesToMenuItems` |
| `locale-storage.ts` | `LocaleKey`, `DEFAULT_LOCALE`, `SUPPORTED_LOCALES`, `LOCALE_OPTIONS`, `normalizeLocale`, `toIsoLangTag`, `getInitialLocale`, cookie helpers |
| `token-storage.ts` | `getAccessToken`, `setAccessToken`, `getRefreshToken`, `clearTokens` (localStorage + cookie) |
| `jwt-utils.ts` | `parseJwt`, `isTokenExpired`, `getTokenExp`, `jwtToMeResponse` |

`features/system/_shared/system-utils.ts`: `errorMessage(error, fallback?)`, `apiErrorCode`, `apiValidationErrors`, `formatAmount`, `formatSysDateTime`, `splitDateTime`, `rowNumber`, `toUseYnFilter`, `lastDaysRange`.

---

## Config (`src/config/`)

| File | Content |
|------|---------|
| `component-registry.tsx` | `componentRegistry` — auto glob of `features/*/*/index.tsx` + `overrides` |
| `menu-config.ts` | static menus (not from the server) |
| `menu-component-fallback.ts` | `resolveMenuComponent(menuCd, menuUrlAddr)` — menu → screen folder when the URL is missing |
| `theme-config.ts` | `APP_THEME` — antd theme tokens |

`src/app/route-constants.ts`: `PUBLIC_ROUTES`, `ROUTE_MENU_CODES`, `PRIVATE_ROUTES`, `getRouteByMenuCode(code)`.

---

## lib

| Module | Exports |
|--------|---------|
| `lib/api/client.ts` | `apiClient` (axios + interceptors); axios config flag `skipErrorToast` |
| `lib/api/error.ts` | `ApiError` (`code`, `errorCode`, `errorArgs`, `validation`, `statusCode`, `userMessage`, `isUnauthorized/isForbidden/isNotFound/isServerError`, `ApiError.from`, `ApiError.fromAxiosError`) |
| `lib/api/types.ts` | `ApiResponse<T>`, `ApiErrorResponse`, auth DTOs (`UserInfo`, `LoginRequest`, `MeResponse`, …) |
| `lib/api/query-client.ts` | `queryClient` (stale 0 dev / 5 min prod, 1 retry except 401/403/404, no focus refetch) |
| `lib/api/api-notify.ts` | `apiNotify.setHandler(fn)`, `apiNotify.error/warning/…(msg)` — toasts from outside React |
| `lib/api/tab-request-registry.ts` | `registerTabRequest`, `unregisterTabRequest`, `abortTabRequests(tabKey)` |
| `lib/cache/idb-cache.ts` | `idbGet`, `idbSet`, `idbDelete` — IndexedDB cache with timestamp |
| `lib/i18n/` | i18next instance, `formatLabel(template, ...values)` (`{0}`, `{1}` placeholders) |
| `lib/crypto.ts` | `encryptPassword` (RSA-OAEP) for login, `sha512` |
| `api/common/api-utils.ts` | `apiGet/Post/Put/Patch/Delete`, `apiDownload`, `cleanParams`, `PageResponse`, `PageQuery`, `SortDirection`, `EMPTY_PAGE` |
