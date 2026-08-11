import { memo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

interface StatusDotCellRendererParams extends ICellRendererParams {
  /** status code → color 매핑 (필수). 미매칭 시 기본값 '#d4d4d4' 사용. */
  colorMap: Record<string, string>;
}

/**
 * AG Grid cell renderer — 상태 dot 표시.
 *
 * colorMap을 cellRendererParams로 주입받아 화면별 상태 코드 체계에 대응.
 *
 * @example
 * // PMS301013SC (P/I/C/D 코드):
 * cellRenderer: StatusDotCellRenderer,
 * cellRendererParams: {
 *   colorMap: { P: '#d4d4d4', I: '#44c7ff', C: '#32c968', D: '#FF9500' },
 * },
 *
 * // 숫자 코드 화면:
 * cellRendererParams: {
 *   colorMap: { '0': '#d4d4d4', '1': '#44c7ff', '2': '#32c968', '9': '#FF9500' },
 * },
 */
function StatusDotCellRendererBase({
  value,
  colorMap,
}: StatusDotCellRendererParams) {
  if (value == null) return null;

  const key = String(value);
  const color = colorMap?.[key] ?? '#d4d4d4';

  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * 스크롤/데이터 갱신 시 값이 바뀌지 않은 셀의 재렌더를 막아 깜박임을 줄인다.
 * 그리드가 getRowId 기반 immutable 데이터 모드이므로 value 변경은 항상 새 참조로 감지된다.
 */
export const StatusDotCellRenderer = memo(StatusDotCellRendererBase);
StatusDotCellRenderer.displayName = 'StatusDotCellRenderer';
