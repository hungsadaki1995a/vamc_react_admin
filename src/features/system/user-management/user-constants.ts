import type { AccountStatus, EmpStatus } from '@/api/system/employee-api';

/** Employment status (COM_CD EMP_STTS_CD) in the design's order; Employed is the default. */
export const EMP_STATUS_OPTIONS: { value: EmpStatus; label: string }[] = [
  { value: 'H', label: 'Employed' },
  { value: 'L', label: 'On Leave' },
  { value: 'S', label: 'Suspended' },
  { value: 'R', label: 'Resigned' },
];

export const EMP_STATUS_LABEL: Record<EmpStatus, string> = Object.fromEntries(
  EMP_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<EmpStatus, string>;

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: 'Active',
  LOCKED: 'Locked',
};

/** Same patterns as the server DTOs (CreateEmpRequest / UpdateEmpRequest). */
export const EMP_NO_PATTERN = /^[a-zA-Z0-9_-]{3,10}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_PATTERN = /^\+?[0-9][0-9 .-]{7,18}[0-9]$/;
