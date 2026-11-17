import { Menu } from 'antd';
import { useMenuStore } from '@/stores/menuStore';
import { useTabStore } from '@/stores/tabStore';
import { menuConfig } from '@/config/menuConfig';
import { useShallow } from 'zustand/react/shallow';
import { buildAntMenuItems, findMenuByKey } from '@/utils/menuUtils';
import type { MenuProps } from 'antd';

export default function Sidebar() {
  const { openKeys, selectedKey, setOpenKeys, setSelectedKey } = useMenuStore(
    useShallow((s) => ({
      openKeys: s.openKeys,
      selectedKey: s.selectedKey,
      setOpenKeys: s.setOpenKeys,
      setSelectedKey: s.setSelectedKey,
    }))
  );
  const collapsed = false;
  const openTab = useTabStore((s) => s.openTab);

  const items = buildAntMenuItems(menuConfig);

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    const menuItem = findMenuByKey(menuConfig, key);
    if (!menuItem) return;

    if (menuItem.componentPath) {
      setSelectedKey(key);
      openTab(menuItem);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Menu
      mode="inline"
      items={items}
      openKeys={collapsed ? [] : openKeys}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={handleClick}
      onOpenChange={handleOpenChange}
      inlineCollapsed={collapsed}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
}
