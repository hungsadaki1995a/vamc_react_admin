import { createContext, useContext, useLayoutEffect } from 'react';
import type { PageHeaderSlot, PageHeaderSlotSetter } from '@/types/layout';

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
