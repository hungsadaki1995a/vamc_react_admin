import { useEffect, useRef, useCallback, useState } from 'react';
import { RightOutlined, FolderOutlined, FileTextOutlined } from '@ant-design/icons';
import logoHarmony from '@/assets/logo_harmony.svg';
import { Select } from 'antd';
import { menuConfig } from '@/config/menuConfig';
import { useMenuStore } from '@/stores/menuStore';
import { findMenuByKey } from '@/utils/menuUtils';
import { useTabStore } from '@/stores/tabStore';
import { useProjectStore } from '@/stores/projectStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '@/stores/settingsStore';
import type { MenuItem } from '@/types/menu';

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

export default function FlyoutPanel() {
  const { activeRailKey, flyoutVisible, closeFlyout, serverMenus, menuLoading, resetNavState, loadMenuForProject } = useMenuStore(
    useShallow((s) => ({
      activeRailKey: s.activeRailKey,
      flyoutVisible: s.flyoutVisible,
      closeFlyout: s.closeFlyout,
      serverMenus: s.serverMenus,
      menuLoading: s.menuLoading,
      resetNavState: s.resetNavState,
      loadMenuForProject: s.loadMenuForProject,
    }))
  );
  const { openTab, resetTabs, tabs, activeTabKey } = useTabStore(
    useShallow((s) => ({
      openTab: s.openTab,
      resetTabs: s.resetTabs,
      tabs: s.tabs,
      activeTabKey: s.activeTabKey,
    }))
  );
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);
  const { activeProject, setActiveProject, myProjects } = useProjectStore(
    useShallow((s) => ({
      activeProject: s.activeProject,
      setActiveProject: s.setActiveProject,
      myProjects: s.myProjects,
    }))
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 현재 활성 탭의 menuKey
  const activeMenuKey = tabs.find((t) => t.key === activeTabKey)?.menuKey ?? null;

  // server menus 우선, 없으면 static menuConfig fallback
  const allMenus = [...serverMenus, ...menuConfig];
  const activeCategory = allMenus.find((m) => m.key === activeRailKey)
    ?? (activeRailKey ? findMenuByKey(allMenus, activeRailKey) : null);
  const flyoutItems = activeCategory?.children ?? [];

  // Auto-expand parent keys when active menu changes (tab switch or menu click).
  useEffect(() => {
    if (!activeMenuKey) {
      setExpandedKeys([]);
      return;
    }

    // Static menus use dot-separated keys (e.g. "project.list") → derive parents from key segments
    if (activeRailKey && activeMenuKey.startsWith(activeRailKey + '.')) {
      const parts = activeMenuKey.split('.');
      const parentKeys: string[] = [];
      for (let i = 1; i < parts.length - 1; i++) {
        parentKeys.push(parts.slice(0, i + 1).join('.'));
      }
      setExpandedKeys(parentKeys);
      return;
    }

    // Server menus (no dot separator): traverse the flyout tree to find ancestors
    const ancestors = findAncestorKeys(flyoutItems, activeMenuKey);
    if (ancestors !== null) {
      setExpandedKeys(ancestors);
    }
    // If item not found in current flyout, keep existing expanded state
  }, [activeRailKey, activeMenuKey, flyoutItems]);

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

  // Project selector options
  const projectOptions = myProjects.map((p) => ({
    value: p.projId,
    label: p.projNm ?? p.projId,
  }));

  const handleProjectChange = useCallback(
    (value: string) => {
      const proj = myProjects.find((p) => p.projId === value);
      if (proj) {
        setActiveProject({ id: proj.projId, name: proj.projNm ?? proj.projId, status: 'active' });
        // Reset all navigation state (rail, flyout, open keys)
        resetNavState();
        setExpandedKeys([]);
        // Reset tabs and reopen home tab for the new project context
        resetTabs();
        const homeMenu = findMenuByKey(menuConfig, homeMenuKey);
        if (homeMenu) openTab(homeMenu);
        // Re-fetch menus — setActiveProject above already updated projectStore,
        // so interceptor will send the new X-Project-Id header
        loadMenuForProject();
      }
    },
    [myProjects, setActiveProject, resetNavState, resetTabs, openTab, homeMenuKey, loadMenuForProject]
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
        <img src={logoHarmony} alt="HARMONY" className="flyout-logo-img" />
      </div>

      {/* Project Selector */}
      {myProjects.length > 0 && (
        <div className="flyout-project-selector">
          <Select
            value={activeProject?.id ?? undefined}
            onChange={handleProjectChange}
            options={projectOptions}
            placeholder="프로젝트 선택"
            style={{ width: '100%' }}
            size="middle"
            loading={menuLoading}
            disabled={menuLoading}
            popupMatchSelectWidth={false}
          />
        </div>
      )}

      {activeCategory && (
        <div className="flyout-body">
          {renderItems(flyoutItems, 0)}
        </div>
      )}

    </div>
  );
}
