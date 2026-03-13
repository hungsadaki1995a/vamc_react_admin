import { create } from 'zustand';
import type { MenuItem } from '@/types/menu';
import { mockLoadMenus } from '@/mock/services/menuService';


interface MenuStore {
  activeRailKey: string | null;
  flyoutVisible: boolean;
  openKeys: string[];
  selectedKey: string | null;
  serverMenus: MenuItem[];
  menuLoading: boolean;
  setOpenKeys: (keys: string[]) => void;
  setSelectedKey: (key: string | null) => void;
  setActiveRailKey: (key: string | null) => void;
  setFlyoutVisible: (visible: boolean) => void;
  toggleFlyout: (railKey: string) => void;
  closeFlyout: () => void;
  toggleSidebar: () => void;
  setServerMenus: (menus: MenuItem[]) => void;
  clearServerMenus: () => void;
  resetNavState: () => void;
  /**
   * Load menus with TTL-based IndexedDB cache.
   * - Cache hit (fresh < 5min): serve immediately, no network request.
   * - Cache hit (stale ≥ 5min): serve immediately + background revalidation.
   * - Cache miss: fetch from server, persist to IDB.
   */
  loadMenuForProject: () => Promise<void>;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  activeRailKey: null,
  flyoutVisible: false,
  openKeys: [],
  selectedKey: null,
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

  setServerMenus: (menus) => set({ serverMenus: menus }),
  clearServerMenus: () => set({ serverMenus: [] }),
  resetNavState: () => set({ activeRailKey: null, flyoutVisible: false, openKeys: [], selectedKey: null }),

  loadMenuForProject: async () => {
    if (get().menuLoading) return;
    set({ menuLoading: true });
    try {
      const menus = await mockLoadMenus();
      set({ serverMenus: menus, menuLoading: false });
    } catch {
      set({ menuLoading: false });
    }
  },
}));
