import { useState } from 'react';
import { Button, Badge } from 'antd';
import { SearchOutlined, UndoOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { useComponentLabel } from '@/hooks/use-component-label';
import './filter-panel.scss';

interface FilterPanelProps {
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
}

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
    <div className={`ds-filter-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="ds-filter-header">
        <div className="ds-filter-header-left">
          <span className="ds-filter-header-title">{tvt('filterTitle', 'Search Filters')}</span>
          {collapsed && activeFilterCount > 0 && (
            <Badge count={activeFilterCount} size="small" className="ml-1!" />
          )}
        </div>
        <div className="ds-filter-header-actions">
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
      <div className="ds-filter-body">
        <div className="ds-filter-fields">
          {children}
        </div>
      </div>
    </div>
  );
}
