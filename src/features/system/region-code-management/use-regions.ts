import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  createDistrict,
  createProvince,
  deleteDistrict,
  deleteProvince,
  downloadProvincesExcel,
  getDistrictsByProvince,
  getProvinces,
  updateDistrict,
  updateProvince,
} from '@/api/system/system-operations-api';
import type { DistrictItem, ProvinceItem } from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Region Code Management (menu A06030200).

export interface ProvinceSearch {
  useYn?: 'Y' | 'N';
  keyword?: string;
}

const REGION_KEYS = {
  all: ['system', 'regions'] as const,
  provinces: ['system', 'regions', 'provinces'] as const,
  provinceList: (search: ProvinceSearch, page: number, size: number) =>
    ['system', 'regions', 'provinces', 'list', search, page, size] as const,
  districts: ['system', 'regions', 'districts'] as const,
  districtList: (mctpvCd: string | null) => ['system', 'regions', 'districts', mctpvCd] as const,
};

/** Paged province list. */
export function useProvinces(search: ProvinceSearch, page: number, size: number) {
  return useApiQuery<PageResponse<ProvinceItem>>(
    REGION_KEYS.provinceList(search, page, size),
    () => getProvinces(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** Districts of one province; skipped while no province is selected. */
export function useDistricts(mctpvCd: string | null) {
  return useApiQuery<DistrictItem[]>(REGION_KEYS.districtList(mctpvCd), () => getDistrictsByProvince(mctpvCd as string), {
    enabled: !!mctpvCd,
  });
}

export function useDownloadProvincesExcel() {
  return useApiDownload(downloadProvincesExcel);
}

export interface SaveProvinceVariables {
  /** null = register. */
  mctpvCd: string | null;
  request: Partial<ProvinceItem>;
}

/** Registers or edits a province. */
export function useSaveProvince() {
  return useApiAction(
    ({ mctpvCd, request }: SaveProvinceVariables) =>
      mctpvCd === null ? createProvince(request) : updateProvince(mctpvCd, request),
    { invalidate: [REGION_KEYS.provinces] },
  );
}

export function useDeleteProvince() {
  return useApiAction(deleteProvince, { invalidate: [REGION_KEYS.provinces] });
}

export interface SaveDistrictVariables {
  /** null = register. */
  distCd: string | null;
  request: Partial<DistrictItem>;
}

/** Registers or edits a district. */
export function useSaveDistrict() {
  return useApiAction(
    ({ distCd, request }: SaveDistrictVariables) =>
      distCd === null ? createDistrict(request) : updateDistrict(distCd, request),
    { invalidate: [REGION_KEYS.districts] },
  );
}

export function useDeleteDistrict() {
  return useApiAction(deleteDistrict, { invalidate: [REGION_KEYS.districts] });
}
