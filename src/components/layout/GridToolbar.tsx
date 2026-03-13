import './GridToolbar.css';

interface GridToolbarProps {
  /** Total count display (e.g. "전체 102건") */
  totalCount?: number;
  /** Count label (default: "전체") */
  countLabel?: string;
  /** Left additional elements */
  left?: React.ReactNode;
  /** Right action buttons */
  actions?: React.ReactNode;
}

export default function GridToolbar({ totalCount, countLabel = '전체', left, actions }: GridToolbarProps) {
  return (
    <div className="ds-grid-toolbar">
      <div className="ds-grid-toolbar-left">
        {totalCount !== undefined && (
          <span className="ds-grid-toolbar-count">
            {countLabel} <strong>{totalCount.toLocaleString()}</strong>건
          </span>
        )}
        {left}
      </div>
      <div className="ds-grid-toolbar-right">
        {actions}
      </div>
    </div>
  );
}
