import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  changeLogoUse,
  createLogo,
  deleteLogos,
  getLogo,
  getLogos,
  updateLogo,
  uploadLogoImage,
} from '@/api/contents/site-display-api';
import type { LogoRequest, SiteDisplaySearch } from '@/api/contents/site-display-api';
import type { Post, PostDetail } from '@/api/contents/post-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Logo Management (menu A07060200) — the screen never calls the API itself.

const LOGO_KEYS = {
  all: ['contents', 'logos'] as const,
  list: (search: SiteDisplaySearch, page: number, size: number) =>
    ['contents', 'logos', 'list', search, page, size] as const,
  detail: (logoId: string | null) => ['contents', 'logos', 'detail', logoId] as const,
};

/** Paged logo list. */
export function useLogos(search: SiteDisplaySearch, page: number, size: number) {
  return useApiQuery<PageResponse<Post>>(LOGO_KEYS.list(search, page, size), () => getLogos(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One logo; skipped while `logoId` is null (register mode). */
export function useLogo(logoId: string | null) {
  return useApiQuery<PostDetail>(LOGO_KEYS.detail(logoId), () => getLogo(logoId as string), {
    enabled: logoId !== null,
    gcTime: 0,
  });
}

export interface ChangeLogoUseVariables {
  ids: string[];
  useYn: 'Y' | 'N';
}

/** Bulk use / unuse. */
export function useChangeLogoUse() {
  return useApiAction(({ ids, useYn }: ChangeLogoUseVariables) => changeLogoUse(ids, useYn), {
    invalidate: [LOGO_KEYS.all],
  });
}

export function useDeleteLogos() {
  return useApiAction(deleteLogos, { invalidate: [LOGO_KEYS.all] });
}

/** Uploads the logo image; resolves the file-group id. */
export function useUploadLogoImage() {
  return useApiTask(uploadLogoImage);
}

export interface SaveLogoVariables {
  /** null = register. */
  logoId: string | null;
  request: LogoRequest;
}

/** Registers / edits a logo. */
export function useSaveLogo() {
  return useApiTask(
    ({ logoId, request }: SaveLogoVariables) =>
      logoId === null ? createLogo(request) : updateLogo(logoId, request),
    { invalidate: [LOGO_KEYS.all] },
  );
}
