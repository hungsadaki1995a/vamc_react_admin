import { useState } from 'react';
import { Button, Badge } from 'antd';
import { SearchOutlined, UndoOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useComponentLabel } from '@/hooks/use-component-label';
import styles from './filter-panel.module.scss';

type FilterPanelProps = {
  /** Collapsed state (controlled) */
  collapsed?: boolean;
  /** Collapse toggle callback */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Active filter count (shown as badge when collapsed) */
  activeFilterCount?: number;
  /** Search button click */
  onSearch?: () => void;
  /** Reset button click */
  onReset?: () => void;
  /** Filter fields */
  children: React.ReactNode;
};

export default function FilterPanel({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  activeFilterCount = 0,
  onSearch,
  onReset,
  children,
}: FilterPanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const { tvt, tvb } = useComponentLabel();

  const toggle = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <div className={`${styles.panel} ds-filter-panel ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>{tvt('filterTitle', 'Search Filters')}</span>
          {collapsed && activeFilterCount > 0 && (
            <Badge count={activeFilterCount} size="small" className="ml-1!" />
          )}
        </div>
        <div className={styles.headerActions}>
          {onReset && (
            <Button size="middle" icon={<UndoOutlined />} onClick={onReset}>
              {tvb('reset', 'Reset')}
            </Button>
          )}
          {onSearch && (
            <Button size="middle" type="primary" icon={<SearchOutlined />} onClick={onSearch}>
              {tvb('search', 'Search')}
            </Button>
          )}
          <Button size="middle" icon={collapsed ? <DownOutlined /> : <UpOutlined />} onClick={toggle} />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.fields}>
          {children}
        </div>
      </div>
    </div>
  );
}
