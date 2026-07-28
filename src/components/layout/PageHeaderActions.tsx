import type { ReactNode } from 'react';
import { Badge } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import './PageHeaderActions.css';

interface PageHeaderActionsProps {
  className?: string;
  activeFilterCount?: number;
  collapsed?: boolean;
  onCollapsedChange?: (nextCollapsed: boolean) => void;
  onReset?: () => void;
  onSearch?: () => void;
  resetLoading?: boolean;
  searchLoading?: boolean;
  resetLabel?: ReactNode;
  searchLabel?: ReactNode;
  resetAriaLabel?: string;
  searchAriaLabel?: string;
  collapseAriaLabel?: string;
  showReset?: boolean;
  showSearch?: boolean;
  showCollapse?: boolean;
  showText?: boolean;
  searchPrimary?: boolean;
}

export default function PageHeaderActions({
  className,
  activeFilterCount = 0,
  collapsed = false,
  onCollapsedChange,
  onReset,
  onSearch,
  resetLoading = false,
  searchLoading = false,
  resetLabel,
  searchLabel,
  resetAriaLabel,
  searchAriaLabel,
  collapseAriaLabel,
  showReset,
  showSearch,
  showCollapse = false,
  showText = true,
  searchPrimary = false,
}: PageHeaderActionsProps) {
  const shouldShowReset = showReset ?? !!onReset;
  const shouldShowSearch = showSearch ?? !!onSearch;
  const rootClassName = [
    'ds-page-header-actions',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      {collapsed && activeFilterCount > 0 && (
        <Badge count={activeFilterCount} size="small" />
      )}
      <ActionButtonGroup preset="search" size={4} wrap={false}>
        {shouldShowReset && (
          <ActionButton
            action="reset"
            className="ds-page-header-actions__reset"
            size="middle"
            onClick={onReset}
            loading={resetLoading}
            aria-label={resetAriaLabel}
          >
            {showText ? resetLabel : null}
          </ActionButton>
        )}
        {shouldShowSearch && (
          <ActionButton
            action="search"
            intent={searchPrimary ? 'primary' : 'default'}
            className="ds-page-header-actions__search"
            size="middle"
            onClick={onSearch}
            loading={searchLoading}
            aria-label={searchAriaLabel}
          >
            {showText ? searchLabel : null}
          </ActionButton>
        )}
        {showCollapse && (
          <ActionButton
            action={collapsed ? 'expand' : 'collapse'}
            className="ds-page-header-actions__collapse"
            size="middle"
            icon={collapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={() => onCollapsedChange?.(!collapsed)}
            aria-label={collapseAriaLabel}
          />
        )}
      </ActionButtonGroup>
    </div>
  );
}
