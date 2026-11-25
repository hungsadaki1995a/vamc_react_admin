import type { ProgramType } from '@/api/system/program-screen-api';
import { ALL } from '@/config/sys-constants';

/** Type radio of the popup: Page (default) / Popup. */
export const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: 'PAGE', label: 'Page' },
  { value: 'POPUP', label: 'Popup' },
];

/** Type filter: All (default) / Page / Popup. */
export const PROGRAM_TYPE_FILTER_OPTIONS: { value: '' | ProgramType; label: string }[] = [
  { value: ALL, label: 'All' },
  ...PROGRAM_TYPE_OPTIONS,
];

export const programTypeLabel = (value?: string) =>
  PROGRAM_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '-';
