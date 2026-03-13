import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Do not retry on 401/403/404 — these won't change on retry
        if (error instanceof ApiError) {
          if ([401, 403, 404].includes(error.statusCode)) return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
