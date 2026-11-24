import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import { createBanner, deleteBanners, getBanners, updateBanner, uploadBannerImage } from '@/api/contents/banner-api';
import type { Banner, BannerRequest, BannerSearch } from '@/api/contents/banner-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Banner Management (VPA07060101 / VPA070601P01) — the screen never calls the API itself.

const BANNER_KEYS = {
  all: ['contents', 'banners'] as const,
  list: (search: BannerSearch, page: number, size: number) =>
    ['contents', 'banners', 'list', search, page, size] as const,
};

/** Paged banner list. */
export function useBanners(search: BannerSearch, page: number, size: number) {
  return useApiQuery<PageResponse<Banner>>(BANNER_KEYS.list(search, page, size), () => getBanners(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

export function useDeleteBanners() {
  return useApiAction(deleteBanners, { invalidate: [BANNER_KEYS.all] });
}

/** Uploads the banner image; resolves the file-group id. */
export function useUploadBannerImage() {
  return useApiTask(uploadBannerImage);
}

export interface SaveBannerVariables {
  /** null = register. */
  bannerId: string | null;
  request: BannerRequest;
}

/** Registers / edits a banner; the server moves the other banners to keep the orders 1..n. */
export function useSaveBanner() {
  return useApiAction(
    ({ bannerId, request }: SaveBannerVariables) =>
      bannerId === null ? createBanner(request) : updateBanner(bannerId, request),
    { invalidate: [BANNER_KEYS.all] },
  );
}
