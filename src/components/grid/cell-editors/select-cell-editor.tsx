import { useCallback } from 'react';
import { Select } from 'antd';
import type { CustomCellEditorProps } from 'ag-grid-react';

interface SelectCellEditorProps extends CustomCellEditorProps {
  values: string[];
  valueLabels?: Record<string, string>;
}

export default function SelectCellEditor({
  value,
  onValueChange,
  values,
  valueLabels,
}: SelectCellEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onValueChange(val);
    },
    [onValueChange],
  );

  const options = values.map((v) => ({
    label: valueLabels?.[v] ?? v,
    value: v,
  }));

  return (
    <Select
      value={value ?? undefined}
      onChange={handleChange}
      options={options}
      autoFocus
      defaultOpen
      style={{ width: '100%' }}
    />
  );
}
