import { useState, useEffect } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import type { CustomCellEditorProps } from 'ag-grid-react';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import { useComcdStore } from '@/stores/comcdStore';
import type { CodeDetail } from '@/api/common';

// ── Cell Renderer ─────────────────────────────────────────────────────────────

export interface ComcdCellRendererParams extends ICellRendererParams {
  cdDmnId: string;
  /** Shown when value is '' (same as ComcdSelect.prefixOption) */
  prefixOption?: string;
}

/**
 * AG Grid cell renderer — displays the code name for the stored code value.
 *
 * Uses getState() + subscribe pattern (same as ComcdSelect) instead of a Zustand
 * selector hook, to avoid per-cell subscriptions that add overhead to AG Grid's
 * internal postMessage pipeline.
 *
 * @example
 * {
 *   field: 'jbcCd',
 *   headerName: '직책',
 *   cellRenderer: ComcdSelectCellRenderer,
 *   cellRendererParams: { cdDmnId: 'JBC_CD' },
 * }
 */
export function ComcdSelectCellRenderer({ value, cdDmnId, prefixOption }: ComcdCellRendererParams) {
  const [label, setLabel] = useState(() => {
    if (value === '' || value === null || value === undefined) return prefixOption ?? '';
    return useComcdStore.getState().getCodeName(cdDmnId, value);
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value === '' || value === null || value === undefined) { setLabel(prefixOption ?? ''); return; }

    // Catch up on changes that occurred between render and effect mount
    setLabel(useComcdStore.getState().getCodeName(cdDmnId, value));

    let current = useComcdStore.getState().codes[cdDmnId];
    return useComcdStore.subscribe((state) => {
      const next = state.codes[cdDmnId];
      if (next !== current) {
        current = next;
        setLabel(state.getCodeName(cdDmnId, value));
      }
    });
  }, [cdDmnId, value, prefixOption]);

  return <span>{label}</span>;
}

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface ComcdCellEditorProps extends CustomCellEditorProps {
  cdDmnId: string;
  /**
   * Prepend a blank option at the top of the list (same as ComcdSelect.prefixOption).
   * Value is always ''. Pass the label text: '전체', '선택', or '' for blank.
   */
  prefixOption?: string;
  /**
   * Optional filter for cascading cell editors.
   * Use via cellEditorParams as a function to access row data:
   * @example
   * cellEditorParams: (params) => ({
   *   cdDmnId: 'CHILD_CD',
   *   filterFn: (code: CodeDetail) => code.bzLrgCzCd === params.data.parentCd,
   * })
   */
  filterFn?: (item: CodeDetail) => boolean;
}

/**
 * AG Grid in-cell editor — renders ComcdSelect dropdown.
 *
 * Uses CustomCellEditorProps (AG Grid React hook pattern) — same as SelectCellEditor.
 * No forwardRef/useImperativeHandle needed.
 *
 * @example
 * {
 *   field: 'jbcCd',
 *   headerName: '직책',
 *   editable: true,
 *   cellRenderer: ComcdSelectCellRenderer,
 *   cellRendererParams: { cdDmnId: 'JBC_CD' },
 *   cellEditor: ComcdSelectCellEditor,
 *   cellEditorParams: { cdDmnId: 'JBC_CD' },
 * }
 */
export function ComcdSelectCellEditor({
  value,
  onValueChange,
  stopEditing,
  cdDmnId,
  prefixOption,
  filterFn,
}: ComcdCellEditorProps) {
  const handleChange = (v: unknown) => {
    onValueChange(v as string);
    stopEditing();
  };

  return (
    <ComcdSelect
      cdDmnId={cdDmnId}
      value={value ?? undefined}
      onChange={handleChange}
      prefixOption={prefixOption}
      filterFn={filterFn}
      autoFocus
      defaultOpen
      style={{ width: '100%' }}
    />
  );
}
