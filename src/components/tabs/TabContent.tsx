import { Suspense, useRef, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useTabStore } from '@/stores/tab-store';
import { componentRegistry } from '@/config/component-registry';
import { TabContext } from '@/contexts/tab-context';
import PageHeader from '@/components/layout/PageHeader';
import { PageHeaderSlotContext } from '@/components/layout/page-header-slot-context';
import type { PageHeaderSlot } from '@/types/layout';
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
  const { t } = useTranslation();
  const Component: ComponentType | undefined = componentRegistry[tab.componentKey];
  // Per-tab header slot — registered by the page via usePageHeaderSlot
  const [headerSlot, setHeaderSlot] = useState<PageHeaderSlot | null>(null);

  return (
    <div
      className={`tab-content-panel ${isActive ? '' : 'hidden!'}`}
    >
      <TabContext.Provider value={{ tab }}>
        <PageHeaderSlotContext.Provider value={setHeaderSlot}>
          {!headerSlot?.hidden && tab.componentKey !== 'MemberList' && tab.componentKey !== 'InquiryManagement' && tab.componentKey !== 'FaqManagement' && (
            <PageHeader
              actions={headerSlot?.actions}
              inlineFilters={headerSlot?.inlineFilters}
              titleExtra={headerSlot?.titleExtra}
            />
          )}
          {Component ? (
            <Suspense
              fallback={
                <div className="text-center p-[60px]">
                  <LoadingSpinner size="large" />
                </div>
              }
            >
              <Component />
            </Suspense>
          ) : (
            <div className="p-5 text-[#999]">
              {t('common.componentNotFound', { key: tab.componentKey })}
            </div>
          )}
        </PageHeaderSlotContext.Provider>
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
  const { t } = useTranslation();
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
      <div className="tab-content-container flex items-center justify-center text-[#999]">
        {t('common.selectMenu')}
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
