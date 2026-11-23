import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { getMemberFeePayments, registerMembershipPayment } from '@/api/member/member-fee-api';
import type { MemberFeePayment, RegisterMembershipPaymentRequest } from '@/api/member/member-fee-api';

// Data hooks of the membership fee part of the member detail / edit popups.

const MEMBER_FEE_KEYS = {
  history: (mbrNo: string | null) => ['member', 'fee', 'history', mbrNo] as const,
};

/** Payments of a member, newest first; skipped while `mbrNo` is null. */
export function useMemberFeePayments(mbrNo: string | null) {
  return useApiQuery<MemberFeePayment[]>(MEMBER_FEE_KEYS.history(mbrNo), () => getMemberFeePayments(mbrNo as string), {
    enabled: !!mbrNo,
  });
}

/** Register Payment refreshes the history, the member detail (period, grade) and the list. */
export function useRegisterMembershipPayment(mbrNo: string | null) {
  return useApiAction(
    (request: RegisterMembershipPaymentRequest) => registerMembershipPayment(mbrNo as string, request),
    { invalidate: [MEMBER_FEE_KEYS.history(mbrNo), ['memberDetail'], ['members']] },
  );
}
