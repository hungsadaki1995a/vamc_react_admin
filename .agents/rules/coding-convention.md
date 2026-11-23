---
trigger: always_on
---

# Coding Conventions

Follow these conventions across the project (React 19 + TypeScript strict + Vite, Ant Design 6, TanStack Query 5, Zustand 5). Naming is in `naming-convention.md`, styling in `styling-convention.md`.

Reference implementation: `src/features/system/fee-management/` + `src/api/system/fee-api.ts`. Copy it when adding a screen.

## 1. Layering — screen → data hook → API file

```
src/features/<domain>/<screen>/index.tsx     screen (UI + local UI state only)
src/features/<domain>/<screen>/use-<x>.ts    data hooks (TanStack Query)
src/api/<domain>/<resource>-api.ts           HTTP calls + request/response types
```

- **Components never call the API or the HTTP client directly** — no `apiClient`, no `@/api/...` function calls, no `useEffect` + fetch + manual `isLoading`. They use data hooks.
- **Components do not call `useQuery` / `useMutation` directly** either; that lives in the feature's `use-<x>.ts`.
- Screens are auto-registered by `src/config/component-registry.tsx` (glob `features/*/*/index.tsx`, key = folder name). Only screens opened from a menu sit at depth 2; popups and sub-components live as sibling files (`FeeModal.tsx`) in the screen folder. Use the `overrides` map only when the DB menu URL cannot match the folder name.

## 2. API files (`src/api/<domain>/<resource>-api.ts`)

- Use the helpers from `@/api/common/api-utils`: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `apiDownload`, `cleanParams`. They normalise the backend body `{ status, message, data }` into `ApiResponse<T>` (`success = status === 200`).
- Declare request/response types in the same file, mirroring the backend DTO (keep server field names). Document code values and formats with short JSDoc (`/** dd/MM/yyyy, inclusive. */`).
- API functions are exported arrow constants (`export const getFee = (feeId: string) => apiGet<Fee>(\`${BASE}/${encodeURIComponent(feeId)}\`);`) over a module `const BASE = '/api/...'`. Server error codes the UI reacts to go in `<RESOURCE>_ERRORS`.
- Paged lists take `(search: XxxSearch, query: PageQuery)` and return `ApiResponse<PageResponse<Xxx>>` (page is 1-based).
- Start the file with a one-line comment naming the controller / base path / screen IDs, e.g. `// Fee Management API — FeeController (/api/v1/platform/fees), screens VPA09010301 / VPA090103P01.`
- The generated SDK (`src/api/generated`, `pnpm api:generate`) is never edited by hand. If you use it, wrap/re-export it from an `src/api/<domain>/*-api.ts` file (see `faq-api.ts`) — features do not import `@/api/generated` directly.

## 3. Data hooks (`use-<x>.ts` in the feature folder)

- Queries: `useApiQuery<T>(key, fn, options)` from `@/hooks/use-api-query`. Lists use `placeholderData: keepPreviousData`; detail queries use `enabled` to skip when there is no id.
- Writes: `useApiAction(fn, { invalidate: [XXX_KEYS.all] })` from `@/hooks/use-api-action` (resolves the whole `ApiResponse`, rejects with `ApiError`). Use `useApiTask` for calls that return no `ApiResponse` (uploads) and `useApiDownload` for file downloads (shows its own error toast). `useApiMutation` is legacy — prefer `useApiAction`.
- Define one query-key factory per resource, scoped by domain:
  ```ts
  const FEE_KEYS = {
    all: ['system', 'fees'] as const,
    list: (search: FeeSearch, query: PageQuery) => ['system', 'fees', 'list', search, query] as const,
    detail: (feeId: string | null) => ['system', 'fees', 'detail', feeId] as const,
  };
  ```
- One hook per use case, named after it: `useFees`, `useFee`, `useSaveFee`, `useDeleteFee`, `useDownloadFeeExcel`. A register/edit pair can share one hook (`feeId === null` → create).

## 4. Components

- Function components only; screens and components use `export default function Name()`. Shared folders expose a barrel (`components/common/index.ts`, `components/inputs/index.ts`) that also re-exports the props types.
- Props: `interface XxxProps`, destructured in the signature. No `React.FC`, no `import React`.
- Reuse existing building blocks before writing new ones:
  - list screens in `system`: `SysPage`, `SysTitleBar`, `SysFilterPanel`/`SysFilterItem`, `SysTable`, `SysPager`, … from `features/system/_shared/SysListUi.tsx` and `SysFormUi.tsx`;
  - list screens in other domains (member, content, npl, trade, auction): `SysPageHeader` + `SysPagination` from `@/features/system/_shared/SystemUi` with `DataTable` / `Popup`, plus the domain's `_shared/` boards (`PostBoard`, `TradeApplicationBoard`, …);
  - inputs: `AppSelect`, `TextInput`, `AppDatePicker`/`AppRangePicker`, `AppCheckbox`, `AppRadio`, `AppSwitch`, `Spinbox`, `TextArea`, `CommonCodeSelect` from `@/components/inputs`;
  - common UI: `Popup`, `DataTable`, `Pagination`, `StatusBadge`, `ActionButton`, `FileUploadBox`, `TreeView`, … from `@/components/common`.
- Keep pure helpers (`toSearch(filter)`, column definitions, option lists) at module level outside the component; static `columns` arrays are module constants.
- List-screen state goes through `usePagedList(INITIAL_FILTER)` (`draft` for inputs, `applied` for the query, `pageQuery` for paging/sort).
- Modal state as a discriminated value, e.g. `type ModalState = { feeId: string | null } | null` (closed / register / edit).

## 5. Feedback, errors, permissions

- Toasts and dialogs go through `useNotify()` (`toast.*`, `dialog.*`). In `system` screens use `useSysDialogs()` (`confirm`, `ask`, `alert`) and the texts in `sys-messages.ts` (`SYS_MESSAGES`).
- Inline field errors in forms: `useFieldErrors<FieldKey>()` → `checkRequired`, `setError`, `clearError`, `applyApiError(error, { CODE: [field, message] })`.
- Writes: `try { await x.mutateAsync(v); toast.success(...) } catch (error) { if (!applyApiError(error, …)) toast.error(errorMessage(error)); }`. Never swallow an error silently.
- Write actions are gated with `const { canWrite } = useMenuPermission();` — hide or disable the buttons when `!canWrite`.

## 6. Labels / i18n

- Shared components read DB labels through `useComponentLabel()` / `useScreenLabel(sceId)` (`tvt`, `tvb`, …) with an English fallback.
- Auth pages (outside the admin shell) use `react-i18next` (`useTranslation`) with `src/lib/i18n/locales/{en,vn}.json`.
- Admin business screens currently use the English texts of the screen design; keep them in constants (`sys-messages.ts`, `*-constants.ts`) rather than scattering literals when the same text is reused.

## 7. TypeScript and general

- `strict` is on, plus `noUnusedLocals` / `noUnusedParameters` / `verbatimModuleSyntax`: use `import type { … }` for type-only imports. No `any`; narrow `unknown` instead.
- Import across top-level folders with the `@/` alias (`@/hooks/...`, `@/api/...`); use relative paths only inside a feature/domain (`./use-fees`, `../_shared/...`).
- Import order: external packages → `@/…` → relative → stylesheet last.
- No `console.*` in committed code.
- Comments and JSDoc in English, short, explaining *why* or the spec reference (screen ID, message code). Do not narrate the code.
- Before finishing: `npx tsc -b` (not `--noEmit`, `tsconfig.json` is a solution file) and `pnpm lint` must pass with no errors.

## Known deviations (do not copy)

- `features/member/member-list/` (`use-members.ts`, `NewMemberModal.tsx`, `MemberDetailModal.tsx`) calls `useQuery`/`useMutation` and the generated SDK directly from components.
- `features/auth/*` uses `hooks/` and `components/` sub-folders and `index.module.scss`; new admin screens keep files flat in the screen folder.
- `component-registry.tsx` `overrides` contains several aliases for the same screen; add new entries only when the menu URL cannot be aligned.
