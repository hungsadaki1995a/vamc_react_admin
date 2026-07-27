import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DownloadOutlined, DownOutlined, FileExcelOutlined, UploadOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import ActionButton, { type ActionButtonProps } from '@/components/common/ActionButton';

export type ExcelDropdownItemType = 'upload' | 'template' | 'download' | 'custom';

export interface ExcelDropdownButtonItem {
  key: string;
  label: ReactNode;
  type?: ExcelDropdownItemType;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  hidden?: boolean;
  order?: number;
}

export interface ExcelDropdownButtonProps extends Omit<ActionButtonProps, 'children' | 'onClick'> {
  label?: ReactNode;
  items: ExcelDropdownButtonItem[];
  trigger?: ('click' | 'hover' | 'contextMenu')[];
}

function getItemIcon(type: ExcelDropdownItemType): ReactNode {
  switch (type) {
    case 'upload':
      return <UploadOutlined />;
    case 'template':
      return <FileExcelOutlined />;
    case 'download':
      return <DownloadOutlined />;
    default:
      return undefined;
  }
}

const DEFAULT_ITEM_ORDER: Record<ExcelDropdownItemType, number> = {
  template: 0,
  upload: 1,
  download: 2,
  custom: 3,
};

export function ExcelDropdownButton({
  label = '엑셀',
  items,
  trigger = ['click'],
  action = 'excelDownload',
  disabled,
  ...buttonProps
}: ExcelDropdownButtonProps) {
  const menuItems = items
    .filter((item) => !item.hidden)
    .map(({ type = 'custom', icon, hidden: _hidden, order, ...item }, index) => ({
      item: {
        ...item,
        icon: icon ?? getItemIcon(type),
      },
      index,
      order: order ?? DEFAULT_ITEM_ORDER[type],
    }))
    .sort((left, right) => (left.order - right.order) || (left.index - right.index))
    .map(({ item }) => item) as MenuProps['items'];
  const isDisabled = disabled || !menuItems || menuItems.length === 0;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={trigger} disabled={isDisabled}>
      <ActionButton {...buttonProps} action={action} disabled={isDisabled}>
        {label} <DownOutlined />
      </ActionButton>
    </Dropdown>
  );
}

export default ExcelDropdownButton;
