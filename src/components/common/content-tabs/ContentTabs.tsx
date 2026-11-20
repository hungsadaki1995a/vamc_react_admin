import type { ReactNode } from 'react';
import styles from './content-tabs.module.scss';

export interface ContentTabItem<T extends string = string> {
  key: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface ContentTabsProps<T extends string = string> {
  items: ContentTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  ariaLabel?: string;
  fullWidth?: boolean;
  className?: string;
}

/** Underline content tabs matching the VNPL Admin Design System (contents-tabs_type1). */
export default function ContentTabs<T extends string = string>({
  items,
  activeKey,
  onChange,
  ariaLabel,
  fullWidth = false,
  className,
}: ContentTabsProps<T>) {
  const rootClassName = [styles.tabs, className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const btnClassName = [
          styles.tabBtn,
          fullWidth ? styles.tabBtnFull : '',
          isActive ? styles.tabBtnActive : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={btnClassName}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
