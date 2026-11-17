import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import Header from '@/components/layout/header';
import IconRail from '@/components/layout/icon-rail';
import FlyoutPanel from '@/components/layout/flyout-panel';
import ContentHeader from '@/components/layout/content-header';
import TabBar from '@/components/tabs/tab-bar';
import TabContent from '@/components/tabs/tab-content';
import { useTabRouteSync } from '@/hooks/use-tab-route-sync';
import { useMenuStore } from '@/stores/menu-store';
import { useLocaleStore } from '@/stores/locale-store';
import { useShallow } from 'zustand/react/shallow';

export default function AppLayout() {
  useTabRouteSync();
  const { flyoutVisible, toggleSidebar } = useMenuStore(
    useShallow((s) => ({ flyoutVisible: s.flyoutVisible, toggleSidebar: s.toggleSidebar }))
  );
  const locale = useLocaleStore((s) => s.locale);

  const toggleTitle =
    locale === 'ko'
      ? (flyoutVisible ? '메뉴 접기' : '메뉴 펼치기')
      : locale === 'vn'
      ? (flyoutVisible ? 'Thu gọn menu' : 'Mở rộng menu')
      : (flyoutVisible ? 'Collapse menu' : 'Expand menu');

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <div className="sidebar-area">
          <IconRail />
          <FlyoutPanel />
          <div
            className={`sidebar-toggle-btn ${flyoutVisible ? 'is-open' : ''}`}
            onClick={toggleSidebar}
            title={toggleTitle}
          >
            {flyoutVisible ? <LeftOutlined /> : <RightOutlined />}
          </div>
        </div>
        <div className="main-area">
          <TabBar />
          <TabContent />
          <ContentHeader />
        </div>
      </div>
    </div>
  );
}
