import { useQuery } from '@tanstack/react-query';
import { useApiTask } from '@/hooks/use-api-action';
import { answerInquiry, getInquiry, type InquiryDetailResponse } from '@/api/contents/inquiry-api';
import { INQUIRY_KEYS } from './use-inquiries';

export interface UseInquiryDetailOptions {
  enabled?: boolean;
}

export function useInquiryDetail(pstNo?: string, options?: UseInquiryDetailOptions) {
  return useQuery<InquiryDetailResponse | null>({
    queryKey: INQUIRY_KEYS.detail(pstNo),
    queryFn: async () => {
      if (!pstNo) return null;
      const res = await getInquiry({ path: { pstNo }, throwOnError: true });
      return res.data?.data ?? null;
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

export interface AnswerInquiryVariables {
  pstNo: string;
  answer: string;
}

/** PUT /api/v1/contents/inquiries/{pstNo}/answer — a rejected call must not look like success. */
export function useAnswerInquiry() {
  return useApiTask(
    ({ pstNo, answer }: AnswerInquiryVariables) =>
      answerInquiry({ path: { pstNo }, body: { answer }, throwOnError: true }),
    { invalidate: [INQUIRY_KEYS.all, INQUIRY_KEYS.details] },
  );
}
