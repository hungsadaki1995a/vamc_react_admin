import { useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/error';
import type { ApiResponse } from '@/lib/api/types';

type ApiQueryOptions<T> = Omit<
  UseQueryOptions<T, ApiError, T, QueryKey>,
  'queryKey' | 'queryFn'
>;

// Wraps useQuery with ApiResponse<T> unwrapping.
// Usage:
//   const { data, isLoading } = useApiQuery<Project[]>(
//     ['projects'],
//     () => projectApi.getProjects(),
//   )
export function useApiQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<T>>,
  options?: ApiQueryOptions<T>,
): UseQueryResult<T, ApiError> {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      const response = await queryFn();
      if (!response.success || response.data == null) {
        throw new ApiError({
          code: 'E_API',
          data: null,
          message: response.message || '데이터를 불러오지 못했습니다.',
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: '',
        });
      }
      return response.data as T;
    },
    ...options,
  });
}
