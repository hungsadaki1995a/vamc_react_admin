import i18n from '@/lib/i18n';
import type { ExchangeRateSchedule } from '@/api/system/exchange-rate-api';

// Display helpers of Exchange Rate Management (VPA09010401).

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
  if (minStep && hour === '*') return i18n.t('messages.system.exchangeRate.everyMinutes', { count: Number(minStep[1]) });
  if (!NUMBER.test(min)) return cron;
  if (hour === '*') return i18n.t('messages.system.exchangeRate.hourlyAt', { minute: pad(min) });
  const hourStep = /^(?:\*|0)\/(\d+)$/.exec(hour);
  if (hourStep) {
    return i18n.t('messages.system.exchangeRate.everyHoursAt', { count: Number(hourStep[1]), minute: pad(min) });
  }
  if (/^\d+(,\d+)*$/.test(hour)) {
    const times = hour
      .split(',')
      .map((h) => `${pad(h)}:${pad(min)}`)
      .join(', ');
    return i18n.t('messages.system.exchangeRate.everyDayAt', { times });
  }
  return cron;
}

/** Run Schedule text: described cron + zone, or why there is none. */
export function formatSchedule(schedule?: ExchangeRateSchedule | null): string {
  if (!schedule?.cron) return schedule && !schedule.enabled ? i18n.t('messages.system.exchangeRate.notScheduled') : '-';
  // The zone is the server's (Asia/Ho_Chi_Minh); the design shows the schedule only.
  const text = describeCron(schedule.cron);
  return schedule.enabled ? text : `${text} · ${i18n.t('messages.system.exchangeRate.off')}`;
}
