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
 *
 * 버튼은 섹션과 무관하게 tvb 하나로 쓴다 — 다이얼로그 버튼용 tsb(SCRIPT.BTN_)가 있었으나
 * 구분(BTN)만 보고는 섹션을 알 수 없게 만드는 유일한 원인이었고 실사용이 없어 폐기했다.
 *
 * Global MESSAGE context (cross-screen messages):
 *   tm(type, code) → MESSAGE.{type}.TEXT_{code}
 *   type: 'CONFIRM' | 'INFO' | 'ERROR'
 *
 * `sceId` is auto-derived from TabContext (tab.sceId → tab.componentKey).
 * Pass an explicit `sceId` only when the component is rendered outside a TabPanel.
 *
 * `labels` is exposed so useMemo deps can react to locale/project changes.
 *
 * @example
 * // Auto sceId from TabContext:
 * const { tvt, tvb, tsg, tsm, tm, labels } = useScreenLabel();
 *
 * // Explicit sceId (outside TabPanel):
 * const { tvt } = useScreenLabel('SYS030101SC');
 *
 * // JSX:
 * {tvt('usrId')}         // → SYS030101SC.VIEW.TEXT_usrId
 * {tvb('save')}          // → SYS030101SC.VIEW.BTN_save
 *
 * // Grid header:
 * tsg('dpNm')            // → SYS030101SC.SCRIPT.GRID_dpNm
 *
 * // Handler:
 * tsm('updateSuccess')   // → SYS030101SC.SCRIPT.MSG_updateSuccess
 *
 * // Global message (cross-screen):
 * tmc('C100007')   // → MESSAGE.CONFIRM.TEXT_C100007
 * tmi('I100008')   // → MESSAGE.INFO.TEXT_I100008
 * tme('E100001')   // → MESSAGE.ERROR.TEXT_E100001
 */
export function useScreenLabel(sceIdOverride?: string) {
  const ctx = useTabContext();
  // Subscribe to version counter (number) instead of the full labels object.
  // Triggers re-render on labels update with O(1) comparison, without capturing
  // a reference to the entire labels map in every useCallback closure.
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);
  const tmc = useLabelStore((s) => s.tmc);
  const tmi = useLabelStore((s) => s.tmi);
  const tme = useLabelStore((s) => s.tme);

  // Priority: explicit override > tab.sceId > tab.componentKey (= sceId fallback)
  const sceId = sceIdOverride ?? ctx?.tab.sceId ?? ctx?.tab.componentKey ?? '';

  // Resolve helper: returns label value if found, defaultText if provided, otherwise key.
  const resolve = useCallback(
    (key: string, defaultText?: string) => {
      const val = t(key);
      return val !== key ? val : (defaultText ?? key);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion],
  );

  // VIEW — field/form text labels
  const tvt = useCallback(
    (field: string, defaultText?: string) => resolve(`${sceId}.VIEW.TEXT_${field}`, defaultText),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // VIEW — button labels
  const tvb = useCallback(
    (field: string, defaultText?: string) => resolve(`${sceId}.VIEW.BTN_${field}`, defaultText),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // VIEW — title/heading labels
  const tvh = useCallback(
    (field: string, defaultText?: string) => resolve(`${sceId}.VIEW.TITLE_${field}`, defaultText),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // SCRIPT — grid column header labels
  const tsg = useCallback(
    (field: string, defaultText?: string) => resolve(`${sceId}.SCRIPT.GRID_${field}`, defaultText),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // SCRIPT — message labels (success/error/confirm)
  const tsm = useCallback(
    (field: string, defaultText?: string) => resolve(`${sceId}.SCRIPT.MSG_${field}`, defaultText),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labelsVersion, sceId],
  );

  // Expose labels for callers using it as useMemo dep (non-subscribing read — component
  // already re-renders via labelsVersion, so getState() always returns current value here).
  const labels = useLabelStore.getState().labels;

  return { t, tvt, tvb, tvh, tsg, tsm, tmc, tmi, tme, labels, sceId };
}
