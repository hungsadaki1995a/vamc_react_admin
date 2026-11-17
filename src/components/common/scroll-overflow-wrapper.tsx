import type { ReactNode, CSSProperties } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useScrollOverflow } from '@/hooks/useScrollOverflow';

interface Props {
  children: ReactNode;
  step?: number;
  /** outer wrapper div style */
  style?: CSSProperties;
  /** inner scrollable div style (merged with defaults) */
  innerStyle?: CSSProperties;
  /** outer wrapper div className */
  className?: string;
}

export function ScrollOverflowWrapper({ children, step, style, innerStyle, className }: Props) {
  const { ref, overflow, scrollLeft, scrollRight } = useScrollOverflow<HTMLDivElement>(step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, ...style }} className={className}>
      {overflow && (
        <button className="scroll-overflow-btn" onClick={scrollLeft} tabIndex={-1}>
          <LeftOutlined />
        </button>
      )}
      <div
        ref={ref}
        className="scroll-overflow-inner"
        style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap', minWidth: 0, ...innerStyle }}
      >
        {children}
      </div>
      {overflow && (
        <button className="scroll-overflow-btn" onClick={scrollRight} tabIndex={-1}>
          <RightOutlined />
        </button>
      )}
    </div>
  );
}
