import { useQuery } from '@tanstack/react-query';
import { getFaq, type PostDetailResponse } from '@/api/contents/faqApi';

export interface UseFaqDetailOptions {
  enabled?: boolean;
}

export function useFaqDetail(pstNo?: string, options?: UseFaqDetailOptions) {
  return useQuery<PostDetailResponse | null>({
    queryKey: ['faq-detail', pstNo],
    queryFn: async () => {
      if (!pstNo) return null;
      try {
        const res = await getFaq({
          path: { pstNo },
        });
        return res.data?.data ?? null;
      } catch (err) {
        console.warn(`getFaq for pstNo "${pstNo}" failed or offline:`, err);
        return null;
      }
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

