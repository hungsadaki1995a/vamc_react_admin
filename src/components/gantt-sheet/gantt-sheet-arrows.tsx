import React from 'react';
import type { DependencyLine } from './ganttTypes';
import type { DateEngine } from './useGanttDateEngine';

interface GanttSheetArrowsProps {
  lines: DependencyLine[];
  /** taskId → index in visibleTasks */
  taskIndexMap: Map<string, number>;
  visibleStartIdx: number;
  visibleEndIdx: number;
  dateEngine: DateEngine;
  rowHeight: number;
  barHeight: number;
  /** Maps taskId → { start, end } for position calculation */
  taskDateMap: Map<string, { start: string; end: string }>;
  /** Total virtual list height (SVG covers the full scrollable area) */
  totalListHeight: number;
}

const ARROW_COLOR = 'rgba(0,0,0,0.35)';
const ARROW_CRITICAL = '#f5222d';
const ARROW_HEAD_SIZE = 6;

/**
 * Build a right-angle SVG path for a FS dependency arrow.
 * from: right edge of predecessor bar
 * to:   left edge of successor bar
 */
function buildArrowPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const midX = (fromX + toX) / 2;

  if (Math.abs(fromY - toY) < 2) {
    // Same row — simple horizontal
    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  }

  if (toX > fromX + 10) {
    // Normal forward dependency
    return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  }

  // Backward (toX < fromX) — route around
  const offX = fromX + 12;
  const offX2 = toX - 12;
  return [
    `M ${fromX} ${fromY}`,
    `L ${offX} ${fromY}`,
    `L ${offX} ${(fromY + toY) / 2}`,
    `L ${offX2} ${(fromY + toY) / 2}`,
    `L ${offX2} ${toY}`,
    `L ${toX} ${toY}`,
  ].join(' ');
}

export default function GanttSheetArrows({
  lines,
  taskIndexMap,
  visibleStartIdx,
  visibleEndIdx,
  dateEngine,
  rowHeight,
  barHeight,
  taskDateMap,
  totalListHeight,
}: GanttSheetArrowsProps) {
  if (lines.length === 0) return null;

  const arrowPaths: React.ReactNode[] = [];
  const barTop = Math.floor((rowHeight - barHeight) / 2);
  const barMidY = barTop + barHeight / 2;

  // Render buffer: also draw arrows that connect into visible range from outside
  const bufferRows = 3;

  for (const line of lines) {
    const fromIdx = taskIndexMap.get(line.fromId);
    const toIdx = taskIndexMap.get(line.toId);
    if (fromIdx === undefined || toIdx === undefined) continue;

    // Skip if both endpoints are well outside the visible range
    const fromVisible = fromIdx >= visibleStartIdx - bufferRows && fromIdx <= visibleEndIdx + bufferRows;
    const toVisible = toIdx >= visibleStartIdx - bufferRows && toIdx <= visibleEndIdx + bufferRows;
    if (!fromVisible && !toVisible) continue;

    const fromDates = taskDateMap.get(line.fromId);
    const toDates = taskDateMap.get(line.toId);
    if (!fromDates || !toDates) continue;

    // X positions: from = end of predecessor, to = start of successor (FS)
    const fromX = dateEngine.dateToX(new Date(fromDates.end));
    const toX = dateEngine.dateToX(new Date(toDates.start));

    // Y positions: absolute coordinates in the full virtual list space.
    // SVG sits at top:0 covering the entire totalListHeight, so no scrollTop subtraction.
    // The parent wrapper has overflow:hidden which clips the SVG to the visible area.
    const fromY = fromIdx * rowHeight + barMidY;
    const toY = toIdx * rowHeight + barMidY;

    const color = line.isCritical ? ARROW_CRITICAL : ARROW_COLOR;
    const d = buildArrowPath(fromX, fromY, toX, toY);

    const headD = [
      `M ${toX} ${toY}`,
      `L ${toX - ARROW_HEAD_SIZE} ${toY - ARROW_HEAD_SIZE / 2}`,
      `L ${toX - ARROW_HEAD_SIZE} ${toY + ARROW_HEAD_SIZE / 2}`,
      'Z',
    ].join(' ');

    arrowPaths.push(
      <g key={`${line.fromId}-${line.toId}`}>
        <path d={d} stroke={color} strokeWidth={1.5} fill="none" />
        <path d={headD} fill={color} />
      </g>,
    );
  }

  if (arrowPaths.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: dateEngine.totalWidth,
        height: totalListHeight,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {arrowPaths}
    </svg>
  );
}
