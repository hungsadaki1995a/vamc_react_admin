import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type PageHeaderSlot = {
  actions?: ReactNode;
  inlineFilters?: ReactNode;
  titleExtra?: ReactNode;
  supportSlotEnabled?: boolean;
  className?: string;
  /** The page draws its own title bar and breadcrumb; the tab's shared header row is not shown. */
  hidden?: boolean;
};

export type PageHeaderSlotSetter = Dispatch<SetStateAction<PageHeaderSlot | null>>;
