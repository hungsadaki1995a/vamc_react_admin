import dayjs from 'dayjs';
import type { TradeAppKind, TradeContractDetail } from '@/api/trade/trade-api';
import { dmyToDayjs } from '@/utils/date-format';

/** The renewal decision opens this many days before the end date (sale.contract.expiry-notice-days). */
export const RENEWAL_WINDOW_DAYS = 30;

// Actions of the contract popup. The server sends them in `availableActions` (WP8); for an older server they are
// derived from plan §2.4 (officer = tkcgEmpNo, nothing while an approval is open, approver decides).

export type ContractAction =
  | 'DECIDE'
  | 'CHANGE_OFFICER'
  | 'UPDATE_DRAFT'
  | 'REQUEST_DRAFT_APPROVAL'
  | 'REGISTER_DRAFT'
  | 'REQUEST_SIGNATURE_APPROVAL'
  | 'ATTACH_SIGNED_SCAN'
  | 'CONCLUDE'
  | 'CONFIRM_FEE'
  | 'REFUND_FEE'
  | 'COMPLETE_SALE'
  | 'CONCLUDE_TRADE'
  | 'RECORD_DELIVERY'
  | 'CREATE_ANNEX'
  | 'DECIDE_RENEWAL'
  | string;

export function contractActions(detail: TradeContractDetail, me: string | undefined, kind: TradeAppKind, canWrite: boolean): Set<ContractAction> {
  if (!canWrite) return new Set();
  if (detail.availableActions) return new Set(detail.availableActions);
  // Fallback (§2.4) — the approver step cannot be derived without the open session, so DECIDE is not offered.
  const actions = new Set<ContractAction>(['CHANGE_OFFICER']);
  const officer = !!me && detail.tkcgEmpNo === me;
  const open = detail.atrzSttsCd === 'INPROGRESS';
  if (!officer || open) return actions;
  const main = detail.mstCtrtCd === undefined || detail.mstCtrtCd === detail.srvcCtrtCd;
  switch (detail.ctrtSttsCd) {
    case 'PREPR':
      actions.add('UPDATE_DRAFT');
      if (detail.ctrtBgngDmy && (detail.feeClclnMthCd || !main)) actions.add('REQUEST_DRAFT_APPROVAL');
      break;
    case 'DRFAPR':
      actions.add('REGISTER_DRAFT');
      break;
    case 'SGNWT':
      actions.add('REQUEST_SIGNATURE_APPROVAL');
      break;
    case 'SGNCP':
      actions.add('ATTACH_SIGNED_SCAN');
      if (detail.scanFiles?.length) actions.add('CONCLUDE');
      break;
    case 'PROGS':
      if (detail.fees?.some((fee) => fee.feeRcptYn !== 'Y')) actions.add('CONFIRM_FEE');
      if (kind === 'sale' && main && !detail.trdCnclsDmy) actions.add('COMPLETE_SALE');
      if (kind === 'purchase' && main && !detail.trdCnclsDmy) actions.add('CONCLUDE_TRADE');
      if (kind === 'purchase' && detail.trdCnclsDmy && !detail.dlvrCmptnDmy) actions.add('RECORD_DELIVERY');
      if (kind !== 'consulting' && main) actions.add('CREATE_ANNEX');
      if (kind !== 'consulting' && main && withinRenewalWindow(detail.ctrtEndDmy)) actions.add('DECIDE_RENEWAL');
      break;
    default:
      break;
  }
  return actions;
}

/** End date within the renewal window (or past it); open-ended contracts never are. */
function withinRenewalWindow(ctrtEndDmy?: string): boolean {
  const end = dmyToDayjs(ctrtEndDmy);
  return !!end && end.diff(dayjs().startOf('day'), 'day') <= RENEWAL_WINDOW_DAYS;
}
