import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type PageHeaderSlot = {
  actions?: ReactNode;
  inlineFilters?: ReactNode;
  titleExtra?: ReactNode;
  supportSlotEnabled?: boolean;
  className?: string;
};

export type PageHeaderSlotSetter = Dispatch<SetStateAction<PageHeaderSlot | null>>;
