import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem, MenuTreeItem } from '@/types/menu';
import { fetchAuthMenuList } from '@/api/common/myMenuApi';
import { idbGet, idbSet, idbDelete } from '@/lib/cache/idbCache';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLocaleStore } from '@/stores/localeStore';
import { mapMenuTreesToMenuItems } from '@/utils/menu-tree-utils';

interface MenuStore {
  activeRailKey: string | null;
  flyoutVisible: boolean;
  openKeys: string[];
  selectedKey: string | null;
  menuTrees: MenuTreeItem[];
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
          serverMenus: mapMenuTreesToMenuItems(trees),
        }),
      setServerMenus: (menus) => set({ serverMenus: menus }),
      clearServerMenus: () => set({ menuTrees: [], serverMenus: [] }),
      resetNavState: () => set({ activeRailKey: null, flyoutVisible: false, openKeys: [], selectedKey: null }),

      loadMenuForProject: async () => {
        if (get().menuLoading) return;

        // If login already provided menuTrees, keep them as the source of truth.
        const existingTrees = get().menuTrees;
        if (existingTrees.length > 0) {
          if (get().serverMenus.length === 0) {
            set({ serverMenus: mapMenuTreesToMenuItems(existingTrees) });
          }
          return;
        }

        const userId    = useAuthStore.getState().user?.usrId ?? '_';
        const projectId = useProjectStore.getState().activeProject?.id ?? '_';
        const locale    = useLocaleStore.getState().locale;
        const cacheKey  = `menus:${userId}:${projectId}:${locale}`;

        const cached = await idbGet<MenuItem[]>(cacheKey);
        if (cached) {
          // 캐시 즉시 반영 — 로딩 없이 바로 표시
          set({ serverMenus: cached.data });
          // 항상 백그라운드 재검증 (SWR)
          fetchAuthMenuList()
            .then((fresh) => {
              set({ serverMenus: fresh });
              idbSet(cacheKey, fresh);
            })
            .catch(() => { /* 오류 시 캐시 유지 */ });
          return;
        }

        // 캐시 없음: 로딩 표시 후 서버 fetch
        set({ menuLoading: true });
        try {
          const menus = await fetchAuthMenuList();
          set({ serverMenus: menus, menuLoading: false });
          idbSet(cacheKey, menus);
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
      partialize: (state) => ({ menuTrees: state.menuTrees }),
      onRehydrateStorage: () => (state) => {
        if (state?.menuTrees?.length) {
          state.serverMenus = mapMenuTreesToMenuItems(state.menuTrees);
        }
      },
    },
  ),
);
