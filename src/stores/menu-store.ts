import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem, MenuTreeItem } from '@/types/menu';
import { fetchAuthMenuResult } from '@/api/common/my-menu-api';
import { idbGet, idbSet, idbDelete } from '@/lib/cache/idb-cache';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/project-store';
import { useLocaleStore, type LocaleKey } from '@/stores/locale-store';
import { mapMenuTreesToMenuItems } from '@/utils/menu-tree-utils';

interface MenuStore {
  activeRailKey: string | null;
  flyoutVisible: boolean;
  openKeys: string[];
  selectedKey: string | null;
  menuTrees: MenuTreeItem[];
  menuLocale: LocaleKey | null;
  serverMenus: MenuItem[];
  menuLoading: boolean;
  setOpenKeys: (keys: string[]) => void;
  setSelectedKey: (key: string | null) => void;
  setActiveRailKey: (key: string | null) => void;
  setFlyoutVisible: (visible: boolean) => void;
  toggleFlyout: (railKey: string) => void;
  closeFlyout: () => void;
  toggleSidebar: () => void;
  setMenuTrees: (trees: MenuTreeItem[]) => void;
  setServerMenus: (menus: MenuItem[]) => void;
  clearServerMenus: () => void;
  resetNavState: () => void;
  /**
   * SWR: if cache exists, display immediately → always revalidate in background
   * If no cache, fetch from server and save to IDB
   */
  loadMenuForProject: () => Promise<void>;
  /**
   * Clear IDB cache and immediately re-fetch after menu save/delete
   */
  invalidateMenuCache: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      activeRailKey: null,
      flyoutVisible: false,
      openKeys: [],
      selectedKey: null,
      menuTrees: [],
      menuLocale: null,
      serverMenus: [],
      menuLoading: false,

      setOpenKeys: (keys) => set({ openKeys: keys }),
      setSelectedKey: (key) => set({ selectedKey: key }),
      setActiveRailKey: (key) => set({ activeRailKey: key }),
      setFlyoutVisible: (visible) => set({ flyoutVisible: visible }),

      toggleFlyout: (railKey: string) => {
        const { activeRailKey, flyoutVisible } = get();
        if (!flyoutVisible) {
          set({ activeRailKey: railKey, flyoutVisible: true, openKeys: [] });
        } else if (activeRailKey === railKey) {
          // no-op
        } else {
          set({ activeRailKey: railKey, openKeys: [] });
        }
      },

      closeFlyout: () => set({ flyoutVisible: false }),

      toggleSidebar: () => {
        const { flyoutVisible, activeRailKey } = get();
        if (flyoutVisible) {
          set({ flyoutVisible: false });
        } else {
          set({ flyoutVisible: true, activeRailKey: activeRailKey });
        }
      },

      setMenuTrees: (trees) =>
        set({
          menuTrees: trees,
          menuLocale: useLocaleStore.getState().locale,
          serverMenus: mapMenuTreesToMenuItems(trees),
        }),
      setServerMenus: (menus) => set({ serverMenus: menus }),
      clearServerMenus: () => set({ menuTrees: [], menuLocale: null, serverMenus: [] }),
      resetNavState: () => set({ activeRailKey: null, flyoutVisible: false, openKeys: [], selectedKey: null }),

      loadMenuForProject: async () => {
        if (get().menuLoading) return;

        const userId    = useAuthStore.getState().user?.usrId ?? '_';
        const projectId = useProjectStore.getState().activeProject?.id ?? '_';
        const locale    = useLocaleStore.getState().locale;
        const cacheKey  = `menus:${userId}:${projectId}:${locale}`;

        // Only reuse login menuTrees when they were fetched for the active locale.
        const existingTrees = get().menuTrees;
        if (existingTrees.length > 0 && get().menuLocale === locale) {
          if (get().serverMenus.length === 0) {
            set({ serverMenus: mapMenuTreesToMenuItems(existingTrees) });
          }
          return;
        }

        const cached = await idbGet<{ trees: MenuTreeItem[]; items: MenuItem[] } | MenuItem[]>(cacheKey);
        if (cached) {
          if (Array.isArray(cached.data)) {
            set({ serverMenus: cached.data });
          } else {
            set({ menuTrees: cached.data.trees, menuLocale: locale, serverMenus: cached.data.items });
          }
          // Always revalidate in background (SWR)
          fetchAuthMenuResult()
            .then((fresh) => {
              set({ menuTrees: fresh.trees, menuLocale: locale, serverMenus: fresh.items });
              idbSet(cacheKey, fresh);
            })
            .catch(() => { /* Keep cached menus on error */ });
          return;
        }

        // No cache: show loading and fetch from server
        set({ menuLoading: true });
        try {
          const fresh = await fetchAuthMenuResult();
          set({ menuTrees: fresh.trees, menuLocale: locale, serverMenus: fresh.items, menuLoading: false });
          idbSet(cacheKey, fresh);
        } catch {
          set({ menuLoading: false });
        }
      },

      invalidateMenuCache: async () => {
        const userId    = useAuthStore.getState().user?.usrId ?? '_';
        const projectId = useProjectStore.getState().activeProject?.id ?? '_';
        const locale    = useLocaleStore.getState().locale;
        const cacheKey  = `menus:${userId}:${projectId}:${locale}`;
        await idbDelete(cacheKey);
        // Reset menuLoading guard and immediately re-fetch
        set({ menuLoading: false });
        get().loadMenuForProject();
      },
    }),
    {
      name: 'vamc-menu-trees',
      partialize: (state) => ({ menuTrees: state.menuTrees, menuLocale: state.menuLocale }),
      onRehydrateStorage: () => (state) => {
        if (state?.menuTrees?.length) {
          state.serverMenus = mapMenuTreesToMenuItems(state.menuTrees);
        }
      },
    },
  ),
);
