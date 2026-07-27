import { useLabelStore } from '@/stores/labelStore';

const OK_KEY     = 'COMPONENT.VIEW.BTN_ssfOk';
const CANCEL_KEY = 'COMPONENT.VIEW.BTN_ssfCancel';

function withFallback(value: string, key: string, fallback: string): string {
  return value === key ? fallback : value;
}

/**
 * Returns common i18n defaults for JSX <Modal> components.
 * Uses the same label keys as useNotify.dialog() for consistency.
 *
 * @example
 * const modalProps = useModalProps();
 *
 * <Modal {...modalProps} title="..." open={open} onOk={onOk} onCancel={onCancel}>
 *   ...
 * </Modal>
 */
export function useModalProps() {
  const t = useLabelStore((s) => s.t);

  return {
    okText:     withFallback(t(OK_KEY),     OK_KEY,     'OK'),
    cancelText: withFallback(t(CANCEL_KEY), CANCEL_KEY, 'Cancel'),
  };
}
