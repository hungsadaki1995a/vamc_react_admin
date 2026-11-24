import { apiDownload, apiGet, apiPost, apiPut } from '@/api/common/api-utils';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import type { YesNo } from './code-group-api';

// ── Region / Locations (A09030200) ───────────────────────────────────────────
export interface ProvinceItem {
  mctpvCd: string;
  mctpvNm: string;
  /** GSO administrative code 0–99. */
  admdstCd: number;
  sortSeq?: number;
  useYn: YesNo;
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
  useYn: YesNo;
  crtDt?: string;
}

export interface ProvinceSearch {
  mctpvCd?: string;
  mctpvNm?: string;
  useYn?: YesNo;
}

export interface CreateProvinceRequest {
  mctpvCd: string;
  mctpvNm: string;
  admdstCd: number;
  sortSeq?: number;
  useYn: YesNo;
}

export interface UpdateProvinceRequest {
  mctpvNm: string;
  sortSeq?: number;
  useYn: YesNo;
}

/** One grid row; `isNew=true` makes the server reject an existing code (COD006). */
export interface SaveDistrictItem {
  distCd: string;
  distNm: string;
  sortSeq?: number;
  useYn: YesNo;
  isNew: boolean;
}

export interface BatchSaveDistrictsRequest {
  toSave: SaveDistrictItem[];
  deleteDistCds: string[];
}

const LOC_BASE = '/api/v1/locations';

/** Sorted by administrative code on the server. */
export const getProvinces = (search: ProvinceSearch, page: PageQuery) =>
  apiGet<PageResponse<ProvinceItem>>(`${LOC_BASE}/provinces`, { ...search, ...page });
export const downloadProvincesExcel = (search: ProvinceSearch) =>
  apiDownload(`${LOC_BASE}/provinces/excel`, 'provinces.xlsx', search);
/** Errors: 409 (no code) duplicate province code. */
export const createProvince = (req: CreateProvinceRequest) => apiPost<ProvinceItem>(`${LOC_BASE}/provinces`, req);
export const updateProvince = (mctpvCd: string, req: UpdateProvinceRequest) =>
  apiPut<ProvinceItem>(`${LOC_BASE}/provinces/${encodeURIComponent(mctpvCd)}`, req);
export const getDistrictsByProvince = (mctpvCd: string) =>
  apiGet<DistrictItem[]>(`${LOC_BASE}/provinces/${encodeURIComponent(mctpvCd)}/districts`, undefined, []);
/** Errors: COD006 duplicate (409), 400 code repeated within the batch. */
export const batchSaveDistricts = (mctpvCd: string, req: BatchSaveDistrictsRequest) =>
  apiPost<DistrictItem[]>(`${LOC_BASE}/provinces/${encodeURIComponent(mctpvCd)}/districts/batch`, req);

/** Active provinces (administrative unit options of the Finance branch grid). */
export const getActiveProvinces = () => apiGet<ProvinceItem[]>('/api/common/locations/provinces', undefined, []);
