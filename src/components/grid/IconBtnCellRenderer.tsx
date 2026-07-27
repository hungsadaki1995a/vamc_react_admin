import { memo, type ReactNode } from 'react';
import { Button } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import type { ICellRendererParams } from 'ag-grid-community';

interface IconBtnCellRendererParams<TData = unknown> extends ICellRendererParams<TData> {
  /** Row 데이터를 받아 호출되는 클릭 핸들러. 안정 ref 콜백 권장. */
  onClick: (data: TData) => void;
  /** 기본값: <PlusCircleOutlined /> */
  icon?: ReactNode;
  /** 정적 또는 row 기반 조건부 비활성화 */
  disabled?: boolean | ((data: TData) => boolean);
}

/**
 * AG Grid cell renderer — 아이콘 버튼 표시.
 *
 * 레거시 slickCustomFormatter.regButton 대응 공통 컴포넌트.
 * PlusCircleOutlined 아이콘을 기본으로 표시하며, icon/disabled 파라미터로 커스터마이즈 가능.
 *
 * @example
 * const handleRef = useRef(handleClick);
 * handleRef.current = handleClick;
 *
 * // columnDef:
 * cellRenderer: IconBtnCellRenderer,
 * cellRendererParams: {
 *   onClick: (data) => handleRef.current(data),
 * },
 */
function IconBtnCellRendererBase<TData = unknown>({
  data,
  onClick,
  icon,
  disabled,
}: IconBtnCellRendererParams<TData>) {
  if (!data) return null;

  const isDisabled =
    typeof disabled === 'function' ? disabled(data) : (disabled ?? false);

  return (
    <Button
      size="small"
      type="text"
      icon={icon ?? <PlusCircleOutlined />}
      disabled={isDisabled}
      onClick={() => { if (!isDisabled) onClick(data); }}
      style={{ padding: '0 4px' }}
    />
  );
}

/**
 * 값이 바뀌지 않은 셀의 재렌더를 막아 스크롤/갱신 시 깜박임을 줄인다.
 * onClick 은 memoized columnDefs 에서 넘어오는 안정 참조라 memo 가 유효하게 동작한다.
 * memo 는 제네릭 시그니처를 잃으므로 원본 함수 타입으로 캐스팅해 호출부 타입을 유지한다.
 */
export const IconBtnCellRenderer = memo(IconBtnCellRendererBase) as typeof IconBtnCellRendererBase;
