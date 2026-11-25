import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryKey, UseMutationResult } from '@tanstack/react-query';
import { App } from 'antd';
import i18n from '@/lib/i18n';
import { ApiError } from '@/lib/api/error';
import type { ApiResponse } from '@/lib/api/types';

interface ApiActionOptions {
  /** Query keys (prefixes) refetched after the action succeeds. */
  invalidate?: QueryKey[];
}

/**
 * Mutation wrapper for write calls that answer `ApiResponse<T>`.
 *
 * Unlike `useApiMutation` it resolves the whole response, so the caller can show the
 * server's own message (`response.message`). Rejections are always `ApiError`.
 *
 * @example
 * const deleteFees = useApiAction(api.deleteFees, { invalidate: [FEE_KEYS.all] });
 * const response = await deleteFees.mutateAsync(ids);
 */
export function useApiAction<TData, TVariables = void>(
  action: (variables: TVariables) => Promise<ApiResponse<TData>>,
  { invalidate = [] }: ApiActionOptions = {},
): UseMutationResult<ApiResponse<TData>, ApiError, TVariables> {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<TData>, ApiError, TVariables>({
    mutationFn: async (variables) => {
      try {
        const response = await action(variables);
        if (!response.success) throw new Error(response.message || i18n.t('messages.api.requestFailed'));
        return response;
      } catch (error) {
        throw ApiError.from(error);
      }
    },
    onSuccess: () =>
      // A failed refetch must not turn a completed write into an error.
      Promise.allSettled(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(() => undefined),
  });
}

/** Mutation wrapper for calls that resolve nothing useful (file downloads, uploads). */
export function useApiTask<TResult, TVariables = void>(
  task: (variables: TVariables) => Promise<TResult>,
  { invalidate = [] }: ApiActionOptions = {},
): UseMutationResult<TResult, ApiError, TVariables> {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVariables>({
    mutationFn: async (variables) => {
      try {
        return await task(variables);
      } catch (error) {
        throw ApiError.from(error);
      }
    },
    onSuccess: () =>
      // A failed refetch must not turn a completed write into an error.
      Promise.allSettled(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(() => undefined),
  });
}

/**
 * File download (Excel export, attachment) that reports its own failure with a toast,
 * so a plain `download.mutate(search)` on a button never fails silently.
 */
export function useApiDownload<TVariables = void>(
  download: (variables: TVariables) => Promise<void>,
): UseMutationResult<void, ApiError, TVariables> {
  const { message } = App.useApp();
  return useMutation<void, ApiError, TVariables>({
    mutationFn: async (variables) => {
      try {
        await download(variables);
      } catch (error) {
        throw ApiError.from(error);
      }
    },
    onError: (error) => {
      void message.error(error.message);
    },
  });
}
