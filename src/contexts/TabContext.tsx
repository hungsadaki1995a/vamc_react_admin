import { createContext, useContext } from 'react';
import type { Tab } from '@/types/tab';

interface TabContextValue {
  tab: Tab;
}

export const TabContext = createContext<TabContextValue | null>(null);

/** Returns the current tab's context — available inside any page component rendered by TabContent. */
export function useTabContext(): TabContextValue | null {
  return useContext(TabContext);
}
