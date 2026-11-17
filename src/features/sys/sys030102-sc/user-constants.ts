import type { EmpStatus } from '@/api/sys/employee-api';

/** English fallbacks for COM_CD EMP_STTS_CD (labels override them when registered). */
export const EMP_STATUS_FALLBACK: Record<EmpStatus, string> = {
  H: 'Employed',
  L: 'On leave',
  R: 'Retired',
  S: 'Suspended',
};

export const EMP_STATUS_CODES: EmpStatus[] = ['H', 'L', 'R', 'S'];

/** The account locks after this many failed logins. */
export const LOCK_FAIL_COUNT = 5;
