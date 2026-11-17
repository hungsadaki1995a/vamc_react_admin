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
import { useComponentLabel } from '@/hooks/use-component-label';
import { useLocaleStore } from '@/stores/locale-store';
import { useShallow } from 'zustand/react/shallow';
import { findTopLevelMenuKey } from '@/utils/menu-utils';
import {
  getMenuIconByCode,
  getTopLevelMenuItems,
  mapMenuTreesToMenuItems,
} from '@/utils/menu-tree-utils';

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

  // 로케일이 적용된 전체 메뉴 (서버 메뉴 + 정적 메뉴)
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
          topLevelTrees[idx]?.menuNmDisplay?.trim() ||
          topLevelTrees[idx]?.menuLblVal?.trim() ||
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
  // 레일은 어느 화면 안에서 그려지느냐와 무관하므로 화면 라벨이 아니라 공용 컴포넌트 라벨을 쓴다
  const { tvb } = useComponentLabel();
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
            title={locale === 'ko' ? '설정' : locale === 'vn' ? 'Cài đặt' : 'Settings'}
            placement="right"
            mouseEnterDelay={0.3}
          >
            <div className="rail-bottom-item">
              <img src={gnbSetting} alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />
            </div>
          </Tooltip>
        )}
        <Tooltip
          title={tvb('logout', locale === 'ko' ? '로그아웃' : locale === 'vn' ? 'Đăng xuất' : 'Sign Out')}
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
