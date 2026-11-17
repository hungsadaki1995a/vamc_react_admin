import { useCallback } from 'react';
import { Input } from 'antd';
import type { CustomCellEditorProps } from 'ag-grid-react';

const { TextArea } = Input;

interface TextAreaCellEditorProps extends CustomCellEditorProps {
  maxLength?: number;
  rows?: number;
  placeholder?: string;
}

/**
 * AG Grid in-cell editor — renders Ant Design TextArea.
 *
 * Uses popup mode (isPopup = true via cellEditorPopup prop on colDef)
 * so the textarea isn't clipped by the cell boundary.
 * Width is pinned to the host cell (eGridCell.clientWidth) so the popup
 * never overflows the column.
 *
 * @example
 * {
 *   field: 'mrCont',
 *   headerName: '비고',
 *   editable: true,
 *   cellEditor: TextAreaCellEditor,
 *   cellEditorPopup: true,
 *   cellEditorParams: { maxLength: 100, rows: 3 },
 * }
 */
export default function TextAreaCellEditor({
  value,
  onValueChange,
  stopEditing,
  eGridCell,
  maxLength = 500,
  rows = 3,
  placeholder,
}: TextAreaCellEditorProps) {
  const cellWidth = eGridCell?.clientWidth ?? 0;
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange(e.target.value);
    },
    [onValueChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Enter or Shift+Enter: commit and close
      if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
        e.preventDefault();
        stopEditing();
      }
      // Escape: cancel (AG Grid handles this natively)
    },
    [stopEditing],
  );

  return (
    <TextArea
      value={value ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      maxLength={maxLength}
      rows={rows}
      placeholder={placeholder}
      showCount
      autoFocus
      style={{ width: cellWidth > 0 ? cellWidth : '100%', resize: 'none' }}
    />
  );
}
