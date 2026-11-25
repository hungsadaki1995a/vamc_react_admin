import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import { getCurrentSlogan, saveSlogan } from '@/api/contents/site-display-api';
import type { SloganSetting } from '@/api/contents/site-display-api';

// Data hooks of Slogan Management (VPA07060301, menu A07060300) — the screen never calls the API itself.

const SLOGAN_KEYS = {
  current: ['contents', 'slogans', 'current'] as const,
};

/** Home hero slogan shown on the user platform. */
export function useCurrentSlogan() {
  return useApiQuery<SloganSetting>(SLOGAN_KEYS.current, getCurrentSlogan, { gcTime: 0 });
}

/** Applies both slogans to the user home hero. */
export function useSaveSlogan() {
  return useApiAction(saveSlogan, { invalidate: [SLOGAN_KEYS.current] });
}
