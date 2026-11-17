import { Space, type SpaceProps } from 'antd';
import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import ActionButton, { type ActionButtonAction, type ActionButtonProps } from './ActionButton';
import './ActionButtonGroup.css';

export type ActionButtonGroupPreset =
  | 'gridEdit'
  | 'search'
  | 'formEdit'
  | 'modal'
  | 'excelRegister';

export type ActionButtonGroupJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'between';

export interface ActionButtonGroupItem extends ActionButtonProps {
  key: string;
  label?: ReactNode;
  hidden?: boolean;
  order?: number;
}

export interface ActionButtonGroupProps {
  children?: ReactNode;
  className?: string;
  items?: ActionButtonGroupItem[];
  preset?: ActionButtonGroupPreset;
  justify?: ActionButtonGroupJustify;
  size?: SpaceProps['size'];
  align?: SpaceProps['align'];
  wrap?: boolean;
  /** useMenuPermission().canWrite 연동 — false면 쓰기 계열 버튼(addRow/deleteRow/saveChanges/register/excelUpload/upload)을 비활성화 */
  canWrite?: boolean;
}

/** canWrite=false일 때 비활성화되는 쓰기 계열 액션 */
const WRITE_ACTIONS: ActionButtonAction[] = [
  'addRow', 'deleteRow', 'saveChanges', 'register', 'excelUpload', 'upload',
];

function isWriteAction(action?: ActionButtonAction): boolean {
  return !!action && WRITE_ACTIONS.includes(action);
}

const PRESET_ORDER: Record<ActionButtonGroupPreset, ActionButtonAction[]> = {
  search: ['reset', 'search', 'collapse', 'expand'],
  gridEdit: ['excelUpload', 'excelDownload', 'register', 'addRow', 'deleteRow', 'saveChanges'],
  formEdit: ['reset', 'copy', 'deleteRow', 'saveChanges'],
  modal: ['deleteRow', 'cancel', 'close', 'confirm', 'saveChanges'],
  excelRegister: ['excelUpload', 'excelDownload', 'register'],
};

function getActionOrder(action: ActionButtonAction | undefined, preset?: ActionButtonGroupPreset): number {
  if (!preset || !action) return Number.MAX_SAFE_INTEGER;
  const index = PRESET_ORDER[preset].indexOf(action);
  return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

function getItemOrder(item: ActionButtonGroupItem, preset?: ActionButtonGroupPreset): number {
  if (typeof item.order === 'number') return item.order;
  return getActionOrder(item.action, preset);
}

function renderItems(
  items: ActionButtonGroupItem[] | undefined,
  preset?: ActionButtonGroupPreset,
  canWrite?: boolean,
) {
  if (!items) return null;

  return [...items]
    .filter((item) => !item.hidden)
    .sort((left, right) => getItemOrder(left, preset) - getItemOrder(right, preset))
    .map(({ key, label, hidden: _hidden, order: _order, ...buttonProps }) => (
      <ActionButton
        key={key}
        {...buttonProps}
        disabled={buttonProps.disabled || (canWrite === false && isWriteAction(buttonProps.action))}
      >
        {label}
      </ActionButton>
    ));
}

function renderChildren(children: ReactNode, preset?: ActionButtonGroupPreset, canWrite?: boolean) {
  const childItems = Children.toArray(children).map((child) => {
    if (
      canWrite === false
      && isValidElement<ActionButtonProps>(child)
      && isWriteAction(child.props.action)
    ) {
      return cloneElement(child, { disabled: child.props.disabled || true });
    }
    return child;
  });
  if (!preset) return childItems;

  return childItems
    .map((child, index) => {
      const action = isValidElement<ActionButtonProps>(child) ? child.props.action : undefined;
      return { child, index, order: getActionOrder(action, preset) };
    })
    .sort((left, right) => (left.order - right.order) || (left.index - right.index))
    .map(({ child }) => child);
}

export default function ActionButtonGroup({
  children,
  className,
  items,
  preset,
  justify = 'end',
  size = 6,
  align = 'center',
  wrap = true,
  canWrite,
}: ActionButtonGroupProps) {
  const rootClassName = [
    'ds-action-button-group',
    `ds-action-button-group--justify-${justify}`,
    preset ? `ds-action-button-group--preset-${preset}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Space className={rootClassName} size={size} align={align} wrap={wrap}>
      {items ? renderItems(items, preset, canWrite) : renderChildren(children, preset, canWrite)}
    </Space>
  );
}
