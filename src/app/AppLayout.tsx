import { useTranslation } from 'react-i18next';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import Header from '@/components/layout/Header';
import IconRail from '@/components/layout/IconRail';
import FlyoutPanel from '@/components/layout/FlyoutPanel';
import TabBar from '@/components/tabs/TabBar';
import TabContent from '@/components/tabs/TabContent';
import { useTabRouteSync } from '@/hooks/use-tab-route-sync';
import { useMenuStore } from '@/stores/menu-store';
import { useShallow } from 'zustand/react/shallow';

export default function AppLayout() {
  useTabRouteSync();
  const { t } = useTranslation();
  const { flyoutVisible, toggleSidebar } = useMenuStore(
    useShallow((s) => ({ flyoutVisible: s.flyoutVisible, toggleSidebar: s.toggleSidebar }))
  );

  const toggleTitle = flyoutVisible ? t('common.collapseMenu') : t('common.expandMenu');

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
        </div>
      </div>
    </div>
  );
}
