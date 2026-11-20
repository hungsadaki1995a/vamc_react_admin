import { apiDelete, apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageResponse } from '@/api/common/api-utils';

// ── Region / Locations (A06030200) ───────────────────────────────────────────
export interface ProvinceItem {
  mctpvCd: string;
  mctpvNm: string;
  admdstCd?: string;
  sortSeq?: number;
  useYn: 'Y' | 'N';
  districtCount?: number;
  crtDt?: string;
  crtBy?: string;
}

export interface DistrictItem {
  distCd: string;
  mctpvCd: string;
  mctpvNm?: string;
  distNm: string;
  sortSeq?: number;
  useYn: 'Y' | 'N';
}

const LOC_BASE = '/api/v1/locations';
export const getProvinces = (search: { useYn?: 'Y' | 'N'; keyword?: string }, page: number, size: number) =>
  apiGet<PageResponse<ProvinceItem>>(`${LOC_BASE}/provinces`, { ...search, page, size });
export const downloadProvincesExcel = (search: { useYn?: 'Y' | 'N'; keyword?: string }) =>
  apiDownload(`${LOC_BASE}/provinces/excel`, 'provinces.xlsx', search);
export const createProvince = (req: Partial<ProvinceItem>) => apiPost<ProvinceItem>(`${LOC_BASE}/provinces`, req);
export const updateProvince = (mctpvCd: string, req: Partial<ProvinceItem>) =>
  apiPut<ProvinceItem>(`${LOC_BASE}/provinces/${mctpvCd}`, req);
export const deleteProvince = (mctpvCd: string) => apiDelete<void>(`${LOC_BASE}/provinces/${mctpvCd}`);
export const getDistrictsByProvince = (mctpvCd: string) =>
  apiGet<DistrictItem[]>(`${LOC_BASE}/provinces/${mctpvCd}/districts`);
export const createDistrict = (req: Partial<DistrictItem>) => apiPost<DistrictItem>(`${LOC_BASE}/districts`, req);
export const updateDistrict = (distCd: string, req: Partial<DistrictItem>) =>
  apiPut<DistrictItem>(`${LOC_BASE}/districts/${distCd}`, req);
export const deleteDistrict = (distCd: string) => apiDelete<void>(`${LOC_BASE}/districts/${distCd}`);
