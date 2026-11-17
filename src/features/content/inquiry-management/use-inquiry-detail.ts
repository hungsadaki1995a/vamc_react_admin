import { useQuery } from '@tanstack/react-query';
import { getInquiry, type InquiryDetailResponse } from '@/api/contents/inquiry-api';

export interface UseInquiryDetailOptions {
  enabled?: boolean;
}

export function useInquiryDetail(pstNo?: string, options?: UseInquiryDetailOptions) {
  return useQuery<InquiryDetailResponse | null>({
    queryKey: ['inquiry-detail', pstNo],
    queryFn: async () => {
      if (!pstNo) return null;
      const res = await getInquiry({ path: { pstNo }, throwOnError: true });
      return res.data?.data ?? null;
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

