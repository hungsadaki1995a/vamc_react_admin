import { useState } from 'react';
import { Typography, Tree, Card, Tag, Button, Input, Space } from 'antd';
import type { TreeDataNode } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';
import DevPageHeader from '@/dev/DevPageHeader';

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
      <DevPageHeader page="MenuManagement" />
      <div style={{ display: 'flex', gap: 12, minHeight: 400 }}>
        {/* Tree panel */}
        <Card
          size="small"
          title="Menu tree"
          style={{ width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          styles={{ body: { flex: 1, overflow: 'auto', padding: 8 } }}
          extra={
            <Input
              size="small"
              placeholder="Search"
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
          title="Menu details"
          style={{ flex: 1, overflow: 'auto' }}
          extra={selectedMenu && <Button size="small" icon={<EditOutlined />}>Edit</Button>}
        >
          {selectedMenu ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Key', selectedMenu.key],
                ['Label', selectedMenu.label],
                ['Icon', selectedMenu.icon ?? '-'],
                ['Component', selectedMenu.componentPath ?? '(group menu)'],
                ['Permission', selectedMenu.permType ?? '-'],
                ['Children', String(selectedMenu.children?.length ?? 0)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                  <Text style={{ width: 80, flexShrink: 0, fontWeight: 500, color: '#555' }}>{label}</Text>
                  <Text code={label === 'Key' || label === 'Component'}>{value}</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary">Select a menu in the tree</Text>
          )}
        </Card>
      </div>
    </>
  );
}
