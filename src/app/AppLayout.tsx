import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import IconRail from '@/components/layout/IconRail';
import FlyoutPanel from '@/components/layout/FlyoutPanel';
import ContentHeader from '@/components/layout/ContentHeader';
import TabBar from '@/components/tabs/TabBar';
import TabContent from '@/components/tabs/TabContent';
import { useTabRouteSync } from '@/hooks/useTabRouteSync';
import { useMenuStore } from '@/stores/menuStore';
import { useShallow } from 'zustand/react/shallow';

export default function AppLayout() {
  useTabRouteSync();
  const { flyoutVisible, toggleSidebar } = useMenuStore(
    useShallow((s) => ({ flyoutVisible: s.flyoutVisible, toggleSidebar: s.toggleSidebar }))
  );

  return (
    <div className="app-layout">
      <div className="sidebar-area">
        <IconRail />
        <FlyoutPanel />
        <div
          className={`sidebar-toggle-btn ${flyoutVisible ? 'is-open' : ''}`}
          onClick={toggleSidebar}
          title={flyoutVisible ? '메뉴 접기' : '메뉴 펼치기'}
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
  );
}
