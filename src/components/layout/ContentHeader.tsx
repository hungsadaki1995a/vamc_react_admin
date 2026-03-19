import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dropdown, Input, Popover, Empty, Select } from 'antd';
import type { MenuProps, InputRef } from 'antd';
import {
  HomeOutlined,
  SunOutlined,
  MoonOutlined,
  RightOutlined,
  BellOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  UserAddOutlined,
  FileTextOutlined,
  CheckOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { menuConfig } from '@/config/menuConfig';
import { useTabStore } from '@/stores/tabStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMenuStore } from '@/stores/menuStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';
import { useLogout } from '@/hooks/useLogout';
import { useShallow } from 'zustand/react/shallow';
import { getMenuBreadcrumb, findMenuByKey } from '@/utils/menuUtils';
import type { MenuItem } from '@/types/menu';

// ── 알림 Mock 데이터 ──
type NotificationType = 'info' | 'warning' | 'success' | 'user' | 'document';
interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: NotificationItem[] = [
  { id: '1', type: 'warning', message: 'ERP 시스템 구축 마일스톤 지연', time: '5분 전', isRead: false },
  { id: '2', type: 'user', message: '김철수님이 프로젝트에 배정됨', time: '1시간 전', isRead: false },
  { id: '3', type: 'success', message: '"웹사이트 리뉴얼" 태스크 완료', time: '2시간 전', isRead: true },
  { id: '4', type: 'document', message: '새 문서 "API 설계서 v3.0" 업로드', time: '3시간 전', isRead: false },
  { id: '5', type: 'info', message: '내일 오후 2시 주간회의 예정', time: '5시간 전', isRead: true },
];

const notificationIconMap: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
  warning: { icon: <WarningOutlined />, color: '#faad14' },
  success: { icon: <CheckCircleOutlined />, color: '#52c41a' },
  user: { icon: <UserAddOutlined />, color: '#1677ff' },
  document: { icon: <FileTextOutlined />, color: '#722ed1' },
  info: { icon: <InfoCircleOutlined />, color: '#1677ff' },
};

// ── 메뉴 Flat 변환 (검색용) ──
interface FlatMenuItem {
  key: string;
  label: string;
  breadcrumb: string;
  componentPath?: string;
}

function flattenMenuItems(items: MenuItem[], parents: string[] = []): FlatMenuItem[] {
  const result: FlatMenuItem[] = [];
  for (const item of items) {
    if (item.hidden) continue;
    const crumbs = [...parents, item.label];
    if (item.componentPath) {
      result.push({
        key: item.key,
        label: item.label,
        breadcrumb: crumbs.join(' > '),
        componentPath: item.componentPath,
      });
    }
    if (item.children) {
      result.push(...flattenMenuItems(item.children, crumbs));
    }
  }
  return result;
}

export default function ContentHeader() {
const { tabs, activeTabKey, openTab, setActiveTab } = useTabStore(
    useShallow((s) => ({
      tabs: s.tabs,
      activeTabKey: s.activeTabKey,
      openTab: s.openTab,
      setActiveTab: s.setActiveTab,
    }))
  );
  const { mode, toggleMode } = useThemeStore();
  const { toggleFlyout, serverMenus } = useMenuStore(
    useShallow((s) => ({ toggleFlyout: s.toggleFlyout, serverMenus: s.serverMenus }))
  );
  const homeMenuKey = useSettingsStore((s) => s.homeMenuKey);

  // Merged menus: server business menus + static menuConfig
  const allMenus = useMemo(() => [...serverMenus, ...menuConfig], [serverMenus]);
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const { locale, setLocale } = useLocaleStore();

  const localeOptions: { value: LocaleKey; label: string }[] = [
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // ── 검색 상태 ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<InputRef>(null);

  // ── 알림 상태 ──
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  // ── 메뉴 검색 ──
  const flatMenus = useMemo(() => flattenMenuItems(allMenus), [allMenus]);

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return flatMenus.slice(0, 10);
    const q = searchText.toLowerCase();
    return flatMenus
      .filter((m) => m.label.toLowerCase().includes(q) || m.breadcrumb.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchText, flatMenus]);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setSearchText('');
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchText('');
  }, []);

  const handleSearchSelect = useCallback(
    (menuKey: string) => {
      const menu = findMenuByKey(allMenus, menuKey);
      if (menu) openTab(menu);
      handleSearchClose();
    },
    [allMenus, openTab, handleSearchClose],
  );

  // 검색 모달이 열릴 때 Input에 포커스 (rAF: Portal 렌더링 후 레이아웃 완료 시점에 실행)
  useEffect(() => {
    if (searchOpen) {
      const frame = requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [searchOpen]);

  // Ctrl+K / Cmd+K 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        handleSearchClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, handleSearchClose]);

  // ── 알림 핸들러 ──
  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleNotiClick = useCallback(
    (noti: NotificationItem) => {
      setNotifications((prev) => prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n)));
    },
    [],
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleOpenNotiCenter = useCallback(() => {
    const menu = findMenuByKey(allMenus, 'notifications.notification-center');
    if (menu) openTab(menu);
    setNotiOpen(false);
  }, [openTab]);

  // Breadcrumb from active tab
  const breadcrumb = useMemo(() => {
    const activeTab = tabs.find((t) => t.key === activeTabKey);
    if (!activeTab) return [];
    return getMenuBreadcrumb(allMenus, activeTab.menuKey);
  }, [tabs, activeTabKey, allMenus]);

  // Navigate to home
  const goHome = () => {
    const homeTab = tabs.find((t) => t.menuKey === homeMenuKey);
    if (homeTab) {
      setActiveTab(homeTab.key);
    } else {
      const homeMenu = findMenuByKey(allMenus, homeMenuKey);
      if (homeMenu) openTab(homeMenu);
    }
  };

  // Click on breadcrumb parent → open flyout for that category
  const handleParentClick = (key: string) => {
    const topKey = key.split('.')[0];
    toggleFlyout(topKey);
  };

  // ── 알림 팝오버 콘텐츠 ──
  const notiContent = (
    <div style={{ width: 340 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0 8px',
          borderBottom: '1px solid var(--border-color, #f0f0f0)',
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>알림</span>
        {unreadCount > 0 && (
          <span
            onClick={handleMarkAllRead}
            style={{ color: '#1677ff', cursor: 'pointer', fontSize: 12 }}
          >
            <CheckOutlined style={{ marginRight: 4 }} />
            모두 읽음
          </span>
        )}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <Empty description="알림이 없습니다" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          notifications.map((noti) => {
            const iconInfo = notificationIconMap[noti.type];
            return (
              <div
                key={noti.id}
                onClick={() => handleNotiClick(noti)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 4px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  background: noti.isRead ? 'transparent' : 'var(--row-hover-bg, rgba(22,119,255,0.04))',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    'var(--row-hover-bg, rgba(0,0,0,0.04))';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = noti.isRead
                    ? 'transparent'
                    : 'var(--row-hover-bg, rgba(22,119,255,0.04))';
                }}
              >
                <span style={{ color: iconInfo.color, fontSize: 16, flexShrink: 0, paddingTop: 2 }}>
                  {iconInfo.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: noti.isRead ? 400 : 500,
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {noti.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary, #999)', marginTop: 2 }}>
                    {noti.time}
                  </div>
                </div>
                {!noti.isRead && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#1677ff',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div
        style={{
          textAlign: 'center',
          padding: '8px 0 2px',
          borderTop: '1px solid var(--border-color, #f0f0f0)',
          marginTop: 4,
        }}
      >
        <span
          onClick={handleOpenNotiCenter}
          style={{ color: '#1677ff', cursor: 'pointer', fontSize: 13 }}
        >
          알림 센터 열기
        </span>
      </div>
    </div>
  );

  return (
    <div className="content-header">
      {/* Breadcrumb */}
      <div className="breadcrumb-area">
        <span className="breadcrumb-home" onClick={goHome} title="홈으로">
          <HomeOutlined />
        </span>
        {breadcrumb.map((item, idx) => (
          <span key={item.key} className="breadcrumb-item">
            <RightOutlined className="breadcrumb-separator" />
            <span
              className={
                idx === breadcrumb.length - 1
                  ? 'breadcrumb-current'
                  : 'breadcrumb-parent'
              }
              onClick={
                idx < breadcrumb.length - 1
                  ? () => handleParentClick(item.key)
                  : undefined
              }
            >
              {item.label}
            </span>
          </span>
        ))}
        {breadcrumb.length === 0 && (
          <span className="breadcrumb-empty" style={{ marginLeft: 8 }}>
            메뉴를 선택해주세요
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="header-controls">
        {/* Search */}
        <div className="header-icon-btn" title="검색 (Ctrl+K)" onClick={handleSearchOpen}>
          <SearchOutlined style={{ fontSize: 13 }} />
        </div>

        {/* Notifications */}
        <Popover
          content={notiContent}
          trigger="click"
          open={notiOpen}
          onOpenChange={setNotiOpen}
          placement="bottomRight"
          arrow={false}
        >
          <div className="header-icon-btn" title="알림">
            <BellOutlined style={{ fontSize: 13 }} />
            {unreadCount > 0 && <span className="icon-btn-badge" />}
          </div>
        </Popover>

        <span className="header-divider" />

        {/* Theme toggle */}
        <div
          className="header-icon-btn"
          onClick={toggleMode}
          title={mode === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {mode === 'dark' ? (
            <SunOutlined style={{ fontSize: 13 }} />
          ) : (
            <MoonOutlined style={{ fontSize: 13 }} />
          )}
        </div>

        <span className="header-divider" />

        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GlobalOutlined style={{ fontSize: 12, color: 'var(--text-secondary)' }} />
          <Select
            value={locale}
            onChange={setLocale}
            options={localeOptions}
            size="small"
            variant="borderless"
            style={{ width: 100 }}
            popupMatchSelectWidth={false}
          />
        </div>

        <span className="header-divider" />

        {/* User info + logout */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '1px 4px', borderRadius: 4 }}>
            <UserOutlined style={{ fontSize: 12 }} />
            <span style={{ fontSize: 12 }}>{user?.usrNm ?? '사용자'}</span>
          </div>
        </Dropdown>
      </div>

      {/* ── 글로벌 검색 모달 (Portal: 사이드바 포함 전체 화면 커버) ── */}
      {searchOpen && createPortal(
        <>
          <div className="search-overlay" onClick={handleSearchClose} />
          <div className="search-modal">
            <div className="search-modal-input-wrap">
              <SearchOutlined style={{ color: 'var(--text-tertiary, #999)', fontSize: 16 }} />
              <Input
                ref={searchInputRef}
                placeholder="메뉴 검색... (Ctrl+K)"
                variant="borderless"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={() => {
                  if (searchResults.length > 0) handleSearchSelect(searchResults[0].key);
                }}
                style={{ flex: 1 }}
              />
              <kbd className="search-kbd">ESC</kbd>
            </div>
            <div className="search-modal-results">
              {searchResults.length === 0 ? (
                <div className="search-empty">검색 결과가 없습니다</div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.key}
                    className="search-result-item"
                    onClick={() => handleSearchSelect(item.key)}
                  >
                    <span className="search-result-label">{item.label}</span>
                    <span className="search-result-crumb">{item.breadcrumb}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
