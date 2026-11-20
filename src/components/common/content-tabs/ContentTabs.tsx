import type { ContentTabsProps } from '@/types/content-tabs';
import styles from './content-tabs.module.scss';

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
