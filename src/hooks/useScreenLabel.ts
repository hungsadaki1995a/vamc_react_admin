import { useCallback } from 'react';
import { useLabelStore } from '@/stores/labelStore';
import { useTabContext } from '@/contexts/TabContext';

/**
 * Screen-scoped label helpers with type-shorthand functions.
 *
 * Key pattern: {sceId}.{context}.{TYPE}_{field}
 *
 * VIEW context (JSX template):
 *   tvt(field) → {sceId}.VIEW.TEXT_{field}       (field/form labels)
 *   tvb(field) → {sceId}.VIEW.BTN_{field}         (button text)
 *   tvh(field) → {sceId}.VIEW.TITLE_{field}       (page/section titles)
 *
 * SCRIPT context (event handlers):
 *   tsg(field) → {sceId}.SCRIPT.GRID_{field}      (grid column headers)
 *   tsm(field) → {sceId}.SCRIPT.MSG_{field}       (success/error/confirm messages)
 *   tsb(field) → {sceId}.SCRIPT.BTN_{field}       (dialog button text)
 *
 * `sceId` is auto-derived from TabContext (tab.sceId → tab.componentKey).
 * Pass an explicit `sceId` only when the component is rendered outside a TabPanel.
 *
 * `labels` is exposed so useMemo deps can react to locale/project changes.
 *
 * @example
 * // Auto sceId from TabContext:
 * const { tvt, tvb, tsg, tsm, tsb, labels } = useScreenLabel();
 *
 * // Explicit sceId (outside TabPanel):
 * const { tvt } = useScreenLabel('CCO101001SC');
 *
 * // JSX:
 * {tvt('usrId')}         // → CCO101001SC.VIEW.TEXT_usrId
 * {tvb('save')}          // → CCO101001SC.VIEW.BTN_save
 *
 * // Grid header:
 * tsg('dpNm')            // → CCO101001SC.SCRIPT.GRID_dpNm
 *
 * // Handler:
 * tsm('updateSuccess')   // → CCO101001SC.SCRIPT.MSG_updateSuccess
 * tsb('cancel')          // → CCO101001SC.SCRIPT.BTN_cancel
 */
export function useScreenLabel(sceIdOverride?: string) {
  const ctx = useTabContext();
  // Subscribe to version counter (number) instead of the full labels object.
  // Triggers re-render on labels update with O(1) comparison, without capturing
  // a reference to the entire labels map in every useCallback closure.
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);

  // Priority: explicit override > tab.sceId > tab.componentKey (= sceId fallback)
  const sceId = sceIdOverride ?? ctx?.tab.sceId ?? ctx?.tab.componentKey ?? '';

  // VIEW — field/form text labels
  const tvt = useCallback(
    (field: string) => t(`${sceId}.VIEW.TEXT_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // VIEW — button labels
  const tvb = useCallback(
    (field: string) => t(`${sceId}.VIEW.BTN_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // VIEW — title/heading labels
  const tvh = useCallback(
    (field: string) => t(`${sceId}.VIEW.TITLE_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // SCRIPT — grid column header labels
  const tsg = useCallback(
    (field: string) => t(`${sceId}.SCRIPT.GRID_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // SCRIPT — message labels (success/error/confirm)
  const tsm = useCallback(
    (field: string) => t(`${sceId}.SCRIPT.MSG_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // SCRIPT — button labels used inside dialogs/handlers
  const tsb = useCallback(
    (field: string) => t(`${sceId}.SCRIPT.BTN_${field}`),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // Expose labels for callers using it as useMemo dep (non-subscribing read — component
  // already re-renders via labelsVersion, so getState() always returns current value here).
  const labels = useLabelStore.getState().labels;

  return { tvt, tvb, tvh, tsg, tsm, tsb, labels, sceId };
}
