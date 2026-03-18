import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Input, Badge, Avatar, Button, Space, Dropdown, Switch } from 'antd';
import type { MenuProps } from 'antd';
import { useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';

export default function Header() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((v) => !v);
  const { mode, toggleMode } = useThemeStore();

  const profileItems: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: '프로필' },
    { key: 'settings', icon: <SettingOutlined />, label: '설정' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '로그아웃', danger: true },
  ];

  return (
    <div className="app-header">
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
        />
        <span className="logo">VAMC NPL ADMIN</span>
      </div>
      <div className="header-right">
        <Input
          placeholder="검색..."
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          size="small"
        />
        <Space size={12} align="center">
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={mode === 'dark'}
            onChange={toggleMode}
            size="small"
          />
          <Badge count={5} size="small">
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
          <Dropdown menu={{ items: profileItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }} size={6}>
              <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span style={{ fontSize: 13 }}>관리자</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
