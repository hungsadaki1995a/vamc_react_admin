import { LEGACY_FEE_CATEGORY } from '@/api/system/fee-api';
import type { Fee, FeeCategory, FeeCurrency, FeeMethod } from '@/api/system/fee-api';
import { ALL } from '../_shared/sys-constants';

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

/** Design number format: `.` thousands, `,` decimals (e.g. 2.000.000); `-` when empty. */
export function formatFeeNumber(value?: number | null): string {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString('de-DE', { maximumFractionDigits: 2 });
}

/** Fee column: amount for Fixed, % for Rate. */
export function feeValueText(fee: Pick<Fee, 'method' | 'fee' | 'rate'>): string {
  if (fee.method === 'TRF') return fee.rate === undefined || fee.rate === null ? '-' : `${formatFeeNumber(fee.rate)}%`;
  return formatFeeNumber(fee.fee);
}

/** InputNumber display in the design format (20.000.000). */
export const amountFormatter = (value?: number | string) => {
  if (value === undefined || value === '') return '';
  const [int, dec] = `${value}`.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === undefined ? grouped : `${grouped},${dec}`;
};
export const amountParser = (value?: string) => Number((value ?? '').replace(/\./g, '').replace(',', '.'));
