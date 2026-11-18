import { useMutation, useQuery } from '@tanstack/react-query';
import { confirmFindId, findId } from '@/api/generated/sdk.gen';
import type {
  EmpAccountRecoveryResponse,
  EmpFindIdConfirmRequest,
  EmpFindIdRequest,
  EmpFindIdResultResponse,
} from '@/api/generated/types.gen';
import { ApiError } from '@/lib/api/error';

/** Mutation hook for requesting a find-ID verification (EMAIL or ZALO). */
export function useFindIdMutation() {
  return useMutation<EmpAccountRecoveryResponse | undefined, ApiError, EmpFindIdRequest>({
    mutationFn: async (body) => {
      try {
        const response = await findId({ body, throwOnError: true });
        return response.data?.data;
      } catch (err) {
        throw ApiError.from(err);
      }
    },
  });
}

/** Mutation hook for confirming find-ID (e.g., ZALO verification code). */
export function useConfirmFindIdMutation() {
  return useMutation<EmpFindIdResultResponse | undefined, ApiError, EmpFindIdConfirmRequest>({
    mutationFn: async (body) => {
      try {
        const response = await confirmFindId({ body, throwOnError: true });
        return response.data?.data;
      } catch (err) {
        throw ApiError.from(err);
      }
    },
  });
}

/** Query hook that confirms an EMAIL find-ID token when present in URL query params. */
export function useConfirmFindIdQuery(token: string | null) {
  return useQuery<EmpFindIdResultResponse | undefined, ApiError>({
    queryKey: ['auth', 'confirm-find-id', 'EMAIL', token],
    queryFn: async () => {
      try {
        const response = await confirmFindId({
          body: {
            channel: 'EMAIL',
            token: token!,
          },
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
