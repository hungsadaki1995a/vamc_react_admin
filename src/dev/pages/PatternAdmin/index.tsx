import { Tabs } from 'antd';
import ProjectCreate from '../ProjectCreate';
import NotificationCenter from '../NotificationCenter';
import PermissionManagement from '../PermissionManagement';
import MenuManagement from '../MenuManagement';

export default function PatternAdmin() {
  return (
    <div className="page-container page-scrollable">
      <Tabs
        defaultActiveKey="form"
        destroyOnHidden
        className="ds-scrollable-tabs"
        items={[
          { key: 'form',         label: '폼 입력',   children: <ProjectCreate /> },
          { key: 'notification', label: '알림 센터', children: <NotificationCenter /> },
          { key: 'permission',   label: '권한 관리', children: <PermissionManagement /> },
          { key: 'menu',         label: '메뉴 관리', children: <MenuManagement /> },
        ]}
      />
    </div>
  );
}
