import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  changeBannerUse,
  createBanner,
  deleteBanners,
  downloadBannerExcel,
  getBanner,
  getBanners,
  updateBanner,
  uploadBannerImage,
} from '@/api/contents/banner-api';
import type { Banner, BannerRequest, BannerSearch } from '@/api/contents/banner-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Banner Management (VPA003201 / VPA0032P01) — the screen never calls the API itself.

const BANNER_KEYS = {
  all: ['contents', 'banners'] as const,
  list: (search: BannerSearch, page: number, size: number) =>
    ['contents', 'banners', 'list', search, page, size] as const,
  detail: (bannerId: string | null) => ['contents', 'banners', 'detail', bannerId] as const,
};

/** Paged banner list. */
export function useBanners(search: BannerSearch, page: number, size: number) {
  return useApiQuery<PageResponse<Banner>>(BANNER_KEYS.list(search, page, size), () => getBanners(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One banner; skipped while `bannerId` is null (register mode). */
export function useBanner(bannerId: string | null) {
  return useApiQuery<Banner>(BANNER_KEYS.detail(bannerId), () => getBanner(bannerId as string), {
    enabled: bannerId !== null,
    gcTime: 0,
  });
}

export function useDeleteBanners() {
  return useApiAction(deleteBanners, { invalidate: [BANNER_KEYS.all] });
}

export function useDownloadBannerExcel() {
  return useApiTask(downloadBannerExcel);
}

/** Uploads the banner image; resolves the file-group id. */
export function useUploadBannerImage() {
  return useApiTask(uploadBannerImage);
}

export interface SaveBannerVariables {
  /** null = register. */
  bannerId: string | null;
  /** Omitted when only the usage flag changes (banner in use). */
  request?: BannerRequest;
  /** Usage flag to apply after saving; the server always stores new / edited banners as Unused. */
  useYn?: 'Y' | 'N';
}

/** Registers / edits a banner, then applies the usage flag. */
export function useSaveBanner() {
  return useApiTask(
    async ({ bannerId, request, useYn }: SaveBannerVariables) => {
      let savedId = bannerId;
      if (request) {
        const saved = bannerId === null ? await createBanner(request) : await updateBanner(bannerId, request);
        savedId = saved.data?.bannerId ?? bannerId;
      }
      if (useYn && savedId) await changeBannerUse([savedId], useYn);
    },
    { invalidate: [BANNER_KEYS.all] },
  );
}
