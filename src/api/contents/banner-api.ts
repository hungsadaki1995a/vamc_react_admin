import { apiClient } from '@/lib/api/client';
import { apiDelete, apiDownload, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';
import type { ContentFileGroup } from './post-api';

// Banner Management API — BannerController (`/api/v1/contents/banners`), menu A04060000.
// Screens VPA003201 (list) / VPA0032P01 (popup).

export interface Banner {
  bannerId: string;
  useYn: 'Y' | 'N';
  order: number;
  /** Free-text position key, e.g. MAIN_TOP. */
  positionId: string;
  title: string;
  linkUrl?: string;
  /** Y when a link URL is registered. */
  linked?: 'Y' | 'N';
  imageFileId: string;
  imagePreviewUrl?: string;
  /** false while the banner is in use. */
  editable: boolean;
  crtDt?: string;
  crtBy?: string;
  crtByNm?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface BannerSearch {
  useYn?: 'Y' | 'N';
  positionId?: string;
  /** dd/MM/yyyy */
  fromDate?: string;
  toDate?: string;
  /** Banner ID or title */
  keyword?: string;
}

export interface BannerRequest {
  title: string;
  positionId: string;
  /** 1–999 */
  order: number;
  /** Empty or http(s)://… */
  linkUrl?: string;
  imageFileId: string;
}

const BASE = '/api/v1/contents/banners';

export const getBanners = (search: BannerSearch, page: number, size: number) =>
  apiGet<PageResponse<Banner>>(BASE, { ...search, page, size });

export const getBanner = (bannerId: string) => apiGet<Banner>(`${BASE}/${bannerId}`);

/** New banners always start not in use. */
export const createBanner = (request: BannerRequest) => apiPost<Banner>(BASE, request);

/** Rejected with 409 BNR001 while the banner is in use. */
export const updateBanner = (bannerId: string, request: BannerRequest) =>
  apiPut<Banner>(`${BASE}/${bannerId}`, request);

export const changeBannerUse = (bannerIds: string[], useYn: 'Y' | 'N') =>
  apiPatch<void>(`${BASE}/use`, { bannerIds, useYn });

export const deleteBanners = (bannerIds: string[]) => apiDelete<void>(BASE, { bannerIds });

export const downloadBannerExcel = (search: BannerSearch) =>
  apiDownload(`${BASE}/excel`, 'banners.xlsx', search);

/** Uploads the banner image (multipart part `files`) → file group id for `imageFileId`. */
export async function uploadBannerImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('files', file);
  const { data } = await apiClient.post<{ data?: ContentFileGroup }>(`${BASE}/images`, body);
  const fileUnqId = data.data?.fileUnqId;
  if (!fileUnqId) throw new Error('Upload did not return an image id.');
  return fileUnqId;
}
