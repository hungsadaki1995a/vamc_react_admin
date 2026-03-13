import React, { useRef } from 'react';
import type { GanttTask, GanttTaskPriority } from './ganttTypes';
import type { DragHandle } from './useGanttDrag';

interface GanttSheetBarProps {
  task: GanttTask;
  x: number;
  width: number;
  barHeight: number;
  rowHeight: number;
  progress: number;
  isSelected: boolean;
  isHovered: boolean;
  isCritical: boolean;
  readOnly: boolean;
  showProgress: boolean;
  barCornerRadius: number;
  /** Called when drag handle is activated */
  onDragStart: (e: React.PointerEvent, task: GanttTask, handle: DragHandle, barWidth: number) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
  onClick: (task: GanttTask) => void;
  onDoubleClick?: (task: GanttTask) => void;
  onContextMenu?: (task: GanttTask, e: React.MouseEvent) => void;
  onHover: (hovering: boolean) => void;
}

const PRIORITY_COLORS: Record<GanttTaskPriority, { bar: string; progress: string }> = {
  low:      { bar: '#91caff', progress: '#1677ff' },
  normal:   { bar: '#b7eb8f', progress: '#52c41a' },
  high:     { bar: '#ffd591', progress: '#fa8c16' },
  critical: { bar: '#ffccc7', progress: '#f5222d' },
};

const HANDLE_WIDTH = 8;

export default function GanttSheetBar({
  task,
  x,
  width,
  barHeight,
  rowHeight,
  progress,
  isSelected,
  isHovered,
  isCritical,
  readOnly,
  showProgress,
  barCornerRadius,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  onDoubleClick,
  onContextMenu,
  onHover,
}: GanttSheetBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const draggable = !readOnly && !task.locked;
  const topOffset = Math.floor((rowHeight - barHeight) / 2);

  // Determine bar colors
  const colors = task.priority ? PRIORITY_COLORS[task.priority] : null;
  const barBg = task.color
    ? task.color
    : colors
    ? colors.bar
    : isCritical
    ? '#ffccc7'
    : 'var(--g-bar-color, #d9d9d9)';
  const progressBg = colors ? colors.progress : isCritical ? '#f5222d' : 'var(--g-progress-color, #1677ff)';

  // Milestone: diamond
  if (task.milestone) {
    const size = barHeight;
    return (
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: topOffset,
          width: size,
          height: size,
          transform: 'rotate(45deg)',
          background: task.color ?? '#722ed1',
          cursor: 'pointer',
          zIndex: isSelected ? 3 : 2,
          outline: isSelected ? '2px solid #1677ff' : 'none',
        }}
        onClick={() => onClick(task)}
        onDoubleClick={() => onDoubleClick?.(task)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(task, e); }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      />
    );
  }

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: topOffset,
    width,
    height: barHeight,
    borderRadius: barCornerRadius,
    background: barBg,
    border: isSelected ? '1px solid #1677ff' : isCritical ? '1px solid #f5222d' : '1px solid rgba(0,0,0,0.1)',
    cursor: draggable ? 'grab' : 'pointer',
    userSelect: 'none',
    zIndex: isSelected ? 3 : isHovered ? 2 : 1,
    opacity: task.locked ? 0.7 : 1,
    overflow: 'visible',
    boxShadow: isHovered && !isSelected ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
    transition: 'box-shadow 0.12s',
  };

  const progressWidth = Math.max(0, Math.min(100, progress));

  return (
    <div
      ref={barRef}
      style={containerStyle}
      onClick={(e) => { e.stopPropagation(); onClick(task); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(task); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(task, e); }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      // Drag: move entire bar
      onPointerDown={draggable ? (e) => onDragStart(e, task, 'move', width) : undefined}
      onPointerMove={draggable ? onDragMove : undefined}
      onPointerUp={draggable ? onDragEnd : undefined}
      onPointerCancel={draggable ? onDragEnd : undefined}
    >
      {/* Progress fill */}
      {showProgress && progressWidth > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progressWidth}%`,
            background: progressBg,
            borderRadius: `${barCornerRadius}px 0 0 ${barCornerRadius}px`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Task label — overflow: visible so text shows outside bar when bar is narrow */}
      <div
        style={{
          position: 'absolute',
          left: HANDLE_WIDTH + 2,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--g-text-dark, rgba(0,0,0,0.85))',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {task.name}
      </div>

      {/* Left resize handle */}
      {draggable && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: HANDLE_WIDTH,
            height: '100%',
            cursor: 'ew-resize',
            borderRadius: `${barCornerRadius}px 0 0 ${barCornerRadius}px`,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 4,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onDragStart(e, task, 'resize-left', width);
          }}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />
      )}

      {/* Right resize handle */}
      {draggable && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: HANDLE_WIDTH,
            height: '100%',
            cursor: 'ew-resize',
            borderRadius: `0 ${barCornerRadius}px ${barCornerRadius}px 0`,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 4,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onDragStart(e, task, 'resize-right', width);
          }}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />
      )}

      {/* Progress drag handle */}
      {draggable && showProgress && (
        <div
          style={{
            position: 'absolute',
            left: `${progressWidth}%`,
            top: 0,
            width: 6,
            height: '100%',
            transform: 'translateX(-3px)',
            cursor: 'col-resize',
            background: 'rgba(255,255,255,0.6)',
            zIndex: 5,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onDragStart(e, task, 'progress', width);
          }}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />
      )}
    </div>
  );
}
