import type { DateEngine } from './useGanttDateEngine';

interface GanttSheetTimelineHeaderProps {
  dateEngine: DateEngine;
  headerHeight: number;
}

const UPPER_HEIGHT = 30;

export default function GanttSheetTimelineHeader({
  dateEngine,
  headerHeight,
}: GanttSheetTimelineHeaderProps) {
  const lowerHeight = headerHeight - UPPER_HEIGHT;

  return (
    <div
      className="gs-timeline-header"
      style={{
        height: headerHeight,
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--content-header-bg)',
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden',
        flexShrink: 0,
        width: dateEngine.totalWidth,
      }}
    >
      {/* Upper row: year/month grouping */}
      <div style={{ height: UPPER_HEIGHT, position: 'relative' }}>
        {dateEngine.upperHeaders.map((cell, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cell.x,
              width: cell.width,
              height: UPPER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {cell.label}
          </div>
        ))}
      </div>

      {/* Lower row: unit cells (Day/Week/Month) */}
      <div style={{ height: lowerHeight, position: 'relative' }}>
        {dateEngine.lowerHeaders.map((cell, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cell.x,
              width: cell.width,
              height: lowerHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: cell.isToday ? 700 : 400,
              color: cell.isToday
                ? '#f5222d'
                : cell.isWeekend
                ? 'var(--text-disabled, rgba(0,0,0,0.25))'
                : 'var(--text-secondary)',
              borderRight: '1px solid var(--border-color)',
              boxSizing: 'border-box',
              background: cell.isWeekend ? 'rgba(0,0,0,0.02)' : 'transparent',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {cell.label}
          </div>
        ))}
      </div>
    </div>
  );
}
