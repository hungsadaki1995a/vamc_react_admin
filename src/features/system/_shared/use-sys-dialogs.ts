import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNotify } from '@/hooks/use-notify';
import { SYS_DIALOG_LABELS, SYS_MESSAGES } from './sys-messages';

// Confirm / alert dialogs of the v0.8 system messages (C0x codes), built on useNotify.
// Dialog buttons follow the design: [Close] [<action>].

interface ConfirmOptions {
  content: ReactNode;
  /** Action button text, e.g. 'Delete', 'Apply', 'Run'. */
  okText: string;
  /** Red action button (delete-type confirmations). */
  danger?: boolean;
  /** May return a promise — the dialog shows a spinner until it settles. */
  onOk: () => void | Promise<void>;
}

export function useSysDialogs() {
  const { dialog } = useNotify();

  /** C0x confirmation, e.g. confirm({ content: 'Delete this user?', okText: 'Delete', danger: true, onOk }). */
  const confirm = useCallback(
    ({ content, okText, danger = false, onOk }: ConfirmOptions) => {
      dialog.confirm({
        content,
        okText,
        cancelText: SYS_DIALOG_LABELS.close,
        okButtonProps: danger ? { danger: true } : undefined,
        onOk,
      });
    },
    [dialog],
  );

  /** Promise form for guards: resolves true on the action button, false on [Close]. */
  const ask = useCallback(
    (content: ReactNode, okText: string, danger = false) =>
      new Promise<boolean>((resolve) => {
        dialog.confirm({
          content,
          okText,
          cancelText: SYS_DIALOG_LABELS.close,
          okButtonProps: danger ? { danger: true } : undefined,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [dialog],
  );

  /** Single-button notice, e.g. C02 "Please select codes to delete. [OK]". */
  const alert = useCallback(
    (content: ReactNode) => {
      dialog.info({ content, okText: SYS_DIALOG_LABELS.ok });
    },
    [dialog],
  );

  /**
   * C01 unsaved-changes guard: runs `proceed` at once when nothing is dirty,
   * otherwise after the user confirms. `kind` picks the leave / refresh wording.
   */
  const guardDiscard = useCallback(
    (dirty: boolean, proceed: () => void, kind: 'leave' | 'refresh' = 'leave') => {
      if (!dirty) {
        proceed();
        return;
      }
      dialog.confirm({
        content: kind === 'refresh' ? SYS_MESSAGES.discardRefresh : SYS_MESSAGES.discardLeave,
        okText: kind === 'refresh' ? SYS_DIALOG_LABELS.refresh : SYS_DIALOG_LABELS.leave,
        cancelText: SYS_DIALOG_LABELS.close,
        onOk: proceed,
      });
    },
    [dialog],
  );

  return useMemo(() => ({ confirm, ask, alert, guardDiscard }), [confirm, ask, alert, guardDiscard]);
}
