import { useRef, useState } from 'react';
import { Input, Tooltip } from 'antd';
import type { InputProps, InputRef } from 'antd';
import './tip-input.scss';

/**
 * Input with automatic overflow tooltip.
 * Shows a tooltip with the full value only when text is truncated (scrollWidth > offsetWidth).
 *
 * `readOnly` also owns its visual styling — never set background color or cursor via inline styles on screens.
 * Keeping rules outside the component causes drift across screens and more places to update when dark-mode tokens change.
 */
export default function TipInput({ value, readOnly, className, onMouseEnter, onMouseLeave, ...props }: InputProps) {
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

  const rootClassName = [className, readOnly ? 'ds-input-readonly' : '']
    .filter(Boolean).join(' ') || undefined;

  return (
    <Tooltip title={tooltipTitle} placement="topLeft" mouseEnterDelay={0.4}>
      <Input
        ref={inputRef}
        value={value}
        readOnly={readOnly}
        className={rootClassName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      />
    </Tooltip>
  );
}
