import { useQuery } from '@tanstack/react-query';
import { useApiTask } from '@/hooks/use-api-action';
import {
  createFaq,
  getFaq,
  getFaqs,
  updateFaq,
  updateFaqDisplayOrder,
  updateFaqStatus,
  type PostDetailResponse,
  type UpdateFaqRequest,
} from '@/api/contents/faq-api';
import { FAQ_KEYS, springQuerySerializer } from './use-faqs';

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
  content: UpdateFaqRequest;
  /** Order among the published FAQs of the category; used only when published. */
  displayOrder: number;
}

/**
 * Registers a FAQ, or saves its text, then the category / publish status, then the display order.
 * Published FAQs stay editable (design); the server shifts the other FAQs when the order changes.
 */
export function useSaveFaq() {
  return useApiTask(
    async ({ pstNo, category, published, content, displayOrder }: SaveFaqVariables) => {
      if (pstNo === null) {
        await createFaq({ category, ...content, published, displayOrder });
        return;
      }
      await updateFaq({ path: { pstNo }, body: content, throwOnError: true });
      await updateFaqStatus({ path: { pstNo }, body: { category, published }, throwOnError: true });
      if (published === 'Y') await updateFaqDisplayOrder(pstNo, displayOrder);
    },
    { invalidate: [FAQ_KEYS.all, FAQ_KEYS.details] },
  );
}

/** Published FAQs of a category (the display order range of the popup). */
export function usePublishedFaqCount(category: string, enabled: boolean) {
  return useQuery<number>({
    queryKey: [...FAQ_KEYS.all, 'published-count', category],
    queryFn: async () => {
      const res = await getFaqs({
        query: { pageRequest: { page: 1, size: 1 }, cond: { category, published: 'Y' } },
        querySerializer: springQuerySerializer,
        throwOnError: true,
      });
      return res.data?.data?.totalElements ?? 0;
    },
    enabled: enabled && Boolean(category),
    staleTime: 0,
  });
}
