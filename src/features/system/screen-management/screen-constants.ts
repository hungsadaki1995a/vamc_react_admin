import { ALL } from '@/config/sys-constants';
import type { ScreenItem, ScreenType } from '@/api/system/program-screen-api';

export type { ScreenType };

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

/** Business (1Depth menu) name shown in the list. */
export function businessName(row: Pick<ScreenItem, 'menuCd' | 'menuNmEn' | 'menuNmVn'>): string | undefined {
  return row.menuNmEn || row.menuNmVn || row.menuCd;
}

export const SCREEN_MESSAGES = {
  businessInvalid: 'Select a 1Depth menu of the selected type.',
  labelKeyNotFound: 'This label key does not exist.',
  hasLabels: 'This screen cannot be deleted while labels still use it.',
} as const;
