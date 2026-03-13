import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { App } from 'antd';
import { ApiError } from '@/lib/api/error';
import type { ApiResponse } from '@/lib/api/types';

interface ApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'> {
  successMessage?: string; // Auto-show success toast if provided
}

// Wraps useMutation with ApiResponse<T> unwrapping and optional success toast.
// Usage:
//   const { mutate, isPending } = useApiMutation<Project, CreateProjectDto>(
//     (dto) => projectApi.createProject(dto),
//     { successMessage: '프로젝트가 생성되었습니다.' }
//   )
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: ApiMutationOptions<TData, TVariables>,
) {
  const { message } = App.useApp();
  const { successMessage, onSuccess, ...restOptions } = options ?? {};

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new ApiError({
          code: 'E_API',
          data: null,
          message: response.message || '요청을 처리하지 못했습니다.',
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: '',
        });
      }
      return response.data as TData;
    },
    onSuccess: (...args) => {
      if (successMessage) {
        message.success(successMessage);
      }
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}
