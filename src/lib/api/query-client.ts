import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
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
