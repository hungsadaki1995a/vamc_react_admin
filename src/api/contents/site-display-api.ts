import { apiClient } from '@/lib/api/client';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/api/common/api-util';
import type { PageResponse } from '@/api/common/api-util';
import type { ContentFileGroup, Post, PostDetail } from './post-api';

// Site Display Management APIs — LogoController (`/api/v1/contents/logos`, menu A04110200)
// and SloganController (`/api/v1/contents/slogans`, menu A04110300).

export interface SiteDisplaySearch {
  published?: 'Y' | 'N';
  tag?: string;
  /** dd/MM/yyyy */
  fromDate?: string;
  toDate?: string;
  keyword?: string;
}

export interface LogoRequest {
  title: string;
  titleEn?: string;
  positionId: string;
  imageFileId: string;
  linkUrl?: string;
  description?: string;
  descriptionEn?: string;
  useYn?: 'Y' | 'N';
}

export interface SloganRequest {
  title: string;
  titleEn?: string;
  subSlogan?: string;
  subSloganEn?: string;
  positionId: string;
  useYn?: 'Y' | 'N';
}

const LOGO_BASE = '/api/v1/contents/logos';
const SLOGAN_BASE = '/api/v1/contents/slogans';

export const getLogos = (search: SiteDisplaySearch, page: number, size: number) =>
  apiGet<PageResponse<Post>>(LOGO_BASE, { ...search, page, size });

export const getLogo = (id: string) => apiGet<PostDetail>(`${LOGO_BASE}/${id}`);

export const createLogo = (request: LogoRequest) => apiPost<PostDetail>(LOGO_BASE, request);

export const updateLogo = (id: string, request: LogoRequest) =>
  apiPut<PostDetail>(`${LOGO_BASE}/${id}`, request);

export const changeLogoUse = (ids: string[], useYn: 'Y' | 'N') =>
  apiPatch<number>(`${LOGO_BASE}/use`, { ids, useYn });

export const deleteLogos = (ids: string[]) => apiDelete<number>(LOGO_BASE, { ids });

/** Uploads a logo image (multipart part `files`) -> file group id for `imageFileId`. */
export async function uploadLogoImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('files', file);
  const { data } = await apiClient.post<{ data?: ContentFileGroup }>(`${LOGO_BASE}/images`, body);
  const fileUnqId = data.data?.fileUnqId;
  if (!fileUnqId) throw new Error('Upload did not return an image id.');
  return fileUnqId;
}

export const getSlogans = (search: SiteDisplaySearch, page: number, size: number) =>
  apiGet<PageResponse<Post>>(SLOGAN_BASE, { ...search, page, size });

export const getSlogan = (id: string) => apiGet<PostDetail>(`${SLOGAN_BASE}/${id}`);

export const createSlogan = (request: SloganRequest) => apiPost<PostDetail>(SLOGAN_BASE, request);

export const updateSlogan = (id: string, request: SloganRequest) =>
  apiPut<PostDetail>(`${SLOGAN_BASE}/${id}`, request);

export const changeSloganUse = (ids: string[], useYn: 'Y' | 'N') =>
  apiPatch<number>(`${SLOGAN_BASE}/use`, { ids, useYn });

export const deleteSlogans = (ids: string[]) => apiDelete<number>(SLOGAN_BASE, { ids });
