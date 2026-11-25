import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import { getAboutOrgChart, saveAboutOrgChart } from '@/api/contents/about-page-api';
import type { AboutOrgChart } from '@/api/contents/about-page-api';
import { fetchAttachmentPreview } from '@/api/contents/post-api';

// Data hooks of Organization Chart Management (VPA07100101) — the screen never calls the API itself.
// Chart images are uploaded with `useUploadContentImage('ABOUT')` of the content boards.

const ORG_CHART_KEYS = {
  all: ['contents', 'about-pages', 'organization-chart'] as const,
};

/** Chart images and body (registered = false until saved once). */
export function useAboutOrgChart() {
  return useApiQuery<AboutOrgChart>(ORG_CHART_KEYS.all, getAboutOrgChart, { gcTime: 0 });
}

/** [Save]: creates the page on the first save, then updates it. */
export function useSaveAboutOrgChart() {
  return useApiAction(saveAboutOrgChart, { invalidate: [ORG_CHART_KEYS.all] });
}

/** Object URL of a registered image (the preview endpoint needs the bearer token). */
export function useImagePreviewUrl() {
  return useApiTask((fileUnqId: string) => fetchAttachmentPreview(fileUnqId));
}
