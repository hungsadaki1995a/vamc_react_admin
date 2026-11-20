import { apiErrorCode, errorMessage } from '@/features/system/_shared/system-utils';

// Display / validation helpers of Batch Management (VPA09040401, P01, P02).

export const BATCH_BREADCRUMB = ['System Operation Management', 'System Management', 'Batch Management'];

/** Job name of the exchange rate sync batch (Exchange Rate [View All History]). */
export const EXCHANGE_RATE_SYNC_JOB = 'exchange-rate-sync';

export const BATCH_MESSAGES = {
  duplicate: 'This job name is already registered.',
  invalidCron: 'Invalid Cron format. (e.g. 0 0 3 * * ?)',
  invalidJson: 'Please enter in JSON format.',
  notice: 'Use and Cron changes are applied to the execution server after [Refresh Schedule] on the list.',
  confirmRunNow: (jobName: string) => `Run ${jobName} once now?`,
  confirmRefresh: 'Apply the changed schedule to the execution server?',
  confirmRerun: 'Run the failed execution again?',
  runStarted: (jobName: string) => `${jobName} started. Check the result in Execution History.`,
  refreshed: 'The schedule was applied to the execution server.',
  inactive: 'An inactive job cannot be run.',
  alreadyRunning: 'This job is already running.',
} as const;

/** Maps BTCH_STTS to the ResultBadge values (COMPLETED → SUCCESS). */
export function toResult(status?: string | null): string | undefined {
  if (!status) return undefined;
  return status.toUpperCase() === 'COMPLETED' ? 'SUCCESS' : status;
}

/** Milliseconds → `HH:MM:SS`; `-` when unknown. */
export function formatDuration(ms?: number | null): string {
  if (ms === undefined || ms === null || ms < 0) return '-';
  const total = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

const CRON_FIELD = /^[0-9A-Za-z*?/,\-#]+$/;

/** Spring 6-field cron (sec min hour day month weekday); the server re-checks (BAT004). */
export function isValidCron(value: string): boolean {
  const fields = value.trim().split(/\s+/);
  return fields.length === 6 && fields.every((field) => CRON_FIELD.test(field));
}

/** Empty is allowed (optional); otherwise must parse as JSON (BAT005). */
export function isValidJson(value: string): boolean {
  if (value.trim() === '') return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** Message of a failed Run Now / Rerun (BAT006 inactive, BAT007 already running). */
export function runErrorMessage(error: unknown): string {
  const code = apiErrorCode(error);
  if (code === 'BAT006') return BATCH_MESSAGES.inactive;
  if (code === 'BAT007') return BATCH_MESSAGES.alreadyRunning;
  return errorMessage(error);
}
