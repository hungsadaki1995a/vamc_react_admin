import dayjs from 'dayjs';
import i18n from '@/lib/i18n';

/** Message of a rejected API call (the 4xx body message is already on ApiError). */
export function errorMessage(error: unknown, fallback = i18n.t('messages.api.requestFailed')): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Splits a server timestamp into the wireframe's two-line `dd/MM/yyyy` + `HH:mm:ss`. */
export function splitDateTime(value?: string | null): { date: string; time?: string } | null {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return { date: value };
  return { date: parsed.format('DD/MM/YYYY'), time: parsed.format('HH:mm:ss') };
}

/** Thousand-separated amount; `-` when empty. */
export function formatAmount(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** Descending row number for a 1-based page (newest row gets the highest number). */
export function rowNumber(total: number, page: number, size: number, index: number): number {
  return total - (page - 1) * size - index;
}

/** `[all, yes, no]` checkbox trio → server filter value (undefined = no filter). */
export function toUseYnFilter(yes: boolean, no: boolean): 'Y' | 'N' | undefined {
  if (yes && !no) return 'Y';
  if (no && !yes) return 'N';
  return undefined;
}

/** v0.8 display format `DD-MM-YYYY HH:mm` (`withSeconds` adds `:ss`, `dateOnly` drops the time); `-` when empty. */
export function formatSysDateTime(
  value?: string | null,
  { withSeconds = false, dateOnly = false }: { withSeconds?: boolean; dateOnly?: boolean } = {},
): string {
  if (!value) return '-';
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  if (dateOnly) return parsed.format('DD-MM-YYYY');
  return parsed.format(withSeconds ? 'DD-MM-YYYY HH:mm:ss' : 'DD-MM-YYYY HH:mm');
}

/** Business error code of a rejected call (`ErrorResponse.errorCode`, e.g. `MNU002`). */
export function apiErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'errorCode' in error) {
    const code = (error as { errorCode?: unknown }).errorCode;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** `[today - (days - 1), today]` — e.g. 7 → the last 7 days including today. */
export function lastDaysRange(days: number): [dayjs.Dayjs, dayjs.Dayjs] {
  const today = dayjs().startOf('day');
  return [today.subtract(days - 1, 'day'), today];
}

/** Per-field messages of a 400 validation failure (`ApiError.validation`), or undefined. */
export function apiValidationErrors(error: unknown): Record<string, string> | undefined {
  if (error && typeof error === 'object' && 'validation' in error) {
    const validation = (error as { validation?: unknown }).validation;
    if (validation && typeof validation === 'object') return validation as Record<string, string>;
  }
  return undefined;
}
