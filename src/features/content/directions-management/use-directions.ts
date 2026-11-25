import { useApiAction } from '@/hooks/use-api-action';
import { useApiQuery } from '@/hooks/use-api-query';
import { getAboutDirections, saveAboutDirections } from '@/api/contents/about-page-api';
import type { AboutDirections } from '@/api/contents/about-page-api';

// Data hooks of Directions Management (VPA07100301) — the screen never calls the API itself.

const DIRECTIONS_KEYS = {
  all: ['contents', 'about-pages', 'directions'] as const,
};

/** Address, map, contact and business hours (registered = false while none is saved). */
export function useAboutDirections() {
  return useApiQuery<AboutDirections>(DIRECTIONS_KEYS.all, getAboutDirections, { gcTime: 0 });
}

/** [Save]: creates the page on the first save, then updates it. */
export function useSaveAboutDirections() {
  return useApiAction(saveAboutDirections, { invalidate: [DIRECTIONS_KEYS.all] });
}
