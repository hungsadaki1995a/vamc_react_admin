import { useMemo } from 'react';
import { Tooltip } from 'antd';
import * as Icons from '@ant-design/icons';
import React from 'react';
import { CUSTOM_ICON_MAP } from '@/components/icons/custom-icons';
import {
  gnbUser,
  gnbHandshake,
  gnbBuildingOffice,
  gnbBookOpenText,
  gnbChartPieSlice,
  gnbNetwork,
  gnbGavel,
  gnbSetting,
  gnbLogout,
} from '@/assets/images';
import type { MenuItem } from '@/types/menu';
import { useMenuStore } from '@/stores/menu-store';
import { useTabStore } from '@/stores/tab-store';
import { useLogout } from '@/hooks/use-logout';
import { useAllMenus } from '@/hooks/use-all-menus';
import { useTranslation } from 'react-i18next';
import { useComponentLabel } from '@/hooks/use-component-label';
import { useShallow } from 'zustand/react/shallow';
import { findTopLevelMenuKey } from '@/utils/menu-utils';
import {
  getMenuIconByCode,
  getTopLevelMenuItems,
  mapMenuTreesToMenuItems,
} from '@/utils/menu-tree-utils';

// Pin dev (dev tools) at rail-bottom
// In production builds menuConfig has no 'dev' entry, so bottomRailMenu is undefined —
// the render guard below (`{bottomRailMenu && ...}`) already handles that case.
//
// ⚠️ Use useAllMenus() instead of reading menuConfig directly — capturing it as a module constant
//    would freeze tooltip menu names in Korean even after switching locales.
const BOTTOM_RAIL_KEY = 'dev';

// Static menu keys to hide from the Rail (dashboard is accessed via server menu or home tab)
const EXCLUDED_RAIL_KEYS = new Set(['dashboard']);

// Menu key to display a notification badge on
const badgeKeys = new Set(['notification']);

const GNB_ICON_BY_KEY: Record<string, string> = {
  members: gnbUser,
  member: gnbUser,
  'content-management': gnbBookOpenText,
  deal: gnbHandshake,
  transaction: gnbHandshake,
  npl: gnbBuildingOffice,
  statistics: gnbChartPieSlice,
  stats: gnbChartPieSlice,
  system: gnbNetwork,
  auction: gnbGavel,
};

const GNB_ICON_BY_NAME: Record<string, string> = {
  UserOutlined: gnbUser,
  ReadOutlined: gnbBookOpenText,
  BookOutlined: gnbBookOpenText,
  BankOutlined: gnbBuildingOffice,
  PieChartOutlined: gnbChartPieSlice,
  ApartmentOutlined: gnbNetwork,
};

function getIconComponent(item: MenuItem): React.ReactNode {
  const codeIcon = getMenuIconByCode(item.key);
  if (codeIcon) {
    return <img src={codeIcon} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />;
  }
  const gnbSrc = GNB_ICON_BY_KEY[item.key] ?? (item.icon ? GNB_ICON_BY_NAME[item.icon] : undefined);
  if (gnbSrc) {
    return <img src={gnbSrc} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />;
  }
  const iconName = item.icon;
  if (!iconName) return null;
  // Custom SVG icons (prefixed with 'custom:')
  if (iconName.startsWith('custom:')) {
    const name = iconName.slice(7);
    const Comp = CUSTOM_ICON_MAP[name];
    return Comp ? <Comp style={{ fontSize: 24 }} /> : null;
  }
  // Ant Design icons
  const Comp = (Icons as Record<string, unknown>)[iconName] as
    | React.ComponentType<{ style?: React.CSSProperties }>
    | undefined;
  if (!Comp) return null;
  return <Comp style={{ fontSize: 24 }} />;
}

export default function IconRail() {
  const { activeRailKey, flyoutVisible, toggleFlyout, closeFlyout, menuTrees, serverMenus } = useMenuStore(
    useShallow((s) => ({
      activeRailKey: s.activeRailKey,
      flyoutVisible: s.flyoutVisible,
      toggleFlyout: s.toggleFlyout,
      closeFlyout: s.closeFlyout,
      menuTrees: s.menuTrees,
      serverMenus: s.serverMenus,
    }))
  );
  const { tabs, activeTabKey, openTab, setActiveTab } = useTabStore(
    useShallow((s) => ({
      tabs: s.tabs,
      activeTabKey: s.activeTabKey,
      openTab: s.openTab,
      setActiveTab: s.setActiveTab,
    }))
  );

  // All menus with locale applied (server menus + static menus)
  const allMenus = useAllMenus();
  const bottomRailMenu = useMemo(
    () => allMenus.find((m) => m.key === BOTTOM_RAIL_KEY),
    [allMenus],
  );

  // Top-level rail items from login menuTrees when available; otherwise fallback to static + server menus
  const mainRailItems = useMemo(() => {
    if (menuTrees.length > 0) {
      const topLevelTrees = getTopLevelMenuItems(menuTrees);
      return mapMenuTreesToMenuItems(topLevelTrees).map((item, idx) => ({
        ...item,
        label:
          topLevelTrees[idx]?.menuLblVal?.trim() ||
          topLevelTrees[idx]?.menuNmDisplay?.trim() ||
          item.label,
      }));
    }
    const staticItems = allMenus.filter(
      (m) => !serverMenus.some((sm) => sm.key === m.key)
        && m.key !== BOTTOM_RAIL_KEY
        && !EXCLUDED_RAIL_KEYS.has(m.key)
    );
    return [...staticItems, ...serverMenus];
  }, [allMenus, menuTrees, serverMenus]);
  const confirmLogout = useLogout();
  // Rail is independent of the screen it is rendered in, so use shared component labels instead of screen labels
  const { tvb } = useComponentLabel();
  const { t } = useTranslation();

  // Top-level category (rail icon) containing the currently active tab.
  const activeTab = tabs.find((t) => t.key === activeTabKey);
  const activeTopKey = useMemo(() => {
    const key = activeTab?.menuKey;
    if (!key) return null;
    const staticTop = key.split('.')[0];
    if (mainRailItems.some((m) => m.key === staticTop)) return staticTop;
    return findTopLevelMenuKey(mainRailItems, key);
  }, [activeTab?.menuKey, mainRailItems]);

  const handleRailClick = (item: MenuItem) => {
    // leaf icon (no children, e.g. dashboard) → open tab directly + close flyout
    if (!item.children || item.children.length === 0) {
      if (item.componentPath) {
        const existingTab = tabs.find((t) => t.menuKey === item.key);
        if (existingTab) {
          setActiveTab(existingTab.key);
        } else {
          openTab(item);
        }
      }
      closeFlyout();
      return;
    }
    // icon with children → toggle flyout
    toggleFlyout(item.key);
  };

  return (
    <div className="icon-rail">
      {/* Menu icons */}
      <div className="rail-items">
        {mainRailItems.map((item) => {
          const isActive = activeTopKey === item.key;
          const isFlyoutActive = flyoutVisible && activeRailKey === item.key;
          const showBadge = badgeKeys.has(item.key);
          return (
            <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.3}>
              <div
                className={`rail-item ${isActive ? 'active' : ''} ${isFlyoutActive ? 'flyout-open' : ''}`}
                onClick={() => handleRailClick(item)}
              >
                {getIconComponent(item)}
                {showBadge && <span className="rail-badge" />}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="rail-bottom">
        {/* Dev tools / Settings */}
        {bottomRailMenu ? (() => {
          const isActive = activeTopKey === bottomRailMenu.key;
          const isFlyoutActive = flyoutVisible && activeRailKey === bottomRailMenu.key;
          return (
            <Tooltip title={bottomRailMenu.label} placement="right" mouseEnterDelay={0.3}>
              <div
                className={`rail-bottom-item ${isActive ? 'active' : ''} ${isFlyoutActive ? 'flyout-open' : ''}`}
                onClick={() => handleRailClick(bottomRailMenu)}
              >
                <img src={gnbSetting} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />
              </div>
            </Tooltip>
          );
        })() : (
          <Tooltip
            title={t('common.settings')}
            placement="right"
            mouseEnterDelay={0.3}
          >
            <div className="rail-bottom-item">
              <img src={gnbSetting} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />
            </div>
          </Tooltip>
        )}
        <Tooltip
          title={tvb('logout', t('common.signOut'))}
          placement="right"
          mouseEnterDelay={0.3}
        >
          <div className="rail-bottom-item" onClick={confirmLogout}>
            <img src={gnbLogout} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
