import { memo, type ReactNode } from 'react';
import { Button } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import type { ICellRendererParams } from 'ag-grid-community';

interface IconBtnCellRendererParams<TData = unknown> extends ICellRendererParams<TData> {
  /** Click handler invoked with row data. A stable ref callback is recommended. */
  onClick: (data: TData) => void;
  /** Default: <PlusCircleOutlined /> */
  icon?: ReactNode;
  /** Static or row-based conditional disabling */
  disabled?: boolean | ((data: TData) => boolean);
}

/**
 * AG Grid cell renderer — displays an icon button.
 *
 * Displays PlusCircleOutlined by default; customizable via icon/disabled parameters.
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
 * Prevents unnecessary re-renders of unchanged cells to reduce flicker during scroll/refresh.
 * Because onClick is a stable reference from memoized columnDefs, memo works effectively.
 * Since memo drops generic signatures, cast back to the original function type to preserve caller types.
 */
export const IconBtnCellRenderer = memo(IconBtnCellRendererBase) as typeof IconBtnCellRendererBase;
