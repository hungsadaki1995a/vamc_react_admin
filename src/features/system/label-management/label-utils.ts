import { COMMON_SCREEN_ID } from '@/api/system/label-management-api';
import type { LabelDetail, LabelKey } from '@/api/system/label-management-api';

// Label key rules and messages of i18n Label Management (VPA09040301 / VPA090403P01).

export const LABEL_MESSAGES = {
  duplicate: 'This label key is already registered.',
  variableMismatch: 'Variables (%1, %2) do not match Tiếng Việt.',
  confirmDelete: 'If a label in use is deleted, the label key will be shown on user screens. Delete?',
  // Design: "Apply the edited labels to user screens now?" — the API only clears the admin caches.
  confirmRefreshCache:
    'Apply the edited labels to admin screens now? User screens pick them up when their own cache expires.',
  cacheRefreshed: 'Label cache refreshed.',
  menuScreenReserved: 'Menu labels are managed in Menu Settings.',
  invalidScreenId: 'Use letters, numbers and _ only.',
  invalidLabelCode: 'Use letters, numbers, _ . - only.',
  keyTooLong: 'The label key must be 100 characters or less.',
  typeNotAvailable: 'Not available yet (pending schema change).',
  uploadDone: (rows: number) => `Excel uploaded (${rows.toLocaleString('en-US')} rows checked).`,
  uploadFailed: 'Nothing was saved. Fix the rows below and upload again.',
} as const;

export const SCREEN_ID_PATTERN = /^[A-Za-z0-9_]+$/;
export const LABEL_CODE_PATTERN = /^[A-Za-z0-9_.-]+$/;
export const LABEL_KEY_MAX = 100;

/** `[Screen ID].[Label Type]_[Label Code]`; `COM` stands in for the Screen ID of Common labels. */
export function composeLabelKey(scrnId: string, lblSeCd: string, code: string): string {
  return `${scrnId}.${lblSeCd}_${code}`;
}

/** Label Code part of a stored key, or the whole key for labels not made by the composer. */
export function labelCodeOf({ scrnId, lblSeCd, lblCd }: LabelKey): string {
  const prefix = `${scrnId}.${lblSeCd}_`;
  return lblCd.startsWith(prefix) ? lblCd.slice(prefix.length) : lblCd;
}

export const isCommonScreen = (scrnId: string) => scrnId === COMMON_SCREEN_ID;

export const labelRowId = ({ scrnId, lblSeCd, lblCd }: LabelKey) => `${scrnId}|${lblSeCd}|${lblCd}`;

export const sameLabel = (a: LabelKey | null, b: LabelKey | null) =>
  a !== null && b !== null && labelRowId(a) === labelRowId(b);

/** Sorted `%n` variables of a text (`%1`, `%2` …). */
function variablesOf(text: string): string {
  return (text.match(/%\d+/g) ?? []).sort().join(',');
}

/** Same rule as LBL006 for `%n`: a non-empty text must use the same variables as Tiếng Việt. */
export function variablesMatch(defaultText: string, text: string): boolean {
  return text.trim() === '' || variablesOf(defaultText) === variablesOf(text);
}

/** langCd → stored text of a label. */
export function storedTexts(detail?: LabelDetail): Record<string, string> {
  return Object.fromEntries((detail?.translations ?? []).map((t) => [t.langCd, t.trslLtr ?? '']));
}

/** True when a draft differs from the stored text. */
export function hasTextChanges(drafts: Record<string, string>, stored: Record<string, string>): boolean {
  return Object.entries(drafts).some(([langCd, text]) => text !== (stored[langCd] ?? ''));
}
