import { useCallback } from 'react';
import { Select } from 'antd';
import type { CustomCellEditorProps } from 'ag-grid-react';

interface TagsCellEditorProps extends CustomCellEditorProps {
  presetTags?: string[];
}

export default function TagsCellEditor({
  value,
  onValueChange,
  presetTags = [],
}: TagsCellEditorProps) {
  const handleChange = useCallback(
    (val: string[]) => {
      onValueChange(val);
    },
    [onValueChange],
  );

  const options = presetTags.map((t) => ({ label: t, value: t }));

  return (
    <Select
      mode="tags"
      value={value ?? []}
      onChange={handleChange}
      options={options}
      autoFocus
      defaultOpen
      style={{ width: '100%', minWidth: 160 }}
      placeholder="태그 입력"
    />
  );
}
