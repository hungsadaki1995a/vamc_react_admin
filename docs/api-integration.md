# VAMC NPL Admin — API Integration

Layering rule (see `.agents/rules/coding-convention.md`): **screen → data hook (`use-<x>.ts`) → API file (`src/api/<domain>/<resource>-api.ts`) → `apiClient`.** Components never call the API directly.

## 1. HTTP client (`src/lib/api/client.ts`)

One axios instance, `apiClient`:

```
baseURL          VITE_API_BASE_URL (trailing slash removed; empty → relative /api via proxy)
timeout          30 000 ms
withCredentials  true   (refresh-token cookie)
headers          Content-Type / Accept: application/json
```

### Request interceptor

| Header | Value | When |
|--------|-------|------|
| `Authorization` | `Bearer <accessToken>` | logged in |
| `X-Project-Id` | `project-store.activeProject.id` | a project is selected |
| `X-Lang` | `en` / `vn` | always |
| `Accept-Language` | ISO tag of the locale | always |
| `X-Menu-Cd` | active tab key, if it is a 9-char menu code | for audit log `MENU_CD` |

Also: removes `Content-Type` for `FormData`, increments `loading-store` (reads → top progress bar only; writes and blob downloads → full-screen spinner; override per request with `blockUi: true | false`), and binds the request to the active tab so closing the tab aborts it (except auth/menu/label/code calls).

### Response interceptor

| Case | Behaviour |
|------|-----------|
| canceled (tab closed) | rejected silently |
| no response (network) | toast `MESSAGE.ERROR.TEXT_NETWORK` → reject `ApiError` |
| 401 on `/api/auth/login` | reject (no refresh) |
| 401 elsewhere | silent refresh (see §6) |
| 403 | toast `apiErr.userMessage` → reject |
| ≥ 500 | toast `apiErr.userMessage` → reject |
| other 4xx | reject `ApiError` (the screen handles it) |

Pass `{ skipErrorToast: true }` in the axios config to suppress the interceptor toast.

Toasts go through `apiNotify` (`lib/api/api-notify.ts`), wired to antd `message` by `ApiNotifyBridge` in `App.tsx`.

---

## 2. Response format

The admin backend returns `{ status, message, data }` (no `success`; `data` omitted when null). The frontend type is:

```ts
// src/lib/api/types.ts
interface ApiResponse<T = unknown> {
  status?: number;
  success: boolean;      // filled by api-utils: status === 200
  message: string;
  data: T | null | undefined;
}
```

Paged lists return `PageResponse<T>` (`src/api/common/api-utils.ts`):

```ts
interface PageResponse<T> { content: T[]; page: number /* 1-based */; size: number; totalElements: number; totalPages: number; }
interface PageQuery { page: number; size: number; sortBy?: string; sortDirection?: 'ASC' | 'DESC'; }
```

---

## 3. Writing an API file

Use the helpers in `@/api/common/api-utils` — they normalise every body into `ApiResponse<T>`:

| Helper | Use |
|--------|-----|
| `apiGet<T>(url, params?, fallback?)` | GET; params pass through `cleanParams` (drops `''`, `null`, `undefined`) |
| `apiPost<T>(url, body?)` / `apiPut` / `apiPatch` / `apiDelete` | writes |
| `apiDownload(url, fileName, params?)` | blob download (Excel, attachment) and save |
| `openAttachment(url)` (`@/api/common/attachment-api`) | opens a backend `previewUrl` / `downloadUrl` in a new tab through the authenticated client. Never `window.open(url)` or `<a href>` an attachment URL: the attachment API needs the bearer token (401). Use the URLs the backend returns instead of building `/api/v1/attachments/...` by hand |
| `cleanParams(obj)` | strip empty filters yourself when needed |
| `EMPTY_PAGE` | empty `PageResponse` placeholder |

```ts
// src/api/system/fee-api.ts
import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Fee Management API — FeeController (`/api/v1/platform/fees`), screens VPA09010301 / VPA090103P01.

export interface Fee { feeId: string; useYn: YesNo; name: string; /* … mirrors the DTO */ }
export interface FeeSearch { useYn?: YesNo | ''; keyword?: string; /** dd/MM/yyyy */ fromDate?: string; }
export interface FeeRequest { /* request body */ }

/** Error codes the screen reacts to: FEE001 in use, FEE002 not found, … */
export const FEE_ERRORS = { inUse: 'FEE001', notFound: 'FEE002' /* … */ } as const;

const BASE = '/api/v1/platform/fees';

export const getFees = (search: FeeSearch, query: PageQuery) =>
  apiGet<PageResponse<Fee>>(BASE, { ...search, ...query });

export const getFee = (feeId: string) => apiGet<Fee>(`${BASE}/${encodeURIComponent(feeId)}`);

export const createFee = (request: FeeRequest) => apiPost<Fee>(BASE, request);

export const updateFee = (feeId: string, request: FeeRequest) =>
  apiPut<Fee>(`${BASE}/${encodeURIComponent(feeId)}`, request);

export const deleteFees = (feeIds: string[]) => apiDelete<number>(BASE, { feeIds });

export const downloadFeeExcel = (search: FeeSearch) => apiDownload(`${BASE}/excel`, 'fees.xlsx', search);
```

Rules:

- API functions are exported arrow constants that return the helper's promise; path IDs go through `encodeURIComponent`.
- Server error codes the UI reacts to go in a `<RESOURCE>_ERRORS` constant next to the API.
- Paths always start with `/api/...` (the base URL may be empty).
- Types live in the same file and keep the backend field names. Document formats and code values with JSDoc.
- First line: a comment naming controller / base path / screen IDs.
- No React, no hooks, no toasts in API files.

### Generated SDK

`pnpm api:generate` writes `src/api/generated/` (`sdk.gen.ts`, `types.gen.ts`) from the backend OpenAPI. Never edit it. If you use it, call it from an `src/api/<domain>/*-api.ts` file (as `contents/faq-api.ts` does) and normalise to `ApiResponse<T>` there; features do not import `@/api/generated` directly. (`features/member/member-list` still does — legacy, do not copy.)

---

## 4. Data hooks

Put them in the feature folder (`features/<domain>/<screen>/use-<x>.ts`) or the domain `_shared/`.

```ts
// features/system/fee-management/use-fees.ts
const FEE_KEYS = {
  all: ['system', 'fees'] as const,
  list: (search: FeeSearch, query: PageQuery) => ['system', 'fees', 'list', search, query] as const,
  detail: (feeId: string | null) => ['system', 'fees', 'detail', feeId] as const,
};

export function useFees(search: FeeSearch, query: PageQuery) {
  return useApiQuery<PageResponse<Fee>>(FEE_KEYS.list(search, query), () => getFees(search, query), {
    placeholderData: keepPreviousData,
  });
}

export function useFee(feeId: string | null) {
  return useApiQuery<Fee>(FEE_KEYS.detail(feeId), () => getFee(feeId as string), { enabled: feeId !== null, gcTime: 0 });
}

export function useSaveFee() {
  return useApiAction(
    ({ feeId, request }: SaveFeeVariables) => (feeId === null ? createFee(request) : updateFee(feeId, request)),
    { invalidate: [FEE_KEYS.all] },
  );
}

export function useDownloadFeeExcel() {
  return useApiDownload((search: FeeSearch) => downloadFeeExcel(search));
}
```

| Hook (`src/hooks/`) | Resolves | Use for |
|---------------------|----------|---------|
| `useApiQuery<T>(key, fn, options?)` | `T` (`data` unwrapped); throws `ApiError` when `success` is false or `data` is null | reads |
| `useApiAction(fn, { invalidate })` | the whole `ApiResponse<T>` (so the server `message` is available); rejects `ApiError`; invalidates keys on success | writes |
| `useApiTask(fn, { invalidate })` | whatever `fn` returns | uploads / calls without `ApiResponse` |
| `useApiDownload(fn)` | `void`; shows an error toast itself | file downloads |
| `useApiMutation(fn, { successMessage })` | `T` | legacy — prefer `useApiAction` |

React Query defaults (`lib/api/query-client.ts`): `staleTime` 0 in dev / 5 min in prod, 1 retry except 401/403/404, no refetch on window focus.

---

## 5. Using it in a screen

```tsx
const list = usePagedList<FeeFilter>(INITIAL_FILTER);
const { data, isFetching } = useFees(toSearch(list.applied), list.pageQuery);

const saveFee = useSaveFee();
const { toast } = useNotify();
const { applyApiError } = useFieldErrors<FieldKey>();

async function handleSave() {
  try {
    await saveFee.mutateAsync({ feeId, request });
    toast.success(SYS_MESSAGES.registered);
    onClose();
  } catch (error) {
    if (!applyApiError(error, { FEE001: ['name', SYS_MESSAGES.duplicate('item name')] })) {
      toast.error(errorMessage(error));
    }
  }
}
```

### `ApiError` (`lib/api/error.ts`)

| Member | Meaning |
|--------|---------|
| `code`, `errorCode`, `errorArgs` | server error code (e.g. `FEE004`) and label arguments |
| `validation` | 400 field messages (`field → message`) |
| `statusCode` | HTTP status |
| `userMessage` | message to show (server message → label `MESSAGE.ERROR.TEXT_HTTP<status>` → English default) |
| `isUnauthorized` / `isForbidden` / `isNotFound` / `isServerError` | status helpers |
| `ApiError.from(e)` / `ApiError.fromAxiosError(e)` | normalise anything into `ApiError` |

---

## 6. Silent refresh

```
request → 401
  → already refreshing? queue it
  → POST /api/auth/refresh (refresh token cookie)
  → store the new access token (auth-store + utils/token-storage)
  → replay the queue
  → refresh fails or retried call is 401 again → clear tokens, logout, redirect /login
```

---

## 7. Global endpoints (`src/api/common/`)

| Method | Path | File | Notes |
|--------|------|------|-------|
| GET | `/api/auth/public-key` | `auth-api.ts` | RSA key for password encryption |
| POST | `/api/auth/login` | `auth-api.ts` | returns access token |
| POST | `/api/auth/refresh` | `auth-api.ts` / client | cookie |
| POST | `/api/auth/logout` | `auth-api.ts` | |
| GET | `/api/common/menus/my` | `my-menu-api.ts` | menu tree + `menuAuthrt` of the user |
| GET | `/api/lbl/bulk` | `label-bulk-api.ts` | label map for `X-Lang` |
| GET | `/api/lbl/languages` | `label-bulk-api.ts` | languages in use |
| GET | `/api/common/codes/{groupCd}` | `common-code-api.ts` | codes of one group (`useCommonCodes`) |
| GET | `/api/comcd/codes`, `/api/comcd/domains` | `code-domain-api.ts` | code domains (`common-code-store`) |
