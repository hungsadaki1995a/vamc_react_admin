import { createContext, useContext, useLayoutEffect, type Dispatch, type ReactNode, type SetStateAction } from 'react';

export interface PageHeaderSlot {
  actions?: ReactNode;
  inlineFilters?: ReactNode;
  titleExtra?: ReactNode;
  supportSlotEnabled?: boolean;
  className?: string;
}

export type PageHeaderSlotSetter = Dispatch<SetStateAction<PageHeaderSlot | null>>;

export const PageHeaderSlotContext = createContext<PageHeaderSlotSetter | null>(null);

function isSameSlot(a: PageHeaderSlot | null, b: PageHeaderSlot | null) {
  return a?.actions === b?.actions
    && a?.inlineFilters === b?.inlineFilters
    && a?.titleExtra === b?.titleExtra
    && a?.supportSlotEnabled === b?.supportSlotEnabled
    && a?.className === b?.className;
}

export function usePageHeaderSlot(slot: PageHeaderSlot | null) {
  const setSlot = useContext(PageHeaderSlotContext);

  useLayoutEffect(() => {
    if (!setSlot) return undefined;

    setSlot((prev) => (isSameSlot(prev, slot) ? prev : slot));

    return () => {
      setSlot((prev) => (isSameSlot(prev, slot) ? null : prev));
    };
  }, [setSlot, slot]);
}
