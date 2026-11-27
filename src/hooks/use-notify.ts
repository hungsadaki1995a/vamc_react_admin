import { useCallback, useMemo } from 'react';
import { App } from 'antd';
import type { ModalFuncProps } from 'antd';
import { useLabelStore } from '@/stores/label-store';
import { useDialogStore, type DialogType } from '@/stores/dialog-store';

// ── Notify i18n config ────────────────────────────────────────────────────────

type NotifyType = 'success' | 'error' | 'warning' | 'info';

// Notification titles — use shared component labels.
//
// Previously MESSAGE.SCRIPT.TEXT_* was never registered in DB, so the fallback
// (lowercase English like 'success') appeared as the title in every language. Because the MESSAGE namespace
// uses CONFIRM/INFO/ERROR in the section slot, it cannot be registered via the label management screen —
// moved to COMPONENT.VIEW.TITLE_* which can be registered on screen.
const NOTIFY_CONFIG: Record<NotifyType, { titleKey: string; titleFallback: string }> = {
  success: { titleKey: 'COMPONENT.VIEW.TITLE_success', titleFallback: 'Success' },
  error:   { titleKey: 'COMPONENT.VIEW.TITLE_error',   titleFallback: 'Error' },
  warning: { titleKey: 'COMPONENT.VIEW.TITLE_warning', titleFallback: 'Warning' },
  info:    { titleKey: 'COMPONENT.VIEW.TITLE_info',    titleFallback: 'Info' },
};

type NotifyOptions = Parameters<ReturnType<typeof App.useApp>['notification']['success']>[0];
/** String → auto-mapped to description. Object → passed as-is. */
type NotifyArg = string | NotifyOptions;

// Dialog OK/Cancel buttons — use shared component labels directly.
// Previously MESSAGE.SCRIPT.BTN_* was never registered in DB, so the
// 'OK'/'CANCEL' fallback below appeared in every language.
const OK_KEY     = 'COMPONENT.VIEW.BTN_ok';
const CANCEL_KEY = 'COMPONENT.VIEW.BTN_cancel';

function withFallback(value: string, key: string, fallback: string): string {
  return value === key ? fallback : value;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Unified notification hook — wraps antd message / notification and design-system Popup dialogs in one place.
 *
 * ```
 * const { toast, notify, dialog } = useNotify();
 *
 * // Toast (auto-dismiss)
 * toast.success('Saved successfully');
 * toast.error('An error occurred');
 *
 * // Notification (persistent panel) — string is auto-mapped to description
 * notify.success('Operation completed.');                        // title: i18n 'Success'
 * notify.error({ title: 'Error', description: 'Details' });    // object as-is (message also accepted, auto-mapped to title)
 *
 * // Dialog (Figma Popup 4042:25841) — centered message layout, i18n OK/Cancel defaults
 * dialog.confirm({ content: 'Save changes?', onOk: handleSave });
 * dialog.warning({ title: 'Delete Data', content: 'Cannot be undone.', okText: 'Delete', onOk: handleDelete });
 * dialog.error({ content: 'A server error occurred.' });
 * ```
 *
 * Label keys (all in COMPONENT namespace — register in the multilingual label management screen):
 *   Title    COMPONENT.VIEW.TITLE_success / _error / _warning / _info
 *   Button   COMPONENT.VIEW.BTN_ok / BTN_cancel
 */
export function useNotify() {
  const { message, notification } = App.useApp();
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);
  const openStoreDialog = useDialogStore((s) => s.open);
  const updateStoreDialog = useDialogStore((s) => s.update);
  const closeStoreDialog = useDialogStore((s) => s.close);

  // ── toast: antd message API (auto-dismiss toast) ──────────────────────────
  const toast = useMemo(() => message, [message]);

  // ── notify: antd notification API — string is auto-mapped to description ──
  const openNotify = useCallback(
    (type: NotifyType, arg: NotifyArg) => {
      const cfg = NOTIFY_CONFIG[type];
      const defaultTitle = withFallback(t(cfg.titleKey), cfg.titleKey, cfg.titleFallback);
      if (typeof arg === 'string') {
        notification[type]({ title: defaultTitle, description: arg });
      } else {
        // Remap deprecated `message` field → `title` for antd v6 compatibility
        const { message: msgField, title, ...rest } = arg as NotifyOptions & { message?: string };
        notification[type]({ title: title ?? msgField, ...rest });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notification, labelsVersion],
  );

  const notify = useMemo(() => ({
    success: (arg: NotifyArg) => openNotify('success', arg),
    error:   (arg: NotifyArg) => openNotify('error',   arg),
    warning: (arg: NotifyArg) => openNotify('warning', arg),
    info:    (arg: NotifyArg) => openNotify('info',    arg),
  }), [openNotify]);

  // ── dialog: Figma Popup (4042:25841) hosted by AppDialogHost ──────────────
  const openDialog = useCallback(
    (type: DialogType, options: ModalFuncProps) => {
      const defaultOkText = withFallback(t(OK_KEY),     OK_KEY,     'OK');
      const defaultCancel = withFallback(t(CANCEL_KEY), CANCEL_KEY, 'CANCEL');
      const maskClosable =
        typeof options.mask === 'object' && options.mask !== null
          ? options.mask.closable
          : options.maskClosable;

      const id = openStoreDialog({
        type,
        title: options.title ?? '',
        content: options.content,
        icon: options.icon,
        width: options.width,
        okText: options.okText ?? defaultOkText,
        cancelText: options.cancelText ?? defaultCancel,
        okCancel: options.okCancel,
        okDisabled: options.okButtonProps?.disabled,
        maskClosable,
        onOk: options.onOk,
        onCancel: options.onCancel,
      });

      return {
        destroy: () => closeStoreDialog(id),
        update: (next: ModalFuncProps) =>
          updateStoreDialog(id, {
            ...(next.title !== undefined ? { title: next.title } : {}),
            ...(next.content !== undefined ? { content: next.content } : {}),
            ...(next.okText !== undefined ? { okText: next.okText } : {}),
            ...(next.cancelText !== undefined ? { cancelText: next.cancelText } : {}),
            ...(next.okCancel !== undefined ? { okCancel: next.okCancel } : {}),
            ...(next.okButtonProps !== undefined ? { okDisabled: next.okButtonProps.disabled } : {}),
          }),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openStoreDialog, updateStoreDialog, closeStoreDialog, labelsVersion],
  );

  const dialog = useMemo(() => ({
    confirm: (options: ModalFuncProps) => openDialog('confirm', options),
    info:    (options: ModalFuncProps) => openDialog('info',    options),
    warning: (options: ModalFuncProps) => openDialog('warning', options),
    error:   (options: ModalFuncProps) => openDialog('error',   options),
  }), [openDialog]);

  return { toast, notify, dialog };
}
