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
   * SWR: 캐시 있으면 즉시 표시 → 항상 백그라운드 재검증
   * 캐시 없으면 서버 fetch 후 IDB 저장
   */
  loadMenuForProject: () => Promise<void>;
  /**
   * 메뉴 저장/삭제 후 IDB 캐시를 삭제하고 즉시 재fetch
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
          // 항상 백그라운드 재검증 (SWR)
          fetchAuthMenuResult()
            .then((fresh) => {
              set({ menuTrees: fresh.trees, menuLocale: locale, serverMenus: fresh.items });
              idbSet(cacheKey, fresh);
            })
            .catch(() => { /* 오류 시 캐시 유지 */ });
          return;
        }

        // 캐시 없음: 로딩 표시 후 서버 fetch
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
        // menuLoading 가드 초기화 후 즉시 재fetch
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
