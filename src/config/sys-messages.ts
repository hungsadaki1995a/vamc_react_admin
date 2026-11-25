// System messages of the v0.8 design (codes E0x / C0x per screen).
// E = inline field error (red border + text below the field), C = confirm dialog.
// Korean-only texts in the design are rendered here in English.

export const SYS_MESSAGES = {
  /** E01 — required field empty. */
  required: 'Please fill in the required fields.',
  /** E02 — duplicate key, e.g. duplicate('form no.') → "This form no. is already registered." */
  duplicate: (item: string) => `This ${item} is already registered.`,
  /** C01 — leave with unsaved changes (row/menu change, search, page move). */
  discardLeave: 'Unsaved changes will be lost. Leave?',
  /** C01 — [Refresh] with unsaved changes. */
  discardRefresh: 'Unsaved changes will be lost. Refresh?',
  /** C01 — delete confirmation, e.g. confirmDelete('this user'). */
  confirmDelete: (target: string) => `Delete ${target}?`,
  /** C01 — delete N selected items. */
  confirmDeleteCount: (count: number) => `Delete ${count} selected items?`,
  /** C02 — [Delete Row] without a checked row. */
  selectToDelete: (item = 'codes') => `Please select ${item} to delete.`,
  /** Generic save / delete toasts. */
  saved: 'Saved.',
  registered: 'Registered.',
  updated: 'Updated.',
  deleted: 'Deleted.',
} as const;

/** Button labels used by the design's dialogs ([Close] instead of Cancel). */
export const SYS_DIALOG_LABELS = {
  close: 'Close',
  leave: 'Leave',
  refresh: 'Refresh',
  delete: 'Delete',
  apply: 'Apply',
  run: 'Run',
  rerun: 'Rerun',
  send: 'Send',
  sync: 'Sync',
  ok: 'OK',
} as const;
