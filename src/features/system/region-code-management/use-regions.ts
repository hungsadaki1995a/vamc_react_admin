import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import {
  batchSaveDistricts,
  createProvince,
  downloadProvincesExcel,
  getDistrictsByProvince,
  getProvinces,
  updateProvince,
} from '@/api/system/location-api';
import type {
  BatchSaveDistrictsRequest,
  DistrictItem,
  ProvinceItem,
  ProvinceSearch,
  UpdateProvinceRequest,
} from '@/api/system/location-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Region Code Management (menu A09030200).

const REGION_KEYS = {
  provinces: ['system', 'regions', 'provinces'] as const,
  provinceList: (search: ProvinceSearch, page: PageQuery) => ['system', 'regions', 'provinces', search, page] as const,
  districts: ['system', 'regions', 'districts'] as const,
  districtList: (mctpvCd: string | null) => ['system', 'regions', 'districts', mctpvCd] as const,
};

/** Paged province list; default server order is administrative code unless `sortBy` is set. */
export function useProvinces(search: ProvinceSearch, page: PageQuery) {
  return useApiQuery<PageResponse<ProvinceItem>>(REGION_KEYS.provinceList(search, page), () => getProvinces(search, page), {
    placeholderData: keepPreviousData,
  });
}

/** Districts of one province; no focus refetch so unsaved grid edits survive. */
export function useDistricts(mctpvCd: string | null) {
  return useApiQuery<DistrictItem[]>(REGION_KEYS.districtList(mctpvCd), () => getDistrictsByProvince(mctpvCd as string), {
    enabled: !!mctpvCd,
    refetchOnWindowFocus: false,
  });
}

export function useDownloadProvincesExcel() {
  return useApiDownload(downloadProvincesExcel);
}

export function useCreateProvince() {
  return useApiAction(createProvince, { invalidate: [REGION_KEYS.provinces] });
}

export function useUpdateProvince() {
  return useApiAction(
    ({ mctpvCd, request }: { mctpvCd: string; request: UpdateProvinceRequest }) => updateProvince(mctpvCd, request),
    { invalidate: [REGION_KEYS.provinces] },
  );
}

export function useBatchSaveDistricts() {
  return useApiAction(
    ({ mctpvCd, request }: { mctpvCd: string; request: BatchSaveDistrictsRequest }) => batchSaveDistricts(mctpvCd, request),
    { invalidate: [REGION_KEYS.districts, REGION_KEYS.provinces] },
  );
}
