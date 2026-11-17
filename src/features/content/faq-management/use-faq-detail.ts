import { useQuery } from '@tanstack/react-query';
import { getFaq, type PostDetailResponse } from '@/api/contents/faq-api';

export interface UseFaqDetailOptions {
  enabled?: boolean;
}

export function useFaqDetail(pstNo?: string, options?: UseFaqDetailOptions) {
  return useQuery<PostDetailResponse | null>({
    queryKey: ['faq-detail', pstNo],
    queryFn: async () => {
      if (!pstNo) return null;
      const res = await getFaq({ path: { pstNo }, throwOnError: true });
      return res.data?.data ?? null;
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

