import { useApiAction } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import { getAboutOverview, saveAboutOverview } from '@/api/contents/about-page-api';
import type { AboutOverview } from '@/api/contents/about-page-api';

// Data hooks of Overview Management (VPA07100401) — the screen never calls the API itself.

const OVERVIEW_KEYS = {
  all: ['contents', 'about-pages', 'overview'] as const,
};

/** Overview body (registered = false until saved once). */
export function useAboutOverview() {
  return useApiQuery<AboutOverview>(OVERVIEW_KEYS.all, getAboutOverview, { gcTime: 0 });
}

/** [Save]: creates the page on the first save, then updates it. */
export function useSaveAboutOverview() {
  return useApiAction(saveAboutOverview, { invalidate: [OVERVIEW_KEYS.all] });
}
