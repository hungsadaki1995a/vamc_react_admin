import { useRef, useState } from 'react';
import { Input, Tooltip } from 'antd';
import type { InputProps, InputRef } from 'antd';
import './TipInput.css';

/**
 * Input with automatic overflow tooltip.
 * Shows a tooltip with the full value only when text is truncated (scrollWidth > offsetWidth).
 *
 * `readOnly` 는 표기까지 함께 책임진다 — 화면에서 배경색·커서를 인라인 style 로 지정하지 않는다.
 * 규칙이 컴포넌트 밖에 있으면 화면마다 조금씩 달라지고, 다크모드 토큰이 바뀔 때 추적할 곳이 늘어난다.
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
