import type { LocaleKey } from '@/stores/locale-store';
import { AG_GRID_LOCALE_VI } from './ag-grid-locale-vi';

/**
 * Select built-in AG Grid UI strings (localeText) by locale.
 *
 * <p>Since AG Grid's default language is English, `en` returns `undefined` —
 * passing an empty object would cause raw keys to be displayed instead.</p>
 *
 * <p>These strings are bundled constants rather than DB label table (LANG_LBL) entries. Grid internals
 * have hundreds of strings and are not meant to be edited by operators like screen labels, so instant
 * switching without DB round-trips is preferable. Screen text uses DB labels via `useScreenLabel`.</p>
 */
export function getAgGridLocale(locale: LocaleKey): Record<string, string> | undefined {
  if (locale === 'vn') return AG_GRID_LOCALE_VI;
  return undefined; // en — AG Grid built-in English
}
