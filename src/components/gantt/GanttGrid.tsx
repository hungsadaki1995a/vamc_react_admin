import { useState, useCallback, useRef } from 'react';
import type { GanttTask } from './ganttTypes';
import './GanttGrid.css';

interface GanttGridProps {
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
}

/** 컬럼 정의 */
interface ColDef {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  flex?: boolean; // true → 남은 공간 차지
}

const DEFAULT_COLUMNS: ColDef[] = [
  { key: 'name', label: '태스크', width: 180, minWidth: 100, flex: true },
  { key: 'assignee', label: '담당자', width: 60, minWidth: 40 },
  { key: 'start', label: '시작', width: 58, minWidth: 40 },
  { key: 'end', label: '종료', width: 58, minWidth: 40 },
  { key: 'progress', label: '진행률', width: 70, minWidth: 50 },
];

/** 날짜 MM-DD 포맷 */
function fmtDate(d: string) {
  return d.slice(5); // YYYY-MM-DD → MM-DD
}

export default function GanttGrid({
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
}: GanttGridProps) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const resizingRef = useRef<{ colIdx: number; startX: number; startWidth: number } | null>(null);

  /** 컬럼 리사이즈 시작 */
  const handleColResizeStart = useCallback(
    (e: React.MouseEvent, colIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns[colIdx];
      resizingRef.current = { colIdx, startX: e.clientX, startWidth: col.width };

      const handleMove = (ev: MouseEvent) => {
        if (!resizingRef.current) return;
        const { colIdx: idx, startX, startWidth } = resizingRef.current;
        const diff = ev.clientX - startX;
        const minW = columns[idx].minWidth;
        const newWidth = Math.max(minW, startWidth + diff);
        setColumns((prev) => prev.map((c, i) => (i === idx ? { ...c, width: newWidth } : c)));
      };

      const handleUp = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [columns],
  );

  /** 컬럼 gridTemplate 생성 */
  const gridTemplate = columns.map((c) => (c.flex ? `minmax(${c.minWidth}px, 1fr)` : `${c.width}px`)).join(' ');
  // 고정 컬럼 너비 합산 (flex 제외)
  const fixedWidth = columns.reduce((sum, c) => sum + (c.flex ? 0 : c.width), 0);
  // flex 컬럼은 minWidth 사용 (1fr이므로 나머지 공간을 자동으로 채움)
  const flexMinWidth = columns.find((c) => c.flex)?.minWidth ?? 100;
  const totalMinWidth = fixedWidth + flexMinWidth;

  /** 셀 렌더링 */
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup(task.id);
                  }}
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
      {/* 헤더 */}
      <div className="gantt-grid-header" style={{ height: headerHeight }}>
        <div
          className="gantt-grid-row gantt-grid-header-row"
          style={{ height: headerHeight, display: 'grid', gridTemplateColumns: gridTemplate, minWidth: totalMinWidth }}
        >
          {columns.map((col, i) => {
            const hasResizer = !col.flex && i < columns.length - 1;
            const needsSeparator = col.flex && i < columns.length - 1;
            return (
              <div
                key={col.key}
                className={[
                  'gantt-grid-hcell',
                  col.key !== 'name' ? 'gantt-grid-hcell--center' : '',
                  needsSeparator ? 'gantt-grid-hcell--separator' : '',
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

      {/* 바디 */}
      <div className="gantt-grid-body" ref={bodyRef}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={[
              'gantt-grid-row',
              task.isGroup ? 'gantt-grid-row--group' : '',
              selectedTaskId === task.id ? 'gantt-grid-row--selected' : '',
              hoveredTaskId === task.id ? 'gantt-grid-row--hovered' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ height: rowHeight, display: 'grid', gridTemplateColumns: gridTemplate, minWidth: totalMinWidth }}
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
        ))}
      </div>
    </div>
  );
}
