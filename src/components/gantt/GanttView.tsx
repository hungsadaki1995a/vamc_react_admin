import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';
import { useThemeStore } from '@/stores/themeStore';
import { calculateCriticalPath } from './criticalPath';
import GanttGrid from './GanttGrid';
import type { GanttTask, GanttViewMode, CriticalPathResult } from './ganttTypes';
import './GanttView.css';

/** frappe-gantt 헤더 고정 높이 */
const HEADER_HEIGHT = 85;

interface GanttViewProps {
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

  // ── 표시 옵션
  /** 진행률 바 표시 (기본: true) */
  showProgress?: boolean;
  /** Today 버튼 표시 (기본: true) */
  todayButton?: boolean;
  /** 격자 선 종류 (기본: 'both') */
  lines?: 'vertical' | 'horizontal' | 'both' | 'none';
  /** 바 높이 px (기본: 28) */
  barHeight?: number;
  /** 바 모서리 반경 (기본: 4) */
  barCornerRadius?: number;
  /** 행 패딩 px (기본: 16) */
  rowPadding?: number;
  /** 날짜 언어 (기본: 'ko') */
  language?: string;

  // ── 이벤트: 태스크
  onTaskClick?: (task: GanttTask) => void;
  /** 태스크 더블클릭 */
  onTaskDoubleClick?: (task: GanttTask) => void;
  /** 태스크 우클릭 (기본 컨텍스트 메뉴 억제) */
  onTaskContextMenu?: (task: GanttTask, event: MouseEvent) => void;
  /** 태스크 호버 진입/이탈 (null = 이탈) */
  onTaskHover?: (task: GanttTask | null) => void;
  /** 태스크 선택 변경 (null = 선택 해제) */
  onTaskSelect?: (task: GanttTask | null) => void;
  /** 간트 초기 렌더링 완료 */
  onGanttReady?: () => void;
  /** 오늘 날짜로 스크롤하는 함수를 외부에 노출 */
  scrollToTodayRef?: React.MutableRefObject<(() => void) | null>;

  // ── 이벤트: 데이터 변경
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
}

export default function GanttView({
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
}: GanttViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const timelinePanelRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const themeMode = useThemeStore((s) => s.mode);

  // 행 높이: barHeight + rowPadding (frappe-gantt 계산 방식)
  const ROW_HEIGHT = barHeight + rowPadding;

  // 리사이저 상태
  const [gridWidth, setGridWidth] = useState(initialGridWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // uncontrolled 접기/펼치기 내부 상태 — collapsedGroups prop이 없을 때 사용
  const [internalCollapsed, setInternalCollapsed] = useState<Set<string>>(new Set());
  const effectiveCollapsed = collapsedGroups ?? internalCollapsed;

  // 접힌 그룹의 자식 태스크를 제외한 표시 태스크 목록
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

  // 크리티컬 패스 계산
  const criticalPath = useMemo<CriticalPathResult | null>(() => {
    if (!showCriticalPath) return null;
    return calculateCriticalPath(tasks);
  }, [tasks, showCriticalPath]);

  // frappe-gantt 태스크 변환 (visibleTasks 기준 — 접힌 그룹의 자식 제외)
  const frappeTasks = useMemo(
    () =>
      visibleTasks.map((t) => ({
        id: t.id,
        name: t.name,
        start: t.start,
        end: t.end,
        progress: t.progress,
        dependencies: t.dependencies?.join(', ') ?? '',
        // frappe-gantt classList.add()는 공백 포함 문자열 불가 → 단일 클래스만 전달
        // 나머지 클래스는 post-render DOM 조작으로 적용 (하단 querySelectorAll 루프)
        custom_class: '',
        color: t.color,
        description: t.assignee ? `담당: ${t.assignee}` : '',
        readonly: t.locked,
      })),
    [visibleTasks, criticalPath],
  );

  // Gantt 초기화 & 업데이트
  useEffect(() => {
    if (!containerRef.current || frappeTasks.length === 0) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const gantt = new Gantt(container, frappeTasks, {
      view_mode: viewMode,
      language,
      readonly: readOnly,
      readonly_dates: readOnly,
      readonly_progress: readOnly,
      bar_height: barHeight,
      bar_corner_radius: barCornerRadius,
      padding: rowPadding,
      view_mode_select: false,
      today_button: todayButton,
      lines,
      popup: (ctx) => {
        const original = taskMap.get(ctx.task.id);
        ctx.set_title(ctx.task.name);
        ctx.set_subtitle(original?.assignee ? `담당: ${original.assignee}` : '');
        ctx.set_details(
          `<div>기간: ${original?.start} ~ ${original?.end}</div>` +
            `<div>진행률: ${original?.progress ?? 0}%</div>` +
            (original?.projectName ? `<div>프로젝트: ${original.projectName}</div>` : ''),
        );
      },
      on_click: (task) => {
        const original = taskMap.get(task.id);
        if (original) {
          setSelectedTaskId(task.id);
          onTaskClick?.(original);
        }
      },
      on_date_change: (task, start, end) => {
        const original = taskMap.get(task.id);
        if (original) onDateChange?.(original, start, end);
      },
      on_progress_change: (task, progress) => {
        const original = taskMap.get(task.id);
        if (original) onProgressChange?.(original, progress);
      },
    });

    ganttRef.current = gantt;

    // 초기 렌더링 완료 콜백
    requestAnimationFrame(() => { onGanttReady?.(); });

    // 더블클릭 / 우클릭 이벤트
    const extraHandlers = new Map<Element, { dblclick?: () => void; contextmenu?: (e: MouseEvent) => void }>();
    container.querySelectorAll('.bar-wrapper').forEach((bar) => {
      const barId = bar.getAttribute('data-id');
      if (!barId) return;
      const original = taskMap.get(barId);
      if (!original) return;

      // Apply task classes (split from custom_class to avoid classList.add() space error)
      const extraClasses = [
        criticalPath?.criticalTaskIds.has(original.id) ? 'critical-task' : '',
        original.milestone ? 'milestone-task' : '',
        original.isGroup ? 'group-task' : '',
        original.locked ? 'locked-task' : '',
        original.priority ? `priority-${original.priority}` : '',
        original.customClass ?? '',
      ].filter(Boolean);
      if (extraClasses.length > 0) bar.classList.add(...extraClasses);

      const handlers: { dblclick?: () => void; contextmenu?: (e: MouseEvent) => void } = {};
      if (onTaskDoubleClick) {
        handlers.dblclick = () => onTaskDoubleClick(original);
        bar.addEventListener('dblclick', handlers.dblclick);
      }
      if (onTaskContextMenu) {
        handlers.contextmenu = (e: MouseEvent) => {
          e.preventDefault();
          onTaskContextMenu(original, e);
        };
        bar.addEventListener('contextmenu', handlers.contextmenu as EventListener);
      }
      if (handlers.dblclick || handlers.contextmenu) {
        extraHandlers.set(bar, handlers);
      }
    });

    // Today 버튼: frappe-gantt 기본 핸들러 제거 후 커스텀 핸들러 등록
    const todayBtn = container.querySelector('.today-button') as HTMLButtonElement | null;
    if (todayBtn) {
      // 기존 이벤트 리스너 제거 (cloneNode로 교체)
      const newBtn = todayBtn.cloneNode(true) as HTMLButtonElement;
      todayBtn.parentNode?.replaceChild(newBtn, todayBtn);

      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const timeline = timelinePanelRef.current;
        if (!timeline) return;
        const highlight = container.querySelector('.current-highlight') as HTMLElement | null;
        if (highlight) {
          const left = parseFloat(highlight.style.left) || 0;
          timeline.scrollTo({ left: Math.max(0, left - timeline.clientWidth / 3), behavior: 'smooth' });
        } else {
          const g = ganttRef.current as any;
          if (g) {
            const now = new Date();
            if (now > g.gantt_end) {
              timeline.scrollTo({ left: timeline.scrollWidth, behavior: 'smooth' });
            } else {
              timeline.scrollTo({ left: 0, behavior: 'smooth' });
            }
          }
        }
      });
    }

    // scrollToTodayRef: 외부에서 오늘 날짜로 스크롤 트리거
    if (scrollToTodayRef) {
      scrollToTodayRef.current = () => {
        const timeline = timelinePanelRef.current;
        if (!timeline) return;
        const highlight = container.querySelector('.current-highlight') as HTMLElement | null;
        if (highlight) {
          const left = parseFloat(highlight.style.left) || 0;
          timeline.scrollTo({ left: Math.max(0, left - timeline.clientWidth / 3), behavior: 'smooth' });
        } else {
          timeline.scrollTo({ left: 0, behavior: 'smooth' });
        }
      };
    }

    // 첫 로드 시 오늘 날짜로 스크롤
    requestAnimationFrame(() => {
      const timeline = timelinePanelRef.current;
      if (!timeline) return;
      const highlight = container.querySelector('.current-highlight') as HTMLElement | null;
      if (highlight) {
        const left = parseFloat(highlight.style.left) || 0;
        timeline.scrollLeft = Math.max(0, left - timeline.clientWidth / 3);
      }
    });

    // 간트 hover 이벤트 연결 (bar + grid-row)
    const hoverHandlers = new Map<Element, { enter: () => void; leave: () => void }>();

    const attachHover = (el: Element, taskId: string) => {
      const enter = () => setHoveredTaskId(taskId);
      const leave = () => setHoveredTaskId(null);
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
      hoverHandlers.set(el, { enter, leave });
    };

    // 바 hover
    container.querySelectorAll('.bar-wrapper').forEach((bar) => {
      const barId = bar.getAttribute('data-id');
      if (barId) attachHover(bar, barId);
    });

    // SVG grid-row hover (빈 영역 호버 지원)
    container.querySelectorAll('.grid-row').forEach((row, i) => {
      if (i < visibleTasks.length) {
        (row as SVGElement).style.pointerEvents = 'all';
        attachHover(row, visibleTasks[i].id);
      }
    });

    return () => {
      hoverHandlers.forEach(({ enter, leave }, el) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
      extraHandlers.forEach(({ dblclick, contextmenu }, el) => {
        if (dblclick) el.removeEventListener('dblclick', dblclick);
        if (contextmenu) el.removeEventListener('contextmenu', contextmenu as EventListener);
      });
      container.innerHTML = '';
      ganttRef.current = null;
      if (scrollToTodayRef) scrollToTodayRef.current = null;
    };
  }, [frappeTasks, viewMode, readOnly, barHeight, barCornerRadius, rowPadding, language, todayButton, lines]);

  // 간트 바 + 행 hover 하이라이트 동기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // 바 하이라이트
    container.querySelectorAll('.bar-wrapper').forEach((bar) => {
      const barId = bar.getAttribute('data-id');
      bar.classList.toggle('bar-hovered', barId === hoveredTaskId);
    });

    // SVG 행 오버레이: holiday-highlight 위에 렌더링되도록
    // g.bar 직전에 오버레이 rect 삽입 (holidays 위, bars 아래)
    const NS = 'http://www.w3.org/2000/svg';
    let overlay = svg.querySelector('.row-hover-overlay') as SVGRectElement | null;
    const hoveredIdx = hoveredTaskId ? visibleTasks.findIndex((t) => t.id === hoveredTaskId) : -1;

    if (hoveredIdx >= 0) {
      if (!overlay) {
        overlay = document.createElementNS(NS, 'rect') as SVGRectElement;
        overlay.classList.add('row-hover-overlay');
        overlay.setAttribute('x', '0');
        overlay.setAttribute('width', svg.getAttribute('width') || '100%');
        overlay.setAttribute('height', String(ROW_HEIGHT));
        // g.bar 앞에 삽입 → holidays 위, bars 아래
        const barGroup = svg.querySelector('g.bar');
        if (barGroup) svg.insertBefore(overlay, barGroup);
        else svg.appendChild(overlay);
      }
      overlay.setAttribute('y', String(HEADER_HEIGHT + hoveredIdx * ROW_HEIGHT));
      overlay.style.display = '';
    } else if (overlay) {
      overlay.style.display = 'none';
    }
  }, [hoveredTaskId, visibleTasks]);

  // onTaskHover 콜백 노출
  useEffect(() => {
    if (!onTaskHover) return;
    const hovered = tasks.find((t) => t.id === hoveredTaskId) ?? null;
    onTaskHover(hovered);
  }, [hoveredTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // onTaskSelect 콜백 노출
  useEffect(() => {
    if (!onTaskSelect) return;
    const selected = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null;
    onTaskSelect(selected);
  }, [selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 스크롤 동기화 + 수평 스크롤바 높이 보정
  useEffect(() => {
    if (!showGrid) return;

    const timeline = timelinePanelRef.current;
    const gridBody = gridBodyRef.current;
    if (!timeline || !gridBody) return;

    // 그리드와 타임라인의 스크롤 범위를 일치시키는 패딩 보정
    // SVG 데이터 영역(SVG높이 - 헤더) vs 그리드 행 합(rows × rowHeight) 차이 + 스크롤바 높이
    //
    // Forced reflow 방지: getBoundingClientRect() / offsetHeight 직접 읽기 대신
    // ResizeObserver 엔트리 데이터를 캐시해서 사용 → layout read 없이 write만 수행
    let cachedSvgHeight = 0;
    let cachedScrollbarH = 0;

    const adjustPadding = () => {
      const svgDataHeight = cachedSvgHeight - HEADER_HEIGHT;
      const gridRowsHeight = visibleTasks.length * ROW_HEIGHT;
      const extraGap = Math.max(0, svgDataHeight - gridRowsHeight);
      gridBody.style.paddingBottom = `${extraGap + cachedScrollbarH}px`;
    };

    // SVG 높이 캐시 — frappe-gantt가 SVG를 수정하면 ResizeObserver가 non-blocking으로 감지
    const svgEl = timeline.querySelector('svg');
    const svgResizeObs = new ResizeObserver((entries) => {
      // borderBoxSize.blockSize ≈ offsetHeight (layout read 없이 엔트리에서 직접 획득)
      cachedSvgHeight = entries[0]?.borderBoxSize?.[0]?.blockSize
        ?? entries[0]?.contentRect?.height
        ?? 0;
      requestAnimationFrame(adjustPadding);
    });
    if (svgEl) svgResizeObs.observe(svgEl);

    // 타임라인 컨테이너 크기 변화 → 수평 스크롤바 높이 캐시 갱신
    // borderBoxSize - contentRect.height ≈ offsetHeight - clientHeight (스크롤바 + 테두리 합)
    const containerResizeObs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const borderH = entry.borderBoxSize?.[0]?.blockSize ?? 0;
      cachedScrollbarH = Math.max(0, borderH - entry.contentRect.height);
      requestAnimationFrame(adjustPadding);
    });
    containerResizeObs.observe(timeline);

    const syncFromGantt = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      gridBody.scrollTop = timeline.scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    };

    const syncFromGrid = () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      timeline.scrollTop = gridBody.scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    };

    // passive: true → 브라우저가 JS 완료를 기다리지 않고 즉시 스크롤 합성 → 부드러운 스크롤
    timeline.addEventListener('scroll', syncFromGantt, { passive: true });
    gridBody.addEventListener('scroll', syncFromGrid, { passive: true });

    return () => {
      timeline.removeEventListener('scroll', syncFromGantt);
      gridBody.removeEventListener('scroll', syncFromGrid);
      svgResizeObs.disconnect();
      containerResizeObs.disconnect();
      gridBody.style.paddingBottom = '';
    };
  }, [showGrid, frappeTasks, visibleTasks.length]);

  // 리사이저 드래그
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = gridWidth;

      const handleMove = (ev: MouseEvent) => {
        const newWidth = Math.min(gridMaxWidth, Math.max(gridMinWidth, startWidth + ev.clientX - startX));
        setGridWidth(newWidth);
      };

      const handleUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [gridWidth],
  );

  const handleTaskClick = useCallback(
    (task: GanttTask) => {
      setSelectedTaskId(task.id);
      onTaskClick?.(task);
    },
    [onTaskClick],
  );

  const handleToggleGroup = useCallback(
    (groupId: string) => {
      if (collapsedGroups === undefined) {
        // uncontrolled: 내부 상태 직접 관리
        setInternalCollapsed((prev) => {
          const next = new Set(prev);
          if (next.has(groupId)) next.delete(groupId);
          else next.add(groupId);
          return next;
        });
      }
      onToggleGroup?.(groupId);
    },
    [collapsedGroups, onToggleGroup],
  );

  const rootClass = [
    'ds-gantt-view',
    themeMode === 'dark' ? 'ds-gantt-dark' : '',
    !showProgress ? 'ds-gantt-no-progress' : '',
    className ?? '',
  ].filter(Boolean).join(' ');

  if (tasks.length === 0) {
    return (
      <div className={rootClass} style={{ height, flex: 1, minHeight: 0 }}>
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          표시할 작업이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} style={{ height, flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(2px)',
        }}>
          <span style={{ fontSize: 13, color: '#666' }}>로딩 중...</span>
        </div>
      )}
      {/* 좌측 그리드 */}
      {showGrid && (
        <>
          <div className="gantt-grid-panel" style={{ width: gridWidth }}>
            <GanttGrid
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
            />
          </div>
          <div
            className={`gantt-resizer ${isResizing ? 'gantt-resizer--active' : ''}`}
            onMouseDown={handleResizeStart}
          />
        </>
      )}

      {/* 우측 간트 타임라인 */}
      <div ref={timelinePanelRef} className="gantt-timeline-panel" style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <div ref={containerRef} />
      </div>
    </div>
  );
}
