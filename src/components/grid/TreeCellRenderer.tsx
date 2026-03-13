import type { ICellRendererParams } from 'ag-grid-community';
import type { TreeMeta } from './useTreeGrid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TreeCellRendererParams extends ICellRendererParams {
  /**
   * Called when the user clicks the expand/collapse toggle.
   * Receives the node's _nodeId. Wire this to useTreeGrid's toggleExpand.
   *
   * @example
   * cellRendererParams: { onToggle: toggleExpand }
   */
  onToggle?: (id: string) => void;
  /**
   * Optional custom inner renderer for the cell value area.
   * Receives the same ICellRendererParams as the outer renderer.
   * If omitted, renders `params.value` as plain text.
   */
  innerRenderer?: (params: ICellRendererParams) => React.ReactNode;
  /** Pixels to indent per depth level. Default: 18 */
  indentSize?: number;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const toggleBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: 'inherit',
  fontSize: 10,
  lineHeight: 1,
  flexShrink: 0,
  transition: 'opacity 0.1s',
};

const leafPlaceholderStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 16,
  height: 16,
  flexShrink: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * AG Grid Community cell renderer that displays a tree hierarchy.
 *
 * Renders: [indent] [toggle icon] [cell value]
 *
 * Use together with useTreeGrid hook:
 * @example
 * const { treeData, toggleExpand } = useTreeGrid({ data, idField: 'id', parentField: 'parentId' });
 *
 * const columnDefs = [{
 *   field: 'name',
 *   headerName: '이름',
 *   cellRenderer: TreeCellRenderer,
 *   cellRendererParams: { onToggle: toggleExpand },
 * }];
 *
 * <GridTable rowData={treeData} columnDefs={columnDefs} />
 */
export function TreeCellRenderer(params: TreeCellRendererParams) {
  const { data, value, onToggle, innerRenderer, indentSize = 18 } = params;

  const meta = data as (typeof data & Partial<TreeMeta>);
  const level = meta?._treeLevel ?? 0;
  const hasChildren = meta?._hasChildren ?? false;
  const isExpanded = meta?._isExpanded ?? false;
  const nodeId = meta?._nodeId ?? '';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle && nodeId) onToggle(nodeId);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        paddingLeft: level * indentSize,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {hasChildren ? (
        <button
          style={toggleBtnStyle}
          onClick={handleToggle}
          title={isExpanded ? '접기' : '펼치기'}
        >
          {/* Chevron rotates: right (collapsed) → down (expanded) */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          >
            <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span style={leafPlaceholderStyle} />
      )}

      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {innerRenderer ? innerRenderer(params) : (value ?? '')}
      </span>
    </div>
  );
}
