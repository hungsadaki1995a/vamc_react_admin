import { useQuery } from '@tanstack/react-query';
import { useApiTask } from '@/hooks/use-api-action';
import {
  createFaq,
  getFaq,
  updateFaq,
  updateFaqStatus,
  type PostDetailResponse,
  type UpdateFaqRequest,
} from '@/api/contents/faq-api';
import { FAQ_KEYS } from './use-faqs';

export interface UseFaqDetailOptions {
  enabled?: boolean;
}

export function useFaqDetail(pstNo?: string, options?: UseFaqDetailOptions) {
  return useQuery<PostDetailResponse | null>({
    queryKey: FAQ_KEYS.detail(pstNo),
    queryFn: async () => {
      if (!pstNo) return null;
      const res = await getFaq({ path: { pstNo }, throwOnError: true });
      return res.data?.data ?? null;
    },
    enabled: Boolean(pstNo) && (options?.enabled ?? true),
    staleTime: 30000,
  });
}

export interface SaveFaqVariables {
  /** null = register. */
  pstNo: string | null;
  category: string;
  published: 'Y' | 'N';
  /** Question / answer text; omitted when the FAQ is posted (content locked). */
  content?: UpdateFaqRequest;
}

/** Registers a FAQ, or saves its text first and the category / posting status afterwards. */
export function useSaveFaq() {
  return useApiTask(
    async ({ pstNo, category, published, content }: SaveFaqVariables) => {
      if (pstNo === null) {
        if (content) await createFaq({ body: { category, ...content, published }, throwOnError: true });
        return;
      }
      // Content can only be edited while the FAQ is not posted (contentEditable).
      if (content) await updateFaq({ path: { pstNo }, body: content, throwOnError: true });
      await updateFaqStatus({ path: { pstNo }, body: { category, published }, throwOnError: true });
    },
    { invalidate: [FAQ_KEYS.all, FAQ_KEYS.details] },
  );
}
