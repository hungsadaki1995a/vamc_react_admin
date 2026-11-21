import type { ReactNode } from 'react';

export type ContentTabItem<T extends string = string> = {
  key: T;
  label: ReactNode;
  disabled?: boolean;
};

export type ContentTabVariant = 'underline' | 'boxed' | 'segmented';

export type ContentTabsProps<T extends string = string> = {
  items: ContentTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  variant?: ContentTabVariant;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
};
