import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { RightOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import AppTooltip from '@/components/common/tooltip/AppTooltip';
import {
  chevronDown,
  chevronUp,
  folderClose,
  folderOpen,
  treeFile,
} from '@/assets/images';
import {
  findMenuTreeByCode,
  isMenuShown,
  mapMenuTreesToMenuItems,
} from '@/utils/menu-tree-utils';

/** Expand: 3 equal-level lines (collapsed menu) + bottom-right '+' badge */
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

/** Collapse: 3 indented tree lines (expanded menu) + bottom-right '−' badge */
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

import { useAllMenus } from '@/hooks/use-all-menus';
import { useMenuStore } from '@/stores/menu-store';
import { findMenuByKey } from '@/utils/menu-utils';
import { useTabStore } from '@/stores/tab-store';

import { useShallow } from 'zustand/react/shallow';
import type { MenuItem, MenuTreeItem } from '@/types/menu';

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
  const { activeRailKey, flyoutVisible, closeFlyout, menuTrees } = useMenuStore(
    useShallow((s) => ({
      activeRailKey: s.activeRailKey,
      flyoutVisible: s.flyoutVisible,
      closeFlyout: s.closeFlyout,
      menuTrees: s.menuTrees,
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

  // menuKey of the currently active tab
  const activeMenuKey = tabs.find((t) => t.key === activeTabKey)?.menuKey ?? null;

  // Find selected top-level menu from login menuTrees when available
  const activeMenuTree = useMemo(
    () => (activeRailKey && menuTrees.length > 0 ? findMenuTreeByCode(menuTrees, activeRailKey) : null),
    [menuTrees, activeRailKey],
  );

  // Prefer server menus; fall back to static menuConfig if absent
  const allMenus = useAllMenus();
  const activeCategory = useMemo(() => {
    return allMenus.find((m) => m.key === activeRailKey)
      ?? (activeRailKey ? findMenuByKey(allMenus, activeRailKey) : null);
  }, [allMenus, activeRailKey]);
  // Creating `?? []` on every render would invalidate downstream useMemo dependencies, so memoize it.
  const flyoutItems = useMemo(
    () => (activeMenuTree ? mapMenuTreesToMenuItems(activeMenuTree.children ?? []) : activeCategory?.children ?? []),
    [activeMenuTree, activeCategory],
  );

  // Auto-expand parent keys when active menu changes (tab switch or menu click).
  // Rail change → replace with parent keys of new active menu (fresh start).
  // Same rail   → merge parent keys so previously expanded siblings stay open.
  // Adjust during render instead of effect — prevents expanded state from updating one tick late and flickering.
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
        // leaf active: matches menuKey of the currently active tab
        const isActive = !hasChildren && activeMenuKey === item.key;
        // parent active: if any descendant menu is active
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
                <span className={`flyout-item-arrow ${isExpanded ? 'rotate-90' : ''}`}>
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

  const renderMenuTreeItems = (items: MenuTreeItem[], depth: number) => {
    return items.filter(isMenuShown).map((item, index) => {
      const code = item.menuCd ?? `${depth}-${index}`;
      const hasChildren = Boolean(item.children?.some(isMenuShown));
      const isExpanded = expandedKeys.includes(code);
      const isActive = !hasChildren && activeMenuKey === code;
      const label = item.menuLblVal?.trim() || item.menuNmDisplay?.trim() || '';

      if (hasChildren) {
        return (
          <div key={code}>
            <div
              className={`lnb-folder-item ${isExpanded ? 'expanded' : ''}`}
              style={{ paddingLeft: 4 + depth * 20 }}
              onClick={() => toggleExpand(code)}
            >
              <div className="lnb-folder-left">
                <img
                  src={isExpanded ? folderOpen : folderClose}
                  alt=""
                  aria-hidden="true"
                  className="lnb-item-icon"
                />
                <span className="lnb-folder-label">{label}</span>
              </div>
              <img
                src={isExpanded ? chevronUp : chevronDown}
                alt=""
                aria-hidden="true"
                className="lnb-folder-arrow"
              />
            </div>
            {isExpanded && (
              <div className="lnb-children">
                {renderMenuTreeItems(item.children!, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={code}
          className={`lnb-file-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: depth > 0 ? 24 + (depth - 1) * 16 : 4 }}
          onClick={() => {
            const [mapped] = mapMenuTreesToMenuItems([item]);
            if (mapped?.componentPath) handleLeafClick(mapped);
          }}
        >
          <img src={treeFile} alt="" aria-hidden="true" className="lnb-item-icon" />
          <span className="lnb-file-label">{label}</span>
        </div>
      );
    });
  };

  return (
    <div
      ref={panelRef}
      className={`flyout-panel ${flyoutVisible ? 'visible' : ''} ${activeMenuTree ? 'lnb-panel' : ''}`}
    >
      {activeMenuTree ? (
        <>
          <div className="lnb-title-header">
            <span className="lnb-title-text">
              {activeMenuTree.menuLblVal?.trim() || activeMenuTree.menuNmDisplay?.trim()}
            </span>
            {allExpandableKeys.length > 0 && (
              <AppTooltip variant="default" title={isAllExpanded ? 'Collapse All' : 'Expand All'} placement="bottom">
                <button type="button" className="lnb-title-toggle" onClick={toggleExpandAll}>
                  <img
                    src={isAllExpanded ? chevronUp : chevronDown}
                    alt=""
                    aria-hidden="true"
                    className="lnb-title-arrow"
                  />
                </button>
              </AppTooltip>
            )}
          </div>
          <div className="lnb-menu-list">
            {renderMenuTreeItems(activeMenuTree.children ?? [], 0)}
          </div>
        </>
      ) : (
        <>
          {/* Logo header — always visible when panel is open */}
          <div className="flyout-logo-header">
            <span className="flyout-logo-text">VAMC NPL ADMIN</span>
            {allExpandableKeys.length > 0 && (
              <AppTooltip variant="default" title={isAllExpanded ? 'Collapse All' : 'Expand All'} placement="bottom">
                <button className="flyout-expand-all-btn" onClick={toggleExpandAll}>
                  {isAllExpanded ? <CollapseAllIcon /> : <ExpandAllIcon />}
                </button>
              </AppTooltip>
            )}
          </div>

          {activeCategory && (
            <div className="flyout-body">
              {renderItems(flyoutItems, 0)}
            </div>
          )}
        </>
      )}

    </div>
  );
}
