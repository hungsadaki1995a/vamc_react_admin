import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import { getCurrentLogo, saveLogo, uploadLogoImage } from '@/api/contents/site-display-api';
import type { LogoSetting } from '@/api/contents/site-display-api';

// Data hooks of Logo Management (VPA07060201, menu A07060200) — the screen never calls the API itself.

const LOGO_KEYS = {
  current: ['contents', 'logos', 'current'] as const,
};

/** Header logo shown on the user platform. */
export function useCurrentLogo() {
  return useApiQuery<LogoSetting>(LOGO_KEYS.current, getCurrentLogo, { gcTime: 0 });
}

/** Uploads the picked PNG / SVG; resolves the file-group id. */
export function useUploadLogoImage() {
  return useApiTask(uploadLogoImage);
}

/** Applies the uploaded image to the user header logo. */
export function useSaveLogo() {
  return useApiAction(saveLogo, { invalidate: [LOGO_KEYS.current] });
}
