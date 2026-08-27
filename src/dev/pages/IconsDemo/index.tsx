import { useState, useMemo } from 'react';
import { Typography, Input, Empty } from 'antd';
import * as Icons from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { ComponentType } from 'react';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

const { Title, Text } = Typography;

// Collect all menu icons
function collectIcons(items: MenuItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.icon ? [item.icon] : []),
    ...(item.children ? collectIcons(item.children) : []),
  ]);
}

const menuIconNames = Array.from(new Set(collectIcons(menuConfig)));

// Filter only icon components (OutlinedIcon style names)
const allIconNames = Object.keys(Icons).filter(
  (name) => name.endsWith('Outlined') || name.endsWith('Filled') || name.endsWith('TwoTone'),
);

export default function IconsDemo() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allIconNames;
    return allIconNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>아이콘 갤러리</Title>
      <Text type="secondary">총 {allIconNames.length}개 아이콘</Text>

      <div style={{ margin: '12px 0 8px' }}>
        <Title level={5}>메뉴에서 사용 중인 아이콘</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {menuIconNames.map((name) => {
            const IconComp = (Icons as unknown as Record<string, ComponentType<AntdIconProps>>)[name];
            if (!IconComp) return null;
            return (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', border: '1px solid #f0f0f0', borderRadius: 6 }}>
                <IconComp style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 11 }}>{name}</Text>
              </div>
            );
          })}
        </div>
      </div>

      <Input
        placeholder="아이콘 이름 검색 (예: User, Home, Setting)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 400 }}
        allowClear
      />
      <Text type="secondary">{filtered.length}개 표시 중</Text>

      {filtered.length === 0 ? (
        <Empty description="검색 결과 없음" style={{ marginTop: 24 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginTop: 12 }}>
          {filtered.slice(0, 200).map((name) => {
            const IconComp = (Icons as unknown as Record<string, ComponentType<AntdIconProps>>)[name];
            if (!IconComp) return null;
            return (
              <div
                key={name}
                title={name}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', border: '1px solid #f0f0f0', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
                onClick={() => navigator.clipboard?.writeText(name)}
              >
                <IconComp style={{ fontSize: 20 }} />
                <Text ellipsis style={{ fontSize: 10, maxWidth: 90, textAlign: 'center' }}>{name}</Text>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length > 200 && (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>... 상위 200개만 표시. 검색어를 입력하세요.</Text>
      )}
    </div>
  );
}
