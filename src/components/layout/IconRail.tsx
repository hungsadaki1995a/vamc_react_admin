import { Tooltip } from 'antd';
import {
  LogoutOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import React from 'react';
import { CUSTOM_ICON_MAP } from '@/components/icons/CustomIcons';
import vamcLogo from '@/assets/vamc_logo.png';
import { menuConfig } from '@/config/menuConfig';
import { useMenuStore } from '@/stores/menuStore';
import { useTabStore } from '@/stores/tabStore';
import { useLogout } from '@/hooks/useLogout';
import { useShallow } from 'zustand/react/shallow';

// dev(개발 도구)는 rail-bottom에 고정 배치
const BOTTOM_RAIL_KEY = 'dev';
const bottomRailMenu = menuConfig.find((m) => m.key === BOTTOM_RAIL_KEY);

// Rail에 표시하지 않을 static 메뉴 키 (대시보드는 서버 메뉴 또는 홈탭으로 접근)
const EXCLUDED_RAIL_KEYS = new Set(['dashboard']);

// 알림 뱃지를 표시할 메뉴 키
const badgeKeys = new Set(['notification']);

function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  // Custom SVG icons (prefixed with 'custom:')
  if (iconName.startsWith('custom:')) {
    const name = iconName.slice(7);
    const Comp = CUSTOM_ICON_MAP[name];
    return Comp ? <Comp style={{ fontSize: 20 }} /> : null;
  }
  // Ant Design icons
  const Comp = (Icons as Record<string, unknown>)[iconName] as
    | React.ComponentType<{ style?: React.CSSProperties }>
    | undefined;
  if (!Comp) return null;
  return <Comp style={{ fontSize: 20 }} />;
}

export default function IconRail() {
  const { activeRailKey, flyoutVisible, toggleFlyout, closeFlyout, serverMenus } = useMenuStore(
    useShallow((s) => ({
      activeRailKey: s.activeRailKey,
      flyoutVisible: s.flyoutVisible,
      toggleFlyout: s.toggleFlyout,
      closeFlyout: s.closeFlyout,
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

  // Static leaf items (dashboard) + server business menus
  const staticLeafItems = menuConfig.filter(
    (m) => m.key !== BOTTOM_RAIL_KEY && !EXCLUDED_RAIL_KEYS.has(m.key) && (!m.children || m.children.length === 0)
  );
  const mainRailItems = [...staticLeafItems, ...serverMenus];
  const confirmLogout = useLogout();

  // 현재 활성 탭의 1단 카테고리
  const activeTab = tabs.find((t) => t.key === activeTabKey);
  const activeTopKey = activeTab?.menuKey.split('.')[0] ?? null;

  const handleRailClick = (item: typeof menuConfig[number]) => {
    // leaf 아이콘 (대시보드 등 children 없음) → 직접 탭 열기 + Flyout 닫기
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
    // children 있는 아이콘 → flyout 토글
    toggleFlyout(item.key);
  };


  return (
    <div className="icon-rail">
      {/* Logo */}
      <div className="rail-logo">
        <img src={vamcLogo} alt="VAMC" className="rail-logo-img" />
      </div>

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
                {getIconComponent(item.icon)}
                {showBadge && <span className="rail-badge" />}
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="rail-bottom">
        {/* Dev tools (settings) */}
        {bottomRailMenu && (() => {
          const isActive = activeTopKey === bottomRailMenu.key;
          const isFlyoutActive = flyoutVisible && activeRailKey === bottomRailMenu.key;
          return (
            <Tooltip title={bottomRailMenu.label} placement="right" mouseEnterDelay={0.3}>
              <div
                className={`rail-item ${isActive ? 'active' : ''} ${isFlyoutActive ? 'flyout-open' : ''}`}
                onClick={() => handleRailClick(bottomRailMenu)}
              >
                {getIconComponent(bottomRailMenu.icon)}
              </div>
            </Tooltip>
          );
        })()}
        <Tooltip title="매뉴얼" placement="right" mouseEnterDelay={0.3}>
          <div className="rail-item">
            <ReadOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
        <Tooltip title="로그아웃" placement="right" mouseEnterDelay={0.3}>
          <div className="rail-item" onClick={confirmLogout}>
            <LogoutOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
