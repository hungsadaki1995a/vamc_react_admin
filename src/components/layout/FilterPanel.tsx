import { useState } from 'react';
import { Button, Badge } from 'antd';
import { SearchOutlined, UndoOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import './FilterPanel.css';

interface FilterPanelProps {
  /** 접힘 상태 (controlled) */
  collapsed?: boolean;
  /** 접힘 토글 콜백 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** 활성 필터 개수 (접혔을 때 배지 표시) */
  activeFilterCount?: number;
  /** 검색 버튼 클릭 */
  onSearch?: () => void;
  /** 초기화 버튼 클릭 */
  onReset?: () => void;
  /** 필터 필드들 */
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

  const toggle = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <div className={`ds-filter-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="ds-filter-header">
        <div className="ds-filter-header-left">
          <span className="ds-filter-header-title">검색 조건</span>
          {collapsed && activeFilterCount > 0 && (
            <Badge count={activeFilterCount} size="small" style={{ marginLeft: 4 }} />
          )}
        </div>
        <div className="ds-filter-header-actions">
          {onReset && (
            <Button size="middle" icon={<UndoOutlined />} onClick={onReset}>
              초기화
            </Button>
          )}
          {onSearch && (
            <Button size="middle" type="primary" icon={<SearchOutlined />} onClick={onSearch}>
              검색
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
