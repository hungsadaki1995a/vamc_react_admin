import { useState } from 'react';
import { Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import './FormPanel.css';

interface FormPanelProps {
  /** Panel title (left side of header) */
  title?: React.ReactNode;
  /** Action buttons (right side of header, before collapse toggle) */
  actions?: React.ReactNode;
  /** Highlight bottom border to indicate edit/new mode */
  editMode?: boolean;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Form content */
  children?: React.ReactNode;
}

export default function FormPanel({
  title,
  actions,
  editMode = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  children,
}: FormPanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    const next = !collapsed;
    if (isControlled) {
      onCollapsedChange?.(next);
    } else {
      setInternalCollapsed(next);
      onCollapsedChange?.(next);
    }
  };

  return (
    <div className="ds-form-panel" data-edit={editMode || undefined}>
      <div className="ds-form-panel-header">
        {title && <span className="ds-form-panel-title">{title}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {actions}
          <Button
            size="middle"
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={handleToggle}
          />
        </div>
      </div>
      {!collapsed && (
        <div className="ds-form-panel-body">
          {children}
        </div>
      )}
    </div>
  );
}
