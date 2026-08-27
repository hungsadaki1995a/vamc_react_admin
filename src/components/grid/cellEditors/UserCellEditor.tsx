import { useState, useEffect, useCallback } from 'react';
import { Select, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { CustomCellEditorProps } from 'ag-grid-react';
import { getUsrSimpleList } from '@/api/sys/usr';

export default function UserCellEditor({ value, onValueChange }: CustomCellEditorProps) {
  const [options, setOptions] = useState<{ label: React.ReactNode; value: string }[]>([]);

  useEffect(() => {
    getUsrSimpleList({}).then((res) => {
      setOptions(
        (res.data ?? []).map((u) => ({
          label: (
            <Space size={4}>
              <UserOutlined />
              <span>{u.usrNm}</span>
              {u.dpNm && (
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>({u.dpNm})</span>
              )}
            </Space>
          ),
          value: u.usrNm,
        })),
      );
    });
  }, []);

  const handleChange = useCallback(
    (val: string) => { onValueChange(val); },
    [onValueChange],
  );

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
