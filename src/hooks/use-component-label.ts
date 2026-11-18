import { useScreenLabel } from './use-screen-label';

/**
 * Screen ID for shared component labels.
 *
 * <p>`useScreenLabel` reads sceId from tab context, whereas shared components
 * (FilterPanel, GridToolbar, tab context menu, Excel modal, …) must show the same text
 * regardless of which screen renders them. Therefore sceId is fixed to this value.</p>
 *
 * <p>Follows the existing namespace already used in code —
 * `ExcelUploadModal`, `AppModal`, `GridExternalPaginationFooter`, etc. call
 * `t('COMPONENT.VIEW.TEXT_...')` directly.
 * `LANG_LBL.SCRN_ID` also uses this value when seeded in DB.</p>
 */
export const COMPONENT_SCE_ID = 'COMPONENT';

/**
 * Shared component label hook — alias for `useScreenLabel('COMPONENT')`.
 *
 * <p>Use together with `formatLabel` when interpolating values into a sentence.</p>
 *
 * @example
 * const { tvt, tvb } = useComponentLabel();
 * tvt('filterTitle', 'Search Filters')   // → COMPONENT.VIEW.TEXT_filterTitle
 * tvb('search', 'Search')                // → COMPONENT.VIEW.BTN_search
 */
export function useComponentLabel() {
  return useScreenLabel(COMPONENT_SCE_ID);
}
