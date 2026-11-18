import type { CSSProperties, ReactNode } from 'react';
import { Tooltip } from 'antd';
import './view-mode-toggle.scss';

export interface ViewModeToggleOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Custom icon. Defaults to index-based icon (grid/list) when omitted */
  icon?: ReactNode;
  /** Antd tooltip shown on hover. Replaces native title when specified */
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
            // Prevent duplicate native title when using antd tooltip
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
