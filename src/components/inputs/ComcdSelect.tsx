import { useState, useEffect, useMemo } from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { useComcdStore } from '@/stores/comcdStore';
import type { CodeDetail } from '@/api/common/code';

interface ComcdSelectProps extends Omit<SelectProps, 'options'> {
  /** Code domain ID from T_CCO_COM_C (e.g. 'JBC_CD', 'GD_CD') */
  cdDmnId: string;
  /**
   * Prepend a blank option at the top of the list.
   * Pass the label to display (e.g. '전체', '선택', '').
   * The option value is always ''.
   *
   * @example
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="전체" />
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="선택" />
   * <ComcdSelect cdDmnId="JBC_CD" prefixOption="" />
   */
  prefixOption?: string;
  /**
   * Optional filter function for cascading (chained) selects.
   * Receives each CodeDetail item — return true to include, false to exclude.
   *
   * @example
   * // Show only codes whose parent equals selected value
   * <ComcdSelect cdDmnId="CHILD_CD" filterFn={(c) => c.bzLrgCzCd === parentValue} />
   */
  filterFn?: (item: CodeDetail) => boolean;
}

export type { ComcdSelectProps };

/**
 * Ant Design Select pre-loaded with common code options.
 * Just set cdDmnId — options are pulled from the global comcdStore.
 *
 * Uses useState + store.subscribe instead of useSyncExternalStore to avoid
 * React 19 + Zustand v5 getSnapshot stability issues.
 *
 * @example
 * <ComcdSelect cdDmnId="JBC_CD" style={{ width: '100%' }} />
 */
export default function ComcdSelect({ cdDmnId, value, prefixOption, filterFn, ...rest }: ComcdSelectProps) {
  // Initialize from current store state (no hook, no useSyncExternalStore)
  const [codeList, setCodeList] = useState(
    () => useComcdStore.getState().codes[cdDmnId],
  );

  useEffect(() => {
    // Sync in case store changed between render and effect mount
    let current = useComcdStore.getState().codes[cdDmnId];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCodeList(current);

    // Subscribe to future store changes; only update when our slice changes
    return useComcdStore.subscribe((state) => {
      const next = state.codes[cdDmnId];
      if (next !== current) {
        current = next;
        setCodeList(next);
      }
    });
  }, [cdDmnId]);

  const options = useMemo(() => {
    const list = filterFn ? (codeList ?? []).filter(filterFn) : (codeList ?? []);
    const base = list.map((c) => ({ label: c.cdNm, value: c.cd }));
    if (prefixOption !== undefined) {
      return [{ label: prefixOption, value: '' }, ...base];
    }
    return base;
  }, [codeList, prefixOption, filterFn]);

  return <Select options={options} value={value ?? undefined} {...rest} />;
}
