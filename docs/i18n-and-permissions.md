# VAMC NPL Admin — Labels / i18n, Permissions, Common Codes

## 1. Locale

```ts
import { useLocaleStore } from '@/stores/locale-store';

const locale = useLocaleStore((s) => s.locale);   // 'en' | 'vn' (default 'en')
useLocaleStore.getState().setLocale('vn');
```

- Persisted in localStorage **and** cookie `vamc-locale` (`utils/locale-storage.ts`).
- Every request sends `X-Lang: en|vn` and `Accept-Language` (ISO tag).
- On change, `useAppSync()` (in `App.tsx`) switches dayjs / `<html lang>` / i18next / antd locale and reloads common codes, menus and labels.
- The language selector is `components/common/LanguageSelector.tsx`.

There are two text sources:

| Where | Source | API |
|-------|--------|-----|
| Admin shell + shared components | DB labels (`LANG_LBL`) via `label-store` | `useScreenLabel`, `useComponentLabel`, `useLabelStore(s => s.t)` |
| Auth pages (`/login`, `/find-id`, `/find-password`) and a few shell texts (`AppLayout`, `IconRail`) | `src/lib/i18n/locales/{en,vn}.json` | `useTranslation()` from `react-i18next` |
| Trade and approval screens (`features/trade`, `features/approval`): labels `trade.*` / `approval.*`, messages `messages.trade.*` / `messages.approval.*` | `src/lib/i18n/locales/{en,vn}.json` | `useTranslation()`; code → label maps with `codeLabel(group, code)` (`lib/i18n/code-label.ts`) |

Other business screens (`features/system`, `content`, `npl`, …) currently show the English text of the screen design. Keep repeated texts in constants (`config/sys-messages.ts`, `*-constants.ts`).

---

## 2. DB labels

```
GET /api/lbl/bulk   (X-Lang)  →  Record<labelKey, text>  →  label-store.labels
```

`label-store` caches the map in IndexedDB per locale for 5 minutes (stale-while-revalidate). After editing labels call `useLabelStore.getState().invalidateLabelCache()`.

| Member | Description |
|--------|-------------|
| `t(key, defaultText?)` | text → `defaultText` → the key itself |
| `tmc / tmi / tme(code)` | `MESSAGE.CONFIRM\|INFO\|ERROR.TEXT_<code>` |
| `loadLabels(force?)` | load (called by `useAppSync`) |
| `labelsVersion` | counter — use it as a memo dependency |

**Always pass an English `defaultText`** — otherwise a missing label shows the raw key.

### `useScreenLabel(sceId?)` — screen labels

`sceId` comes from the current tab (`TabContext`: `tab.sceId` → `tab.componentKey`); pass it explicitly only outside a tab.

| Function | Key |
|----------|-----|
| `tvt(field, fallback)` | `<sceId>.VIEW.TEXT_<field>` — field labels |
| `tvb(field, fallback)` | `<sceId>.VIEW.BTN_<field>` — buttons |
| `tvh(field, fallback)` | `<sceId>.VIEW.TITLE_<field>` — titles |
| `tsg(field, fallback)` | `<sceId>.SCRIPT.GRID_<field>` — grid headers |
| `tsm(field, fallback)` | `<sceId>.SCRIPT.MSG_<field>` — messages |

### `useComponentLabel()` — shared component labels

Same functions with `sceId = 'COMPONENT'` (`COMPONENT.VIEW.TEXT_filterTitle`, `COMPONENT.VIEW.BTN_search`, …). Used by `FilterPanel`, `GridToolbar`, `PageHeader`, `TabBar`, `TabContextMenu`, `GridTable`. Notification/dialog titles and OK/Cancel in `useNotify` also use `COMPONENT.VIEW.*`.

Interpolate with `formatLabel` (`lib/i18n/format-label.ts`).

### Label key convention

`<SCRN_ID>.<VIEW|SCRIPT>.<TYPE>_<field>` — `LANG_LBL` is identified by `LBL_CD` + `SCRN_ID` + `LBL_SE_CD`. `LBL_CD` must be globally unique: `/api/lbl/bulk` returns a map, so a duplicate silently overwrites another.

---

## 3. Menu permissions

```
GET /api/common/menus/my  →  menu tree with menuAuthrt  →  menu-store.serverMenus
useMenuPermission()       →  active tab key  →  serverMenus item  →  permType
```

```ts
import { useMenuPermission } from '@/hooks/use-menu-permission';

const { canRead, canWrite, permType } = useMenuPermission();
```

| `permType` (`MENU_ROLE_MPNG.MENU_AUTHRT`) | canRead | canWrite |
|------------|---------|----------|
| `'AL'` all | ✅ | ✅ |
| `'WT'` write (includes read) | ✅ | ✅ |
| `'RD'` read | ✅ | ❌ |
| `''` none | ❌ | ❌ |

Static menus from `config/menu-config.ts` are not server-controlled and fall back to `'AL'`. The backend enforces the same rule; the UI only hides/disables.

Usage:

```tsx
const { canWrite } = useMenuPermission();

{canWrite && <SysButton look="navy" onClick={openRegister}>New</SysButton>}
<Popup confirmDisabled={!canWrite} … />
<ActionButtonGroup preset="gridEdit" canWrite={canWrite} />   // disables write actions automatically
```

---

## 4. Common codes

Two ways, pick by need:

| Need | Use |
|------|-----|
| Options of one `COM_CD` group in a screen | `useCommonCodes(groupCd)` (`hooks/use-common-codes.ts`) → `{ label, value }[]`, cached 5 min by React Query |
| App-wide code lookup / code name | `common-code-store`: `getOptions(cdDmnId)`, `getCodeName(cdDmnId, cd)` (IndexedDB, 5 min TTL) |
| Ready-made select | `<ComcdSelect cdDmnId="JBC_CD" />` (`components/inputs`), or `CommonCodeSelectCell` inside `GridTable` |

```tsx
const categoryOptions = useCommonCodes('FEE_ARTCL_SE_CD');
<AppSelect options={categoryOptions} value={value} onChange={setValue} />

const getCodeName = useComcdStore((s) => s.getCodeName);
getCodeName('TASK_STATUS', 'DONE');
```
