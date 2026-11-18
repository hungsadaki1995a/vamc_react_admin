import { useMutation, useQuery } from '@tanstack/react-query';
import { requestPasswordReset, resetPassword, verifyResetToken } from '@/api/generated/sdk.gen';
import type {
  EmpAccountRecoveryResponse,
  EmpPasswordResetLinkRequest,
  EmpPasswordResetRequest,
  EmpPasswordResetTokenResponse,
} from '@/api/generated/types.gen';
import { ApiError } from '@/lib/api/error';

/** Query hook that verifies an EMAIL password-reset token when present in URL query params. */
export function useVerifyResetTokenQuery(token: string | null) {
  return useQuery<EmpPasswordResetTokenResponse | undefined, ApiError>({
    queryKey: ['auth', 'verify-reset-token', token],
    queryFn: async () => {
      try {
        const response = await verifyResetToken({
          body: { token: token! },
          throwOnError: true,
        });
        return response.data?.data;
      } catch (err) {
        throw ApiError.from(err);
      }
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/** Mutation hook for requesting a password reset verification (EMAIL or ZALO). */
export function useRequestPasswordResetMutation() {
  return useMutation<EmpAccountRecoveryResponse | undefined, ApiError, EmpPasswordResetLinkRequest>({
    mutationFn: async (body) => {
      try {
        const response = await requestPasswordReset({ body, throwOnError: true });
        return response.data?.data;
      } catch (err) {
        throw ApiError.from(err);
      }
    },
  });
}

/** Mutation hook for resetting the password with a verified token. */
export function useResetPasswordMutation() {
  return useMutation<void, ApiError, EmpPasswordResetRequest>({
    mutationFn: async (body) => {
      try {
        await resetPassword({ body, throwOnError: true });
      } catch (err) {
        throw ApiError.from(err);
      }
    },
  });
}
