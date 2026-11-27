import type { ApprovalTargetSummary } from '@/api/common/approval-api';
import i18n from '@/lib/i18n';
import { codeLabel } from '@/lib/i18n/code-label';
import { formatAmount } from '@/utils/system-utils';
import type { ApprovalDetailRow } from './ApprovalParts';

// Business rows of an approval target for the approval popups.

const withCurrency = (amount: number | undefined, crncCd?: string) =>
  amount === undefined ? undefined : `${formatAmount(amount)}${crncCd ? ` ${crncCd}` : ''}`;

/**
 * Business rows of the server's target summary (GET /approvals/{id} `target`): numbers, member, NPL / LOT, total
 * evaluation, price, fee. The target number itself is shown by the popup's "Target" row.
 */
export function targetSummaryRows(target: ApprovalTargetSummary): ApprovalDetailRow[] {
  const rows: (ApprovalDetailRow | null)[] = [
    target.srvcCtrtNo && target.srvcAplyNo ? { label: i18n.t('approval.target.applicationNo'), value: target.srvcAplyNo } : null,
    target.mstCtrtNo ? { label: i18n.t('approval.target.mainContract'), value: target.mstCtrtNo } : null,
    target.mbrNo || target.mbrNm ? { label: i18n.t('approval.target.member'), value: target.mbrNm ? `${target.mbrNm} (${target.mbrNo ?? '-'})` : target.mbrNo } : null,
    target.bndLotYn === 'Y' || target.bndLotId
      ? { label: i18n.t('approval.target.lot'), value: target.bndLotNm || target.bndLotId || '-' }
      : target.bndCd
        ? { label: i18n.t('approval.target.npl'), value: target.bndCd }
        : null,
    target.totEvlAmt !== undefined ? { label: i18n.t('approval.target.totalEvaluation'), value: withCurrency(target.totEvlAmt, target.crncCd) } : null,
    target.prpPrc !== undefined ? { label: i18n.t('approval.target.price'), value: withCurrency(target.prpPrc, target.crncCd) } : null,
    target.feeAmt !== undefined || target.feeClclnMthCd
      ? {
          label: i18n.t('approval.target.fee'),
          value: [withCurrency(target.feeAmt, target.crncCd), target.feeClclnMthCd && codeLabel('trade.feeMethods', target.feeClclnMthCd)]
            .filter(Boolean)
            .join(' · '),
        }
      : null,
  ];
  return rows.filter((row): row is ApprovalDetailRow => row !== null);
}
