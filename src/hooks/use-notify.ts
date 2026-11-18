import { useCallback, useMemo } from 'react';
import { App } from 'antd';
import type { ModalFuncProps } from 'antd';
import { useLabelStore } from '@/stores/label-store';

// ── Notify i18n config ────────────────────────────────────────────────────────

type NotifyType = 'success' | 'error' | 'warning' | 'info';

// Notification & dialog titles — use shared component labels.
//
// Previously MESSAGE.SCRIPT.TEXT_* was never registered in DB, so the fallback
// (lowercase English like 'success') appeared as the title in every language. Because the MESSAGE namespace
// uses CONFIRM/INFO/ERROR in the section slot, it cannot be registered via the label management screen —
// moved to COMPONENT.VIEW.TITLE_* which can be registered on screen.
const NOTIFY_CONFIG: Record<NotifyType, { titleKey: string; titleFallback: string }> = {
  success: { titleKey: 'COMPONENT.VIEW.TITLE_success', titleFallback: '성공' },
  error:   { titleKey: 'COMPONENT.VIEW.TITLE_error',   titleFallback: '오류' },
  warning: { titleKey: 'COMPONENT.VIEW.TITLE_warning', titleFallback: '경고' },
  info:    { titleKey: 'COMPONENT.VIEW.TITLE_info',    titleFallback: '안내' },
};

type NotifyOptions = Parameters<ReturnType<typeof App.useApp>['notification']['success']>[0];
/** String → auto-mapped to description. Object → passed as-is. */
type NotifyArg = string | NotifyOptions;

// ── Dialog i18n config ────────────────────────────────────────────────────────

type DialogType = 'confirm' | 'info' | 'warning' | 'error';

const DIALOG_CONFIG: Record<DialogType, {
  titleKey: string;
  titleFallback: string;
  danger: boolean;
}> = {
  confirm: { titleKey: 'COMPONENT.VIEW.TITLE_confirm', titleFallback: '확인', danger: false },
  info:    { titleKey: 'COMPONENT.VIEW.TITLE_info',    titleFallback: '안내', danger: false },
  warning: { titleKey: 'COMPONENT.VIEW.TITLE_warning', titleFallback: '경고', danger: true  },
  error:   { titleKey: 'COMPONENT.VIEW.TITLE_error',   titleFallback: '오류', danger: true  },
};

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
 * Unified notification hook — wraps antd message / notification / modal in one place.
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
 * // Dialog (modal) — i18n defaults: title / okText / cancelText / okButtonProps.danger
 * dialog.confirm({ content: 'Save changes?', onOk: handleSave });
 * dialog.warning({ title: 'Delete Data', content: 'Cannot be undone.', okText: 'Delete', onOk: handleDelete });
 * dialog.error({ content: 'A server error occurred.' });
 * ```
 *
 * Label keys (all in COMPONENT namespace — register in the multilingual label management screen):
 *   Title    COMPONENT.VIEW.TITLE_success / _error / _warning / _info / _confirm
 *   Button   COMPONENT.VIEW.BTN_ok / BTN_cancel
 *
 * Dialog type defaults:
 *   confirm  — danger: false
 *   info     — danger: false
 *   warning  — danger: true
 *   error    — danger: true
 */
export function useNotify() {
  const { message, notification, modal } = App.useApp();
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);

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

  // ── dialog: modal with i18n defaults ─────────────────────────────────────
  const openDialog = useCallback(
    (type: DialogType, { okButtonProps: callerOkBtnProps, ...rest }: ModalFuncProps) => {
      const cfg = DIALOG_CONFIG[type];
      const defaultTitle  = withFallback(t(cfg.titleKey), cfg.titleKey, cfg.titleFallback);
      const defaultOkText = withFallback(t(OK_KEY),       OK_KEY,       'OK');
      const defaultCancel = withFallback(t(CANCEL_KEY),   CANCEL_KEY,   'CANCEL');

      return modal[type]({
        title:      defaultTitle,
        okText:     defaultOkText,
        cancelText: defaultCancel,
        ...rest,
        okButtonProps: {
          ...(cfg.danger ? { danger: true } : {}),
          ...callerOkBtnProps,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modal, labelsVersion],
  );

  const dialog = useMemo(() => ({
    confirm: (options: ModalFuncProps) => openDialog('confirm', options),
    info:    (options: ModalFuncProps) => openDialog('info',    options),
    warning: (options: ModalFuncProps) => openDialog('warning', options),
    error:   (options: ModalFuncProps) => openDialog('error',   options),
  }), [openDialog]);

  return { toast, notify, dialog };
}
