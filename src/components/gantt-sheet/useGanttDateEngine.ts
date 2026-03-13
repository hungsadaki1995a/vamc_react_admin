import { useMemo } from 'react';
import type { GanttTask, GanttViewMode } from './ganttTypes';

export interface HeaderCell {
  label: string;
  x: number;
  width: number;
  isToday?: boolean;
  isWeekend?: boolean;
}

export interface DateEngine {
  ganttStart: Date;
  ganttEnd: Date;
  totalWidth: number;
  columnWidth: number;
  dateToX: (date: Date) => number;
  xToDate: (x: number) => Date;
  snapToUnit: (date: Date, ceil?: boolean) => Date;
  upperHeaders: HeaderCell[];
  lowerHeaders: HeaderCell[];
  todayX: number | null;
  weekendRanges: { x: number; width: number }[];
}

// Default column width (px per unit) per view mode
export const DEFAULT_COLUMN_WIDTHS: Record<GanttViewMode, number> = {
  'Quarter Day': 38,
  'Half Day': 38,
  'Day': 38,
  'Week': 140,
  'Month': 120,
};

const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// Snap date to the start boundary of a view-mode unit
function snapToUnitStart(date: Date, mode: GanttViewMode): Date {
  const d = new Date(date);
  switch (mode) {
    case 'Quarter Day':
      d.setMinutes(0, 0, 0);
      d.setHours(Math.floor(d.getHours() / 6) * 6);
      return d;
    case 'Half Day':
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() < 12 ? 0 : 12);
      return d;
    case 'Day':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'Week': {
      const day = d.getDay(); // 0=Sun, 1=Mon
      const diff = day === 0 ? -6 : 1 - day; // snap to Monday
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'Month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}

// Advance date by N units for the given view mode
function addUnits(date: Date, mode: GanttViewMode, count = 1): Date {
  const d = new Date(date);
  switch (mode) {
    case 'Quarter Day':
      d.setHours(d.getHours() + 6 * count);
      return d;
    case 'Half Day':
      d.setHours(d.getHours() + 12 * count);
      return d;
    case 'Day':
      d.setDate(d.getDate() + count);
      return d;
    case 'Week':
      d.setDate(d.getDate() + 7 * count);
      return d;
    case 'Month':
      d.setMonth(d.getMonth() + count);
      return d;
  }
}

// Padding before first task and after last task
function getPaddingMs(mode: GanttViewMode): number {
  switch (mode) {
    case 'Quarter Day': return 24 * 3600 * 1000;
    case 'Half Day':    return 2 * 24 * 3600 * 1000;
    case 'Day':         return 3 * 24 * 3600 * 1000;
    case 'Week':        return 14 * 24 * 3600 * 1000;
    case 'Month':       return 30 * 24 * 3600 * 1000;
  }
}

function isSameUnit(a: Date, b: Date, mode: GanttViewMode): boolean {
  switch (mode) {
    case 'Day':
      return a.getFullYear() === b.getFullYear() &&
             a.getMonth() === b.getMonth() &&
             a.getDate() === b.getDate();
    case 'Week': {
      const aSnap = snapToUnitStart(new Date(a), mode).getTime();
      const bSnap = snapToUnitStart(new Date(b), mode).getTime();
      return aSnap === bSnap;
    }
    case 'Month':
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    default:
      return false;
  }
}

function formatLowerLabel(d: Date, mode: GanttViewMode): string {
  switch (mode) {
    case 'Quarter Day':
      return `${String(d.getHours()).padStart(2, '0')}:00`;
    case 'Half Day':
      return d.getHours() === 0 ? '오전' : '오후';
    case 'Day':
      return String(d.getDate());
    case 'Week': {
      const end = addUnits(d, 'Week');
      const eDay = new Date(end);
      eDay.setDate(eDay.getDate() - 1);
      return `${d.getMonth() + 1}/${d.getDate()}~${eDay.getMonth() + 1}/${eDay.getDate()}`;
    }
    case 'Month':
      return MONTHS_KO[d.getMonth()];
  }
}

function buildUpperHeaders(
  ganttStart: Date,
  ganttEnd: Date,
  mode: GanttViewMode,
  dateToX: (d: Date) => number,
): HeaderCell[] {
  const result: HeaderCell[] = [];

  if (mode === 'Month') {
    // Group by year
    let cur = new Date(ganttStart.getFullYear(), 0, 1);
    while (cur < ganttEnd) {
      const next = new Date(cur.getFullYear() + 1, 0, 1);
      const x = Math.max(0, dateToX(cur));
      const nextX = dateToX(next < ganttEnd ? next : ganttEnd);
      result.push({ label: `${cur.getFullYear()}년`, x, width: Math.max(0, nextX - x) });
      cur = next;
    }
  } else {
    // Group by month
    let cur = new Date(ganttStart.getFullYear(), ganttStart.getMonth(), 1);
    while (cur < ganttEnd) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const x = Math.max(0, dateToX(cur));
      const nextX = dateToX(next < ganttEnd ? next : ganttEnd);
      result.push({
        label: `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`,
        x,
        width: Math.max(0, nextX - x),
      });
      cur = next;
    }
  }

  return result;
}

export function useGanttDateEngine(
  tasks: GanttTask[],
  viewMode: GanttViewMode,
  columnWidthOverride?: number,
): DateEngine {
  return useMemo(() => {
    const columnWidth = columnWidthOverride ?? DEFAULT_COLUMN_WIDTHS[viewMode];

    // Determine date range from tasks
    let ganttStart: Date;
    let ganttEnd: Date;

    if (tasks.length === 0) {
      const now = new Date();
      ganttStart = snapToUnitStart(new Date(now.getTime() - getPaddingMs(viewMode)), viewMode);
      ganttEnd = addUnits(ganttStart, viewMode, 20);
    } else {
      const startTimes = tasks.map((t) => new Date(t.start).getTime());
      const endTimes = tasks.map((t) => new Date(t.end).getTime());
      const minTime = Math.min(...startTimes);
      const maxTime = Math.max(...endTimes);
      const pad = getPaddingMs(viewMode);

      ganttStart = snapToUnitStart(new Date(minTime - pad), viewMode);
      let rawEnd = new Date(maxTime + pad);
      ganttEnd = snapToUnitStart(rawEnd, viewMode);
      if (ganttEnd.getTime() <= rawEnd.getTime()) {
        ganttEnd = addUnits(ganttEnd, viewMode);
      }
    }

    const totalMs = ganttEnd.getTime() - ganttStart.getTime();

    // totalWidth: sum of all unit widths (use columnWidth × unit count)
    // For proportional accuracy we count units
    let unitCount = 0;
    {
      let cur = new Date(ganttStart);
      while (cur < ganttEnd) {
        unitCount++;
        cur = addUnits(cur, viewMode);
      }
    }
    const totalWidth = unitCount * columnWidth;

    // Re-implement dateToX with exact unit counting for precision
    const dateToXExact = (d: Date): number => {
      if (totalMs === 0) return 0;
      return ((d.getTime() - ganttStart.getTime()) / totalMs) * totalWidth;
    };

    const xToDate = (x: number): Date => {
      if (totalWidth === 0) return new Date(ganttStart);
      return new Date(ganttStart.getTime() + (x / totalWidth) * totalMs);
    };

    const snapToUnit = (d: Date, ceil = false): Date => {
      const snapped = snapToUnitStart(new Date(d), viewMode);
      if (ceil && snapped.getTime() < d.getTime()) {
        return addUnits(snapped, viewMode);
      }
      return snapped;
    };

    // Build lower headers (one cell per unit)
    const lowerHeaders: HeaderCell[] = [];
    const weekendRanges: { x: number; width: number }[] = [];
    const today = new Date();

    let cur = new Date(ganttStart);
    while (cur < ganttEnd) {
      const next = addUnits(cur, viewMode);
      const x = dateToXExact(cur);
      const width = dateToXExact(next) - x;

      const isToday = isSameUnit(cur, today, viewMode);
      const isWeekend = viewMode === 'Day' && (cur.getDay() === 0 || cur.getDay() === 6);

      lowerHeaders.push({ label: formatLowerLabel(cur, viewMode), x, width, isToday, isWeekend });

      if (isWeekend) {
        weekendRanges.push({ x, width });
      }

      // Week mode: highlight Sat+Sun within each week
      if (viewMode === 'Week') {
        const sat = new Date(cur);
        sat.setDate(sat.getDate() + 5); // Saturday
        if (sat < ganttEnd) {
          const satX = dateToXExact(sat);
          const sunEnd = new Date(cur);
          sunEnd.setDate(sunEnd.getDate() + 7); // Next Monday
          const sunEndX = Math.min(dateToXExact(sunEnd), totalWidth);
          weekendRanges.push({ x: satX, width: sunEndX - satX });
        }
      }

      cur = next;
    }

    const upperHeaders = buildUpperHeaders(ganttStart, ganttEnd, viewMode, dateToXExact);

    // Today marker X
    const todayX = today >= ganttStart && today <= ganttEnd ? dateToXExact(today) : null;

    return {
      ganttStart,
      ganttEnd,
      totalWidth,
      columnWidth,
      dateToX: dateToXExact,
      xToDate,
      snapToUnit,
      upperHeaders,
      lowerHeaders,
      todayX,
      weekendRanges,
    };
  }, [tasks, viewMode, columnWidthOverride]);
}
