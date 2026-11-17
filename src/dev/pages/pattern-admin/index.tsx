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
          { key: 'form',         label: 'Form input',  children: <ProjectCreate /> },
          { key: 'notification', label: 'Notifications', children: <NotificationCenter /> },
          { key: 'permission',   label: 'Permissions', children: <PermissionManagement /> },
          { key: 'menu',         label: 'Menu management', children: <MenuManagement /> },
        ]}
      />
    </div>
  );
}
