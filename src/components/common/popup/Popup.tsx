import type { ReactNode } from 'react';
import { Modal, type ModalProps } from 'antd';
import ActionButton from '@/components/common/actions/ActionButton';
import styles from './popup.module.scss';

export type PopupProps = Omit<ModalProps, 'title' | 'footer'> & {
  title?: ReactNode;
  footer?: ReactNode;
  footerAlign?: 'center' | 'right';
  onConfirm?: () => void;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  confirmDanger?: boolean;
  hideCancel?: boolean;
  children?: ReactNode;
};

/** Modal dialog matching Figma Popup (Window bar + Body + CTA) (4042:25833). */
export default function Popup({
  title,
  footer,
  footerAlign = 'center',
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
  className,
  wrapClassName,
  children,
  ...props
}: PopupProps) {
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
      centered={centered}
      destroyOnHidden={destroyOnHidden}
      onCancel={onCancel}
      title={title ? <span className={styles.title}>{title}</span> : null}
      footer={defaultFooter}
      className={[styles.root, className].filter(Boolean).join(' ')}
      wrapClassName={[styles.wrap, wrapClassName].filter(Boolean).join(' ')}
    >
      {children}
    </Modal>
  );
}
