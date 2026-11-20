import { ALL } from '@/features/system/_shared/sys-constants';

/** W = Web, A = Admin (same codes as MENU_SE_CD). */
export type ScreenType = 'W' | 'A';

export const SCREEN_TYPE_OPTIONS: { value: ScreenType; label: string }[] = [
  { value: 'W', label: 'Web' },
  { value: 'A', label: 'Admin' },
];

export const SCREEN_TYPE_FILTER_OPTIONS: { value: '' | ScreenType; label: string }[] = [
  { value: ALL, label: 'All' },
  ...SCREEN_TYPE_OPTIONS,
];

export const POPUP_OPTIONS = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
];

/** Shown on v0.8 fields the backend cannot store yet. */
export const NOT_AVAILABLE_NOTE = 'Not available yet (waiting for the screen schema change).';

/**
 * Type guessed from the Screen ID prefix (WB_… / AD_…) until SCRN_MNG stores it.
 * TODO(schema): read the type column instead.
 */
export function screenTypeOf(scrnId?: string): ScreenType | undefined {
  const prefix = scrnId?.slice(0, 2).toUpperCase();
  if (prefix === 'WB') return 'W';
  if (prefix === 'AD') return 'A';
  return undefined;
}
