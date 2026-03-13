import { useCallback, useRef, useState } from 'react';
import type { DateEngine } from './useGanttDateEngine';
import type { GanttTask } from './ganttTypes';

export type DragHandle = 'move' | 'resize-left' | 'resize-right' | 'progress';

export interface DragState {
  taskId: string;
  handle: DragHandle;
  /** Preview dates updated live during drag */
  previewStart: Date;
  previewEnd: Date;
  previewProgress: number;
}

interface UseGanttDragOptions {
  dateEngine: DateEngine;
  tasks: GanttTask[];
  readOnly: boolean;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
}

export function useGanttDrag({
  dateEngine,
  tasks,
  readOnly,
  onDateChange,
  onProgressChange,
}: UseGanttDragOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<{
    taskId: string;
    handle: DragHandle;
    startPointerX: number;
    originalStart: Date;
    originalEnd: Date;
    originalProgress: number;
    barWidth: number; // pixel width of bar at drag start (for progress calc)
  } | null>(null);

  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      task: GanttTask,
      handle: DragHandle,
      barPixelWidth: number,
    ) => {
      if (readOnly || task.locked) return;

      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const originalStart = new Date(task.start);
      const originalEnd = new Date(task.end);

      dragRef.current = {
        taskId: task.id,
        handle,
        startPointerX: e.clientX,
        originalStart,
        originalEnd,
        originalProgress: task.progress,
        barWidth: barPixelWidth,
      };

      setDragState({
        taskId: task.id,
        handle,
        previewStart: originalStart,
        previewEnd: originalEnd,
        previewProgress: task.progress,
      });
    },
    [readOnly],
  );

  const moveDrag = useCallback(
    (e: React.PointerEvent) => {
      const ref = dragRef.current;
      if (!ref) return;

      const deltaX = e.clientX - ref.startPointerX;
      const { handle, originalStart, originalEnd, originalProgress, barWidth } = ref;

      const origStartX = dateEngine.dateToX(originalStart);
      const origEndX = dateEngine.dateToX(originalEnd);
      const durationMs = originalEnd.getTime() - originalStart.getTime();

      let previewStart = originalStart;
      let previewEnd = originalEnd;
      let previewProgress = originalProgress;

      switch (handle) {
        case 'move': {
          const newStartX = origStartX + deltaX;
          const snappedStart = dateEngine.snapToUnit(dateEngine.xToDate(newStartX));
          const snappedEnd = new Date(snappedStart.getTime() + durationMs);
          previewStart = snappedStart;
          previewEnd = snappedEnd;
          break;
        }
        case 'resize-left': {
          const newStartX = Math.min(origStartX + deltaX, origEndX - 1);
          previewStart = dateEngine.snapToUnit(dateEngine.xToDate(newStartX));
          // Ensure start < end
          if (previewStart >= originalEnd) previewStart = originalStart;
          previewEnd = originalEnd;
          break;
        }
        case 'resize-right': {
          const newEndX = Math.max(origEndX + deltaX, origStartX + 1);
          previewEnd = dateEngine.snapToUnit(dateEngine.xToDate(newEndX), true);
          if (previewEnd <= originalStart) previewEnd = originalEnd;
          previewStart = originalStart;
          break;
        }
        case 'progress': {
          if (barWidth > 0) {
            const newProgress = Math.round(
              Math.max(0, Math.min(100, originalProgress + (deltaX / barWidth) * 100)),
            );
            previewProgress = newProgress;
          }
          previewStart = originalStart;
          previewEnd = originalEnd;
          break;
        }
      }

      setDragState({
        taskId: ref.taskId,
        handle,
        previewStart,
        previewEnd,
        previewProgress,
      });
    },
    [dateEngine],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const ref = dragRef.current;
      if (!ref) return;

      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

      // Commit final drag state
      const task = tasks.find((t) => t.id === ref.taskId);
      if (task && dragState) {
        if (ref.handle === 'progress') {
          onProgressChange?.(task, dragState.previewProgress);
        } else {
          const start = dragState.previewStart;
          const end = dragState.previewEnd;
          if (
            start.getTime() !== new Date(task.start).getTime() ||
            end.getTime() !== new Date(task.end).getTime()
          ) {
            onDateChange?.(task, start, end);
          }
        }
      }

      dragRef.current = null;
      setDragState(null);
    },
    [tasks, dragState, onDateChange, onProgressChange],
  );

  const cancelDrag = useCallback(() => {
    dragRef.current = null;
    setDragState(null);
  }, []);

  return { dragState, startDrag, moveDrag, endDrag, cancelDrag };
}
