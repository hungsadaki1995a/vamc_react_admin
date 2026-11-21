import type { CSSProperties, ReactNode } from 'react';
import styles from './progress-bar.module.scss';

export type ProgressStatus = 'active' | 'success' | 'error';

export type ProgressBarProps = {
  percent: number;
  label?: ReactNode;
  status?: ProgressStatus;
  showPercent?: boolean;
  className?: string;
};

/** Progress bar & ProgressSet matching Figma Loading / Progress Set (4042:25824). */
export default function ProgressBar({
  percent,
  label,
  status = 'active',
  showPercent = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const resolvedStatus: ProgressStatus =
    status === 'active' && clamped >= 100 ? 'success' : status;

  const statusFillClass =
    resolvedStatus === 'error'
      ? styles.fillError
      : resolvedStatus === 'success'
        ? styles.fillSuccess
        : styles.fillActive;

  const statusTextClass =
    resolvedStatus === 'error'
      ? styles.percentError
      : resolvedStatus === 'success'
        ? styles.percentSuccess
        : styles.percentActive;

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {(label !== undefined || showPercent) && (
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          {showPercent && <span className={[styles.percent, statusTextClass].join(' ')}>{clamped}%</span>}
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={[styles.fill, statusFillClass].join(' ')}
          style={{ width: `${clamped}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}
