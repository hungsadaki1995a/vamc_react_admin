import { Suspense, useRef, memo } from 'react';
import { Spin } from 'antd';
import { useTabStore } from '@/stores/tabStore';
import { componentRegistry } from '@/config/componentRegistry';
import { TabContext } from '@/contexts/TabContext';
import PageHeader from '@/components/layout/PageHeader';
import type { ComponentType } from 'react';
import type { Tab } from '@/types/tab';

/**
 * Memoized individual tab panel.
 * Only re-renders when `isActive` changes (or on first mount).
 */
const TabPanel = memo(function TabPanel({
  tab,
  isActive,
}: {
  tab: Tab;
  isActive: boolean;
}) {
  const Component: ComponentType | undefined = componentRegistry[tab.componentKey];

  return (
    <div
      className="tab-content-panel"
      style={isActive ? undefined : { display: 'none' }}
    >
      <TabContext.Provider value={{ tab }}>
        <PageHeader />
        {Component ? (
          <Suspense
            fallback={
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            }
          >
            <Component />
          </Suspense>
        ) : (
          <div style={{ padding: 20, color: '#999' }}>
            컴포넌트를 찾을 수 없습니다: {tab.componentKey}
          </div>
        )}
      </TabContext.Provider>
    </div>
  );
});

/**
 * Lazy-mount strategy: only mount a tab's component when it becomes active
 * for the first time. Once mounted, keep it alive (display:none) for state preservation.
 *
 * Optimizations:
 * - TabPanel is memo'd: only re-renders when isActive flips
 * - Zustand subscriptions are split: tab keys vs activeTabKey
 */
export default function TabContent() {
  // Subscribe to tab keys only (shallow-stable when order/count doesn't change)
  const tabs = useTabStore((s) => s.tabs);
  const activeTabKey = useTabStore((s) => s.activeTabKey);
  const mountedKeysRef = useRef<Set<string>>(new Set());

  // Lazy-mount tracking: mutate ref during render to record activated tabs.
  // Safe because: (1) idempotent Set.add, (2) only controls display:none not state.
  // eslint-disable-next-line react-hooks/refs
  if (activeTabKey) mountedKeysRef.current.add(activeTabKey);

  // Clean up keys for closed tabs
  const tabKeySet = new Set(tabs.map((t) => t.key));
  // eslint-disable-next-line react-hooks/refs
  for (const key of mountedKeysRef.current) {
    // eslint-disable-next-line react-hooks/refs
    if (!tabKeySet.has(key)) mountedKeysRef.current.delete(key);
  }

  if (tabs.length === 0) {
    return (
      <div
        className="tab-content-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}
      >
        메뉴를 선택해주세요
      </div>
    );
  }

  // Extract map outside JSX so the refs eslint disable can be applied as a line comment
  // eslint-disable-next-line react-hooks/refs
  const tabPanels = tabs.map((tab) => {
    const isActive = tab.key === activeTabKey;
    const hasBeenMounted = mountedKeysRef.current.has(tab.key);

    // Skip rendering entirely if never activated
    if (!isActive && !hasBeenMounted) return null;

    return <TabPanel key={tab.key} tab={tab} isActive={isActive} />;
  });

  return (
    <div className="tab-content-container">
      {tabPanels}
    </div>
  );
}
