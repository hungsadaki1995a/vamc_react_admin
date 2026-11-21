import type { ReactNode } from 'react';
import styles from './status-badge.module.scss';

export type StatusBadgeColor = 'gray' | 'green' | 'orange' | 'red' | 'violet' | 'blue' | 'navy';
export type StatusBadgeVariant = 'outlined' | 'filled';

export type StatusBadgeProps = {
  color?: StatusBadgeColor;
  variant?: StatusBadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const COLOR_CLASS: Record<StatusBadgeColor, string> = {
  gray: styles.colorGray,
  green: styles.colorGreen,
  orange: styles.colorOrange,
  red: styles.colorRed,
  violet: styles.colorViolet,
  blue: styles.colorBlue,
  navy: styles.colorNavy,
};

/** Status badge matching Figma Badge / Label component (4042:25844). */
export default function StatusBadge({
  color = 'gray',
  variant = 'outlined',
  icon,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={[
        styles.root,
        variant === 'filled' ? styles.filled : styles.outlined,
        COLOR_CLASS[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
