import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useThemeStore } from '@/stores/themeStore';
import { calculateCriticalPath } from './criticalPath';
import { useGanttDateEngine } from './useGanttDateEngine';
import { useGanttDrag } from './useGanttDrag';
import GanttSheetGridPanel from './GanttSheetGridPanel';
import GanttSheetTimelineHeader from './GanttSheetTimelineHeader';
import GanttSheetBar from './GanttSheetBar';
import GanttSheetArrows from './GanttSheetArrows';
import type { GanttTask, GanttViewMode, CriticalPathResult } from './ganttTypes';
import type { DragState } from './useGanttDrag';
import './GanttSheet.css';
import '../gantt/GanttGrid.css';

const HEADER_HEIGHT = 60; // upper(30) + lower(30)

interface GanttSheetProps {
  tasks: GanttTask[];
  viewMode?: GanttViewMode;
  readOnly?: boolean;
  showCriticalPath?: boolean;
  showGrid?: boolean;
  gridWidth?: number;
  gridMinWidth?: number;
  gridMaxWidth?: number;
  collapsedGroups?: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  height?: string | number;
  className?: string;
  loading?: boolean;
  showProgress?: boolean;
  todayButton?: boolean;
  lines?: 'vertical' | 'horizontal' | 'both' | 'none';
  barHeight?: number;
  barCornerRadius?: number;
  rowPadding?: number;
  language?: string;
  onTaskClick?: (task: GanttTask) => void;
  onTaskDoubleClick?: (task: GanttTask) => void;
  onTaskContextMenu?: (task: GanttTask, event: MouseEvent) => void;
  onTaskHover?: (task: GanttTask | null) => void;
  onTaskSelect?: (task: GanttTask | null) => void;
  onGanttReady?: () => void;
  scrollToTodayRef?: React.MutableRefObject<(() => void) | null>;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  rowBuffer?: number;
  columnWidth?: number;
}

export default function GanttSheet({
  tasks,
  viewMode = 'Week',
  readOnly = false,
  showCriticalPath = false,
  showGrid = true,
  gridWidth: initialGridWidth = 400,
  gridMinWidth = 200,
  gridMaxWidth = 600,
  collapsedGroups,
  onToggleGroup,
  height = '100%',
  className,
  loading = false,
  showProgress = true,
  todayButton = true,
  lines = 'both',
  barHeight = 28,
  barCornerRadius = 4,
  rowPadding = 16,
  language = 'ko',
  onTaskClick,
  onTaskDoubleClick,
  onTaskContextMenu,
  onTaskHover,
  onTaskSelect,
  onGanttReady,
  scrollToTodayRef,
  onDateChange,
  onProgressChange,
  rowBuffer = 5,
  columnWidth: columnWidthOverride,
}: GanttSheetProps) {
  const themeMode = useThemeStore((s) => s.mode);

  // ── 타임라인을 헤더 div + 바디 div 로 분리
  // 헤더 div: overflow: hidden (수평 스크롤 동기화 수신만)
  // 바디 div: overflow: auto (실제 스크롤 컨테이너)
  // → 두 패널 모두 내부 높이 = totalListHeight 로 일치 → scrollTop 완벽 동기화
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef = useRef<HTMLDivElement>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const prevScrollTop = useRef(0);

  // Fixed horizontal scrollbar height — added to grid body bottom to align with timeline.
  const hScrollbarHeight = 17;

  const ROW_HEIGHT = barHeight + rowPadding;

  const [gridWidth, setGridWidth] = useState(initialGridWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const [internalCollapsed, setInternalCollapsed] = useState<Set<string>>(new Set());
  const effectiveCollapsed = collapsedGroups ?? internalCollapsed;

  const visibleTasks = useMemo(() => {
    if (effectiveCollapsed.size === 0) return tasks;
    const hiddenIds = new Set<string>();
    for (const task of tasks) {
      if (task.parentId && (hiddenIds.has(task.parentId) || effectiveCollapsed.has(task.parentId))) {
        hiddenIds.add(task.id);
      }
    }
    return tasks.filter((t) => !hiddenIds.has(t.id));
  }, [tasks, effectiveCollapsed]);

  const criticalPath = useMemo<CriticalPathResult | null>(() => {
    if (!showCriticalPath) return null;
    return calculateCriticalPath(tasks);
  }, [tasks, showCriticalPath]);

  const dateEngine = useGanttDateEngine(tasks, viewMode, columnWidthOverride);

  const drag = useGanttDrag({
    dateEngine,
    tasks: visibleTasks,
    readOnly,
    onDateChange,
    onProgressChange,
  });

  // Virtualizer — 바디 div를 스크롤 컨테이너로 사용 (헤더 없음)
  const rowVirtualizer = useVirtualizer({
    count: visibleTasks.length,
    getScrollElement: () => timelineBodyRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: rowBuffer,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalListHeight = rowVirtualizer.getTotalSize();

  const visibleStartIdx = virtualRows.length > 0 ? virtualRows[0].index : 0;
  const visibleEndIdx = virtualRows.length > 0 ? virtualRows[virtualRows.length - 1].index : 0;

  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleTasks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [visibleTasks]);

  const taskDateMap = useMemo(() => {
    const map = new Map<string, { start: string; end: string }>();
    visibleTasks.forEach((t) => map.set(t.id, { start: t.start, end: t.end }));
    return map;
  }, [visibleTasks]);

  const dependencyLines = useMemo(() => {
    if (!criticalPath) {
      const lines: Array<{ fromId: string; toId: string; type: string; isCritical: boolean }> = [];
      for (const task of visibleTasks) {
        for (const depId of task.dependencies ?? []) {
          lines.push({ fromId: depId, toId: task.id, type: task.dependencyTypes?.[depId] ?? 'FS', isCritical: false });
        }
      }
      return lines;
    }
    return criticalPath.criticalLines;
  }, [visibleTasks, criticalPath]);

  // ── 스크롤 동기화
  // timelineBody ↔ gridBody: scrollTop 동기화
  // timelineBody → timelineHeader: scrollLeft 동기화 (헤더 수평 추적)
  useEffect(() => {
    const body = timelineBodyRef.current;
    const grid = gridBodyRef.current;
    const header = timelineHeaderRef.current;
    if (!body || !grid) return;

    const syncBodyToGrid = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;

      // scrollTop 변경 시에만 그리드 동기화 (수평 스크롤 이벤트 무시)
      if (body.scrollTop !== prevScrollTop.current) {
        grid.scrollTop = body.scrollTop;
        prevScrollTop.current = body.scrollTop;
      }

      // 헤더 수평 동기화
      if (header) header.scrollLeft = body.scrollLeft;

      requestAnimationFrame(() => { isSyncing.current = false; });
    };

    const syncGridToBody = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      body.scrollTop = grid.scrollTop;
      prevScrollTop.current = grid.scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    };

    body.addEventListener('scroll', syncBodyToGrid, { passive: true });
    grid.addEventListener('scroll', syncGridToBody, { passive: true });

    return () => {
      body.removeEventListener('scroll', syncBodyToGrid);
      grid.removeEventListener('scroll', syncGridToBody);
    };
  }, []);

  useEffect(() => {
    if (visibleTasks.length > 0) {
      requestAnimationFrame(() => onGanttReady?.());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!scrollToTodayRef) return;
    scrollToTodayRef.current = () => {
      const body = timelineBodyRef.current;
      if (!body || dateEngine.todayX === null) return;
      body.scrollTo({ left: Math.max(0, dateEngine.todayX - body.clientWidth / 3), behavior: 'smooth' });
    };
    return () => { if (scrollToTodayRef) scrollToTodayRef.current = null; };
  }, [scrollToTodayRef, dateEngine.todayX]);

  useEffect(() => {
    const body = timelineBodyRef.current;
    if (!body || dateEngine.todayX === null) return;
    requestAnimationFrame(() => {
      body.scrollLeft = Math.max(0, dateEngine.todayX! - body.clientWidth / 3);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTaskClick = useCallback((task: GanttTask) => {
    setSelectedTaskId(task.id);
    onTaskClick?.(task);
  }, [onTaskClick]);

  const handleToggleGroup = useCallback((groupId: string) => {
    if (collapsedGroups === undefined) {
      setInternalCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
        return next;
      });
    }
    onToggleGroup?.(groupId);
  }, [collapsedGroups, onToggleGroup]);

  useEffect(() => {
    if (!onTaskHover) return;
    onTaskHover(tasks.find((t) => t.id === hoveredTaskId) ?? null);
  }, [hoveredTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onTaskSelect) return;
    onTaskSelect(selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null);
  }, [selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startW = gridWidth;
    const onMove = (ev: MouseEvent) => setGridWidth(Math.min(gridMaxWidth, Math.max(gridMinWidth, startW + ev.clientX - startX)));
    const onUp = () => { setIsResizing(false); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [gridWidth, gridMinWidth, gridMaxWidth]);

  const getEffectiveTask = (task: GanttTask, ds: DragState | null) => {
    if (!ds || ds.taskId !== task.id) return task;
    return { ...task, start: ds.previewStart.toISOString().slice(0, 10), end: ds.previewEnd.toISOString().slice(0, 10), progress: ds.previewProgress };
  };

  const rootClass = ['ds-gantt-sheet', themeMode === 'dark' ? 'ds-gantt-sheet-dark' : '', className ?? ''].filter(Boolean).join(' ');

  if (tasks.length === 0) {
    return (
      <div className={rootClass} style={{ height, flex: 1, minHeight: 0 }}>
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>표시할 작업이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={rootClass} style={{ height, flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)' }}>
          <span style={{ fontSize: 13, color: '#666' }}>로딩 중...</span>
        </div>
      )}

      {/* 좌측 그리드 패널 */}
      {showGrid && (
        <>
          <div className="gantt-grid-panel" style={{ width: gridWidth, flexShrink: 0, overflow: 'hidden', height: '100%' }}>
            <GanttSheetGridPanel
              tasks={visibleTasks}
              headerHeight={HEADER_HEIGHT}
              rowHeight={ROW_HEIGHT}
              collapsedGroups={effectiveCollapsed}
              onToggleGroup={handleToggleGroup}
              onTaskClick={handleTaskClick}
              selectedTaskId={selectedTaskId}
              hoveredTaskId={hoveredTaskId}
              onHoverTask={setHoveredTaskId}
              bodyRef={gridBodyRef}
              virtualRows={virtualRows}
              totalListHeight={totalListHeight}
              hScrollbarHeight={hScrollbarHeight}
            />
          </div>
          <div className={`gantt-resizer${isResizing ? ' gantt-resizer--active' : ''}`} onMouseDown={handleResizeStart} />
        </>
      )}

      {/* 우측 타임라인: 헤더(고정) + 바디(스크롤) 분리
          ─ 헤더와 바디를 분리하면:
            · timelineBodyRef 내부 높이 = totalListHeight (헤더 없음)
            · gridBodyRef 내부 높이 = totalListHeight (동일)
            → 수평 스크롤바 유무에 관계없이 max scrollTop이 항상 일치 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* 헤더 — overflow: hidden (바디 scrollLeft 를 JS로 동기화) */}
        <div ref={timelineHeaderRef} style={{ flexShrink: 0, overflow: 'hidden' }}>
          <GanttSheetTimelineHeader dateEngine={dateEngine} headerHeight={HEADER_HEIGHT} />
        </div>

        {/* 바디 — 실제 스크롤 컨테이너 (수직+수평) */}
        <div
          ref={timelineBodyRef}
          style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'scroll', position: 'relative' }}
        >
          {/* 바 영역 — 화살표 SVG 클리핑을 위해 overflow: hidden */}
          <div
            style={{
              position: 'relative',
              width: dateEngine.totalWidth,
              height: totalListHeight,
              overflow: 'hidden',
            }}
          >
            {/* 주말 하이라이트 */}
            {dateEngine.weekendRanges.map((range, i) => (
              <div key={i} style={{ position: 'absolute', left: range.x, top: 0, width: range.width, height: '100%', background: 'var(--g-weekend-highlight-color, rgba(0,0,0,0.03))', pointerEvents: 'none' }} />
            ))}

            {/* 수직 격자선 */}
            {(lines === 'vertical' || lines === 'both') && dateEngine.lowerHeaders.map((cell, i) => (
              <div key={`vl-${i}`} style={{ position: 'absolute', left: cell.x + cell.width - 1, top: 0, width: 1, height: '100%', background: 'var(--g-tick-color, rgba(0,0,0,0.06))', pointerEvents: 'none' }} />
            ))}

            {/* 수평 행 구분선 */}
            {(lines === 'horizontal' || lines === 'both') && virtualRows.map((vRow) => (
              <div key={`hl-${vRow.index}`} style={{ position: 'absolute', top: vRow.start + ROW_HEIGHT - 1, left: 0, width: '100%', height: 1, background: 'var(--g-row-border-color, var(--border-color))', pointerEvents: 'none' }} />
            ))}

            {/* 오늘 수직선 */}
            {dateEngine.todayX !== null && (
              <div style={{ position: 'absolute', left: dateEngine.todayX, top: 0, width: 2, height: '100%', background: '#f5222d', pointerEvents: 'none', zIndex: 1 }} />
            )}

            {/* 호버 행 하이라이트 */}
            {hoveredTaskId && (() => {
              const idx = taskIndexMap.get(hoveredTaskId);
              return idx !== undefined ? (
                <div style={{ position: 'absolute', top: idx * ROW_HEIGHT, left: 0, width: '100%', height: ROW_HEIGHT, background: 'rgba(22,119,255,0.06)', pointerEvents: 'none', zIndex: 1 }} />
              ) : null;
            })()}

            {/* 선택 행 하이라이트 */}
            {selectedTaskId && (() => {
              const idx = taskIndexMap.get(selectedTaskId);
              return idx !== undefined ? (
                <div style={{ position: 'absolute', top: idx * ROW_HEIGHT, left: 0, width: '100%', height: ROW_HEIGHT, background: 'rgba(22,119,255,0.08)', pointerEvents: 'none', zIndex: 1 }} />
              ) : null;
            })()}

            {/* 의존성 화살표
                SVG는 totalListHeight 전체를 덮는 절대 좌표계.
                부모 wrapper의 overflow:hidden 이 클리핑을 담당하므로
                scrollTop 보정 불필요 */}
            <GanttSheetArrows
              lines={dependencyLines}
              taskIndexMap={taskIndexMap}
              visibleStartIdx={visibleStartIdx}
              visibleEndIdx={visibleEndIdx}
              dateEngine={dateEngine}
              rowHeight={ROW_HEIGHT}
              barHeight={barHeight}
              taskDateMap={taskDateMap}
              totalListHeight={totalListHeight}
            />

            {/* 가상 태스크 바 행 */}
            {virtualRows.map((vRow) => {
              const originalTask = visibleTasks[vRow.index];
              if (!originalTask) return null;
              const task = getEffectiveTask(originalTask, drag.dragState);
              const x = dateEngine.dateToX(new Date(task.start));
              const endX = dateEngine.dateToX(new Date(task.end));
              const barWidth = Math.max(8, endX - x);
              const isCritical = criticalPath?.criticalTaskIds.has(task.id) ?? false;

              return (
                <div
                  key={task.id}
                  style={{ position: 'absolute', top: vRow.start, left: 0, width: '100%', height: ROW_HEIGHT }}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  <GanttSheetBar
                    task={originalTask}
                    x={x}
                    width={barWidth}
                    barHeight={barHeight}
                    rowHeight={ROW_HEIGHT}
                    progress={task.progress}
                    isSelected={selectedTaskId === task.id}
                    isHovered={hoveredTaskId === task.id}
                    isCritical={isCritical}
                    readOnly={readOnly}
                    showProgress={showProgress}
                    barCornerRadius={barCornerRadius}
                    onDragStart={(e, t, handle, bw) => drag.startDrag(e, t, handle, bw)}
                    onDragMove={drag.moveDrag}
                    onDragEnd={drag.endDrag}
                    onClick={handleTaskClick}
                    onDoubleClick={onTaskDoubleClick}
                    onContextMenu={onTaskContextMenu ? (t, e) => onTaskContextMenu(t, e as unknown as MouseEvent) : undefined}
                    onHover={(h) => setHoveredTaskId(h ? task.id : null)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 오늘 버튼 */}
      {todayButton && (
        <button
          style={{ position: 'absolute', bottom: 16, right: 24, zIndex: 15, padding: '4px 12px', fontSize: 12, background: 'var(--content-header-bg)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
          onClick={() => {
            const body = timelineBodyRef.current;
            if (!body || dateEngine.todayX === null) return;
            body.scrollTo({ left: Math.max(0, dateEngine.todayX - body.clientWidth / 3), behavior: 'smooth' });
          }}
        >
          {language === 'en' ? 'Today' : language === 'vi' ? 'Hôm nay' : '오늘'}
        </button>
      )}
    </div>
  );
}
