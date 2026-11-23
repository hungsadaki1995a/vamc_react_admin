---
trigger: always_on
---

# Source Code Naming Conventions

Follow these naming conventions for all source code in this project. They describe the code as it is now — when in doubt, copy `src/features/system/fee-management/` and `src/api/system/fee-api.ts`.

## Files and folders

| Item | Convention | Example |
| :--- | :--- | :--- |
| Folder names | `kebab-case` | `fee-management/`, `content-tabs/` |
| Feature screen folder | `src/features/<domain>/<screen>/` — `kebab-case`, usually `<thing>-management` | `features/system/fee-management/` |
| Shared code of one domain | `_shared/` inside the domain | `features/system/_shared/` |
| React component files | `PascalCase.tsx` | `FeeModal.tsx`, `SysListUi.tsx` |
| Screen entry | `index.tsx` (default-exports the screen) | `fee-management/index.tsx` |
| Hook files | `use-kebab-case.ts` | `use-fees.ts`, `use-paged-list.ts` |
| API files | `src/api/<domain>/<resource>-api.ts` | `api/system/fee-api.ts` |
| Zustand stores | `src/stores/<name>-store.ts` | `auth-store.ts`, `tab-store.ts` |
| React contexts | `<name>-context.tsx` | `tab-context.tsx`, `page-header-slot-context.tsx` |
| Constants of a feature | `<feature>-constants.ts` / `sys-constants.ts` | `fee-constants.ts` |
| Types local to a feature | `<feature>.types.ts` | `member.types.ts` |
| Shared types | `src/types/<kebab-case>.ts` | `types/action-button.ts` |
| Utilities | `kebab-case.ts` | `menu-tree-utils.ts`, `system-utils.ts` |
| Stylesheets | `<kebab-case>.module.scss` next to the component | `fee-management.module.scss` |

Domain folders under `src/api/` and `src/features/` should match where possible (`system`, `contents`/`content`, `npl`, `trade`, `auction`, `member`, `auth`).

## Identifiers

| Item | Convention | Example |
| :--- | :--- | :--- |
| React components | `PascalCase` | `FeeModal`, `SysFilterPanel` |
| Component props type | `<Component>Props` | `PopupProps`, `StatusBadgeProps` |
| Hooks | `useCamelCase` | `useFees()`, `useSaveFee()`, `useSysDialogs()` |
| Store hooks | `use<Name>Store` | `useAuthStore`, `useLabelStore` |
| API functions | verb + resource, `camelCase` | `getFees`, `getFee`, `createFee`, `updateFee`, `deleteFees`, `downloadFeeExcel` |
| Functions and variables | `camelCase` | `toSearch`, `feeValueText` |
| Types and interfaces | `PascalCase`, no `I` prefix | `Fee`, `FeeSearch`, `FeeRequest`, `PageResponse<T>` |
| API types | `<Resource>` (row), `<Resource>Search` (filter), `<Resource>Request` (body) | `Fee`, `FeeSearch`, `FeeRequest` |
| Code-value unions | `PascalCase` string-literal union | `type YesNo = 'Y' \| 'N'` |
| Constants | `UPPER_SNAKE_CASE` | `SYS_PAGE_SIZE`, `INITIAL_FILTER`, `EMPTY_PAGE` |
| Query-key factory | `<RESOURCE>_KEYS` with `all` / `list(...)` / `detail(...)` | `FEE_KEYS.list(search, query)` |
| CSS Module classes | `camelCase` (accessed as `styles.xxx`) | `.numberCell`, `.rangePicker` |
| CSS custom properties | `--kebab-case` | `--form-cols`, `--color-text-secondary` |
| Unused params/vars | prefix `_` (ESLint allows it) | `(_: unknown, row) => …` |

Server field names (`crtDt`, `useYn`, `mdfcnBy`, …) are kept as the backend sends them — do not rename DTO fields on the client.
