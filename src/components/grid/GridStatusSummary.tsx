import { memo, type ReactNode } from 'react';
import './GridStatusSummary.css';

export type GridStatusSummaryTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'muted';

export interface GridStatusSummaryItem {
  key: string;
  label: ReactNode;
  value: number | string;
  tone?: GridStatusSummaryTone;
  hidden?: boolean;
}

interface GridStatusSummaryProps {
  totalLabel: ReactNode;
  totalValue: number | string;
  totalUnit?: ReactNode;
  items?: GridStatusSummaryItem[];
  prefix?: ReactNode;
  className?: string;
}

function formatValue(value: number | string): string {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function GridStatusSummary({
  totalLabel,
  totalValue,
  totalUnit,
  items = [],
  prefix,
  className,
}: GridStatusSummaryProps) {
  const visibleItems = items.filter((item) => !item.hidden);
  const rootClassName = ['ds-grid-status-summary', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName}>
      {prefix && (
        <>
          <span className="ds-grid-status-summary-prefix">{prefix}</span>
          <span className="ds-grid-status-summary-divider" aria-hidden="true" />
        </>
      )}

      <span className="ds-grid-status-summary-total">
        <span>{totalLabel}</span>
        <strong>{formatValue(totalValue)}{totalUnit}</strong>
      </span>

      {visibleItems.length > 0 && (
        <span className="ds-grid-status-summary-divider" aria-hidden="true" />
      )}

      {visibleItems.map((item) => (
        <span className="ds-grid-status-summary-item" key={item.key}>
          <span className="ds-grid-status-summary-label">{item.label}</span>
          <span className={`ds-grid-status-summary-badge ds-grid-status-summary-badge--${item.tone ?? 'neutral'}`}>
            {formatValue(item.value)}
          </span>
        </span>
      ))}
    </div>
  );
}

export default memo(GridStatusSummary);
