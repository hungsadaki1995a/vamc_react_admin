import i18n from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';
import type { ContentFileGroup } from './post-api';

// Banner Management API — BannerController (`/api/v1/contents/banners`), menu A07060100.
// Screens VPA07060101 (list) / VPA070601P01 (popup). Server rules: max 5 home banners (BNR005), display orders
// kept 1..n (register / edit move the others, delete closes the gap), every saved banner is shown on the user home.

export interface Banner {
  bannerId: string;
  /** Always Y for banners saved on this screen. */
  useYn: 'Y' | 'N';
  order: number;
  /** Banner area, MAIN_TOP = user home. */
  positionId: string;
  title: string;
  imageFileId: string;
  /** Original image file name, e.g. main_banner_img_290707.png */
  imageFileName?: string;
  imagePreviewUrl?: string;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface BannerSearch {
  positionId?: string;
}

export interface BannerRequest {
  /** Max 50 characters. */
  title: string;
  /** 1 ~ number of banners (+1 on register); omitted = last. */
  order?: number;
  imageFileId: string;
}

/** Business error codes of the banner screens. */
export const BANNER_ERRORS = {
  /** [New] with 5 banners registered. */
  limitExceeded: 'BNR005',
  /** E03 — image not JPG / PNG or over 10MB. */
  imageInvalid: 'BNR006',
  /** Display order outside 1 ~ n. */
  orderOutOfRange: 'BNR007',
} as const;

const BASE = '/api/v1/contents/banners';

export const getBanners = (search: BannerSearch, page: number, size: number) =>
  apiGet<PageResponse<Banner>>(BASE, { ...search, page, size });

export const createBanner = (request: BannerRequest) => apiPost<Banner>(BASE, request);

export const updateBanner = (bannerId: string, request: BannerRequest) =>
  apiPut<Banner>(`${BASE}/${bannerId}`, request);

export const deleteBanners = (bannerIds: string[]) => apiDelete<void>(BASE, { bannerIds });

/** Uploads the banner image (multipart part `files`) → file group id for `imageFileId`. */
export async function uploadBannerImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('files', file);
  const { data } = await apiClient.post<{ data?: ContentFileGroup }>(`${BASE}/images`, body);
  const fileUnqId = data.data?.fileUnqId;
  if (!fileUnqId) throw new Error(i18n.t('messages.api.uploadNoImageId'));
  return fileUnqId;
}
