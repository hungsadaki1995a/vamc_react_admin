import type { ReactNode } from 'react';
import styles from './progress-stepper.module.scss';

export type StepStatus = 'completed' | 'current' | 'next';

export type ProgressStepItem = {
  key?: string | number;
  label: ReactNode;
  status?: StepStatus;
};

export type ProgressStepperProps = {
  steps: ProgressStepItem[];
  current?: number;
  className?: string;
};

/** Horizontal progress stepper matching Figma Progress Stepper (4167:7496). */
export default function ProgressStepper({ steps, current = 0, className }: ProgressStepperProps) {
  return (
    <ol className={[styles.root, className].filter(Boolean).join(' ')}>
      {steps.map((step, index) => {
        const status: StepStatus =
          step.status ?? (index < current ? 'completed' : index === current ? 'current' : 'next');
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const prevCompleted = index <= current && status !== 'next';
        const nextCompleted = status === 'completed';

        return (
          <li
            key={step.key ?? index}
            className={[
              styles.step,
              status === 'completed'
                ? styles.stepCompleted
                : status === 'current'
                  ? styles.stepCurrent
                  : styles.stepNext,
            ].join(' ')}
          >
            <div className={styles.trackRow}>
              <span
                className={[
                  styles.line,
                  isFirst ? styles.lineHidden : '',
                  prevCompleted ? styles.lineActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              />
              <span className={styles.circle}>
                {status === 'completed' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 8.2L6.5 11.2L12.5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={[
                  styles.line,
                  isLast ? styles.lineHidden : '',
                  nextCompleted ? styles.lineActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              />
            </div>
            <span className={styles.label}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
