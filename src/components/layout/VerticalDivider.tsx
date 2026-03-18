import type { CSSProperties } from 'react';

interface VerticalDividerProps {
  height?: number;
  margin?: number;
  style?: CSSProperties;
}

/**
 * Inline vertical divider for button groups.
 * Replaces <Divider type="vertical" /> which is deprecated in antd v6.
 */
export default function VerticalDivider({ height = 14, margin = 2, style }: VerticalDividerProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 1,
        height,
        background: 'var(--ant-color-split)',
        margin: `0 ${margin}px`,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
