import type { ExchangeRateSchedule } from '@/api/system/exchange-rate-api';

// Display helpers of Exchange Rate Management (VPA09010401).

export const EXCHANGE_RATE_MESSAGES = {
  confirmSync: 'Receive exchange rates from Vietcombank again?',
  syncFailed: 'Could not receive exchange rates. Please try again later.',
  syncRunning: 'Exchange rate sync is already running. Please try again later.',
  synced: 'Exchange rates were received.',
  lastRunFailed:
    'The last run failed. The last successfully received rates and base date/time are kept and shown to users.',
} as const;

const RATE_FORMAT = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** `25.540,00` as in the design; `-` when there is no value. */
export function formatRate(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return RATE_FORMAT.format(Number(value));
}

/** AUTO → "Auto", otherwise the admin ID. */
export function formatRunBy(runBy?: string | null): string {
  if (!runBy) return '-';
  return runBy.toUpperCase() === 'AUTO' ? 'Auto' : runBy;
}

const NUMBER = /^\d+$/;
const pad = (value: string) => value.padStart(2, '0');
const isAny = (value: string) => value === '*' || value === '?';

/** Readable form of the common Spring cron shapes; anything else is shown as is. */
export function describeCron(cron: string): string {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 6) return cron;
  const [sec, min, hour, dom, month, dow] = fields;
  const everyDay = isAny(dom) && isAny(month) && isAny(dow);
  if (!everyDay || !NUMBER.test(sec)) return cron;

  const minStep = /^(?:\*|0)\/(\d+)$/.exec(min);
  if (minStep && hour === '*') return `Every ${minStep[1]} minutes`;
  if (!NUMBER.test(min)) return cron;
  if (hour === '*') return `Every hour at minute ${pad(min)}`;
  const hourStep = /^(?:\*|0)\/(\d+)$/.exec(hour);
  if (hourStep) return `Every ${hourStep[1]} hours at minute ${pad(min)}`;
  if (/^\d+(,\d+)*$/.test(hour)) {
    return `Every day at ${hour
      .split(',')
      .map((h) => `${pad(h)}:${pad(min)}`)
      .join(', ')}`;
  }
  return cron;
}

/** Run Schedule text: described cron + zone, or why there is none. */
export function formatSchedule(schedule?: ExchangeRateSchedule | null): string {
  if (!schedule?.cron) return schedule && !schedule.enabled ? 'Not scheduled' : '-';
  const text = `${describeCron(schedule.cron)}${schedule.zone ? ` (${schedule.zone})` : ''}`;
  return schedule.enabled ? text : `${text} · Off`;
}
