import { useQuery } from '@tanstack/react-query';
import { getInquiry, type InquiryDetailResponse } from '@/api/contents/inquiryApi';

export interface UseInquiryDetailOptions {
  enabled?: boolean;
}

export function useInquiryDetail(pstNo?: string, options?: UseInquiryDetailOptions) {
  return useQuery<InquiryDetailResponse | null>({
    queryKey: ['inquiry-detail', pstNo],
    queryFn: async () => {
      if (!pstNo) return null;
      try {
        const res = await getInquiry({
          path: { pstNo },
        });
        return res.data?.data ?? null;
      } catch (err) {
        console.warn(`getInquiry for pstNo "${pstNo}" failed or offline:`, err);
        return null;
      }
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

