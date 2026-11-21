import type { ReactNode } from 'react';
import { Tooltip, type TooltipProps } from 'antd';
import styles from './app-tooltip.module.scss';

export type AppTooltipVariant = 'coachmark' | 'information' | 'default';

export type AppTooltipProps = Omit<TooltipProps, 'title'> & {
  variant?: AppTooltipVariant;
  title?: ReactNode;
  description?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
};

/** Tooltip matching Figma Coachmark (#0040C6) and Information (#FFFFFF) variants (4042:25997). */
export default function AppTooltip({
  variant = 'coachmark',
  title,
  description,
  closable = false,
  onClose,
  classNames,
  children,
  ...props
}: AppTooltipProps) {
  const hasContent = Boolean(title) || Boolean(description);

  const renderedTitle = !hasContent ? undefined : variant === 'information' ? (
    <div className={styles.infoBox}>
      <div className={styles.infoContent}>
        {title && <div className={styles.infoTitle}>{title}</div>}
        {description && <div className={styles.infoBody}>{description}</div>}
      </div>
      {closable && (
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close tooltip"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  ) : (
    <div className={styles.coachmarkBox}>
      {title && <div className={styles.coachmarkTitle}>{title}</div>}
      {description && <div className={styles.coachmarkBody}>{description}</div>}
    </div>
  );

  const variantClass =
    variant === 'information'
      ? styles.informationRoot
      : variant === 'coachmark'
        ? styles.coachmarkRoot
        : styles.defaultRoot;

  return (
    <Tooltip
      {...props}
      title={renderedTitle}
      classNames={(info) => {
        const resolved = typeof classNames === 'function' ? classNames(info) : classNames;
        return {
          ...resolved,
          root: [styles.root, variantClass, resolved?.root].filter(Boolean).join(' '),
        };
      }}
    >
      {children}
    </Tooltip>
  );
}
