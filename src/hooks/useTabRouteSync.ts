import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAllMenus } from '@/hooks/useAllMenus';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey, findTopLevelMenuKey, findMenuByComponentPath } from '@/utils/menuUtils';

/**
 * Bidirectional sync between tab system and browser history.
 * - Tab activation → URL push
 * - Browser back/forward → tab activation
 * - Rail active icon sync
 *
 * <p>탭을 여는 데 쓰는 메뉴 목록은 `useAllMenus()`(서버 메뉴 + 정적 메뉴)다.
 * 업무 메뉴는 전부 서버에서 오고 `menuConfig` 에는 대시보드·개발 도구밖에 없으므로,
 * `menuConfig` 만 뒤지면 URL 직접 접근에서 업무 화면 탭이 복원되지 않는다.</p>
 *
 * <p>서버 메뉴는 로그인 뒤 <b>비동기로</b> 채워진다. 그래서 URL 로 바로 들어오면
 * 첫 렌더 시점에는 아직 메뉴가 없어 탭을 열 수 없다. 이때 URL 을 보류(pending)로 잡아두고,
 * 메뉴가 도착하면 다시 시도한다. 보류 중에는 "탭 → URL" 동기화를 멈춘다 —
 * 그러지 않으면 localStorage 에서 복원된 활성 탭이 주소를 덮어써서
 * 요청한 화면 대신 이전 탭으로 되돌아간다.</p>
 */
export function useTabRouteSync() {
  const { tabKey } = useParams<{ tabKey: string }>();
  const navigate = useNavigate();
  const { activeTabKey, tabs, openTab, setActiveTab } = useTabStore();
  const { setSelectedKey, setActiveRailKey, closeFlyout } = useMenuStore();
  const allMenus = useAllMenus();

  const isNavigatingRef = useRef(false);
  /** URL 이 요구했지만 아직 열지 못한 탭 키 (메뉴 로딩 대기 중) */
  const pendingTabKeyRef = useRef<string | null>(null);

  // Sync Rail active icon from a tab key.
  // Static menus use dot-separated keys (e.g. 'dev.overview') → first segment is the rail key.
  // Server menus use raw IDs (e.g. 'A06040300') → search the serverMenus tree.
  const syncRailFromKey = useCallback((key: string) => {
    setSelectedKey(key);
    const staticTopKey = key.split('.')[0];

    // Top-level leaf (e.g. dashboard) → close flyout and clear rail highlight
    const topLevelItem = menuConfig.find((m) => m.key === staticTopKey);
    if (topLevelItem && (!topLevelItem.children || topLevelItem.children.length === 0)) {
      closeFlyout();
      setActiveRailKey(null);
      return;
    }

    // Static menu: first segment matches a top-level config item
    if (menuConfig.some((m) => m.key === staticTopKey)) {
      setActiveRailKey(staticTopKey);
      return;
    }

    // Server menu: traverse tree to find the rail-level ancestor
    const railKey = findTopLevelMenuKey(useMenuStore.getState().serverMenus, key);
    setActiveRailKey(railKey ?? staticTopKey);
  }, [setSelectedKey, setActiveRailKey, closeFlyout]);

  // URL → Tab: when URL changes (back/forward, 직접 입력)
  useEffect(() => {
    if (!tabKey) return;
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }

    const existingTab = tabs.find((t) => t.key === tabKey);
    if (existingTab) {
      pendingTabKeyRef.current = null;
      if (activeTabKey !== tabKey) setActiveTab(tabKey);
    } else {
      let menuItem = findMenuByKey(allMenus, tabKey) || findMenuByComponentPath(allMenus, tabKey);
      if (menuItem && !menuItem.componentPath && menuItem.children?.[0]?.componentPath) {
        menuItem = menuItem.children[0];
      }
      if (menuItem && menuItem.componentPath) {
        pendingTabKeyRef.current = null;
        openTab(menuItem);
      } else {
        // 메뉴가 아직 안 왔을 수 있다 — 아래 재시도 이펙트가 이어받는다.
        pendingTabKeyRef.current = tabKey;
      }
    }

    syncRailFromKey(tabKey);
    // tabKey 변경에만 반응한다 — allMenus 를 넣으면 백그라운드 메뉴 재검증(SWR)마다
    // 다시 돌면서 isNavigatingRef 가드를 엉뚱한 시점에 소비한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey]);

  // 서버 메뉴 도착 후 보류된 URL 탭 재시도
  useEffect(() => {
    const pending = pendingTabKeyRef.current;
    if (!pending) return;
    // 메뉴가 아직 안 왔으면 다음 변화를 기다린다 (섣불리 포기하면 URL 이 날아간다).
    if (useMenuStore.getState().serverMenus.length === 0) return;

    let menuItem = findMenuByKey(allMenus, pending) || findMenuByComponentPath(allMenus, pending);
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
        navigate(`/app/${active}`, { replace: true });
      }
    }
    pendingTabKeyRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMenus]);

  // Tab → URL: when active tab changes
  useEffect(() => {
    if (!activeTabKey) return;
    if (activeTabKey === tabKey) return;
    // URL 이 요구한 탭을 여는 중이면 주소를 건드리지 않는다.
    // (localStorage 에서 복원된 활성 탭이 요청 주소를 덮어쓰는 것을 막는다)
    if (pendingTabKeyRef.current) return;

    isNavigatingRef.current = true;
    navigate(`/app/${activeTabKey}`, { replace: false });

    syncRailFromKey(activeTabKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabKey]);

  // 서버 메뉴 도착 후 레일 하이라이트 재동기화 (최초 1회).
  // 마운트 시점에는 serverMenus 가 비어 있어 조상 탐색이 실패한다.
  // allMenus 변화마다 돌리지 않는 이유: syncRailFromKey 는 정적 top-level leaf(대시보드)일 때
  // closeFlyout() 을 부르므로, 백그라운드 메뉴 재검증(SWR)이 열어둔 플라이아웃을 닫아버린다.
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
    if (tabKey) return;
    const homeKey = useSettingsStore.getState().homeMenuKey;
    // openTab 이 방금 갱신했을 수 있으므로 스토어에서 직접 읽는다(클로저 값은 낡았다).
    const currentActive = useTabStore.getState().activeTabKey;
    navigate(`/app/${currentActive ?? homeKey}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
