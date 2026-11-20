import type { ButtonProps } from 'antd';
import type { SpaceProps } from 'antd';
import type { ReactNode } from 'react';

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

export type ActionButtonProps = ButtonProps & {
  action?: ActionButtonAction;
  intent?: ActionButtonIntent;
};

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

export type ActionButtonGroupItem = ActionButtonProps & {
  key: string;
  label?: ReactNode;
  hidden?: boolean;
  order?: number;
};

export type ActionButtonGroupProps = {
  children?: ReactNode;
  className?: string;
  items?: ActionButtonGroupItem[];
  preset?: ActionButtonGroupPreset;
  justify?: ActionButtonGroupJustify;
  size?: SpaceProps['size'];
  align?: SpaceProps['align'];
  wrap?: boolean;
  /** Synced with useMenuPermission().canWrite — when false, disables write actions (addRow/deleteRow/saveChanges/register/excelUpload/upload) */
  canWrite?: boolean;
};
