import type { ContentTabsProps } from '@/types/content-tabs';
import styles from './content-tabs.module.scss';

/** Content tabs matching Figma Tab (underline, boxed) & Segmented Control (4042:25788 / 4050:29400). */
export default function ContentTabs<T extends string = string>({
  items,
  activeKey,
  onChange,
  variant = 'underline',
  ariaLabel,
  fullWidth = false,
  className,
}: ContentTabsProps<T>) {
  const variantClass =
    variant === 'boxed'
      ? styles.variantBoxed
      : variant === 'segmented'
        ? styles.variantSegmented
        : styles.variantUnderline;

  const rootClassName = [styles.tabs, variantClass, className].filter(Boolean).join(' ');

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
      {variant === 'boxed' && !fullWidth && <div className={styles.boxedFiller} aria-hidden="true" />}
    </div>
  );
}
