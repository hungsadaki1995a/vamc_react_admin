import type { CellClassParams, CellStyle, ColGroupDef } from 'ag-grid-community';
import type { ColDefEx } from './GridTable';

/**
 * Extracts editable field keys from columnDefs (including nested ColGroupDef children).
 * Columns with `editable: false` are excluded.
 * `context.pairedFields` on ColDefEx entries are also collected (e.g. ickId1 paired with ickNm1).
 */
export function getEditableKeysFromCols<T>(
  cols: (ColDefEx<T> | ColGroupDef<T>)[],
): (keyof T)[] {
  const keys: (keyof T)[] = [];
  for (const col of cols) {
    if ('children' in col) {
      keys.push(...getEditableKeysFromCols<T>(col.children as (ColDefEx<T> | ColGroupDef<T>)[]));
    } else if (col.field && col.editable !== false) {
      keys.push(col.field as unknown as keyof T);
      const paired = (col as ColDefEx<T>).context?.pairedFields;
      if (paired) keys.push(...paired);
    }
  }
  return keys;
}

/**
 * Reverts a dirty row back to _op:'ORG' if all editable fields match the original snapshot.
 * Call at the end of handleCellValueChanged after computing finalRow.
 */
export function revertIfOriginal<T extends { _op: string; _isNew?: boolean }>(
  finalRow: T,
  orig: T | undefined,
  editableKeys: (keyof T)[],
): T {
  if (
    !finalRow._isNew &&
    orig &&
    editableKeys.every((k) => (finalRow[k] ?? null) === (orig[k] ?? null))
  ) {
    return { ...finalRow, _op: 'ORG' };
  }
  return finalRow;
}

/**
 * Returns a CSS class name for the row based on its `_op` dirty state.
 * Used with GridTable's `getRowClass` prop so that GridTable.css `!important`
 * rules can guarantee the dirty background even when AG Grid selection applies
 * a per-cell inline `background-color` override (observed in non-pinned grids).
 */
export function getDirtyRowClass(data: unknown): string | undefined {
  const op = (data as Record<string, unknown>)?._op;
  if (op === 'NEW') return 'ds-dirty-insert';
  if (op === 'MOD') return 'ds-dirty-update';
  if (op === 'DEL') return 'ds-dirty-delete';
  return undefined;
}

/**
 * Returns a cell background style based on `_op` dirty state.
 * Use as colDef.cellStyle for cell-level dirty highlighting.
 * Colors: INSERT=green, UPDATE=orange, DELETE=red+strikethrough
 */
export function getDirtyCellStyle<T>(params: CellClassParams<T>): CellStyle {
  const op = (params.data as Record<string, unknown>)?._op;
  // AG Grid는 cellStyle 함수가 생략한 속성을 지우지 않는다. DEL에서 set한 textDecoration/color를
  // 非DEL 전환(예: 되돌리기 DEL→ORG) 시 명시적으로 리셋하지 않으면 인라인 삭선/색이 잔존한다.
  // → 모든 상태에서 textDecoration/color를 항상 반환(리셋 포함)한다.
  if (op === 'NEW') return { background: 'rgba(82,196,26,.12)', textDecoration: 'none', color: '' };
  if (op === 'MOD') return { background: 'rgba(250,173,20,.12)', textDecoration: 'none', color: '' };
  if (op === 'DEL') return { background: 'rgba(255,77,79,.08)', textDecoration: 'line-through', color: 'var(--ant-color-text-disabled)' };
  return { background: '', textDecoration: 'none', color: '' };
}

/** getDirtyCellStyle + textAlign: 'left' */
export function getDirtyCellStyleLeft<T>(params: CellClassParams<T>): CellStyle {
  return { ...getDirtyCellStyle(params), textAlign: 'left' };
}

/** getDirtyCellStyle + textAlign: 'center' */
export function getDirtyCellStyleCentered<T>(params: CellClassParams<T>): CellStyle {
  return { ...getDirtyCellStyle(params), textAlign: 'center' };
}

/** getDirtyCellStyle + textAlign: 'right' */
export function getDirtyCellStyleRight<T>(params: CellClassParams<T>): CellStyle {
  return { ...getDirtyCellStyle(params), textAlign: 'right' };
}
