import { useState } from 'react';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import ActionButton from '@/components/common/actions/ActionButton';
import styles from './form-panel.module.scss';

type FormPanelProps = {
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
};

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
    <div className={styles.panel} data-edit={editMode || undefined}>
      <div className={styles.header}>
        {title && <span className={styles.title}>{title}</span>}
        <div className="flex items-center gap-1 ml-auto">
          {actions}
          <ActionButton
            intent="icon"
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={handleToggle}
          />
        </div>
      </div>
      {!collapsed && (
        <div className={styles.body}>
          {children}
        </div>
      )}
    </div>
  );
}
