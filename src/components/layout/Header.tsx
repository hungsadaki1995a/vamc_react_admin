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
  GlobalOutlined,
  DownOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Input, Badge, Avatar, Button, Space, Dropdown, Switch } from 'antd';
import type { MenuProps } from 'antd';
import { useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useLocaleStore, type LocaleKey } from '@/stores/localeStore';
import { getLocaleShortLabel } from '@/utils/localeStorage';

export default function Header() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => setCollapsed((v) => !v);
  const { mode, toggleMode } = useThemeStore();
  const { locale, setLocale } = useLocaleStore();

  const languageMenuItems: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>English</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Eng</span>
        </div>
      ),
      icon: locale === 'en' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
    {
      key: 'ko',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>한국어</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Kor</span>
        </div>
      ),
      icon: locale === 'ko' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
    {
      key: 'vn',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minWidth: 105 }}>
          <span>Tiếng Việt</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #999)' }}>Vie</span>
        </div>
      ),
      icon: locale === 'vn' ? <CheckOutlined style={{ color: '#1677ff' }} /> : <span style={{ width: 14 }} />,
    },
  ];

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

          {/* Language selector — as in header mockup: [Globe] Kor ⌵ */}
          <Dropdown
            menu={{
              items: languageMenuItems,
              selectedKeys: [locale],
              onClick: ({ key }) => setLocale(key as LocaleKey),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div
              className="header-lang-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <GlobalOutlined style={{ fontSize: 14 }} />
              <span style={{ fontWeight: 500 }}>{getLocaleShortLabel(locale)}</span>
              <DownOutlined style={{ fontSize: 9, opacity: 0.65 }} />
            </div>
          </Dropdown>

          <Dropdown menu={{ items: profileItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }} size={6}>
              <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#bfbfbf' }} />
              <span style={{ fontSize: 13 }}>관리자</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
