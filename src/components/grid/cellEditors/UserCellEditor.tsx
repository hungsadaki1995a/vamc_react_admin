import { useCallback } from 'react';
import { Select, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { mockUsers } from '@/mock/users';
import type { CustomCellEditorProps } from 'ag-grid-react';

export default function UserCellEditor({ value, onValueChange }: CustomCellEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onValueChange(val);
    },
    [onValueChange],
  );

  const options = mockUsers.map((u) => ({
    label: (
      <Space size={4}>
        <UserOutlined />
        <span>{u.name}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({u.department})</span>
      </Space>
    ),
    value: u.name,
  }));

  return (
    <Select
      value={value ?? undefined}
      onChange={handleChange}
      options={options}
      showSearch
      filterOption={(input, option) =>
        String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
      }
      autoFocus
      defaultOpen
      style={{ width: '100%', minWidth: 150 }}
      placeholder="담당자 선택"
    />
  );
}
