import i18n from '@/lib/i18n';

// System messages of the v0.8 design (codes E0x / C0x per screen).
// E = inline field error (red border + text below the field), C = confirm dialog.
// Dynamic getters evaluate `i18n.t(...)` on access so locale changes take effect immediately.

export const SYS_MESSAGES = {
  /** E01 — required field empty. */
  get required(): string {
    return i18n.t('messages.sys.required');
  },
  /** E02 — duplicate key, e.g. duplicate('form no.') → "This form no. is already registered." */
  duplicate: (item: string): string => i18n.t('messages.sys.duplicate', { item }),
  /** C01 — leave with unsaved changes (row/menu change, search, page move). */
  get discardLeave(): string {
    return i18n.t('messages.sys.discardLeave');
  },
  /** C01 — [Refresh] with unsaved changes. */
  get discardRefresh(): string {
    return i18n.t('messages.sys.discardRefresh');
  },
  /** C01 — delete confirmation, e.g. confirmDelete('this user'). */
  confirmDelete: (target: string): string => i18n.t('messages.sys.confirmDelete', { target }),
  /** C01 — delete N selected items. */
  confirmDeleteCount: (count: number): string => i18n.t('messages.sys.confirmDeleteCount', { count }),
  /** C02 — [Delete Row] without a checked row. */
  selectToDelete: (item = i18n.t('messages.sys.items.codes')): string =>
    i18n.t('messages.sys.selectToDelete', { item }),
  /** Generic save / delete toasts. */
  get saved(): string {
    return i18n.t('messages.sys.saved');
  },
  get registered(): string {
    return i18n.t('messages.sys.registered');
  },
  get updated(): string {
    return i18n.t('messages.sys.updated');
  },
  get deleted(): string {
    return i18n.t('messages.sys.deleted');
  },
};

/** Button labels used by the design's dialogs ([Close] instead of Cancel). */
export const SYS_DIALOG_LABELS = {
  get close(): string {
    return i18n.t('messages.dialog.close');
  },
  get leave(): string {
    return i18n.t('messages.dialog.leave');
  },
  get refresh(): string {
    return i18n.t('messages.dialog.refresh');
  },
  get delete(): string {
    return i18n.t('messages.dialog.delete');
  },
  get apply(): string {
    return i18n.t('messages.dialog.apply');
  },
  get run(): string {
    return i18n.t('messages.dialog.run');
  },
  get rerun(): string {
    return i18n.t('messages.dialog.rerun');
  },
  get send(): string {
    return i18n.t('messages.dialog.send');
  },
  get sync(): string {
    return i18n.t('messages.dialog.sync');
  },
  get ok(): string {
    return i18n.t('messages.dialog.ok');
  },
};
