import { useState } from 'react';
import { Typography, Tree, Card, Tag, Button, Input, Space } from 'antd';
import type { TreeDataNode } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

const { Text } = Typography;

function menuToTreeData(items: MenuItem[]): TreeDataNode[] {
  return items.map((item) => ({
    key: item.key,
    title: (
      <Space>
        <span>{item.label}</span>
        <Text code style={{ fontSize: 11 }}>{item.key}</Text>
        {item.componentPath && <Tag style={{ fontSize: 10 }}>{item.componentPath}</Tag>}
        {item.icon && <Tag color="blue" style={{ fontSize: 10 }}>{item.icon}</Tag>}
      </Space>
    ),
    children: item.children ? menuToTreeData(item.children) : undefined,
  }));
}

const treeData = menuToTreeData(menuConfig);

export default function MenuManagement() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  function findMenu(items: MenuItem[], key: string): MenuItem | null {
    for (const item of items) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findMenu(item.children, key);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedMenu = selected ? findMenu(menuConfig, selected) : null;

  return (
    <>
      <div className="ds-section-header">
        <h2>메뉴 관리</h2>
      </div>
      <div style={{ display: 'flex', gap: 12, minHeight: 400 }}>
        {/* Tree panel */}
        <Card
          size="small"
          title="메뉴 트리"
          style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          styles={{ body: { flex: 1, overflow: 'auto', padding: 8 } }}
          extra={
            <Input
              size="small"
              placeholder="검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 120 }}
              allowClear
            />
          }
        >
          <Tree
            treeData={treeData}
            defaultExpandAll
            selectedKeys={selected ? [selected] : []}
            onSelect={(keys) => setSelected(keys[0] as string ?? null)}
          />
        </Card>

        {/* Detail panel */}
        <Card
          size="small"
          title="메뉴 상세"
          style={{ flex: 1, overflow: 'auto' }}
          extra={selectedMenu && <Button size="small" icon={<EditOutlined />}>수정</Button>}
        >
          {selectedMenu ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Key', selectedMenu.key],
                ['라벨', selectedMenu.label],
                ['아이콘', selectedMenu.icon ?? '-'],
                ['컴포넌트', selectedMenu.componentPath ?? '(그룹 메뉴)'],
                ['권한코드', selectedMenu.permType ?? '-'],
                ['자식 수', String(selectedMenu.children?.length ?? 0)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                  <Text style={{ width: 80, flexShrink: 0, fontWeight: 500, color: '#555' }}>{label}</Text>
                  <Text code={label === 'Key' || label === '컴포넌트'}>{value}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary">트리에서 메뉴를 선택하세요</Text>
          )}
        </Card>
      </div>
    </>
  );
}
