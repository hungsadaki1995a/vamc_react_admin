import { apiDelete, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { ContentFile } from './post-api';

// About VAMC Management API — AboutPageController (/api/v1/contents/about-pages), screens
// VPA07100101 (Organization Chart), VPA07100201 / VPA071002P01 (History), VPA07100301 (Directions),
// VPA07100401 (Overview). Chart images are uploaded first with the content file API (board ABOUT).

const BASE = '/api/v1/contents/about-pages';

/** Server error codes the screens map to a field. */
export const ABOUT_PAGE_ERRORS = {
  /** E03: chart image is not png / jpg / jpeg of 10MB or less. */
  imageInvalid: 'CNT021',
} as const;

interface AboutPageMeta {
  /** false until the page is saved once. */
  registered: boolean;
  pstNo?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface AboutOverview extends AboutPageMeta {
  /** Editor HTML. */
  bodyVn?: string;
  bodyEn?: string;
}

export interface AboutOverviewRequest {
  bodyVn: string;
  /** Optional: the user EN screen shows the VN body when empty. */
  bodyEn?: string;
}

export interface AboutOrgChart extends AboutPageMeta {
  chartImageVnFileId?: string;
  chartImageVn?: ContentFile;
  chartImageEnFileId?: string;
  chartImageEn?: ContentFile;
  bodyVn?: string;
  bodyEn?: string;
}

export interface AboutOrgChartRequest {
  chartImageVnFileId: string;
  chartImageEnFileId?: string;
  bodyVn: string;
  bodyEn?: string;
}

export interface AboutDirections extends AboutPageMeta {
  addressVn?: string;
  addressEn?: string;
  mapLocation?: string;
  /** "latitude,longitude" of the user map pin. */
  coordinates?: string;
  phone?: string;
  email?: string;
  businessHoursVn?: string;
  businessHoursEn?: string;
  closedDaysVn?: string;
  closedDaysEn?: string;
}

export interface AboutDirectionsRequest {
  addressVn: string;
  addressEn?: string;
  /** Text searched on Google Maps; "latitude,longitude" also moves the user map pin. */
  mapLocation: string;
  phone: string;
  email: string;
  businessHoursVn: string;
  businessHoursEn?: string;
  closedDaysVn?: string;
  closedDaysEn?: string;
}

export interface AboutHistory {
  pstNo: string;
  /** Registration sequence (1 = first registered). */
  no: number;
  /** 4 digits. */
  year?: string;
  periodVn?: string;
  periodEn?: string;
  contentVn?: string;
  contentEn?: string;
  published?: 'Y' | 'N';
  crtDt?: string;
  mdfcnDt?: string;
  mdfcnBy?: string;
}

export interface AboutHistoryRequest {
  year: string;
  periodVn: string;
  periodEn?: string;
  contentVn: string;
  contentEn?: string;
}

export const getAboutOverview = () => apiGet<AboutOverview>(`${BASE}/overview`);

export const saveAboutOverview = (request: AboutOverviewRequest) => apiPut<AboutOverview>(`${BASE}/overview`, request);

export const getAboutOrgChart = () => apiGet<AboutOrgChart>(`${BASE}/organization-chart`);

export const saveAboutOrgChart = (request: AboutOrgChartRequest) =>
  apiPut<AboutOrgChart>(`${BASE}/organization-chart`, request);

export const getAboutDirections = () => apiGet<AboutDirections>(`${BASE}/directions`);

export const saveAboutDirections = (request: AboutDirectionsRequest) =>
  apiPut<AboutDirections>(`${BASE}/directions`, request);

/** sortBy: no, year (default), periodVn, contentVn, mdfcnDt, mdfcnBy. */
export const getAboutHistories = (query: PageQuery) => apiGet<PageResponse<AboutHistory>>(`${BASE}/history`, query);

export const getAboutHistory = (pstNo: string) =>
  apiGet<AboutHistory>(`${BASE}/history/${encodeURIComponent(pstNo)}`);

export const createAboutHistory = (request: AboutHistoryRequest) => apiPost<AboutHistory>(`${BASE}/history`, request);

export const updateAboutHistory = (pstNo: string, request: AboutHistoryRequest) =>
  apiPut<AboutHistory>(`${BASE}/history/${encodeURIComponent(pstNo)}`, request);

export const deleteAboutHistory = (pstNo: string) => apiDelete<void>(`${BASE}/history/${encodeURIComponent(pstNo)}`);
