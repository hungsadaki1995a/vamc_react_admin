import React, { useCallback, useRef, useState } from 'react';
import type { VirtualItem } from '@tanstack/react-virtual';
import type { GanttTask } from './ganttTypes';

interface ColDef {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  flex?: boolean;
}

const DEFAULT_COLUMNS: ColDef[] = [
  { key: 'name',     label: '태스크', width: 180, minWidth: 100, flex: true },
  { key: 'assignee', label: '담당자', width: 60,  minWidth: 40 },
  { key: 'start',    label: '시작',   width: 58,  minWidth: 40 },
  { key: 'end',      label: '종료',   width: 58,  minWidth: 40 },
  { key: 'progress', label: '진행률', width: 70,  minWidth: 50 },
];

function fmtDate(d: string) { return d.slice(5); } // YYYY-MM-DD → MM-DD

interface GanttSheetGridPanelProps {
  tasks: GanttTask[];
  headerHeight: number;
  rowHeight: number;
  collapsedGroups: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onTaskClick?: (task: GanttTask) => void;
  selectedTaskId?: string;
  hoveredTaskId?: string | null;
  onHoverTask?: (taskId: string | null) => void;
  bodyRef: React.RefObject<HTMLDivElement | null>;
  /** Virtual rows from @tanstack/react-virtual — only these rows are rendered */
  virtualRows: VirtualItem[];
  totalListHeight: number;
  /** Height of the timeline horizontal scrollbar — added as padding-bottom to align panels */
  hScrollbarHeight: number;
}

export default function GanttSheetGridPanel({
  tasks,
  headerHeight,
  rowHeight,
  collapsedGroups,
  onToggleGroup,
  onTaskClick,
  selectedTaskId,
  hoveredTaskId,
  onHoverTask,
  bodyRef,
  virtualRows,
  totalListHeight,
  hScrollbarHeight,
}: GanttSheetGridPanelProps) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null);

  const handleColResizeStart = useCallback(
    (e: React.MouseEvent, colIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns[colIdx];
      resizingRef.current = { colIdx, startX: e.clientX, startWidth: col.width };

      const onMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const { colIdx: idx, startX, startWidth } = resizingRef.current;
        const newW = Math.max(columns[idx].minWidth, startWidth + ev.clientX - startX);
        setColumns((prev) => prev.map((c, i) => (i === idx ? { ...c, width: newW } : c)));
      };
      const onUp = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [columns],
  );

  const gridTemplate = columns
    .map((c) => (c.flex ? `minmax(${c.minWidth}px, 1fr)` : `${c.width}px`))
    .join(' ');
  const fixedWidth = columns.reduce((s, c) => s + (c.flex ? 0 : c.width), 0);
  const flexMin = columns.find((c) => c.flex)?.minWidth ?? 100;
  const totalMinWidth = fixedWidth + flexMin;

  const renderCell = (task: GanttTask, col: ColDef) => {
    const indent = (task.level ?? 0) * 20;
    const isCollapsed = task.isGroup && collapsedGroups.has(task.id);

    switch (col.key) {
      case 'name':
        return (
          <div className="gantt-grid-cell gantt-grid-cell--name">
            <span style={{ paddingLeft: indent }}>
              {task.isGroup && (
                <button
                  className="gantt-grid-toggle"
                  onClick={(e) => { e.stopPropagation(); onToggleGroup(task.id); }}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
              )}
              <span className={task.isGroup ? 'gantt-grid-group-name' : ''}>{task.name}</span>
            </span>
          </div>
        );
      case 'assignee':
        return <div className="gantt-grid-cell gantt-grid-cell--center">{task.assignee ?? ''}</div>;
      case 'start':
        return <div className="gantt-grid-cell gantt-grid-cell--center gantt-grid-cell--date">{fmtDate(task.start)}</div>;
      case 'end':
        return <div className="gantt-grid-cell gantt-grid-cell--center gantt-grid-cell--date">{fmtDate(task.end)}</div>;
      case 'progress':
        return (
          <div className="gantt-grid-cell gantt-grid-cell--progress">
            <div className="gantt-grid-progress">
              <div className="gantt-grid-progress-fill" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="gantt-grid-progress-text">{task.progress}%</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="gantt-grid">
      {/* Fixed header */}
      <div className="gantt-grid-header" style={{ height: headerHeight }}>
        <div
          className="gantt-grid-row gantt-grid-header-row"
          style={{ height: headerHeight, display: 'grid', gridTemplateColumns: gridTemplate, minWidth: totalMinWidth }}
        >
          {columns.map((col, i) => {
            const hasResizer = !col.flex && i < columns.length - 1;
            const needsSep = col.flex && i < columns.length - 1;
            return (
              <div
                key={col.key}
                className={[
                  'gantt-grid-hcell',
                  col.key !== 'name' ? 'gantt-grid-hcell--center' : '',
                  needsSep ? 'gantt-grid-hcell--separator' : '',
                ].filter(Boolean).join(' ')}
              >
                {col.label}
                {hasResizer && (
                  <div
                    className="gantt-grid-col-resizer"
                    onMouseDown={(e) => handleColResizeStart(e, i)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtual body — scroll synced with timeline.
          paddingBottom = hScrollbarHeight so grid bottom aligns with
          timeline body (which is shorter by the horizontal scrollbar height). */}
      <div className="gantt-grid-body" ref={bodyRef} style={{ paddingBottom: hScrollbarHeight }}>
        <div style={{ height: totalListHeight, position: 'relative' }}>
          {virtualRows.map((vRow) => {
            const task = tasks[vRow.index];
            if (!task) return null;
            return (
              <div
                key={task.id}
                className={[
                  'gantt-grid-row',
                  task.isGroup ? 'gantt-grid-row--group' : '',
                  selectedTaskId === task.id ? 'gantt-grid-row--selected' : '',
                  hoveredTaskId === task.id ? 'gantt-grid-row--hovered' : '',
                ].filter(Boolean).join(' ')}
                style={{
                  position: 'absolute',
                  top: vRow.start,
                  height: rowHeight,
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  minWidth: totalMinWidth,
                }}
                onClick={() => onTaskClick?.(task)}
                onMouseEnter={() => onHoverTask?.(task.id)}
                onMouseLeave={() => onHoverTask?.(null)}
              >
                {columns.map((col) => (
                  <div key={col.key} style={{ overflow: 'hidden' }}>
                    {renderCell(task, col)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
