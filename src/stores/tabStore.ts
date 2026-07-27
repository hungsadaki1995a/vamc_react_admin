import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tab } from '@/types/tab';
import type { MenuItem } from '@/types/menu';
import { useSettingsStore } from './settingsStore';
import { abortTabRequests } from '@/lib/api/tabRequestRegistry';

interface TabStore {
  tabs: Tab[];
  activeTabKey: string | null;
  maxTabs: number;

  openTab: (menuItem: MenuItem) => void;
  closeTab: (key: string) => void;
  closeOtherTabs: (key: string) => void;
  closeRightTabs: (key: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (key: string) => void;
  pinTab: (key: string) => void;
  unpinTab: (key: string) => void;
  reorderTabs: (fromIdx: number, toIdx: number) => void;
  resetTabs: () => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabKey: null,
      maxTabs: 20,

      openTab: (menuItem: MenuItem) => {
        const { tabs, maxTabs } = get();
        const existingTab = tabs.find((t) => t.menuKey === menuItem.key);

        if (existingTab) {
          set({ activeTabKey: existingTab.key });
          return;
        }

        if (!menuItem.componentPath) return;

        const homeKey = useSettingsStore.getState().homeMenuKey;
        const isHome = menuItem.key === homeKey;

        const newTab: Tab = {
          key: menuItem.key,
          menuKey: menuItem.key,
          title: menuItem.label,
          componentKey: menuItem.componentPath ?? '',
          sceId: menuItem.sceId,
          labelKey: menuItem.labelKey,
          pinned: isHome,
          closable: !isHome,
        };

        const newTabs = [...tabs];

        if (newTabs.length >= maxTabs) {
          const unpinnedIdx = newTabs.findIndex((t) => !t.pinned);
          if (unpinnedIdx !== -1) {
            newTabs.splice(unpinnedIdx, 1);
          }
        }

        newTabs.push(newTab);
        set({ tabs: newTabs, activeTabKey: newTab.key });
      },

      closeTab: (key: string) => {
        const { tabs, activeTabKey } = get();
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx === -1) return;

        const tab = tabs[idx];
        if (tab.pinned) return;

        abortTabRequests(key);

        const newTabs = tabs.filter((t) => t.key !== key);
        let newActiveKey = activeTabKey;

        if (activeTabKey === key) {
          if (newTabs.length > 0) {
            const newIdx = Math.min(idx, newTabs.length - 1);
            newActiveKey = newTabs[newIdx].key;
          } else {
            newActiveKey = null;
          }
        }

        set({ tabs: newTabs, activeTabKey: newActiveKey });
      },

      closeOtherTabs: (key: string) => {
        const { tabs } = get();
        const newTabs = tabs.filter((t) => t.key === key || t.pinned);
        tabs
          .filter((t) => !(t.key === key || t.pinned))
          .forEach((t) => abortTabRequests(t.key));
        set({ tabs: newTabs, activeTabKey: key });
      },

      closeRightTabs: (key: string) => {
        const { tabs, activeTabKey } = get();
        const idx = tabs.findIndex((t) => t.key === key);
        if (idx === -1) return;

        const newTabs = tabs.filter(
          (t, i) => i <= idx || t.pinned
        );
        tabs
          .filter((t, i) => !(i <= idx || t.pinned))
          .forEach((t) => abortTabRequests(t.key));
        const activeStillExists = newTabs.some((t) => t.key === activeTabKey);
        set({
          tabs: newTabs,
          activeTabKey: activeStillExists ? activeTabKey : key,
        });
      },

      closeAllTabs: () => {
        const { tabs } = get();
        const pinnedTabs = tabs.filter((t) => t.pinned);
        tabs.filter((t) => !t.pinned).forEach((t) => abortTabRequests(t.key));
        set({
          tabs: pinnedTabs,
          activeTabKey: pinnedTabs.length > 0 ? pinnedTabs[0].key : null,
        });
      },

      setActiveTab: (key: string) => {
        set({ activeTabKey: key });
      },

      pinTab: (key: string) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.key === key ? { ...t, pinned: true, closable: false } : t
          ),
        }));
      },

      unpinTab: (key: string) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.key === key ? { ...t, pinned: false, closable: true } : t
          ),
        }));
      },

      reorderTabs: (fromIdx: number, toIdx: number) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [moved] = newTabs.splice(fromIdx, 1);
          newTabs.splice(toIdx, 0, moved);
          return { tabs: newTabs };
        });
      },

      // Clear all tabs including pinned — used on logout
      resetTabs: () => {
        set({ tabs: [], activeTabKey: null });
      },
    }),
    {
      name: 'vamc-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabKey: state.activeTabKey,
      }),
    }
  )
);
