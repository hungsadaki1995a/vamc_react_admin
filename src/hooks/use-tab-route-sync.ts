import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAllMenus } from '@/hooks/useAllMenus';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey, findTopLevelMenuKey, findMenuByComponentPath } from '@/utils/menuUtils';

/**
 * Bidirectional sync between tab system and browser history.
 * - Tab activation → URL push (/members or /app/:tabKey)
 * - Browser back/forward → tab activation
 * - Rail active icon sync
 */
export function useTabRouteSync() {
  const { tabKey } = useParams<{ tabKey: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTabKey, tabs, openTab, setActiveTab } = useTabStore();
  const { setSelectedKey, setActiveRailKey, closeFlyout } = useMenuStore();
  const allMenus = useAllMenus();

  const isNavigatingRef = useRef(false);
  /** URL 이 요구했지만 아직 열지 못한 탭 키 (메뉴 로딩 대기 중) */
  const pendingTabKeyRef = useRef<string | null>(null);

  const isMembersPath = location.pathname === '/members';
  const isInquiryPath = location.pathname === '/content-management/inquiry-management';
  const isFaqPath = location.pathname === '/content-management/faq';
  const effectiveTabKey = isInquiryPath
    ? 'inquiry-management'
    : isFaqPath
      ? 'faq-management'
      : isMembersPath
        ? 'members'
        : tabKey === 'member.list'
          ? 'members'
          : tabKey;

  // Sync Rail active icon from a tab key.
  const syncRailFromKey = useCallback(
    (key: string) => {
      setSelectedKey(key);
      if (
        key === 'inquiry-management' ||
        key === 'faq-management' ||
        key === 'faq' ||
        key === 'content-management' ||
        key === 'InquiryManagement' ||
        key === 'FaqManagement'
      ) {
        setActiveRailKey('content-management');
        return;
      }
      const staticTopKey = key.split('.')[0];

      // Top-level leaf (e.g. dashboard) → close flyout and clear rail highlight
      const topLevelItem = menuConfig.find((m) => m.key === staticTopKey);
      if (topLevelItem && (!topLevelItem.children || topLevelItem.children.length === 0)) {
        closeFlyout();
        setActiveRailKey(null);
        return;
      }

      // Check static config items
      if (menuConfig.some((m) => m.key === staticTopKey)) {
        setActiveRailKey(staticTopKey);
        return;
      }

      // Server or dynamic menu: traverse tree to find the rail-level ancestor
      const railKey =
        findTopLevelMenuKey(allMenus, key) ??
        findTopLevelMenuKey(useMenuStore.getState().serverMenus, key);
      setActiveRailKey(railKey ?? staticTopKey);
    },
    [allMenus, setSelectedKey, setActiveRailKey, closeFlyout],
  );

  // URL → Tab: when URL changes (back/forward, direct address input)
  useEffect(() => {
    if (!effectiveTabKey) return;
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const existingTab = tabs.find(
      (t) =>
        t.key === effectiveTabKey ||
        (effectiveTabKey === 'members' && (t.key === 'member.list' || t.componentKey === 'MemberList')) ||
        (effectiveTabKey === 'inquiry-management' && (t.key === 'inquiry-management' || t.componentKey === 'InquiryManagement')) ||
        (effectiveTabKey === 'faq-management' && (t.key === 'faq-management' || t.key === 'faq' || t.componentKey === 'FaqManagement')),
    );

    if (existingTab) {
      pendingTabKeyRef.current = null;
      if (activeTabKey !== existingTab.key) setActiveTab(existingTab.key);
    } else {
      let menuItem =
        findMenuByKey(allMenus, effectiveTabKey) ||
        (effectiveTabKey === 'members' ? findMenuByKey(allMenus, 'member.list') : null) ||
        (effectiveTabKey === 'inquiry-management' ? findMenuByKey(allMenus, 'inquiry-management') : null) ||
        (effectiveTabKey === 'faq-management' ? findMenuByKey(allMenus, 'faq-management') : null) ||
        findMenuByComponentPath(allMenus, effectiveTabKey) ||
        (effectiveTabKey === 'members' ? findMenuByComponentPath(allMenus, 'MemberList') : null) ||
        (effectiveTabKey === 'inquiry-management' ? findMenuByComponentPath(allMenus, 'InquiryManagement') : null) ||
        (effectiveTabKey === 'faq-management' ? findMenuByComponentPath(allMenus, 'FaqManagement') : null);

      if (menuItem && !menuItem.componentPath && menuItem.children?.[0]?.componentPath) {
        menuItem = menuItem.children[0];
      }
      if (menuItem && menuItem.componentPath) {
        pendingTabKeyRef.current = null;
        openTab(menuItem);
      } else {
        // 메뉴가 아직 안 왔을 수 있다 — 아래 재시도 이펙트가 이어받는다.
        pendingTabKeyRef.current = effectiveTabKey;
      }
    }

    syncRailFromKey(effectiveTabKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTabKey, isMembersPath, isInquiryPath, isFaqPath]);

  // 서버 메뉴 도착 후 보류된 URL 탭 재시도
  useEffect(() => {
    const pending = pendingTabKeyRef.current;
    if (!pending) return;
    if (useMenuStore.getState().serverMenus.length === 0) return;

    let menuItem =
      findMenuByKey(allMenus, pending) ||
      (pending === 'members' ? findMenuByKey(allMenus, 'member.list') : null) ||
      (pending === 'inquiry-management' ? findMenuByKey(allMenus, 'inquiry-management') : null) ||
      (pending === 'faq-management' ? findMenuByKey(allMenus, 'faq-management') : null) ||
      findMenuByComponentPath(allMenus, pending) ||
      (pending === 'members' ? findMenuByComponentPath(allMenus, 'MemberList') : null) ||
      (pending === 'inquiry-management' ? findMenuByComponentPath(allMenus, 'InquiryManagement') : null) ||
      (pending === 'faq-management' ? findMenuByComponentPath(allMenus, 'FaqManagement') : null);

    if (menuItem && !menuItem.componentPath && menuItem.children?.[0]?.componentPath) {
      menuItem = menuItem.children[0];
    }
    if (menuItem && menuItem.componentPath) {
      openTab(menuItem);
      syncRailFromKey(pending);
    } else {
      // 메뉴가 도착했는데도 없다 → 잘못된 URL. 활성 탭 주소로 되돌린다.
      const active = useTabStore.getState().activeTabKey;
      if (active) {
        isNavigatingRef.current = true;
        if (active === 'members' || active === 'member.list') {
          navigate('/members', { replace: true });
        } else if (active === 'inquiry-management' || active === 'InquiryManagement') {
          navigate('/content-management/inquiry-management', { replace: true });
        } else if (active === 'faq-management' || active === 'faq' || active === 'FaqManagement') {
          navigate('/content-management/faq', { replace: true });
        } else {
          navigate(`/app/${active}`, { replace: true });
        }
      }
    }
    pendingTabKeyRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenus]);

  // Tab → URL: when active tab changes
  useEffect(() => {
    if (!activeTabKey) return;
    // URL 이 요구한 탭을 여는 중이면 주소를 건드리지 않는다.
    if (pendingTabKeyRef.current) return;

    if (activeTabKey === 'members' || activeTabKey === 'member.list') {
      if (location.pathname !== '/members') {
        isNavigatingRef.current = true;
        navigate('/members', { replace: false });
      }
      syncRailFromKey('members');
      return;
    }

    if (activeTabKey === 'inquiry-management' || activeTabKey === 'InquiryManagement') {
      if (location.pathname !== '/content-management/inquiry-management') {
        isNavigatingRef.current = true;
        navigate('/content-management/inquiry-management', { replace: false });
      }
      syncRailFromKey('inquiry-management');
      return;
    }

    if (activeTabKey === 'faq-management' || activeTabKey === 'faq' || activeTabKey === 'FaqManagement') {
      if (location.pathname !== '/content-management/faq') {
        isNavigatingRef.current = true;
        navigate('/content-management/faq', { replace: false });
      }
      syncRailFromKey('faq-management');
      return;
    }

    if (activeTabKey === tabKey && location.pathname === `/app/${activeTabKey}`) return;

    isNavigatingRef.current = true;
    navigate(`/app/${activeTabKey}`, { replace: false });

    syncRailFromKey(activeTabKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabKey]);

  // 서버 메뉴 도착 후 레일 하이라이트 재동기화 (최초 1회).
  const railSyncedRef = useRef(false);
  useEffect(() => {
    if (railSyncedRef.current) return;
    if (useMenuStore.getState().serverMenus.length === 0) return;
    railSyncedRef.current = true;

    const key = useTabStore.getState().activeTabKey;
    if (key) syncRailFromKey(key);
  }, [allMenus, syncRailFromKey]);

  // 홈 탭 보장 — 홈 메뉴가 서버 메뉴일 수도 있으므로 메뉴가 채워질 때마다 확인한다.
  useEffect(() => {
    const homeKey = useSettingsStore.getState().homeMenuKey;
    if (tabs.some((t) => t.menuKey === homeKey)) return;

    const homeMenu = findMenuByKey(allMenus, homeKey);
    if (homeMenu && homeMenu.componentPath) openTab(homeMenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenus]);

  // 최초 진입 시 URL 보정 (1회)
  useEffect(() => {
    if (
      location.pathname === '/members' ||
      location.pathname === '/content-management/inquiry-management' ||
      location.pathname === '/content-management/faq'
    ) {
      return;
    }
    if (tabKey) return;
    const homeKey = useSettingsStore.getState().homeMenuKey;
    const currentActive = useTabStore.getState().activeTabKey;
    if (currentActive === 'members' || currentActive === 'member.list') {
      navigate('/members', { replace: true });
    } else if (currentActive === 'inquiry-management' || currentActive === 'InquiryManagement') {
      navigate('/content-management/inquiry-management', { replace: true });
    } else if (currentActive === 'faq-management' || currentActive === 'faq' || currentActive === 'FaqManagement') {
      navigate('/content-management/faq', { replace: true });
    } else {
      navigate(`/app/${currentActive ?? homeKey}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
