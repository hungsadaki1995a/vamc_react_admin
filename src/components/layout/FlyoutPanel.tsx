import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { RightOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

/** 펼치기: 동일 레벨 3줄(접힌 메뉴) + 우하단 + 배지 */
function ExpandAllIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2"   width="9" height="1.6" rx="0.8" />
      <rect x="1" y="6"   width="9" height="1.6" rx="0.8" />
      <rect x="1" y="10"  width="9" height="1.6" rx="0.8" />
      {/* + badge */}
      <rect x="11"   y="9.8"  width="4"   height="1.4" rx="0.7" />
      <rect x="12.3" y="8.5"  width="1.4" height="4"   rx="0.7" />
    </svg>
  );
}

/** 접기: 들여쓰기 트리 3줄(펼친 메뉴) + 우하단 − 배지 */
function CollapseAllIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="1"   y="2"  width="9"   height="1.6" rx="0.8" />
      <rect x="3.5" y="6"  width="6.5" height="1.6" rx="0.8" />
      <rect x="6"   y="10" width="4"   height="1.6" rx="0.8" />
      {/* − badge */}
      <rect x="11" y="9.8" width="4" height="1.4" rx="0.7" />
    </svg>
  );
}

import { useAllMenus } from '@/hooks/useAllMenus';
import { useMenuStore } from '@/stores/menuStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { useTabStore } from '@/stores/tabStore';

import { useShallow } from 'zustand/react/shallow';
import type { MenuItem } from '@/types/menu';

function getAllExpandableKeys(items: MenuItem[]): string[] {
  const keys: string[] = [];
  for (const item of items) {
    if (item.hidden) continue;
    if (item.children && item.children.length > 0) {
      keys.push(item.key);
      keys.push(...getAllExpandableKeys(item.children));
    }
  }
  return keys;
}

function countLeaves(items: MenuItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.hidden) continue;
    if (item.children && item.children.length > 0) {
      count += countLeaves(item.children);
    } else {
      count++;
    }
  }
  return count;
}

// Returns ancestor keys (parent, grandparent...) from root to the target, excluding the target itself.
function findAncestorKeys(items: MenuItem[], targetKey: string, ancestors: string[] = []): string[] | null {
  for (const item of items) {
    if (item.key === targetKey) return ancestors;
    if (item.children && item.children.length > 0) {
      const found = findAncestorKeys(item.children, targetKey, [...ancestors, item.key]);
      if (found !== null) return found;
    }
  }
  return null;
}

// Compute parent keys to expand for the given active menu.
function getParentKeys(
  activeMenuKey: string | null,
  activeRailKey: string | null,
  flyoutItems: MenuItem[]
): string[] {
  if (!activeMenuKey) return [];

  // Static menus: dot-separated key → derive parents from segments
  if (activeRailKey && activeMenuKey.startsWith(activeRailKey + '.')) {
    const parts = activeMenuKey.split('.');
    const keys: string[] = [];
    for (let i = 1; i < parts.length - 1; i++) {
      keys.push(parts.slice(0, i + 1).join('.'));
    }
    return keys;
  }

  // Server menus: traverse the tree
  return findAncestorKeys(flyoutItems, activeMenuKey) ?? [];
}

export default function FlyoutPanel() {
  const { activeRailKey, flyoutVisible, closeFlyout } = useMenuStore(
    useShallow((s) => ({
      activeRailKey: s.activeRailKey,
      flyoutVisible: s.flyoutVisible,
      closeFlyout: s.closeFlyout,
    }))
  );
  const { openTab, tabs, activeTabKey } = useTabStore(
    useShallow((s) => ({
      openTab: s.openTab,
      tabs: s.tabs,
      activeTabKey: s.activeTabKey,
    }))
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 현재 활성 탭의 menuKey
  const activeMenuKey = tabs.find((t) => t.key === activeTabKey)?.menuKey ?? null;

  // server menus 우선, 없으면 static menuConfig fallback
  const allMenus = useAllMenus();
  const activeCategory = useMemo(() => {
    return allMenus.find((m) => m.key === activeRailKey)
      ?? (activeRailKey ? findMenuByKey(allMenus, activeRailKey) : null);
  }, [allMenus, activeRailKey]);
  // `?? []` 를 렌더마다 새로 만들면 하위 useMemo 의존성이 매번 바뀌므로 메모이즈한다.
  const flyoutItems = useMemo(() => activeCategory?.children ?? [], [activeCategory]);

  // Auto-expand parent keys when active menu changes (tab switch or menu click).
  // Rail change → replace with parent keys of new active menu (fresh start).
  // Same rail   → merge parent keys so previously expanded siblings stay open.
  // effect 대신 렌더 중 조정 — 펼침 상태가 한 박자 늦게 반영되어 깜빡이는 것을 막는다.
  const [prevRailKey, setPrevRailKey] = useState<string | null>(null);
  const [prevMenuKey, setPrevMenuKey] = useState<string | null>(null);
  if (prevRailKey !== activeRailKey || prevMenuKey !== activeMenuKey) {
    const parentKeys = getParentKeys(activeMenuKey, activeRailKey, flyoutItems);
    const railChanged = prevRailKey !== activeRailKey;
    setPrevRailKey(activeRailKey);
    setPrevMenuKey(activeMenuKey);

    if (railChanged) {
      setExpandedKeys(parentKeys);
    } else if (parentKeys.length > 0) {
      setExpandedKeys(prev => [...new Set([...prev, ...parentKeys])]);
    }
  }

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && flyoutVisible) {
        closeFlyout();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flyoutVisible, closeFlyout]);

  const allExpandableKeys = useMemo(() => getAllExpandableKeys(flyoutItems), [flyoutItems]);
  const isAllExpanded = allExpandableKeys.length > 0 && allExpandableKeys.every((k) => expandedKeys.includes(k));
  const toggleExpandAll = useCallback(() => {
    setExpandedKeys(isAllExpanded ? [] : allExpandableKeys);
  }, [isAllExpanded, allExpandableKeys]);

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const handleLeafClick = useCallback(
    (item: MenuItem) => {
      openTab(item);
    },
    [openTab]
  );

  const renderItems = (items: MenuItem[], depth: number) => {
    return items
      .filter((item) => !item.hidden)
      .map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedKeys.includes(item.key);
        const childCount = hasChildren ? countLeaves(item.children!) : 0;
        // leaf active: 현재 활성 탭의 menuKey와 일치
        const isActive = !hasChildren && activeMenuKey === item.key;
        // parent active: 자식 중 활성 메뉴가 있으면
        const isParentActive = hasChildren && activeMenuKey?.startsWith(item.key + '.') || false;

        return (
          <div key={item.key}>
            <div
              className={`flyout-menu-item depth-${depth} ${hasChildren ? 'has-children' : 'leaf'} ${isActive ? 'active' : ''} ${isParentActive ? 'parent-active' : ''}`}
              onClick={() => {
                if (hasChildren) {
                  toggleExpand(item.key);
                } else {
                  handleLeafClick(item);
                }
              }}
              style={{ paddingLeft: 14 + depth * 14 }}
            >
              {hasChildren ? (
                <span className="flyout-item-arrow" style={isExpanded ? { transform: 'rotate(90deg)' } : {}}>
                  <RightOutlined />
                </span>
              ) : (
                <span className="flyout-item-arrow-placeholder" />
              )}
              <span className="flyout-item-icon">
                {hasChildren
                  ? <FolderOutlined />
                  : <FileTextOutlined />}
              </span>
              <span className="flyout-item-label">{item.label}</span>
              {hasChildren && (
                <span className="flyout-child-count">{childCount}</span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="flyout-children">
                {renderItems(item.children!, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <div
      ref={panelRef}
      className={`flyout-panel ${flyoutVisible ? 'visible' : ''}`}
    >
      {/* Logo header — always visible when panel is open */}
      <div className="flyout-logo-header">
        <span className="flyout-logo-text">VAMC NPL ADMIN</span>
        {allExpandableKeys.length > 0 && (
          <Tooltip title={isAllExpanded ? '전체 접기' : '전체 펼치기'} placement="bottom">
            <button className="flyout-expand-all-btn" onClick={toggleExpandAll}>
              {isAllExpanded ? <CollapseAllIcon /> : <ExpandAllIcon />}
            </button>
          </Tooltip>
        )}
      </div>

      {activeCategory && (
        <div className="flyout-body">
          {renderItems(flyoutItems, 0)}
        </div>
      )}

    </div>
  );
}
