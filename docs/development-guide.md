# VAMC NPL Admin — Development Guide

Rules: `.agents/rules/coding-convention.md`, `naming-convention.md`, `styling-convention.md`.
Reference implementation: `src/features/system/fee-management/` + `src/api/system/fee-api.ts`.

## Adding a screen

### Step 1 — API file

`src/api/<domain>/<resource>-api.ts` — types + API functions on top of `api-utils`. See `docs/api-integration.md` §3.

### Step 2 — Screen folder

```
src/features/<domain>/<screen>/          e.g. features/system/fee-management/
  index.tsx                              screen, `export default function FeeManagement()`
  use-<resource>.ts                      data hooks (query keys, useApiQuery / useApiAction)
  <Name>Modal.tsx                        popups opened from this screen
  <screen>-constants.ts                  options, labels, formatters (optional)
  <screen>.types.ts                      local types not owned by the API file (optional)
  <screen>.module.scss                   screen-specific styles
```

- Folder names are `kebab-case`; files stay flat (no `components/` / `hooks/` sub-folders for admin screens).
- Code shared by several screens of one domain goes to `features/<domain>/_shared/`.
- No API calls, `useQuery` or `useMutation` inside `.tsx` files — only hooks from `use-<x>.ts`.

### Step 3 — Menu wiring

The registry auto-discovers `features/*/*/index.tsx` by folder name (see `docs/architecture.md`). The server menu (`MENU_MNG.MENU_URL_ADDR`) should point at that folder name. Only if it cannot, add the screen ID to `overrides` in `src/config/component-registry.tsx`:

```ts
SYS020103SC: lazy(() => import('@/features/system/fee-management')),
```

If the screen needs a fixed URL, add it to `ROUTE_MENU_CODES` in `src/app/route-constants.ts`.

---

## List screen pattern (System Operation)

```tsx
interface FeeFilter { useYn: YesNo | ''; keyword: string; }
const INITIAL_FILTER: FeeFilter = { useYn: ALL, keyword: '' };

function toSearch(filter: FeeFilter): FeeSearch {
  return { useYn: filter.useYn, keyword: filter.keyword.trim() };
}

const columns: TableColumnsType<Fee> = [
  { title: 'Fee Code', dataIndex: 'feeId', align: 'center', width: 130 },
  { title: 'Use', dataIndex: 'useYn', align: 'center', width: 100, render: (v: YesNo) => <UseBadge value={v} /> },
  // …
];

type ModalState = { feeId: string | null } | null;   // closed / register / edit

export default function FeeManagement() {
  const { canWrite } = useMenuPermission();
  const list = usePagedList<FeeFilter>(INITIAL_FILTER);
  const search = toSearch(list.applied);
  const { data, isFetching } = useFees(search, list.pageQuery);
  const excel = useDownloadFeeExcel();
  const [modal, setModal] = useState<ModalState>(null);
  const total = data?.totalElements ?? 0;

  return (
    <SysPage>
      <SysTitleBar title="Fee Management" breadcrumb={['System Operation Management', 'NPL Platform Management', 'Fee Management']} />
      <SysFilterPanel columns={4}>
        <SysFilterItem label="Use">
          <AppSelect value={list.draft.useYn} options={USE_YN_FILTER_OPTIONS}
            onChange={(useYn) => list.setDraft({ useYn: String(useYn ?? '') as YesNo | '' })} />
        </SysFilterItem>
        <SysFilterItem label="Item/Content">
          <TextInput value={list.draft.keyword} allowClear
            onChange={(e) => list.setDraft({ keyword: e.target.value })}
            onPressEnter={() => list.search()} />
        </SysFilterItem>
      </SysFilterPanel>
      <SysSearchActions onReset={list.reset} onSearch={() => list.search()} loading={isFetching} />
      <SysSectionHeader
        total={total}
        actions={<SysExcelButton onClick={() => excel.mutate(search)} loading={excel.isPending} />}
        primaryActions={canWrite && <SysButton look="navy" onClick={() => setModal({ feeId: null })}>New</SysButton>}
      />
      <SysTable<Fee> rowKey="feeId" columns={columns} dataSource={data?.content ?? []} loading={isFetching}
        onRowClick={(fee) => setModal({ feeId: fee.feeId })} />
      <SysPager page={list.page} pageSize={SYS_PAGE_SIZE} total={total} onChange={list.setPage} />
      {modal && <FeeModal key={modal.feeId ?? 'new'} feeId={modal.feeId} canWrite={canWrite} onClose={() => setModal(null)} />}
    </SysPage>
  );
}
```

Key points:

- `usePagedList` keeps `draft` (bound to inputs) separate from `applied` (used by the query). [Search] applies and returns to page 1; [Reset] restores the initial filter.
- `toSearch`, `columns`, `INITIAL_FILTER` live at module level.
- Mount the modal only while open and give it a `key`, so its form state starts fresh.

Other domains (member, content, npl, trade, auction) build list pages from `SysPageHeader` + `SysPagination` (`components/common/sys-ui/SystemUi.tsx`), `DataTable` and `Popup` — see `docs/components.md`. Reuse the domain's `_shared/` building blocks when they exist (`content/_shared/PostBoard`, `trade/_shared/TradeApplicationBoard`).

---

## Register / edit popup pattern

```tsx
export default function FeeModal({ feeId, canWrite, onClose }: FeeModalProps) {
  const { data: detail, isFetching } = useFee(feeId);
  if (feeId !== null && !detail) {
    return <SysFormModal open title="Edit Fee Information" onCancel={onClose}><LoadingSpinner spinning={isFetching} /></SysFormModal>;
  }
  return <FeeForm fee={detail ?? null} canWrite={canWrite} onClose={onClose} />;   // form mounts with loaded data
}

function FeeForm({ fee, canWrite, onClose }: { fee: Fee | null; canWrite: boolean; onClose: () => void }) {
  const { toast } = useNotify();
  const { confirm } = useSysDialogs();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const saveFee = useSaveFee();
  const [values, setValues] = useState<FeeFormState>(() => (fee ? toState(fee) : EMPTY_STATE));

  async function handleSubmit() {
    if (!checkRequired(values, ['category', 'name'])) return;          // E01 required
    try {
      await saveFee.mutateAsync({ feeId: fee?.feeId ?? null, request: toRequest(values) });
      toast.success(fee ? SYS_MESSAGES.updated : SYS_MESSAGES.registered);
      onClose();
    } catch (error) {
      if (!applyApiError(error, { [FEE_ERRORS.invalid]: ['category', '…'] })) toast.error(errorMessage(error));
    }
  }

  return (
    <SysFormModal open title={fee ? 'Edit Fee Information' : 'Register Fee'} width={1200}
      onCancel={onClose} onSubmit={canWrite ? handleSubmit : undefined}
      submitText={fee ? 'Edit' : 'Register'} submitting={saveFee.isPending}>
      <SysFieldGrid columns={3}>
        <SysField label="Type" required error={errors.category}>
          <AppSelect value={values.category} options={categoryOptions}
            onChange={(category) => { clearError('category'); setValues((v) => ({ ...v, category })); }} />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
```

- Load first, then mount the form with initial state — no `useEffect` to copy server data into state.
- Without write permission, omit `onSubmit` → the popup is read-only ([Close] only).
- Destructive actions: `confirm({ content, okText: 'Delete', danger: true, onOk })` from `useSysDialogs()`.

---

## Feedback

| Need | Use |
|------|-----|
| Toast | `const { toast } = useNotify(); toast.success(msg)` / `toast.error(msg)` (antd `message`) |
| Notification with title | `useNotify().notify.success / error / warning / info(textOrOptions)` |
| Confirm / alert (system screens) | `useSysDialogs()` → `confirm`, `ask` (Promise<boolean>), `alert`; texts in `sys-messages.ts` |
| Confirm / alert (elsewhere) | `useNotify().dialog.confirm / info / warning / error` |
| Inline field errors | `useFieldErrors<K>()` |
| Error text | `errorMessage(error)` (`utils/system-utils.ts`) or `ApiError.from(error).userMessage` |

---

## Permissions, labels, common codes

See `docs/i18n-and-permissions.md`. In short:

```tsx
const { canWrite } = useMenuPermission();                // hide/disable write actions
const { tvt, tvb } = useScreenLabel();                   // DB labels with English fallback
const options = useCommonCodes('FEE_ARTCL_SE_CD');       // COM_CD options
```

---

## Styling

`.agents/rules/styling-convention.md` in short:

```tsx
import styles from './fee-management.module.scss';     // last import

<span className={styles.numberCell}>{value}</span>
<div className={styles.formGrid} style={{ '--form-cols': 3 } as CSSProperties}>   // dynamic value via CSS variable only
```

```scss
/* fee-management.module.scss */
.numberCell { font-variant-numeric: tabular-nums; color: var(--color-text-primary, #1f2329); }
.amountInput :global(.ant-input-number-input) { text-align: right; }
```

- No static `style={{ … }}`, no `<style>`, no `const styles = {}` objects in components.
- Tokens from `src/styles/` (`var(--token, fallback)`); antd theme tokens in `src/config/theme-config.ts`.
- Short Tailwind utilities (`flex items-center gap-2`) are fine; move long/repeated lists into the module.

---

## Tabs

```ts
import { useTabStore } from '@/stores/tab-store';
import { findMenuByKey } from '@/utils/menu-utils';
import { useMenuStore } from '@/stores/menu-store';

const openTab = useTabStore((s) => s.openTab);
const serverMenus = useMenuStore((s) => s.serverMenus);

const menu = findMenuByKey(serverMenus, 'A06010300');
if (menu) openTab(menu, { feeId });          // params arrive as tab.params
```

---

## Before you finish

```bash
npx tsc -b      # must pass
pnpm lint       # 0 errors
pnpm e2e        # E2E on every screen (local backend on :7200, e2e/.env.e2e) — see e2e/README.md
pnpm e2e -g "A06010300"   # or only the screen you changed, by menu code
```

Check manually in the browser (`pnpm dev`, backend running): list, search/reset, paging, register, edit, delete, read-only role.

A new menu makes the E2E manifest check (T-01) fail — add the screen to `e2e/support/screens.ts`; the smoke and register-validation suites then cover it automatically.
