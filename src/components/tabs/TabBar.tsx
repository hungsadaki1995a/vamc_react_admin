import { useState, useCallback, useRef, useEffect, useMemo, memo, startTransition } from 'react';
import {
  CloseOutlined,
  PushpinFilled,
  LeftOutlined,
  RightOutlined,
  MenuOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useTabStore } from '@/stores/tabStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAllMenus } from '@/hooks/useAllMenus';
import { findMenuByKey } from '@/utils/menuUtils';
import TabContextMenu from './TabContextMenu';
import type { Tab } from '@/types/tab';

/** Memoized individual tab item to prevent unnecessary re-renders */
const TabItem = memo(function TabItem({
  tab,
  label,
  isActive,
  isDropTarget,
  isHome,
  idx,
  onActivate,
  onClose,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  tab: Tab;
  label: string;
  isActive: boolean;
  isDropTarget: boolean;
  isHome: boolean;
  idx: number;
  onActivate: (key: string) => void;
  onClose: (key: string) => void;
  onContextMenu: (e: React.MouseEvent, key: string) => void;
  onDragStart: (e: React.DragEvent, idx: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDrop: (e: React.DragEvent, idx: number) => void;
}) {
  return (
    <div
      className={`tab-item ${isActive ? 'active' : ''} ${isDropTarget ? 'drop-target' : ''} ${isHome ? 'home-tab' : ''}`}
      onClick={() => onActivate(tab.key)}
      onMouseDown={(e) => {
        if (e.button === 1 && tab.closable) {
          e.preventDefault(); // 브라우저 자동 스크롤 방지
          onClose(tab.key);
        }
      }}
      onContextMenu={(e) => onContextMenu(e, tab.key)}
      draggable
      onDragStart={(e) => onDragStart(e, idx)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, idx)}
      onDrop={(e) => onDrop(e, idx)}
    >
      {isHome && <HomeOutlined className="tab-home-icon" />}
      {!isHome && tab.pinned && <PushpinFilled className="tab-pin-icon" />}
      <span className="tab-label">{label}</span>
      {tab.closable && (
        <span
          className="tab-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.key);
          }}
        >
          <CloseOutlined />
        </span>
      )}
    </div>
  );
});

export default function TabBar() {
  const {
    tabs,
    activeTabKey,
    setActiveTab,
    closeTab,
    closeOtherTabs,
    closeRightTabs,
    closeAllTabs,
    reorderTabs,
  } = useTabStore();

  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);

  // Live menu label: re-derives on locale change so tabs always show current language
  // (서버 메뉴는 menuLblVal, 정적 메뉴는 labelKey → 라벨 테이블)
  const allMenus = useAllMenus();
  const getTabLabel = useCallback(
    (tab: Tab) => findMenuByKey(allMenus, tab.menuKey)?.label ?? tab.title,
    [allMenus]
  );

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabKey: string;
  }>({ visible: false, x: 0, y: 0, tabKey: '' });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dragIdxRef = useRef<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

  // Check scroll state — throttled via rAF
  const rafRef = useRef<number>(0);
  const updateScrollState = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateScrollState, tabs.length]);

  // Auto-scroll active tab into view when activeTabKey changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !activeTabKey) return;
    // Double rAF: first frame waits for React render, second ensures layout is computed
    let frame2: number;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        const activeEl = container.querySelector('.tab-item.active') as HTMLElement | null;
        if (activeEl) {
          // Use offsetLeft/offsetWidth instead of getBoundingClientRect to avoid forced reflow.
          // Scroll container directly (overflow:hidden container is not a scrollIntoView target).
          const containerLeft = container.scrollLeft;
          const containerWidth = container.clientWidth;
          const tabLeft = activeEl.offsetLeft;
          const tabRight = tabLeft + activeEl.offsetWidth;
          if (tabRight > containerLeft + containerWidth) {
            container.scrollTo({ left: tabRight - containerWidth + 4, behavior: 'smooth' });
          } else if (tabLeft < containerLeft) {
            container.scrollTo({ left: tabLeft - 4, behavior: 'smooth' });
          }
        }
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [activeTabKey]);

  // Wrap setActiveTab in startTransition — tab switch triggers expensive AG Grid re-render,
  // which causes 'click handler took Xms' violations if run synchronously.
  const handleActivate = useCallback((key: string) => {
    startTransition(() => {
      setActiveTab(key);
    });
  }, [setActiveTab]);

  // Mouse wheel → horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: e.deltaY > 0 ? 120 : -120 });
  }, []);

  // Press-and-hold scroll: accelerates from 0 → max smoothly, no initial jump
  const pressRafRef = useRef<number>(0);
  const pressActiveRef = useRef(false);
  const pressStopRef = useRef<() => void>(() => {});

  const stopScroll = useCallback(() => pressStopRef.current(), []);

  const makeScrollPress = useCallback((dir: 1 | -1) => ({
    onMouseDown: () => {
      pressActiveRef.current = true;
      let speed = 0;
      let totalScrolled = 0;

      pressStopRef.current = () => {
        pressActiveRef.current = false;
        cancelAnimationFrame(pressRafRef.current);
        // Guarantee at least ~200px scrolled on release
        const remaining = 200 - totalScrolled;
        if (remaining > 0) {
          scrollRef.current?.scrollBy({ left: dir * remaining, behavior: 'smooth' });
        }
      };

      const tick = () => {
        if (!pressActiveRef.current) return;
        const el = scrollRef.current;
        if (el) {
          speed = Math.min(speed + 0.6, 18); // 0 → 18px/frame in ~270ms
          el.scrollLeft += dir * speed;
          totalScrolled += speed;
        }
        pressRafRef.current = requestAnimationFrame(tick);
      };
      pressRafRef.current = requestAnimationFrame(tick);
    },
    onMouseUp: stopScroll,
    onMouseLeave: stopScroll,
  }), [stopScroll]);

  const scrollLeftProps = useMemo(() => makeScrollPress(-1), [makeScrollPress]);
  const scrollRightProps = useMemo(() => makeScrollPress(1), [makeScrollPress]);

  // Cleanup on unmount
  useEffect(() => stopScroll, [stopScroll]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tabKey: string) => {
      e.preventDefault();
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabKey });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // DnD handlers
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDropTargetIdx(null);
    dragIdxRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      const fromIdx = dragIdxRef.current;
      if (fromIdx !== null && fromIdx !== toIdx) {
        reorderTabs(fromIdx, toIdx);
      }
      setDropTargetIdx(null);
      dragIdxRef.current = null;
    },
    [reorderTabs]
  );

  // Memoize management dropdown items
  const manageMenuItems: MenuProps['items'] = useMemo(() => [
    {
      key: 'close-current',
      label: '현재 탭 닫기',
      disabled: !activeTabKey,
      onClick: () => activeTabKey && closeTab(activeTabKey),
    },
    {
      key: 'close-others',
      label: '다른 탭 모두 닫기',
      disabled: !activeTabKey,
      onClick: () => activeTabKey && closeOtherTabs(activeTabKey),
    },
    {
      key: 'close-right',
      label: '오른쪽 탭 닫기',
      disabled: !activeTabKey,
      onClick: () => activeTabKey && closeRightTabs(activeTabKey),
    },
    {
      key: 'close-all',
      label: '모든 탭 닫기',
      onClick: () => closeAllTabs(),
    },
    { type: 'divider' as const },
    ...tabs.map((t) => ({
      key: `goto-${t.key}`,
      label: getTabLabel(t),
      onClick: () => startTransition(() => setActiveTab(t.key)),
      style: t.key === activeTabKey ? { fontWeight: 600, color: '#1677ff' } : {},
    })),
  ], [tabs, activeTabKey, closeTab, closeOtherTabs, closeRightTabs, closeAllTabs, setActiveTab, handleActivate, getTabLabel]);

  // Pinned first — memoized (must be before early return to respect Rules of Hooks)
  const sortedTabs = useMemo(() =>
    [...tabs].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    }), [tabs]);

  if (tabs.length === 0) {
    return (
      <div className="tab-bar">
        <div className="tab-scroll-container">
          <span style={{ color: 'var(--text-secondary)', fontSize: 12, padding: '0 8px' }}>
            좌측 메뉴를 클릭하여 탭을 열어주세요
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tab-bar">
        {/* Left scroll */}
        <div
          className={`tab-scroll-btn ${!canScrollLeft ? 'disabled' : ''}`}
          {...scrollLeftProps}
        >
          <LeftOutlined style={{ fontSize: 10 }} />
        </div>

        {/* Tabs scroll container */}
        <div
          ref={scrollRef}
          className="tab-scroll-container"
          onWheel={handleWheel}
        >
          {sortedTabs.map((tab, idx) => (
            <TabItem
              key={tab.key}
              tab={tab}
              label={getTabLabel(tab)}
              isActive={tab.key === activeTabKey}
              isDropTarget={dropTargetIdx === idx}
              isHome={tab.menuKey === homeMenuKey}
              idx={idx}
              onActivate={handleActivate}
              onClose={closeTab}
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>

        {/* Right scroll */}
        <div
          className={`tab-scroll-btn ${!canScrollRight ? 'disabled' : ''}`}
          {...scrollRightProps}
        >
          <RightOutlined style={{ fontSize: 10 }} />
        </div>

        {/* Tab manage dropdown */}
        <Dropdown
          menu={{ items: manageMenuItems, style: { maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' } }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div className="tab-manage-btn">
            <MenuOutlined style={{ fontSize: 12 }} />
          </div>
        </Dropdown>
      </div>

      <TabContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        tabKey={contextMenu.tabKey}
        onClose={handleCloseContextMenu}
      />
    </>
  );
}
