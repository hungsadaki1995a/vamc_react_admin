import i18n from '@/lib/i18n';

/** Locale groups that map a code to its label, e.g. `trade.applicationStatus` → `{ RCPT: 'Submitted', … }`. */
export type CodeLabelGroup = `trade.${string}` | `approval.${string}`;

/**
 * Label of `code` in a locale group (`<group>.<code>`), or the code itself when the group has no entry for it.
 * Evaluated at call time, so a component that renders it with `useTranslation()` follows the locale.
 *
 * @example
 * codeLabel('trade.applicationStatus', 'RCPT') // → 'Submitted' / 'Đã nộp'
 */
export function codeLabel(group: CodeLabelGroup, code: string | null | undefined, fallback = '-'): string {
  if (!code) return fallback;
  const key = `${group}.${code}`;
  return i18n.exists(key) ? String(i18n.t(key as never)) : code;
}
