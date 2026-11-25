import dayjs from 'dayjs';

// Display helpers for server dates. `*_DMY` columns are `ddMMyyyy` strings; timestamps are ISO date-times.

const DMY_PATTERN = /^(\d{2})(\d{2})(\d{4})$/;

/** `ddMMyyyy` → `dd/MM/yyyy`; other values are returned as sent, `-` when empty. */
export function formatDmy(value?: string | null): string {
  if (!value) return '-';
  const match = DMY_PATTERN.exec(value.trim());
  return match ? `${match[1]}/${match[2]}/${match[3]}` : value;
}

/** ISO date-time → `dd/MM/yyyy HH:mm`; `-` when empty. */
export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : value;
}

/** `ddMMyyyy` → Dayjs (null when empty or invalid), for date pickers fed by `*_DMY` columns. */
export function dmyToDayjs(value?: string | null): dayjs.Dayjs | null {
  const match = value ? DMY_PATTERN.exec(value.trim()) : null;
  if (!match) return null;
  const parsed = dayjs(`${match[3]}-${match[2]}-${match[1]}`);
  return parsed.isValid() ? parsed : null;
}
