import dayjs from 'dayjs';

// Display helpers for server dates. `*_DMY` columns are `ddMMyyyy` strings (business dates, shown as sent);
// timestamps are ISO date-times taken from the DB clock and shown in Vietnam time.

const DMY_PATTERN = /^(\d{2})(\d{2})(\d{4})$/;
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * UTC offset of zone-less server timestamps (`requestedAt`, `processedAt`, `prcsDt`, `crtDt`, …): they come from
 * the DB clock, which runs in UTC. Change it here if a server runs its DB in another zone.
 */
export const SERVER_UTC_OFFSET_MINUTES = 0;
/** Timestamps are displayed in Vietnam time (UTC+7, no daylight saving). */
export const DISPLAY_UTC_OFFSET_MINUTES = 7 * 60;

const pad = (n: number) => String(n).padStart(2, '0');

function offsetMinutes(zone: string): number {
  if (zone === 'Z') return 0;
  const sign = zone.startsWith('-') ? -1 : 1;
  const digits = zone.slice(1).replace(':', '');
  return sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4)));
}

/** `ddMMyyyy` → `dd/MM/yyyy`; other values are returned as sent, `-` when empty. */
export function formatDmy(value?: string | null): string {
  if (!value) return '-';
  const match = DMY_PATTERN.exec(value.trim());
  return match ? `${match[1]}/${match[2]}/${match[3]}` : value;
}

/**
 * ISO date-time → `dd/MM/yyyy HH:mm` in Vietnam time; `-` when empty. A value without zone is read in the server
 * zone (`SERVER_UTC_OFFSET_MINUTES`), one with `Z` / an offset as sent. Independent of the browser's time zone.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const match = ISO_DATE_TIME.exec(value.trim());
  if (!match) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : value;
  }
  const [, y, mo, d, h, mi, s, zone] = match;
  const utcMs =
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0)) -
    (zone ? offsetMinutes(zone) : SERVER_UTC_OFFSET_MINUTES) * 60_000;
  const local = new Date(utcMs + DISPLAY_UTC_OFFSET_MINUTES * 60_000);
  return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

/** `ddMMyyyy` → Dayjs (null when empty or invalid), for date pickers fed by `*_DMY` columns. */
export function dmyToDayjs(value?: string | null): dayjs.Dayjs | null {
  const match = value ? DMY_PATTERN.exec(value.trim()) : null;
  if (!match) return null;
  const parsed = dayjs(`${match[3]}-${match[2]}-${match[1]}`);
  return parsed.isValid() ? parsed : null;
}
