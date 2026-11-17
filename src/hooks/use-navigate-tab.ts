import { useCallback } from 'react';
import { useMenuStore } from '@/stores/menuStore';
import { useTabStore } from '@/stores/tabStore';
import { findMenuByKey, findMenuByComponentPath, findTopLevelMenuKey } from '@/utils/menuUtils';

/**
 * Returns a `navigateTab(key, params?)` function that finds a menu item by key
 * from the dynamic server menu tree and opens it as a tab with optional params.
 * Accepts either a menu key (menuCd) or componentPath (e.g. "SYS030101SC").
 *
 * Usage:
 * ```tsx
 * const navigateTab = useNavigateTab();
 * navigateTab('SYS030101SC', { usrId: row.usrId });
 * ```
 *
 * In the target page, read params via:
 * ```tsx
 * const params = useTabContext()?.tab.params ?? {};
 * ```
 */
export function useNavigateTab() {
  return useCallback((key: string, params?: Record<string, unknown>) => {
    const menus = useMenuStore.getState().serverMenus;
    const menuItem = findMenuByKey(menus, key) ?? findMenuByComponentPath(menus, key);
    if (!menuItem) return;
    useTabStore.getState().openTab(menuItem, params);

    const { activeTabKey, tabs } = useTabStore.getState();
    const activeMenuKey = tabs.find((tab) => tab.key === activeTabKey)?.menuKey ?? menuItem.key;
    const railKey = findTopLevelMenuKey(menus, activeMenuKey);
    useMenuStore.setState({
      selectedKey: activeMenuKey,
      ...(railKey ? { activeRailKey: railKey } : {}),
    });
  }, []);
}
