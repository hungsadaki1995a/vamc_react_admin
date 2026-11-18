import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabStore } from '@/stores/tab-store';
import { useMenuStore } from '@/stores/menu-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useAllMenus } from '@/hooks/use-all-menus';
import { menuConfig } from '@/config/menu-config';
import { ROUTE_MENU_CODES, getRouteByMenuCode } from '@/app/route-constants';
import { findMenuByKey, findTopLevelMenuKey, findMenuByComponentPath } from '@/utils/menu-utils';
import type { MenuItem } from '@/types/menu';

function resolveMenuForPath(allMenus: MenuItem[], pathname: string): MenuItem | null {
  const codes = ROUTE_MENU_CODES[pathname];
  if (!codes) return null;

  for (const code of codes) {
    let menuItem =
      findMenuByKey(allMenus, code) ?? findMenuByComponentPath(allMenus, code);
    if (menuItem && !menuItem.componentPath && menuItem.children?.[0]?.componentPath) {
      menuItem = menuItem.children[0];
    }
    if (menuItem?.componentPath) return menuItem;
  }
  return null;
}

/**
 * Bidirectional sync between tab system and hardcoded browser routes.
 * - Tab activation → mapped URL push (unmapped menu codes do not navigate)
 * - Browser back/forward / direct URL → tab activation
 * - Rail active icon sync
 */
export function useTabRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTabKey, tabs, openTab, setActiveTab } = useTabStore();
  const { setSelectedKey, setActiveRailKey, closeFlyout } = useMenuStore();
  const allMenus = useAllMenus();

  const isNavigatingRef = useRef(false);
  /** Route path requested by URL whose menu hasn't loaded yet */
  const pendingPathRef = useRef<string | null>(null);

  // Sync Rail active icon from a tab key.
  const syncRailFromKey = useCallback(
    (key: string) => {
      setSelectedKey(key);
      if (
        key === 'inquiry-management' ||
        key === 'faq-management' ||
        key === 'faq' ||
        key === 'content-management' ||
        key === 'InquiryManagement' ||
        key === 'FaqManagement'
      ) {
        setActiveRailKey('content-management');
        return;
      }
      const staticTopKey = key.split('.')[0];

      // Top-level leaf (e.g. dashboard) → close flyout and clear rail highlight
      const topLevelItem = menuConfig.find((m) => m.key === staticTopKey);
      if (topLevelItem && (!topLevelItem.children || topLevelItem.children.length === 0)) {
        closeFlyout();
        setActiveRailKey(null);
        return;
      }

      // Check static config items
      if (menuConfig.some((m) => m.key === staticTopKey)) {
        setActiveRailKey(staticTopKey);
        return;
      }

      // Server or dynamic menu: traverse tree to find the rail-level ancestor
      const railKey =
        findTopLevelMenuKey(allMenus, key) ??
        findTopLevelMenuKey(useMenuStore.getState().serverMenus, key);
      setActiveRailKey(railKey ?? staticTopKey);
    },
    [allMenus, setSelectedKey, setActiveRailKey, closeFlyout],
  );

  // URL → Tab: when URL changes (back/forward, direct address input)
  useEffect(() => {
    const codes = ROUTE_MENU_CODES[location.pathname];
    if (!codes) return;
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const existingTab = tabs.find(
      (t) =>
        codes.includes(t.key) ||
        codes.includes(t.menuKey) ||
        codes.includes(t.componentKey),
    );

    if (existingTab) {
      pendingPathRef.current = null;
      if (activeTabKey !== existingTab.key) setActiveTab(existingTab.key);
      syncRailFromKey(existingTab.key);
      return;
    }

    const menuItem = resolveMenuForPath(allMenus, location.pathname);
    if (menuItem) {
      pendingPathRef.current = null;
      openTab(menuItem);
      syncRailFromKey(menuItem.key);
    } else {
      // Menus may not have arrived yet — the retry effect below takes over.
      pendingPathRef.current = location.pathname;
      syncRailFromKey(codes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Retry pending URL tab after server menus arrive
  useEffect(() => {
    const pendingPath = pendingPathRef.current;
    if (!pendingPath) return;
    if (useMenuStore.getState().serverMenus.length === 0) return;

    const menuItem = resolveMenuForPath(allMenus, pendingPath);
    if (menuItem) {
      openTab(menuItem);
      syncRailFromKey(menuItem.key);
    } else {
      // Still missing after menus arrived → invalid URL. Revert to active tab's mapped address if any.
      const active = useTabStore.getState().activeTabKey;
      const fallbackPath = getRouteByMenuCode(active);
      if (fallbackPath && location.pathname !== fallbackPath) {
        isNavigatingRef.current = true;
        navigate(fallbackPath, { replace: true });
      }
    }
    pendingPathRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenus]);

  // Tab → URL: when active tab changes
  useEffect(() => {
    if (!activeTabKey) return;
    // Do not touch URL while a tab requested by URL is still being opened.
    if (pendingPathRef.current) return;

    syncRailFromKey(activeTabKey);

    const targetPath = getRouteByMenuCode(activeTabKey);
    if (!targetPath) return;

    if (location.pathname !== targetPath) {
      isNavigatingRef.current = true;
      navigate(targetPath, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabKey]);

  // Re-sync rail highlight after server menus arrive (once).
  const railSyncedRef = useRef(false);
  useEffect(() => {
    if (railSyncedRef.current) return;
    if (useMenuStore.getState().serverMenus.length === 0) return;
    railSyncedRef.current = true;

    const key = useTabStore.getState().activeTabKey;
    if (key) syncRailFromKey(key);
  }, [allMenus, syncRailFromKey]);

  // Ensure home tab — since home menu may be a server menu, check whenever menus are populated.
  useEffect(() => {
    const homeKey = useSettingsStore.getState().homeMenuKey;
    if (tabs.some((t) => t.menuKey === homeKey)) return;

    const homeMenu = findMenuByKey(allMenus, homeKey);
    if (homeMenu && homeMenu.componentPath) openTab(homeMenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenus]);
}
