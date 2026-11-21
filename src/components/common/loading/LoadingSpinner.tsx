import { Spin, type SpinProps } from 'antd';
import styles from './loading-spinner.module.scss';

export type LoadingSpinnerProps = SpinProps;

/** Loading spinner matching Figma Spinner (48px #EAEAF1 track / #1876FF arc) (4042:25824). */
export default function LoadingSpinner({ size = 'default', className, ...props }: LoadingSpinnerProps) {
  const sizeClass =
    size === 'small' ? styles.sizeSmall : size === 'large' ? styles.sizeLarge : styles.sizeDefault;

  const indicator = (
    <svg viewBox="0 0 48 48" className={[styles.svg, sizeClass].join(' ')} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="none" stroke="#EAEAF1" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="none"
        stroke="#1876FF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="36 103"
      />
    </svg>
  );

  return <Spin {...props} size={size} indicator={indicator} className={className} />;
}
