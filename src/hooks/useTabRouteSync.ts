import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey } from '@/utils/menuUtils';
import type { MenuItem } from '@/types/menu';

// Find the top-level rail key that contains the given leaf key in its subtree.
function findRailKey(railItems: MenuItem[], targetKey: string): string | null {
  for (const rail of railItems) {
    if (rail.key === targetKey) return rail.key;
    if (rail.children && containsKey(rail.children, targetKey)) return rail.key;
  }
  return null;
}

function containsKey(items: MenuItem[], targetKey: string): boolean {
  for (const item of items) {
    if (item.key === targetKey) return true;
    if (item.children && containsKey(item.children, targetKey)) return true;
  }
  return false;
}

/**
 * Bidirectional sync between tab system and browser history.
 * - Tab activation → URL push
 * - Browser back/forward → tab activation
 * - Rail active icon sync
 */
export function useTabRouteSync() {
  const { tabKey } = useParams<{ tabKey: string }>();
  const navigate = useNavigate();
  const { activeTabKey, tabs, openTab, setActiveTab } = useTabStore();
  const { setSelectedKey, setActiveRailKey } = useMenuStore();

  const isNavigatingRef = useRef(false);

  // Sync Rail active icon from a tab key.
  // Static menus use dot-separated keys (e.g. 'project.list') → first segment is the rail key.
  // Server menus use raw IDs (e.g. 'M001-1-1') → search the serverMenus tree.
  const syncRailFromKey = (key: string) => {
    setSelectedKey(key);
    const staticTopKey = key.split('.')[0];

    // Static menu: first segment matches a top-level config item
    if (menuConfig.some((m) => m.key === staticTopKey)) {
      setActiveRailKey(staticTopKey);
      return;
    }

    // Server menu: traverse tree to find the rail-level ancestor
    const serverMenus = useMenuStore.getState().serverMenus;
    const railKey = findRailKey(serverMenus, key);
    if (railKey) {
      setActiveRailKey(railKey);
      return;
    }

    // Fallback
    setActiveRailKey(staticTopKey);
  };

  // URL → Tab: when URL changes (back/forward)
  useEffect(() => {
    if (!tabKey) return;
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const existingTab = tabs.find((t) => t.key === tabKey);
    if (existingTab) {
      if (activeTabKey !== tabKey) {
        setActiveTab(tabKey);
      }
    } else {
      const menuItem = findMenuByKey(menuConfig, tabKey);
      if (menuItem && menuItem.componentPath) {
        openTab(menuItem);
      }
    }

    syncRailFromKey(tabKey);
  }, [tabKey]);

  // Tab → URL: when active tab changes
  useEffect(() => {
    if (!activeTabKey) return;
    if (activeTabKey === tabKey) return;

    isNavigatingRef.current = true;
    navigate(`/app/${activeTabKey}`, { replace: false });

    syncRailFromKey(activeTabKey);
  }, [activeTabKey]);

  // Initial load: ensure home tab always exists
  useEffect(() => {
    const homeKey = useSettingsStore.getState().homeMenuKey;
    const homeExists = tabs.some((t) => t.menuKey === homeKey);
    if (!homeExists) {
      const homeMenu = findMenuByKey(menuConfig, homeKey);
      if (homeMenu) openTab(homeMenu);
    }

    if (!tabKey && activeTabKey) {
      navigate(`/app/${activeTabKey}`, { replace: true });
    } else if (!tabKey && !activeTabKey) {
      navigate(`/app/${homeKey}`, { replace: true });
    }
  }, []);
}
