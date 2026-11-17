import { useRef, useState, useCallback, useEffect } from 'react';
import './SplitPanel.css';

interface SplitPanelProps {
  direction: 'horizontal' | 'vertical';
  /** 초기 크기(px). 비율로 잡으려면 `defaultRatio` 를 쓴다. */
  defaultSize?: number;
  /**
   * 초기 크기를 컨테이너 대비 비율(0~1)로 지정한다. `defaultSize` 가 있으면 무시된다.
   * 화면 폭이 제각각인 업무 화면에서는 px 보다 비율이 맞다 — 기본값은 0.5(반반).
   */
  defaultRatio?: number;
  primaryMinSize?: number;
  secondaryMinSize?: number;
  secondaryVisible?: boolean;
  onResize?: (primarySize: number) => void;
  className?: string;
  children: [React.ReactNode, React.ReactNode];
}

export default function SplitPanel({
  direction,
  defaultSize,
  defaultRatio,
  primaryMinSize = 200,
  secondaryMinSize = 200,
  secondaryVisible = true,
  onResize,
  className,
  children,
}: SplitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [primarySize, setPrimarySize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Cache drag start state: pos (cursor), size (panel size at start), total (container size at start)
  const startRef = useRef({ pos: 0, size: 0, total: 0 });

  // Initialize size — defer layout read to rAF to avoid forced reflow on mount
  useEffect(() => {
    if (primarySize !== null || !containerRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = direction === 'horizontal' ? rect.width : rect.height;
      setPrimarySize(defaultSize ?? Math.floor(total * (defaultRatio ?? 0.5)));
    });
    return () => cancelAnimationFrame(frame);
  }, [defaultSize, defaultRatio, direction, primarySize]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Read container size ONCE at drag start — avoids forced reflow on every mousemove
      const rect = containerRef.current?.getBoundingClientRect();
      const total = rect ? (direction === 'horizontal' ? rect.width : rect.height) : 0;
      setIsDragging(true);
      startRef.current = {
        pos: direction === 'horizontal' ? e.clientX : e.clientY,
        size: primarySize ?? 0,
        total,
      };
    },
    [direction, primarySize],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Use cached container size from drag start — no getBoundingClientRect on mousemove
      const { pos, size, total } = startRef.current;
      const current = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = current - pos;
      let newSize = size + delta;

      // Clamp
      newSize = Math.max(primaryMinSize, newSize);
      newSize = Math.min(total - secondaryMinSize - 4, newSize);

      setPrimarySize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, primaryMinSize, secondaryMinSize, onResize]);

  const isHorizontal = direction === 'horizontal';
  const sizeStyle = primarySize !== null
    ? { [isHorizontal ? 'width' : 'height']: primarySize }
    : { flex: 1 };

  return (
    <div
      ref={containerRef}
      className={`ds-split-panel ${isHorizontal ? 'horizontal' : 'vertical'} ${isDragging ? 'dragging' : ''} ${className ?? ''}`}
    >
      <div className="ds-split-primary" style={sizeStyle}>
        {children[0]}
      </div>
      {secondaryVisible && (
        <>
          <div
            className={`ds-split-divider ${isDragging ? 'active' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div className="ds-split-divider-line" />
          </div>
          <div className="ds-split-secondary">
            {children[1]}
          </div>
        </>
      )}
    </div>
  );
}
