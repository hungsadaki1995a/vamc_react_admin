import { useMemo } from 'react';
import { Tooltip } from 'antd';
import {
  LogoutOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import React from 'react';
import { CUSTOM_ICON_MAP } from '@/components/icons/CustomIcons';
import vamcLogo from '@/assets/vamc_logo.png';
import type { MenuItem } from '@/types/menu';
import { useMenuStore } from '@/stores/menuStore';
import { useTabStore } from '@/stores/tabStore';
import { useLogout } from '@/hooks/useLogout';
import { useAllMenus } from '@/hooks/useAllMenus';
import { useComponentLabel } from '@/hooks/useComponentLabel';
import { useLocaleStore } from '@/stores/localeStore';
import { useShallow } from 'zustand/react/shallow';
import { findTopLevelMenuKey } from '@/utils/menuUtils';

// dev(개발 도구)는 rail-bottom에 고정 배치
// production 빌드에서는 menuConfig에 'dev' 항목이 없으므로 bottomRailMenu는 undefined —
// 아래 렌더링부(`{bottomRailMenu && ...}`)가 이미 그 경우를 가드한다.
//
// ⚠️ menuConfig 를 직접 보지 않고 useAllMenus() 를 쓴다 — 모듈 상수로 잡으면
//    로케일이 바뀌어도 툴팁의 메뉴명이 한국어로 굳는다.
const BOTTOM_RAIL_KEY = 'dev';

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

  // 로케일이 적용된 전체 메뉴 (서버 메뉴 + 정적 메뉴)
  const allMenus = useAllMenus();
  const bottomRailMenu = useMemo(
    () => allMenus.find((m) => m.key === BOTTOM_RAIL_KEY),
    [allMenus],
  );

  // Static items (member, etc.) + server business menus
  const mainRailItems = useMemo(() => {
    const staticItems = allMenus.filter(
      (m) => !serverMenus.some((sm) => sm.key === m.key)
        && m.key !== BOTTOM_RAIL_KEY
        && !EXCLUDED_RAIL_KEYS.has(m.key)
    );
    return [...staticItems, ...serverMenus];
  }, [allMenus, serverMenus]);
  const confirmLogout = useLogout();
  // 레일은 어느 화면 안에서 그려지느냐와 무관하므로 화면 라벨이 아니라 공용 컴포넌트 라벨을 쓴다
  const { tvt, tvb } = useComponentLabel();
  const locale = useLocaleStore((s) => s.locale);

  // 현재 활성 탭이 속한 1단 카테고리(레일 아이콘).
  const activeTab = tabs.find((t) => t.key === activeTabKey);
  const activeTopKey = useMemo(() => {
    const key = activeTab?.menuKey;
    if (!key) return null;
    const staticTop = key.split('.')[0];
    if (mainRailItems.some((m) => m.key === staticTop)) return staticTop;
    return findTopLevelMenuKey(mainRailItems, key);
  }, [activeTab?.menuKey, mainRailItems]);

  const handleRailClick = (item: MenuItem) => {
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
        <Tooltip
          title={tvt('manual', locale === 'ko' ? '매뉴얼' : locale === 'vn' ? 'Hướng dẫn' : 'User Manual')}
          placement="right"
          mouseEnterDelay={0.3}
        >
          <div className="rail-item">
            <ReadOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
        <Tooltip
          title={tvb('logout', locale === 'ko' ? '로그아웃' : locale === 'vn' ? 'Đăng xuất' : 'Sign Out')}
          placement="right"
          mouseEnterDelay={0.3}
        >
          <div className="rail-item" onClick={confirmLogout}>
            <LogoutOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
