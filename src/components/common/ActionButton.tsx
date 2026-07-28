import { Button, type ButtonProps } from 'antd';
import {
  CloseOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import './ActionButton.css';

export type ActionButtonAction =
  | 'reset'
  | 'search'
  | 'copy'
  | 'addRow'
  | 'deleteRow'
  | 'saveChanges'
  | 'excelDownload'
  | 'excelUpload'
  | 'register'
  | 'cancel'
  | 'close'
  | 'confirm'
  | 'download'
  | 'upload'
  | 'collapse'
  | 'expand';

export type ActionButtonIntent =
  | 'default'
  | 'primary'
  | 'danger'
  | 'excel'
  | 'text'
  | 'icon';

interface ActionDefaults {
  intent: ActionButtonIntent;
  icon?: ButtonProps['icon'];
}

const ACTION_DEFAULTS: Record<ActionButtonAction, ActionDefaults> = {
  reset: { intent: 'default', icon: <ReloadOutlined /> },
  search: { intent: 'default', icon: <SearchOutlined /> },
  copy: { intent: 'default' },
  addRow: { intent: 'default' },
  deleteRow: { intent: 'danger' },
  saveChanges: { intent: 'primary' },
  excelDownload: { intent: 'excel', icon: <FileExcelOutlined /> },
  excelUpload: { intent: 'excel', icon: <UploadOutlined /> },
  register: { intent: 'default' },
  cancel: { intent: 'default' },
  close: { intent: 'default', icon: <CloseOutlined /> },
  confirm: { intent: 'primary' },
  download: { intent: 'default', icon: <DownloadOutlined /> },
  upload: { intent: 'default', icon: <UploadOutlined /> },
  collapse: { intent: 'icon' },
  expand: { intent: 'icon' },
};

export interface ActionButtonProps extends ButtonProps {
  action?: ActionButtonAction;
  intent?: ActionButtonIntent;
}

export default function ActionButton({
  action,
  intent,
  className,
  icon,
  type,
  danger,
  ...props
}: ActionButtonProps) {
  const defaults = action ? ACTION_DEFAULTS[action] : undefined;
  const resolvedIntent = intent ?? defaults?.intent ?? 'default';
  const resolvedType = type
    ?? (resolvedIntent === 'primary' ? 'primary' : resolvedIntent === 'text' ? 'link' : undefined);
  const rootClassName = [
    'ds-action-button',
    `ds-action-button--intent-${resolvedIntent}`,
    action ? `ds-action-button--${action}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Button
      {...props}
      className={rootClassName}
      type={resolvedType}
      danger={danger ?? resolvedIntent === 'danger'}
      icon={icon ?? defaults?.icon}
    />
  );
}
