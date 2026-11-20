import { LEGACY_FEE_CATEGORY } from '@/api/system/fee-api';
import type { Fee, FeeCategory, FeeCurrency, FeeMethod } from '@/api/system/fee-api';
import { ALL } from '../_shared/sys-constants';
import { formatAmount } from '../_shared/system-utils';

// Labels and formatting of Fee Management (v0.8 wording).

export const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
  ANFE: 'Membership Fee',
  PMDT: 'Purchase Brokerage',
  DMDT: 'Sale Brokerage',
  CNSLT: 'Consulting',
};

export const FEE_CATEGORY_OPTIONS = (Object.keys(FEE_CATEGORY_LABELS) as FeeCategory[]).map((value) => ({
  value,
  label: FEE_CATEGORY_LABELS[value],
}));

export const FEE_CATEGORY_FILTER_OPTIONS: { value: FeeCategory | ''; label: string }[] = [
  { value: ALL, label: 'All' },
  ...FEE_CATEGORY_OPTIONS,
];

export const FEE_METHOD_LABELS: Record<FeeMethod, string> = { FXAMT: 'Fixed', TRF: 'Rate' };

export const FEE_METHOD_OPTIONS = (Object.keys(FEE_METHOD_LABELS) as FeeMethod[]).map((value) => ({
  value,
  label: FEE_METHOD_LABELS[value],
}));

export const FEE_CURRENCY_OPTIONS: { value: FeeCurrency; label: string }[] = [
  { value: 'VND', label: 'VND' },
  { value: 'USD', label: 'USD' },
];

export const isLegacyFee = (category?: string) => category === LEGACY_FEE_CATEGORY;

/** Type label; a legacy `MDT` row keeps the server name. */
export function feeCategoryLabel(fee: Pick<Fee, 'category' | 'categoryNm'>): string {
  const label = FEE_CATEGORY_LABELS[fee.category as FeeCategory];
  if (label) return label;
  const name = fee.categoryNm || fee.category;
  return isLegacyFee(fee.category) ? `${name} (legacy)` : name;
}

/** Fee column: amount for Fixed, % for Rate. */
export function feeValueText(fee: Pick<Fee, 'method' | 'fee' | 'rate'>): string {
  if (fee.method === 'TRF') return fee.rate === undefined || fee.rate === null ? '-' : `${formatAmount(fee.rate)}%`;
  return formatAmount(fee.fee);
}

/** InputNumber thousand separators. */
export const amountFormatter = (value?: number | string) =>
  value === undefined || value === '' ? '' : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const amountParser = (value?: string) => Number((value ?? '').replace(/,/g, ''));
