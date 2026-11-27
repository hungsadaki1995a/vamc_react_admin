# VAMC NPL Admin — Shared Components

Use these before writing new UI. Most are thin wrappers over Ant Design that apply the Figma styles; they accept the antd props they wrap. Import from the barrels where they exist:

```ts
import { ActionButton, Popup, DataTable, Pagination, StatusBadge } from '@/components/common';
import { AppSelect, TextInput, AppRangePicker, Spinbox } from '@/components/inputs';
```

| Area | Folder |
|------|--------|
| Buttons, popup, table, pagination, badges, loading, upload, tree, tabs, tooltip | `components/common/` |
| Form inputs | `components/inputs/` |
| Page layout blocks | `components/layout/` |
| AG Grid | `components/grid/` |
| Tab shell | `components/tabs/` (used by `AppLayout` only) |
| Route guard / auth header | `components/auth/` |
| System Operation look (v0.8 frame) | `components/common/sys-ui/` (`SysListUi`, `SysFormUi`, `SystemUi`) |

---

## Common (`components/common`)

### ActionButton / ActionButtonGroup

Button with design presets. `action` picks icon + default look, `intent` / `appearance` override it.

| Prop | Values |
|------|--------|
| `action` | `reset` `search` `copy` `addRow` `deleteRow` `saveChanges` `excelDownload` `excelUpload` `register` `cancel` `close` `confirm` `download` `upload` `collapse` `expand` |
| `intent` | `default` `primary` `secondary` `quaternary` `danger` `excel` `text` `icon` |
| `appearance` | `filled` `outlined` |
| …antd `ButtonProps` | |

```tsx
// Filter buttons take their look from the action (search = blue filled, reset = blue outlined): never pass intent/appearance.
<ActionButton action="search" onClick={onSearch}>Search</ActionButton>
// Field lookup (opens a picker popup) is a different role: grey outlined.
<ActionButton action="search" intent="quaternary" appearance="outlined" onClick={openPicker}>Search</ActionButton>

<ActionButtonGroup preset="gridEdit" canWrite={canWrite} items={[
  { key: 'add', action: 'addRow', label: 'Add Row', onClick: addRow },
  { key: 'save', action: 'saveChanges', label: 'Save', onClick: save },
]} />
```

`ActionButtonGroup` orders items by `preset` (`search`, `gridEdit`, `formEdit`, `modal`, `excelRegister`), supports `justify`, `hidden`, `order`, and disables write actions (`addRow`, `deleteRow`, `saveChanges`, `register`, `excelUpload`, `upload`) when `canWrite={false}`. Types: `src/types/action-button.ts`.

### Popup

antd `Modal` with the design header/footer.

| Prop | Description |
|------|-------------|
| `title`, `children`, `open`, `onCancel`, `width` | as antd |
| `onConfirm`, `confirmText`, `cancelText` | footer buttons |
| `confirmLoading`, `confirmDisabled`, `confirmDanger`, `hideCancel` | footer state |
| `footer` | replace the footer; `footerAlign`: `center` \| `right` |

```tsx
<Popup open title="Approval Status" onCancel={onClose} onConfirm={handleSave} confirmText="Save"
  confirmLoading={save.isPending} confirmDisabled={!canWrite}>
  …
</Popup>
```

### DataTable

antd `Table` with design tokens; defaults `size="small"`, `pagination={false}` (use `Pagination` below it). Accepts all `TableProps<T>`.

```tsx
<DataTable<Post> rowKey="pstNo" columns={columns} dataSource={data?.content ?? []} loading={isFetching} />
```

### Pagination

| Prop | Description |
|------|-------------|
| `page`, `onChange(page)` | 1-based |
| `total` + `pageSize` or `totalPages` | size of the list |
| `blockSize` | page numbers per block |
| `variant` | `numbered` (default) \| `fraction` |
| `hideOnSinglePage` | |

### StatusBadge

`color`: `gray` `green` `orange` `red` `violet` `blue` `navy`; `variant`: `outlined` \| `filled`; optional `icon`.

```tsx
<StatusBadge color="green">Approved</StatusBadge>
```

### Others

| Component | Purpose / main props |
|-----------|----------------------|
| `ContentTabs<T>` | in-page tabs — `items`, `activeKey`, `onChange`, `variant` (`underline` \| `boxed` \| `segmented`), `fullWidth` (types in `types/content-tabs.ts`) |
| `FileUploadBox` | file picker box — `fileName`, `accept`, `multiple`, `disabled`, `onFileSelect(files)`, `onClear` |
| `LoadingSpinner` | antd `Spin` with the design indicator (`size`, `spinning`, children) |
| `ProgressBar` | `percent`, `label`, `status` (`active` \| `success` \| `error`), `showPercent` (width via CSS variable) |
| `ProgressStepper` | `steps: { key, label, status? }[]`, `current` |
| `AppTooltip` | antd `Tooltip` + `variant` (`default` \| `information` \| `coachmark`), `title`, `description`, `closable` |
| `TreeView<T>` | tree list — `nodes`, `selectedKey`, `expandedKeys`/`defaultExpandedKeys`, `onSelect`, `onToggleExpand`, drag handlers, `renderExtra` |
| `GlobalLoadingSpinner` | mounted once in `App.tsx`, follows `loading-store`: reads → thin top bar (after 150 ms, screen stays usable); writes / downloads → full-screen spinner (after 300 ms) |
| `LanguageSelector` | `en` / `vn` switcher bound to `locale-store` |

---

## Inputs (`components/inputs`)

All wrap the antd control and keep its props; `className` is merged with the design class.

| Component | Wraps | Extra |
|-----------|-------|-------|
| `TextInput` | `Input` | `variant`: `default` `search` (`onSearch`, `enterButton`) `password` (`visibilityToggle`) `sum` `grid` |
| `TipInput` | alias of `TextInput` (legacy name) | |
| `TextArea` | `Input.TextArea` | `readOnly` style |
| `AppSelect<V>` | `Select` | `size="small"` style, popup class |
| `ComcdSelect` | `AppSelect` | `cdDmnId` (options from `common-code-store`), `prefixOption` (blank option label), `filterFn` |
| `AppDatePicker` / `AppRangePicker` | `DatePicker` / `RangePicker` | date format from caller (system screens: `SYS_DATE_FORMAT` = `DD-MM-YYYY`) |
| `Spinbox` | `InputNumber` | `variant`: `arrows` \| `stepper`; `inputVariant` = antd variant |
| `AppCheckbox` / `AppCheckboxGroup` | `Checkbox` | |
| `AppRadio` / `AppRadioGroup` (`AppRadio.Group`) | `Radio` | |
| `AppSwitch` | `Switch` | |

```tsx
<AppSelect value={draft.useYn} options={USE_YN_FILTER_OPTIONS} onChange={(v) => setDraft({ useYn: v })} />
<AppRangePicker value={draft.period} format={SYS_DATE_FORMAT} allowEmpty={[true, true]} onChange={(period) => setDraft({ period })} />
<Spinbox value={values.order} min={1} max={99} precision={0} onChange={(order) => patch({ order })} />
```

---

## Layout (`components/layout`)

| Component | Purpose / props |
|-----------|-----------------|
| `FilterPanel` | collapsible search area with [Reset]/[Search] — `onSearch`, `onReset`, `collapsed`, `onCollapsedChange`, `activeFilterCount`, children = fields. Labels from `useComponentLabel`. |
| `GridToolbar` | bar above a table — `title`, `totalCount`, `countLabel` (default label `COMPONENT.VIEW.TEXT_gridTotal`), `left`, `actions` |
| `FormPanel` | titled, collapsible form block — `title`, `actions`, `editMode`, `collapsed`, `onCollapsedChange` |
| `SplitPanel` | resizable two-pane layout — `direction`, `defaultSize` or `defaultRatio` (default 0.5), `primaryMinSize`, `secondaryMinSize`, `secondaryVisible`, `onResize`, exactly two children |
| `PageHeader` | screen title + code from the tab (`tab.sceId`, label `tab.labelKey`); slots `actions`, `inlineFilters`, `titleExtra`. Screens can push into it with `usePageHeaderSlot()` (`page-header-slot-context.tsx`). |
| `Header`, `IconRail`, `FlyoutPanel` | app shell — used by `AppLayout` only |

```tsx
<FilterPanel onSearch={() => { if (!list.search()) void refetch(); }} onReset={() => { if (!list.reset()) void refetch(); }}>
  <TextInput value={list.draft.keyword} onChange={(e) => list.setDraft({ keyword: e.target.value })} />
</FilterPanel>
<GridToolbar totalCount={total} actions={canWrite && <ActionButton action="register" onClick={openNew}>Register</ActionButton>} />
<DataTable … />
<Pagination page={list.page} total={total} pageSize={20} onChange={list.setPage} />
```

---

## Grid (`components/grid`)

AG Grid Community wrappers for editable grids or large row counts. For ordinary read-only lists prefer `DataTable` / `SysTable` (no business screen uses `GridTable` today).

### GridTable / GridPanel

`GridPanel` = `GridToolbar` + `GridTable` (`title`, `totalCount`, `countLabel`, `toolbarLeft`, `actions` on top of all `GridTable` props).

| Main props (`types/grid.ts`) | |
|------------------------------|--|
| `columnDefs`, `rowData`, `rowKey` | data |
| `editable`, `enableClipboard`, `rowSelection` (`singleRow` \| `multiRow`), `checkboxSelection` | editing / selection |
| `pagination`, `pageSize`, `height`, `autoHeight`, `rowHeight`, `headerHeight`, `loading`, `noRowsMessage` | display |
| `getRowClass`, `isRowSelectable`, `pinnedTopRowData`, `pinnedBottomRowData`, `enableCellSpan`, `enableCellTextSelection`, `quickFilterText`, `floatingFilter` | advanced |
| `gridRef` | direct `GridApi` access |
| `onRowClick`, `onRowDoubleClick`, `onSelectionChanged(rows)`, `onCellClicked`, `onRowSelected`, `onBodyScrollEnd`, … | events |

Locale texts: `ag-grid-locale.ts` / `ag-grid-locale-vi.ts`. HTML cell content is sanitised with DOMPurify (the only allowed `dangerouslySetInnerHTML`).

### Common-code cells

```ts
import { ComcdSelectCellRenderer, ComcdSelectCellEditor } from '@/components/grid/CommonCodeSelectCell';

{ field: 'jbcCd', cellRenderer: ComcdSelectCellRenderer, cellEditor: ComcdSelectCellEditor, cellRendererParams: { cdDmnId: 'JBC_CD' } }
```

---

## System Operation building blocks (`components/common/sys-ui`)

The v0.8 frame for `features/system/*` and `features/content/*` screens. Use them instead of the generic layout components when matching the v0.8 design.

| `SysListUi.tsx` | |
|-----------------|--|
| `SysPage` (`fill`) | page container |
| `SysTitleBar` (`title`, `breadcrumb[]`) | title + breadcrumb |
| `SysFilterPanel` (`columns` 2/3/4, default 4 as in the design) + `SysFilterItem` (`label`, `span`, `hint`) | filter grid |
| `SysSearchActions` (`onReset`, `onSearch`, `loading`) | [Reset] [Search] |
| `SysSectionHeader` (`title`, `total`, `actions`, `primaryActions`) | result header |
| `SysTable<T>` (antd table props + `onRowClick`, `sort`, `onSortChange`, `fill`) | result table |
| `SysPager` (`page`, `pageSize`, `total`, `onChange`) | pager |
| `SysButton` (`look`: `default` \| `navy` \| `primary` \| `outline`) / `SysExcelButton` | buttons |
| `UseBadge`, `StatusBadge` (`tone`), `ResultBadge`, `DateTimeText` | cell renderers |
| `SysSplit`, `SysEmpty`, `SysNotAvailable` | layout helpers |

| `SysFormUi.tsx` | |
|-----------------|--|
| `SysFormModal` (`open`, `title`, `onCancel`, `onSubmit` (omit = read-only), `submitText`, `submitting`, `submitDisabled`, `extraActions`, `leftActions`, `notice`, `width`) | register/edit popup |
| `SysFieldGrid` (`columns` 1/2/3) + `SysField` (`label`, `required`, `error`, `span`, `hint`) | form grid with inline error |
| `SysFormSection` (`title`, `actions`) | titled block |

Shared hooks in `src/hooks/`: `usePagedList`, `useFieldErrors`, `useSysDialogs`; system-specific hooks in `features/system/_shared/`: `useMenuSettings`, `useMenuPermissions`; constants in `src/config/`: `sys-constants.ts` (`SYS_PAGE_SIZE` = 20, date formats, `USE_YN_*_OPTIONS`), `sys-messages.ts`; helpers in `src/utils/system-utils.ts` (`errorMessage`, `formatAmount`, `rowNumber`, `lastDaysRange`, …).

### `SystemUi.tsx` — wireframe header used by the other domains

Screens outside `system` (member, content, npl, trade, auction) build their list pages from `SystemUi.tsx` + `DataTable`:

| Export | Purpose |
|--------|---------|
| `SysPageHeader` | breadcrumb + title + [Reset] / [Search] / collapse (wireframe header) |
| `SysPagination` | centred numeric pager, blocks of 10 |
| `DateTimeCell`, `UseFlag`, `UseYnChecks`, `FormField` | cell renderers, "All / Used / Unused" filter, label+value form cell |

Import it with the alias: `import { SysPageHeader, SysPagination } from '@/components/common/sys-ui/SystemUi';`. `features/system/*` screens themselves use `SysListUi` / `SysFormUi` (v0.8 frame).
