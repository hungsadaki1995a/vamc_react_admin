import { useState, useEffect, useRef } from 'react';
import { AutoComplete } from 'antd';
import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import type { CustomCellEditorProps } from 'ag-grid-react';
import type { SearchSelectOption, SearchSelectValue } from '@/components/inputs/SearchSelectField';

// ── Value Formatter ────────────────────────────────────────────────────────────

/**
 * AG Grid valueFormatter for SearchSelectValue columns.
 *
 * Required to suppress AG Grid warning #48 ("Cell data type is 'object' but
 * no Value Formatter has been provided"). Also enables correct text output for
 * clipboard copy, CSV export, and floating filter.
 *
 * @example
 * {
 *   field: 'dept',
 *   cellRenderer: SearchSelectCellRenderer,
 *   valueFormatter: searchSelectValueFormatter,
 *   cellEditor: SearchSelectCellEditor,
 *   cellEditorParams: { ... },
 * }
 */
export function searchSelectValueFormatter(
  params: ValueFormatterParams,
): string {
  const val = params.value as SearchSelectValue | string | null | undefined;
  return val && typeof val === 'object' ? val.label : (val ?? '');
}

// ── Cell Renderer ─────────────────────────────────────────────────────────────

/**
 * AG Grid cell renderer — shows only the label (name) of a SearchSelectValue.
 *
 * Accepts:
 *   - { label, value } — displays label
 *   - plain string     — displays as-is
 *
 * Always pair with searchSelectValueFormatter to suppress AG Grid warning #48.
 */
export function SearchSelectCellRenderer(params: ICellRendererParams) {
  const val = params.value as SearchSelectValue | string | null | undefined;
  const label = val && typeof val === 'object' ? val.label : (val ?? '');
  return (
    <span
      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
    >
      {label}
    </span>
  );
}

// ── Cell Editor ───────────────────────────────────────────────────────────────

interface SearchSelectCellEditorProps extends CustomCellEditorProps {
  /** Async option loader (called on every keystroke) */
  fetchOptions?: (keyword: string) => Promise<SearchSelectOption[]>;
  /** Static option list (used when fetchOptions is not provided) */
  staticOptions?: SearchSelectOption[];
}

/**
 * AG Grid in-cell editor — AutoComplete with fetchOptions or staticOptions.
 *
 * Uses CustomCellEditorProps (AG Grid React hook pattern) — same as SelectCellEditor,
 * DateCellEditor, etc. No forwardRef/useImperativeHandle needed.
 *
 * onValueChange + stopEditing replace the manual getValue()/isPopup() approach.
 * getPopupContainer renders the dropdown into document.body to escape overflow:hidden.
 *
 * @example
 * {
 *   field: 'dept',
 *   headerName: '부서',
 *   editable: true,
 *   cellRenderer: SearchSelectCellRenderer,
 *   cellEditor: SearchSelectCellEditor,
 *   cellEditorParams: {
 *     fetchOptions: async (kw) => {
 *       const list = await getOrgList({ orgNm: kw });
 *       return list.map(o => ({ label: o.orgNm, value: o.orgId }));
 *     },
 *   },
 * }
 */
export function SearchSelectCellEditor({
  value,
  onValueChange,
  stopEditing,
  fetchOptions,
  staticOptions,
}: SearchSelectCellEditorProps) {
  const initial = value as SearchSelectValue | null;
  const [acText, setAcText] = useState(initial?.label ?? '');
  const [acOptions, setAcOptions] = useState<SearchSelectOption[]>([]);

  // Refs hold the values read inside the native event listener.
  // React state closures inside useEffect([],...) would be stale — refs are always current.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const acOptionsRef = useRef<SearchSelectOption[]>([]);
  const dropdownOpenRef = useRef(false);
  const acActiveIndexRef = useRef(-1);

  // Native keydown listener registered on the wrapper div.
  //
  // WHY NATIVE instead of React onKeyDown:
  //   React synthetic events fire at the React root container (the topmost DOM node).
  //   AG Grid registers its own native listeners on ag-cell / ag-cell-editor-wrapper,
  //   which are ABOVE our wrapper div but BELOW the React root in the DOM tree.
  //   Bubbling order: input → [wrapper div] → ag-cell (AG Grid) → React root
  //   → AG Grid intercepts Enter via native listener and calls stopEditing() with the
  //     old value BEFORE React's onKeyDown on our wrapper div can fire.
  //   → A native listener on the wrapper div fires before ag-cell, letting us commit
  //     the correct value and stopPropagation first.
  //
  // Arrow keys: we update acActiveIndexRef but do NOT stopPropagation — AG Grid passes
  //   arrows through when an editor is active, and AutoComplete needs them for visual
  //   highlight navigation (processed later at the React root stage).
  // Enter (option highlighted): commit + stopPropagation before AG Grid can interfere.
  // Enter (no option): let bubble → AG Grid stops editing normally.
  // Escape: let bubble → AG Grid cancels edit, AutoComplete closes dropdown.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onNativeKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        acActiveIndexRef.current = Math.min(
          acActiveIndexRef.current + 1,
          acOptionsRef.current.length - 1,
        );
      } else if (e.key === 'ArrowUp') {
        acActiveIndexRef.current = Math.max(acActiveIndexRef.current - 1, -1);
      } else if (e.key === 'Enter') {
        const idx = acActiveIndexRef.current;
        const opts = acOptionsRef.current;
        if (dropdownOpenRef.current && idx >= 0 && idx < opts.length) {
          e.stopPropagation(); // Prevent AG Grid from committing stale value
          e.preventDefault();  // Prevent AutoComplete double-handling
          const opt = opts[idx];
          onValueChange({ label: opt.label, value: opt.value });
          acActiveIndexRef.current = -1;
          stopEditing();
        }
        // No option highlighted: fall through → AG Grid stops editing normally
      }
      // Escape: fall through → AG Grid cancels edit (desired), AutoComplete closes dropdown
    };
    el.addEventListener('keydown', onNativeKeyDown);
    return () => el.removeEventListener('keydown', onNativeKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // onValueChange/stopEditing are stable AG Grid refs — empty deps is safe

  const handleSearch = async (text: string) => {
    setAcText(text);
    if (!text) {
      onValueChange(null);
      acOptionsRef.current = [];
      acActiveIndexRef.current = -1;
      setAcOptions([]);
      return;
    }
    const source = fetchOptions
      ? await fetchOptions(text)
      : (staticOptions ?? []).filter((o) =>
          o.label.toLowerCase().includes(text.toLowerCase()) ||
          o.value.toLowerCase().includes(text.toLowerCase()),
        );
    acOptionsRef.current = source;
    acActiveIndexRef.current = -1;
    setAcOptions(source);
  };

  // Mouse click selection — still handled via React onSelect
  const handleSelect = (_val: string, option: { label: React.ReactNode; value: string }) => {
    const label = String(option.label);
    setAcText(label);
    onValueChange({ label, value: option.value });
    acOptionsRef.current = [];
    acActiveIndexRef.current = -1;
    setAcOptions([]);
    stopEditing();
  };

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
    >
      <AutoComplete
        value={acText}
        options={acOptions.map((o) => ({ label: o.label, value: o.value }))}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onOpenChange={(open) => { dropdownOpenRef.current = open; }}
        autoFocus
        // Render dropdown into document.body to escape AG Grid's overflow:hidden
        getPopupContainer={() => document.body}
        styles={{ popup: { root: { zIndex: 9999 } } }}
        style={{ width: '100%' }}
        placeholder="검색어 입력"
      />
    </div>
  );
}
