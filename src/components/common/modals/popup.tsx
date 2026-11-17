import type { ReactNode } from 'react';
import { Modal, type ModalProps } from 'antd';
import {
  close as closeIcon,
  statusCheckCircleFilled,
  statusInfoFilled,
  statusWarningFilled,
} from '@/assets/images';

export type PopupStatus = 'success' | 'warning' | 'info' | 'none';

export interface PopupProps {
  open: boolean;
  title?: ReactNode;
  children?: ReactNode;
  status?: PopupStatus;
  icon?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  showCancel?: boolean;
  confirmLoading?: boolean;
  ctaAlign?: 'center' | 'right';
  width?: number;
  maskClosable?: ModalProps['maskClosable'];
  destroyOnHidden?: ModalProps['destroyOnHidden'];
  onConfirm?: () => void;
  onCancel?: () => void;
}

const STATUS_ICON_MAP: Record<Exclude<PopupStatus, 'none'>, string> = {
  success: statusCheckCircleFilled,
  warning: statusWarningFilled,
  info: statusInfoFilled,
};

const POPUP_STYLES: ModalProps['styles'] = {
  container: {
    padding: 0,
    borderRadius: 4,
    border: '1px solid var(--color-border-primary)',
    boxShadow: '0px 4px 6px -2px rgba(0, 0, 0, 0.03), 0px 6px 10px -4px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  body: {
    padding: 0,
  },
};

export default function Popup({
  open,
  title,
  children,
  status = 'success',
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  confirmLoading = false,
  ctaAlign = 'center',
  width = 330,
  maskClosable = true,
  destroyOnHidden = true,
  onConfirm,
  onCancel,
}: PopupProps) {
  const statusSrc = status !== 'none' ? STATUS_ICON_MAP[status] : null;
  const resolvedIcon = icon !== undefined ? icon : statusSrc ? (
    <img src={statusSrc} alt="" aria-hidden="true" className="w-8 h-8 shrink-0" />
  ) : null;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      centered
      width={width}
      maskClosable={maskClosable}
      destroyOnHidden={destroyOnHidden}
      styles={POPUP_STYLES}
    >
      <div className="flex flex-col bg-bg-primary">
        <div className="h-[33px] px-3 py-2 flex items-center justify-between bg-bg-secondary border-b border-border-secondary">
          <span className="typo-b2-regular text-text-secondary truncate">{title}</span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="inline-flex items-center justify-center w-4 h-4 shrink-0 bg-transparent border-0 p-0 cursor-pointer"
          >
            <img src={closeIcon} alt="" aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        <div className="px-8 py-6 bg-bg-primary flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            {resolvedIcon}
            {children !== undefined && (
              <div className="typo-h4-medium text-text-primary text-center whitespace-pre-line">
                {children}
              </div>
            )}
          </div>

          <div
            className={`flex items-center gap-2 ${
              ctaAlign === 'right' ? 'justify-end' : 'justify-center'
            }`}
          >
            {showCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={confirmLoading}
                className="h-8 px-[10px] rounded-[4px] border border-btn-primary bg-bg-primary text-btn-primary typo-b2-semibold cursor-pointer hover:bg-bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmLoading}
              className="h-8 px-[10px] rounded-[4px] border border-btn-primary bg-btn-primary text-text-white typo-b2-semibold cursor-pointer hover:bg-btn-primary-fill-hover active:bg-btn-primary-fill-pressed disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
