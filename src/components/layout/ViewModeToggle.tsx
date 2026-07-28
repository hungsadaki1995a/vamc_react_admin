import type { CSSProperties, ReactNode } from 'react';
import { Tooltip } from 'antd';
import './ViewModeToggle.css';

export interface ViewModeToggleOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** 커스텀 아이콘. 미지정 시 인덱스 기반 기본 아이콘(grid/list) 사용 */
  icon?: ReactNode;
  /** 마우스 오버 시 표시할 antd 툴팁. 지정 시 네이티브 title 대신 사용 */
  tooltip?: ReactNode;
}

interface ViewModeToggleProps<T extends string> {
  value: T;
  options: readonly ViewModeToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

type ViewModeToggleStyle = CSSProperties & {
  '--ds-view-mode-toggle-active-index': number;
};

export default function ViewModeToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel = 'View mode',
  className,
}: ViewModeToggleProps<T>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const style: ViewModeToggleStyle = {
    '--ds-view-mode-toggle-active-index': activeIndex,
  };

  return (
    <div
      className={['ds-view-mode-toggle', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
      style={style}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const icon = option.icon ?? getDefaultIcon(index);
        const hasTooltip = option.tooltip != null;

        const button = (
          <button
            key={option.value}
            type="button"
            className={[
              'ds-view-mode-toggle__button',
              selected ? 'ds-view-mode-toggle__button--active' : '',
            ].filter(Boolean).join(' ')}
            // antd 툴팁 사용 시 네이티브 title 중복 표시 방지
            title={hasTooltip ? undefined : option.label}
            aria-label={option.label}
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
          >
            <span className="ds-view-mode-toggle__icon" aria-hidden="true">
              {icon}
            </span>
            <span className="ds-view-mode-toggle__sr">{option.label}</span>
          </button>
        );

        return hasTooltip ? (
          <Tooltip key={option.value} title={option.tooltip}>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}

function getDefaultIcon(index: number) {
  return index === 0 ? <ViewModeGridIcon /> : <ViewModeListIcon />;
}

export function ViewModeGridIcon() {
  return (
    <span className="ds-view-mode-toggle-icon ds-view-mode-toggle-icon--grid" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function ViewModeListIcon() {
  return (
    <span className="ds-view-mode-toggle-icon ds-view-mode-toggle-icon--list" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function ViewModeBoardIcon() {
  return (
    <span className="ds-view-mode-toggle-icon ds-view-mode-toggle-icon--board" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
