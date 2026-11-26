import type { ApprovalTargetSummary } from '@/api/common/approval-api';
import { formatAmount } from '@/utils/system-utils';
import type { ApprovalDetailRow } from './ApprovalParts';

// Business rows of an approval target for the approval popups.

const FEE_METHODS: Record<string, string> = { LUMP: 'Full after signing', AFTR: 'Full after the sale', STAG: 'Advance + balance' };

const withCurrency = (amount: number | undefined, crncCd?: string) =>
  amount === undefined ? undefined : `${formatAmount(amount)}${crncCd ? ` ${crncCd}` : ''}`;

/**
 * Business rows of the server's target summary (GET /approvals/{id} `target`): numbers, member, NPL / LOT, total
 * evaluation, price, fee. The target number itself is shown by the popup's "Target" row.
 */
export function targetSummaryRows(target: ApprovalTargetSummary): ApprovalDetailRow[] {
  const rows: (ApprovalDetailRow | null)[] = [
    target.srvcCtrtNo && target.srvcAplyNo ? { label: 'Application No.', value: target.srvcAplyNo } : null,
    target.mstCtrtNo ? { label: 'Main Contract', value: target.mstCtrtNo } : null,
    target.mbrNo || target.mbrNm ? { label: 'Member', value: target.mbrNm ? `${target.mbrNm} (${target.mbrNo ?? '-'})` : target.mbrNo } : null,
    target.bndLotYn === 'Y' || target.bndLotId
      ? { label: 'LOT', value: target.bndLotNm || target.bndLotId || '-' }
      : target.bndCd
        ? { label: 'NPL', value: target.bndCd }
        : null,
    target.totEvlAmt !== undefined ? { label: 'Total Evaluation', value: withCurrency(target.totEvlAmt, target.crncCd) } : null,
    target.prpPrc !== undefined ? { label: 'Price', value: withCurrency(target.prpPrc, target.crncCd) } : null,
    target.feeAmt !== undefined || target.feeClclnMthCd
      ? {
          label: 'Fee',
          value: [withCurrency(target.feeAmt, target.crncCd), target.feeClclnMthCd && (FEE_METHODS[target.feeClclnMthCd] ?? target.feeClclnMthCd)]
            .filter(Boolean)
            .join(' · '),
        }
      : null,
  ];
  return rows.filter((row): row is ApprovalDetailRow => row !== null);
}
