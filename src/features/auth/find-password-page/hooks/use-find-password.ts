import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset, resetPassword } from '@/api/generated/sdk.gen';
import type {
  EmpAccountRecoveryResponse,
  EmpPasswordResetLinkRequest,
  EmpPasswordResetRequest,
} from '@/api/generated/types.gen';
import { ApiError } from '@/lib/api/error';

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
