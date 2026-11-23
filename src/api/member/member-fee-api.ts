import { apiGet, apiPost } from '@/api/common/api-utils';

// Membership fee API — MemberApprovalController (`/api/v1/members/{mbrNo}/membership-fee/...`).
// History: every confirmed payment, newest first (Q-M7); empty until MBR_FEE_PAY_HSTRY exists (schema/42)
// and the backend flag member.fee-payment-history.enabled is on.
// Register Payment (VPA030100P01): one period chosen by the officer, Paid or Exempt.

/** JOIN at sign-up completion, FRST first fee or new period, RNWL renewal, EXMP exempt period, MIGR before the history. */
export type FeePaymentType = 'JOIN' | 'FRST' | 'RNWL' | 'EXMP' | 'MIGR';

export interface MemberFeePayment {
  paySeCd: FeePaymentType;
  /** yyyy-MM-dd; empty for an exempt period. */
  payDt?: string;
  /** yyyy-MM-dd */
  periodBgngDt?: string;
  /** yyyy-MM-dd */
  periodEndDt?: string;
  cnfmEmpNo?: string;
  /** Partially masked by the server. */
  cnfmEmpNm?: string;
  crtDt?: string;
}

export interface RegisterMembershipPaymentRequest {
  payType: 'PAID' | 'EXEMPT';
  /** yyyy-MM-dd; must be after the end of the period still valid (MBR016 / E06). The period lasts one year minus one day. */
  periodStartDate: string;
  /** yyyy-MM-dd; required for PAID. */
  paymentDate?: string;
}

/** Business error codes of the fee API. */
export const MEMBER_FEE_ERRORS = { periodOverlap: 'MBR016' } as const;

const fee = (mbrNo: string) => `/api/v1/members/${encodeURIComponent(mbrNo)}/membership-fee`;

export const getMemberFeePayments = (mbrNo: string) => apiGet<MemberFeePayment[]>(`${fee(mbrNo)}/history`, undefined, []);

/** The member becomes a full member for the period; Paid also sends the fee-confirmed mail. */
export const registerMembershipPayment = (mbrNo: string, request: RegisterMembershipPaymentRequest) =>
  apiPost<unknown>(`${fee(mbrNo)}/payments`, request);
