import type { BadgeTone } from '@/components/common/sys-ui/SysListUi';
import { ALL } from '@/config/sys-constants';
import type { TermsStatus, TermsType } from '@/api/system/terms-api';

export const TERMS_TYPE_OPTIONS: { value: TermsType; label: string }[] = [
  { value: 'TRMS', label: 'Terms of Use' },
  { value: 'PRVC', label: 'Privacy Policy' },
];

export const TERMS_TYPE_FILTER_OPTIONS: { value: '' | TermsType; label: string }[] = [
  { value: ALL, label: 'All' },
  ...TERMS_TYPE_OPTIONS,
];

export const TERMS_STATUS: Record<TermsStatus, { label: string; tone: BadgeTone }> = {
  SCHEDULED: { label: 'Scheduled', tone: 'orange' },
  IN_EFFECT: { label: 'In Effect', tone: 'blue' },
  PREVIOUS: { label: 'Previous Version', tone: 'gray' },
};

export const TERMS_STATUS_FILTER_OPTIONS: { value: '' | TermsStatus; label: string }[] = [
  { value: ALL, label: 'All' },
  ...(Object.keys(TERMS_STATUS) as TermsStatus[]).map((value) => ({ value, label: TERMS_STATUS[value].label })),
];

export const termsTypeLabel = (value?: string) => TERMS_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value ?? '-';
