import { useRef, useState } from 'react';
import { Input, Tooltip } from 'antd';
import type { InputProps, InputRef } from 'antd';

/**
 * Input with automatic overflow tooltip.
 * Shows a tooltip with the full value only when text is truncated (scrollWidth > offsetWidth).
 */
export default function TipInput({ value, onMouseEnter, onMouseLeave, ...props }: InputProps) {
  const inputRef = useRef<InputRef>(null);
  const [tooltipTitle, setTooltipTitle] = useState<string>();

  const handleMouseEnter = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = inputRef.current?.input;
    if (el && typeof value === 'string' && el.scrollWidth > el.offsetWidth) {
      setTooltipTitle(value);
    } else {
      setTooltipTitle(undefined);
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
    setTooltipTitle(undefined);
    onMouseLeave?.(e);
  };

  return (
    <Tooltip title={tooltipTitle} placement="topLeft" mouseEnterDelay={0.4}>
      <Input
        ref={inputRef}
        value={value}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </Tooltip>
  );
}
