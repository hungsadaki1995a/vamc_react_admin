import type { ReactNode } from 'react';
import { Modal, type ModalProps } from 'antd';
import { popupCheckCircle, popupClose, statusInfoFilled, statusWarningFilled } from '@/assets/images';
import ActionButton from '@/components/common/actions/ActionButton';
import styles from './popup.module.scss';

export type PopupStatus = 'confirm' | 'info' | 'warning' | 'error';

export type PopupProps = Omit<ModalProps, 'title' | 'footer'> & {
  title?: ReactNode;
  footer?: ReactNode;
  footerAlign?: 'center' | 'right';
  status?: PopupStatus;
  icon?: ReactNode;
  onConfirm?: () => void;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  confirmDanger?: boolean;
  hideCancel?: boolean;
  children?: ReactNode;
};

const STATUS_ICONS: Record<PopupStatus, string> = {
  confirm: popupCheckCircle,
  info: statusInfoFilled,
  warning: statusWarningFilled,
  error: statusWarningFilled,
};

/** Modal dialog matching Figma Popup (Window bar + Body + CTA) (4042:25833 / 4042:25841). */
export default function Popup({
  title,
  footer,
  footerAlign = 'center',
  status,
  icon,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
  confirmDisabled = false,
  confirmDanger = false,
  hideCancel = false,
  centered = true,
  destroyOnHidden = true,
  closeIcon,
  width,
  className,
  wrapClassName,
  children,
  ...props
}: PopupProps) {
  const isMessagePopup = Boolean(status || icon);
  const resolvedWidth = width ?? (isMessagePopup ? 330 : undefined);
  const resolvedIcon =
    icon !== undefined ? icon : status ? <img src={STATUS_ICONS[status]} alt="" /> : null;

  const defaultFooter =
    footer !== undefined ? (
      footer
    ) : onConfirm || onCancel ? (
      <div
        className={[
          styles.ctaRow,
          footerAlign === 'right' ? styles.ctaRight : styles.ctaCenter,
        ].join(' ')}
      >
        {!hideCancel && onCancel && (
          <ActionButton
            action="cancel"
            intent="primary"
            appearance="outlined"
            onClick={(e) => onCancel(e as unknown as React.MouseEvent<HTMLButtonElement>)}
          >
            {cancelText}
          </ActionButton>
        )}
        {onConfirm && (
          <ActionButton
            action="confirm"
            intent={confirmDanger ? 'danger' : 'primary'}
            appearance="filled"
            loading={confirmLoading}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmText}
          </ActionButton>
        )}
      </div>
    ) : null;

  return (
    <Modal
      {...props}
      width={resolvedWidth}
      centered={centered}
      destroyOnHidden={destroyOnHidden}
      onCancel={onCancel}
      closeIcon={closeIcon ?? <img src={popupClose} alt="" className={styles.closeIcon} />}
      title={title ? <span className={styles.title}>{title}</span> : null}
      footer={defaultFooter}
      className={[styles.root, isMessagePopup ? styles.messageModal : '', className].filter(Boolean).join(' ')}
      wrapClassName={[styles.wrap, wrapClassName].filter(Boolean).join(' ')}
    >
      {isMessagePopup ? (
        <div className={styles.messageBody}>
          {resolvedIcon && <span className={styles.messageIcon}>{resolvedIcon}</span>}
          <div className={styles.messageText}>{children}</div>
        </div>
      ) : (
        children
      )}
    </Modal>
  );
}
