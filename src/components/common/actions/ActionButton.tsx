import { Button, type ButtonProps } from 'antd';
import {
  CloseOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import styles from './action-button.module.scss';
import type {
  ActionButtonAction,
  ActionButtonAppearance,
  ActionButtonIntent,
  ActionButtonProps,
} from '@/types/action-button';

const INTENT_CLASSES: Record<ActionButtonIntent, string> = {
  primary: styles.intentPrimary,
  secondary: styles.intentSecondary,
  quaternary: styles.intentQuaternary,
  default: styles.intentQuaternary,
  danger: styles.intentDanger,
  excel: styles.intentExcel,
  text: styles.intentText,
  icon: styles.intentIcon,
};

type ActionDefaults = {
  intent: ActionButtonIntent;
  appearance?: ActionButtonAppearance;
  icon?: ButtonProps['icon'];
};

const ACTION_DEFAULTS: Record<ActionButtonAction, ActionDefaults> = {
  // Filter [Reset] / [Search]: one look on every screen — set the colour here, never per call site.
  reset: { intent: 'primary', appearance: 'outlined', icon: <ReloadOutlined /> },
  search: { intent: 'primary', appearance: 'filled', icon: <SearchOutlined /> },
  copy: { intent: 'quaternary' },
  addRow: { intent: 'quaternary' },
  deleteRow: { intent: 'danger' },
  saveChanges: { intent: 'primary' },
  excelDownload: { intent: 'excel', icon: <FileExcelOutlined /> },
  excelUpload: { intent: 'excel', icon: <UploadOutlined /> },
  register: { intent: 'primary' },
  cancel: { intent: 'quaternary' },
  close: { intent: 'quaternary', icon: <CloseOutlined /> },
  confirm: { intent: 'primary' },
  download: { intent: 'quaternary', icon: <DownloadOutlined /> },
  upload: { intent: 'quaternary', icon: <UploadOutlined /> },
  collapse: { intent: 'icon' },
  expand: { intent: 'icon' },
};

function resolveDefaultAppearance(intent: ActionButtonIntent): ActionButtonAppearance {
  return intent === 'primary' || intent === 'secondary' ? 'filled' : 'outlined';
}

/** Design-system button matching Figma Button / Button-icon / Button-text specs (4042:25854). */
export default function ActionButton({
  action,
  intent,
  appearance,
  className,
  icon,
  type,
  danger,
  size,
  ...props
}: ActionButtonProps) {
  const defaults = action ? ACTION_DEFAULTS[action] : undefined;
  const resolvedIntent = intent ?? defaults?.intent ?? 'quaternary';
  // An explicit intent brings its own default appearance; otherwise the action's.
  const resolvedAppearance =
    appearance ?? (intent ? undefined : defaults?.appearance) ?? resolveDefaultAppearance(resolvedIntent);
  const resolvedType =
    type ??
    (resolvedIntent === 'primary' && resolvedAppearance === 'filled'
      ? 'primary'
      : resolvedIntent === 'text'
        ? 'link'
        : undefined);

  const rootClassName = [
    styles.root,
    INTENT_CLASSES[resolvedIntent],
    resolvedAppearance === 'filled' ? styles.appearanceFilled : styles.appearanceOutlined,
    size === 'small' ? styles.sizeSmall : styles.sizeDefault,
    action === 'excelUpload' ? styles.excelUpload : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Button
      {...props}
      size={size}
      className={rootClassName}
      type={resolvedType}
      danger={danger ?? resolvedIntent === 'danger'}
      icon={icon ?? defaults?.icon}
    />
  );
}
